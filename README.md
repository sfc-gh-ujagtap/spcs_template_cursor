# 🚀 SPCS Application Template

A comprehensive template for building React + Express.js applications deployable to Snowflake's Snowpark Container Services (SPCS).

## 🏗️ Architecture

This template follows the proven **flat project structure** pattern with:
- **Single `package.json`** at root level
- **Express server** that serves both API routes AND static React build files  
- **Port 3002** consistently across all environments
- **Per-request Snowflake connections** to prevent timeouts
- **Dual authentication** (SPCS OAuth + local development)

## 📁 Project Structure

```
spcs_template_cursor/
├── .cursorrules              # Cursor AI configuration with SPCS best practices
├── package.json              # Dependencies and scripts
├── server.js                 # Express server with SPCS patterns
├── tsconfig.json            # TypeScript configuration
├── Dockerfile               # Multi-stage Docker build
├── deploy.sh                # 🆕 Unified deployment script (ONE COMMAND!)
├── src/                     # React application source
│   ├── App.tsx              # Main application component with error boundaries
│   ├── index.tsx            # React entry point
│   └── components/          # React components
│       ├── Dashboard.tsx    # Sample dashboard component
│       └── ErrorBoundary.tsx # 🆕 Error boundary for robust error handling
├── public/                  # Static assets
├── scripts/                 # Database setup scripts
│   ├── create_app_role.sql  # Application role creation
│   └── setup_database.sql   # Database and schema setup
└── snowflake/               # SPCS deployment files
    ├── deploy.sql           # Service deployment with embedded specification
    ├── manage_service.sql   # Service management commands
    └── setup_image_repo.sql # Image repository setup
```

## 🚀 Quick Start

### 1. Create New Project

```bash
# Copy template to new project
cp -r spcs_template_cursor my-new-app
cd my-new-app

# Update project name in package.json
# Update APP_NAME in deploy.sh
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Local Development

```bash
# Start React development server
npm start

# Or start Express server (serves built React app)
npm run build
npm run dev
```

### 4. Test Docker Build

```bash
# Build and test Docker image locally
npm run docker:build
npm run docker:run

# Test endpoints
curl http://localhost:3002/api/health
```

## 🔧 Configuration

### Environment Variables

The application automatically detects whether it's running in SPCS or locally:

**SPCS Container (automatic):**
- `SNOWFLAKE_DATABASE` - Database name (default: SPCS_APP_DB)  
- `SNOWFLAKE_SCHEMA` - Schema name (default: APP_SCHEMA)
- `SNOWFLAKE_WAREHOUSE` - Warehouse (default: COMPUTE_WH)
- `SNOWFLAKE_ROLE` - Role (default: APP_SPCS_ROLE)

**Local Development:**
- Uses `~/.snowsql/config` or environment variables
- Falls back to mock data if database unavailable

### Updating Configuration

1. **Database/Schema names**: Update in `scripts/setup_database.sql` and `snowflake/deploy.sql`
2. **Application name**: Update in `package.json` and `deploy.sh`
3. **Container image**: Update in `snowflake/deploy.sql` (embedded specification)

## 🚀 SPCS Deployment

### Prerequisites

1. **Snowflake CLI tools** configured:
   ```bash
   snowsql -q "SELECT CURRENT_ACCOUNT();"
   snow sql -q "SELECT CURRENT_ACCOUNT();"
   ```

2. **Docker** installed and running

### 🎯 One-Command Deployment (Recommended)

```bash
# 🚀 Deploy everything with single command!
./deploy.sh

# This script automatically:
# ✅ Creates application role
# ✅ Sets up database and schema  
# ✅ Creates image repository
# ✅ Builds React application
# ✅ Builds and pushes Docker image
# ✅ Deploys SPCS service
# ✅ Waits for service to be ready
# ✅ Shows service endpoint
```

### 🔧 Manual Deployment Steps (Alternative)

If you prefer step-by-step control:

```bash
# 1. Create application role (run once per account)
snowsql -f scripts/create_app_role.sql

# 2. Setup database and schema
snowsql -f scripts/setup_database.sql  

