const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const snowflake = require('snowflake-sdk');
const ini = require('ini');

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build')); // Serve React build files

function isRunningInSnowflakeContainer() {
  return fs.existsSync("/snowflake/session/token");
}

function getEnvConnectionOptions() {
  // Check if running inside Snowpark Container Services
  if (isRunningInSnowflakeContainer()) {
    console.log('🐳 Running in SPCS container - using OAuth token');
    return {
      // SPCS OAuth requires explicit uppercase account parameter
      account: process.env.SNOWFLAKE_ACCOUNT || 'VDB52565',
      accessUrl: "https://" + (process.env.SNOWFLAKE_HOST || ''),
      authenticator: 'OAUTH',
      token: fs.readFileSync('/snowflake/session/token', 'ascii'),
      role: process.env.SNOWFLAKE_ROLE,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      clientSessionKeepAlive: true,
    };
  } else {
    console.log('🖥️  Running locally - using environment variables and config fallback');
    
    // Try to read from ~/.snowsql/config as fallback
    const configPath = path.join(process.env.HOME, '.snowsql', 'config');
    let connection = {};
    
    if (fs.existsSync(configPath)) {
      console.log('📄 Reading fallback config from ~/.snowsql/config');
      const config = ini.parse(fs.readFileSync(configPath, 'utf-8'));
      const connections = config.connections || {};
      connection = connections.default || {};
    }
    
    // Running locally - use environment variables for credentials
    return {
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USER,
      password: process.env.SNOWFLAKE_PASSWORD,
      role: process.env.SNOWFLAKE_ROLE,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      clientSessionKeepAlive: true,
    };
  }
}

// CRITICAL: Per-request connection pattern to prevent timeouts
async function connectToSnowflake() {
    const config = getEnvConnectionOptions();
    const connection = snowflake.createConnection(config);
    
    return new Promise((resolve, reject) => {
        connection.connect((err, conn) => {
            if (err) {
                console.error('❌ Failed to connect to Snowflake:', err);
                reject(err);
            } else {
                console.log('✅ Successfully connected to Snowflake');
                resolve(connection);
            }
        });
    });
}

// Execute query with proper error handling
async function executeQuery(connection, query, binds = []) {
    return new Promise((resolve, reject) => {
        connection.execute({
            sqlText: query,
            binds: binds,
            complete: (err, stmt, rows) => {
                if (err) {
                    console.error('❌ Query execution failed:', err);
                    reject(err);
                } else {
                    console.log(`✅ Query executed successfully. Returned ${rows.length} rows.`);
                    resolve(rows);
                }
            }
        });
    });
}

// Essential API endpoints
app.get('/api/health', (req, res) => {
    const isInContainer = isRunningInSnowflakeContainer();
    res.json({
        status: 'OK',
        environment: isInContainer ? 'SPCS Container' : 'Local Development',
        port: PORT,
        host: HOST,
        timestamp: new Date().toISOString()
    });
});

// Helper function to get date filter condition
function getDateFilter(timePeriod) {
    if (!timePeriod || timePeriod === 'all') return '';
    
    if (timePeriod === 'q1') {
        return "AND o.order_date >= '2024-01-01' AND o.order_date < '2024-04-01'";
    } else if (timePeriod === 'q2') {
        return "AND o.order_date >= '2024-04-01' AND o.order_date < '2024-07-01'";
    } else if (timePeriod === 'recent3') {
        return "AND o.order_date >= '2024-04-01' AND o.order_date < '2024-07-01'";
    } else if (timePeriod === 'early3') {
        return "AND o.order_date >= '2024-01-01' AND o.order_date < '2024-04-01'";
    }
    
    return '';
}

// Helper function to get category filter condition
function getCategoryFilter(category) {
    if (!category || category === 'all') return '';
    return `AND p.category = '${category}'`;
}

// Sample data endpoint - replace with your actual queries
app.get('/api/data', async (req, res) => {
    const timePeriod = req.query.period;
    const category = req.query.category;
    const dateFilter = getDateFilter(timePeriod);
    const categoryFilter = getCategoryFilter(category);
    let connection;
    
    try {
        connection = await connectToSnowflake();
        
        // Get sales metrics summary
        const query = `
            SELECT 
                COUNT(DISTINCT o.customer_id) as total_customers,
                COUNT(DISTINCT o.order_id) as total_orders,
                SUM(o.total_amount) as total_revenue,
                ROUND(AVG(o.total_amount), 2) as avg_order_value
            FROM ORDERS o
            ${categoryFilter ? 'JOIN PRODUCTS p ON o.product_id = p.product_id' : ''}
            WHERE 1=1 ${dateFilter} ${categoryFilter};
        `;
        
        const rows = await executeQuery(connection, query);
        res.json({ 
            success: true,
            data: rows[0],
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API error:', error);
        
        // Return error response - no mock data per .cursorrules
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sales metrics'
        });
        
    } finally {
        if (connection) {
            connection.destroy(); // CRITICAL: Always cleanup connections
        }
    }
});

// Monthly revenue trends endpoint
app.get('/api/monthly-revenue', async (req, res) => {
    const timePeriod = req.query.period;
    const category = req.query.category;
    const dateFilter = getDateFilter(timePeriod);
    const categoryFilter = getCategoryFilter(category);
    let connection;
    
    try {
        connection = await connectToSnowflake();
        
        const query = `
            SELECT 
                TO_CHAR(o.order_date, 'YYYY-MM') as month,
                SUM(o.total_amount) as revenue,
                COUNT(DISTINCT o.order_id) as orders,
                COUNT(DISTINCT o.customer_id) as customers
            FROM ORDERS o
            ${categoryFilter ? 'JOIN PRODUCTS p ON o.product_id = p.product_id' : ''}
            WHERE 1=1 ${dateFilter} ${categoryFilter}
            GROUP BY TO_CHAR(o.order_date, 'YYYY-MM')
            ORDER BY month;
        `;
        
        const rows = await executeQuery(connection, query);
        res.json({ 
            success: true,
            data: rows
        });
        
    } catch (error) {
        console.error('❌ API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch monthly revenue data'
        });
    } finally {
        if (connection) {
            connection.destroy();
        }
    }
});

