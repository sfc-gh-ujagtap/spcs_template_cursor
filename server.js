const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const snowflake = require('snowflake-sdk');
const ini = require('ini');

const app = express();
const PORT = process.env.SERVER_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('build')); // Serve React build files

// Snowflake configuration - dual authentication (SPCS + local)
function getSnowflakeConfig() {
    const isInContainer = fs.existsSync('/snowflake/session/token');
    
    if (isInContainer) {
        console.log('🐳 Running in SPCS container - using OAuth token');
        return {
            account: process.env.SNOWFLAKE_ACCOUNT || 'your-account',
            username: process.env.SNOWFLAKE_USERNAME || 'your-username',
            role: process.env.SNOWFLAKE_ROLE || 'APP_SPCS_ROLE',
            warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
            database: process.env.SNOWFLAKE_DATABASE || 'SPCS_APP_DB',
            schema: process.env.SNOWFLAKE_SCHEMA || 'APP_SCHEMA',
            authenticator: 'OAUTH',
            token: fs.readFileSync('/snowflake/session/token', 'ascii'),
            accessUrl: `https://app-${process.env.SNOWFLAKE_ACCOUNT}.snowflakecomputing.com`
        };
    } else {
        console.log('🖥️  Running locally - using config from ~/.snowsql/config');
        const configPath = path.join(process.env.HOME, '.snowsql', 'config');
        
        if (fs.existsSync(configPath)) {
            const config = ini.parse(fs.readFileSync(configPath, 'utf-8'));
            const connections = config.connections || {};
            const connection = connections.default || {};
            
            return {
                account: connection.account || process.env.SNOWFLAKE_ACCOUNT,
                username: connection.username || process.env.SNOWFLAKE_USERNAME,
                password: connection.password || process.env.SNOWFLAKE_PASSWORD,
                role: process.env.SNOWFLAKE_ROLE || 'APP_SPCS_ROLE',
                warehouse: connection.warehouse || process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
                database: process.env.SNOWFLAKE_DATABASE || 'SPCS_APP_DB',
                schema: process.env.SNOWFLAKE_SCHEMA || 'APP_SCHEMA'
            };
        } else {
            console.log('⚠️  No snowsql config found, using environment variables');
            return {
                account: process.env.SNOWFLAKE_ACCOUNT,
                username: process.env.SNOWFLAKE_USERNAME,
                password: process.env.SNOWFLAKE_PASSWORD,
                role: process.env.SNOWFLAKE_ROLE || 'APP_SPCS_ROLE',
                warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
                database: process.env.SNOWFLAKE_DATABASE || 'SPCS_APP_DB',
                schema: process.env.SNOWFLAKE_SCHEMA || 'APP_SCHEMA'
            };
        }
    }
}

// CRITICAL: Per-request connection pattern to prevent timeouts
async function connectToSnowflake() {
    const config = getSnowflakeConfig();
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
    const isInContainer = fs.existsSync('/snowflake/session/token');
    res.json({
        status: 'OK',
        environment: isInContainer ? 'SPCS Container' : 'Local Development',
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Sample data endpoint - replace with your actual queries
app.get('/api/data', async (req, res) => {
    let connection;
    
    try {
        connection = await connectToSnowflake();
        
        // Sample query - replace with your actual data query
        const query = `
            USE WAREHOUSE ${getSnowflakeConfig().warehouse};
            SELECT CURRENT_TIMESTAMP() as timestamp, 
                   CURRENT_USER() as user, 
                   CURRENT_ROLE() as role;
        `;
        
        const rows = await executeQuery(connection, query);
        res.json({ 
            success: true,
            data: rows,
            count: rows.length 
        });
        
    } catch (error) {
        console.error('❌ API error:', error);
        
        // Return mock data for local development when DB unavailable
        res.json({
            success: false,
            error: 'Database connection failed',
            mockData: [
                { timestamp: new Date().toISOString(), user: 'mock_user', role: 'mock_role' }
            ],
            message: 'Using mock data for development'
        });
        
    } finally {
        if (connection) {
            connection.destroy(); // CRITICAL: Always cleanup connections
        }
    }
});

// React routing - must be last to catch all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    const isInContainer = fs.existsSync('/snowflake/session/token');
    
    if (isInContainer) {
        console.log(`🚀 Server running in SPCS container on port ${PORT}`);
        console.log('📊 App will be available via SPCS service endpoint');
    } else {
        console.log(`🚀 Server running locally on http://localhost:${PORT}`);
        console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    }
});
