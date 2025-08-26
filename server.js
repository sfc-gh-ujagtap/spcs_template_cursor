const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const snowflake = require('snowflake-sdk');

const app = express();
const PORT = process.env.PORT || 3002;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

function isRunningInSnowflakeContainer() {
  return fs.existsSync("/snowflake/session/token");
}

function getEnvConnectionOptions() {
  // Check if running inside Snowpark Container Services
  if (isRunningInSnowflakeContainer()) {
    return {
      accessUrl: "https://" + (process.env.SNOWFLAKE_HOST || ''),
      account: process.env.SNOWFLAKE_ACCOUNT || '',
      authenticator: 'OAUTH',
      token: fs.readFileSync('/snowflake/session/token', 'ascii'),
      role: process.env.SNOWFLAKE_ROLE,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      clientSessionKeepAlive: true,
    };
  } else {
    // Running locally - use environment variables for credentials
    return {
      account: process.env.SNOWFLAKE_ACCOUNT || '',
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

async function connectToSnowflakeFromEnv(connectionName = 'default') {
  const connection = snowflake.createConnection(getEnvConnectionOptions());
  await new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        reject(err);
      } else {
        resolve(conn);
      }
    });
  });
  return connection;
}

// Function to read snowsql config (similar to Python version)
function readSnowsqlConfig(configPath = '~/.snowsql/config') {
  const expandedPath = configPath.replace('~', require('os').homedir());
  
  if (!fs.existsSync(expandedPath)) {
    throw new Error(`Config file not found at ${expandedPath}`);
  }
  
  const configContent = fs.readFileSync(expandedPath, 'utf8');
  return parseIniFile(configContent);
}

// Simple INI file parser
function parseIniFile(content) {
  const config = {};
  let currentSection = null;
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1);
      config[currentSection] = {};
    } else if (line.includes('=') && currentSection) {
      const [key, value] = line.split('=').map(s => s.trim());
      config[currentSection][key] = value.replace(/['"]/g, ''); // Remove quotes
    }
  });
  
  return config;
}

// Function to load private key (Node.js Snowflake SDK expects PEM string)
function loadPrivateKey(privateKeyPath) {
  try {
    const keyPath = privateKeyPath.replace('~', require('os').homedir());
    
    console.log(`Loading private key from: ${keyPath}`);
    const keyContent = fs.readFileSync(keyPath, 'utf8');
    
    // The Node.js Snowflake SDK expects the private key as a PEM string
    console.log('Successfully loaded private key as PEM string');
    return keyContent;
  } catch (error) {
    console.error('Error loading private key:', error);
    return null;
  }
}

// Connect to Snowflake using default configuration
async function connectToSnowflakeFromConfig(connectionName = 'default') {
  try {
    console.log(`Connecting to Snowflake using ${connectionName}...`);
    
    // Read configuration
    const config = readSnowsqlConfig();
    
    // Try to get connection parameters from the specified connection
    let sectionName = `connections.${connectionName}`;
    if (!config[sectionName]) {
      // Fall back to direct section name
      const availableSections = Object.keys(config).filter(s => !s.startsWith('connections.'));
      if (availableSections.length > 0) {
        sectionName = availableSections[0];
        console.log(`Connection '${connectionName}' not found, using '${sectionName}'`);
      } else {
        throw new Error('No valid connection configuration found');
      }
    }
    
    const section = config[sectionName];
    console.log('Found config section:', sectionName);
    
    // Extract connection parameters
    const account = section.accountname || section.account;
    const username = section.username || section.user;
    const privateKeyPath = section.private_key_path;
    const password = section.password;
    const warehouse = section.warehousename || section.warehouse || process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH';
    const database = section.databasename || section.database || process.env.SNOWFLAKE_DATABASE;
    const schema = section.schemaname || section.schema || process.env.SNOWFLAKE_SCHEMA;
    
    if (!account || !username) {
      throw new Error('Missing required connection parameters (account, username)');
    }
    
    if (!privateKeyPath && !password) {
      throw new Error('Missing authentication method (private_key_path or password)');
    }
    
    console.log(`Account: ${account}`);
    console.log(`Username: ${username}`);
    console.log(`Warehouse: ${warehouse}`);
    
    // Create connection parameters
    const connectionParams = {
      account: account,
      username: username,
      warehouse: warehouse
    };
    
    // Add database and schema if available
    if (database) connectionParams.database = database;
    if (schema) connectionParams.schema = schema;
    
    // Add authentication method
    if (privateKeyPath) {
      console.log('Using private key authentication');
      const privateKey = loadPrivateKey(privateKeyPath);
      if (!privateKey) {
        throw new Error('Failed to load private key');
      }
      connectionParams.privateKey = privateKey;
      connectionParams.authenticator = 'SNOWFLAKE_JWT';
    } else {
      console.log('Using password authentication');
      connectionParams.password = password;
    }
    
    // Create and connect
    const connection = snowflake.createConnection(connectionParams);
    
    await new Promise((resolve, reject) => {
      connection.connect((err, conn) => {
        if (err) {
          reject(err);
        } else {
          resolve(conn);
        }
      });
    });
    
    console.log('✅ Successfully connected to Snowflake!');
    return connection;
    
  } catch (error) {
    console.error('❌ Error connecting to Snowflake:', error);
    throw error;
  }
}

async function connectToSnowflake(connectionName = 'default') {
  if (isRunningInSnowflakeContainer()) {
    return await connectToSnowflakeFromEnv(connectionName);
  } else {
    return await connectToSnowflakeFromConfig(connectionName);
  }
}

// Execute query with proper error handling
async function executeQuery(connection, query) {
    return new Promise((resolve, reject) => {
        connection.execute({
            sqlText: query,
            complete: (err, stmt, rows) => {
                if (err) {
                    reject(err);
                } else {
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
        connection = await connectToSnowflake('default');
        
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
        connection = await connectToSnowflake('default');
        
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
        connection = await connectToSnowflake('default');
        
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
        connection = await connectToSnowflake('default');
        
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
        connection = await connectToSnowflake('default');
        
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
        connection = await connectToSnowflake('default');
        
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