// Category sales distribution endpoint
app.get('/api/category-sales', async (req, res) => {
    const timePeriod = req.query.period;
    const category = req.query.category;
    const dateFilter = getDateFilter(timePeriod);
    const categoryFilter = getCategoryFilter(category);
    let connection;
    
    try {
        connection = await connectToSnowflake();
        
        let query;
        if (category && category !== 'all') {
            // When a specific category is selected, show products within that category
            query = `
                SELECT 
                    p.product_name as CATEGORY,
                    SUM(o.total_amount) as revenue,
                    COUNT(o.order_id) as orders
                FROM ORDERS o
                JOIN PRODUCTS p ON o.product_id = p.product_id
                WHERE 1=1 ${dateFilter} ${categoryFilter}
                GROUP BY p.product_name, p.product_id
                ORDER BY revenue DESC
                LIMIT 8;
            `;
        } else {
            // When "all" is selected, show category breakdown
            query = `
                SELECT 
                    p.category,
                    SUM(o.total_amount) as revenue,
                    COUNT(o.order_id) as orders
                FROM ORDERS o
                JOIN PRODUCTS p ON o.product_id = p.product_id
                WHERE 1=1 ${dateFilter}
                GROUP BY p.category
                ORDER BY revenue DESC;
            `;
        }
        
        const rows = await executeQuery(connection, query);
        res.json({ 
            success: true,
            data: rows
        });
        
    } catch (error) {
        console.error('❌ API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category sales data'
        });
    } finally {
        if (connection) {
            connection.destroy();
        }
    }
});

// Top products endpoint
app.get('/api/top-products', async (req, res) => {
    let connection;
    
    try {
        connection = await connectToSnowflake();
        
        const query = `
            SELECT 
                p.product_name,
                SUM(o.quantity) as units_sold,
                SUM(o.total_amount) as revenue
            FROM ORDERS o
            JOIN PRODUCTS p ON o.product_id = p.product_id
            GROUP BY p.product_name, p.product_id
            ORDER BY revenue DESC
            LIMIT 5;
        `;
        
        const rows = await executeQuery(connection, query);
        res.json({ 
            success: true,
            data: rows
        });
        
    } catch (error) {
        console.error('❌ API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch top products data'
        });
    } finally {
        if (connection) {
            connection.destroy();
        }
    }
});

// Get available categories (for filter dropdown)
app.get('/api/categories', async (req, res) => {
    let connection;
    
    try {
        connection = await connectToSnowflake();
        
        const query = `
            SELECT DISTINCT category
            FROM PRODUCTS
            ORDER BY category;
        `;
        
        console.log('✅ Successfully connected to Snowflake');
        const rows = await executeQuery(connection, query);
        console.log(`✅ Query executed successfully. Returned ${rows.length} rows.`);
        
        res.json({ 
            success: true,
            data: rows
        });
        
    } catch (error) {
        console.error('❌ API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    } finally {
        if (connection) {
            connection.destroy();
        }
    }
});

// Top products by category endpoint
app.get('/api/top-products-by-category', async (req, res) => {
    console.log('🖥️  Running locally - using config from ~/.snowsql/config');
    
    const category = req.query.category;
    const timePeriod = req.query.period;
    const dateFilter = getDateFilter(timePeriod);
    let connection;
    
    try {
        connection = await connectToSnowflake();
        
        let query;
        if (category && category !== 'all') {
            query = `
                SELECT 
                    p.product_name,
                    p.category,
                    SUM(o.quantity) as units_sold,
                    SUM(o.total_amount) as revenue
                FROM ORDERS o
                JOIN PRODUCTS p ON o.product_id = p.product_id
                WHERE p.category = '${category}' ${dateFilter}
                GROUP BY p.product_name, p.category, p.product_id
                ORDER BY revenue DESC
                LIMIT 5;
            `;
        } else {
            // Default to all products
            query = `
                SELECT 
                    p.product_name,
                    p.category,
                    SUM(o.quantity) as units_sold,
                    SUM(o.total_amount) as revenue
                FROM ORDERS o
                JOIN PRODUCTS p ON o.product_id = p.product_id
                WHERE 1=1 ${dateFilter}
                GROUP BY p.product_name, p.category, p.product_id
                ORDER BY revenue DESC
                LIMIT 5;
            `;
        }
        
        console.log('✅ Successfully connected to Snowflake');
        const rows = await executeQuery(connection, query);
        console.log(`✅ Query executed successfully. Returned ${rows.length} rows.`);
        
        res.json({ 
            success: true,
            data: rows,
            category: category || 'all'
        });
        
    } catch (error) {
        console.error('❌ API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch products by category data'
        });
    } finally {
        if (connection) {
            connection.destroy();
        }
    }
});

// React routing - must be last to catch all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    const isInContainer = isRunningInSnowflakeContainer();
    
    if (isInContainer) {
        console.log(`🚀 Server running in SPCS container on port ${PORT}`);
        console.log('📊 App will be available via SPCS service endpoint');
    } else {
        console.log(`🚀 Server running locally on http://${HOST}:${PORT}`);
        console.log(`🔍 Health check: http://${HOST}:${PORT}/api/health`);
    }
});