# 3. Setup image repository
snowsql -f snowflake/setup_image_repo.sql

# 4. Build and upload container image
# (This is included in deploy.sh, but can be done manually with:)
# npm run build && docker build --platform linux/amd64 -t app:latest .

# 5. Deploy service
snowsql -f snowflake/deploy.sql

# 6. Check service status
snowsql -f snowflake/manage_service.sql
```

### Verification

```bash
# Check service status
snowsql -q "SELECT SYSTEM\$GET_SERVICE_STATUS('SPCS_APP_SERVICE');"

# View logs
snowsql -q "CALL SYSTEM\$GET_SERVICE_LOGS('SPCS_APP_SERVICE', '0');"

# Get service endpoints
snowsql -q "SHOW ENDPOINTS IN SERVICE SPCS_APP_SERVICE;"
```

## 🔧 Development

### Adding New API Endpoints

```javascript
// In server.js, add new endpoints following this pattern:
app.get('/api/your-endpoint', async (req, res) => {
    let connection;
    try {
        connection = await connectToSnowflake();
        const rows = await executeQuery(connection, 'YOUR QUERY HERE');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data' });
    } finally {
        if (connection) {
            connection.destroy(); // CRITICAL: Always cleanup
        }
    }
});
```

### Adding React Components

1. Create new components in `src/components/`
2. Import and use in `src/App.tsx`
3. Use TypeScript interfaces for type safety

### Database Changes

1. Update `scripts/setup_database.sql` with new tables/schemas
2. Update queries in `server.js`  
3. Redeploy with updated database setup

## 🐛 Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
snowsql -q "CALL SYSTEM\$GET_SERVICE_LOGS('SPCS_APP_SERVICE', '0');"

# Verify image exists
snowsql -q "SHOW IMAGES IN IMAGE REPOSITORY SPCS_APP_DB.IMAGE_SCHEMA.IMAGE_REPO;"
```

**CSS/JS not loading:**
- Ensure React build files are in `build/` directory
- Check Express static file serving: `app.use(express.static('build'))`

**Database connection issues:**
- Verify role permissions: `SHOW GRANTS TO ROLE APP_SPCS_ROLE;`
- Check warehouse access: `USE WAREHOUSE COMPUTE_WH;`

### Debug Commands

```bash
# Service status
SELECT SYSTEM$GET_SERVICE_STATUS('SPCS_APP_SERVICE');

# Service logs  
CALL SYSTEM$GET_SERVICE_LOGS('SPCS_APP_SERVICE', '0');

# Compute pool status
SHOW COMPUTE POOLS;

# Health check (once deployed)
# Access /api/health endpoint via service URL
```

## 🏆 Best Practices

This template follows all `.cursorrules` guidelines:

1. **🏗️ Flat Project Structure**: Single `package.json`, root-level React app, Express serves both API and static files
2. **🌐 Port Strategy**: Consistent port 3002 across all environments (local, Docker, SPCS)
3. **🔤 TypeScript First**: All components use TypeScript with proper interfaces
4. **🔄 Per-request Connections**: Fresh Snowflake connections for each API call (prevents timeouts)
5. **🔐 Dual Authentication**: Automatic detection between SPCS OAuth and local development
6. **🛡️ Error Boundaries**: Robust error handling with React error boundaries
7. **⚡ Essential Endpoints**: Health check, static files, React routing all implemented
8. **🏷️ CREATE IF NOT EXISTS**: All database scripts are idempotent
9. **📊 Real Data**: No mock data in production, fallbacks only for local development
10. **🚀 Unified Deployment**: Single `deploy.sh` script handles everything
11. **📚 Reference Implementation**: Based on proven Sun Valley SPCS patterns

## 📚 Resources

- [Sun Valley SPCS Reference](https://github.com/sfc-gh-ujagtap/sun_valley_spcs) - Proven implementation
- [Snowpark Container Services Documentation](https://docs.snowflake.com/en/developer-guide/snowpark-container-services)
- [React Documentation](https://reactjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)

## 📄 License

MIT License - Use this template freely for your SPCS applications.

