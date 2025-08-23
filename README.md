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
├── src/                     # React application source
│   ├── App.tsx              # Main application component  
│   ├── index.tsx            # React entry point
│   └── components/          # React components
├── public/                  # Static assets
├── scripts/                 # Database setup scripts
│   ├── create_app_role.sql  # Application role creation
│   └── setup_database.sql   # Database and schema setup
└── snowflake/               # SPCS deployment files
    ├── buildAndUpload.sh    # Build and upload script
    ├── deploy.sql           # Service deployment
    ├── manage_service.sql   # Service management commands
    └── service_spec.yaml    # SPCS service specification
```

## 🚀 Quick Start

### 1. Create New Project

```bash
# Copy template to new project
cp -r spcs_template_cursor my-new-app
cd my-new-app

# Update project name in package.json
# Update APP_NAME in snowflake/buildAndUpload.sh
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
2. **Application name**: Update in `package.json` and `snowflake/buildAndUpload.sh`
3. **Container image**: Update in `snowflake/service_spec.yaml` and `snowflake/deploy.sql`

## 🚀 SPCS Deployment

### Prerequisites

1. **Snowflake CLI tools** configured:
   ```bash
   snowsql -q "SELECT CURRENT_ACCOUNT();"
   snow sql -q "SELECT CURRENT_ACCOUNT();"
   ```

2. **Docker** installed and running

### Deployment Steps

```bash
# 1. Create application role (run once per account)
snowsql -f scripts/create_app_role.sql

# 2. Setup database and schema
snowsql -f scripts/setup_database.sql  

# 3. Setup image repository
snowsql -f snowflake/setup_image_repo.sql

# 4. Build and upload container image
cd snowflake && ./buildAndUpload.sh

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

1. **Always use the Sun Valley reference**: https://github.com/sfc-gh-ujagtap/sun_valley_spcs
2. **Per-request connections**: Create fresh Snowflake connections for each API call
3. **Consistent ports**: Use 3002 across all environments  
4. **Role consistency**: Use same role for service creation AND data access
5. **Mock data**: Implement fallbacks for local development
6. **Error handling**: Always include proper error boundaries and cleanup

## 📚 Resources

- [Sun Valley SPCS Reference](https://github.com/sfc-gh-ujagtap/sun_valley_spcs) - Proven implementation
- [Snowpark Container Services Documentation](https://docs.snowflake.com/en/developer-guide/snowpark-container-services)
- [React Documentation](https://reactjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)

## 📄 License

MIT License - Use this template freely for your SPCS applications.
