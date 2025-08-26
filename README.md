# 📊 Sales Analytics Dashboard - SPCS Template

A **complete example** of a React + Express.js sales analytics dashboard built for Snowflake's Snowpark Container Services (SPCS). This template provides a working, production-ready application that you can use as a starting point for your own SPCS projects.

## 🎯 What This Template Provides

This isn't just a skeleton - it's a **fully functional sales analytics dashboard** featuring:

- 📈 **Real-time Sales Metrics**: Revenue, orders, customers, and growth analytics
- 🛍️ **Product Analytics**: Top products by category with performance insights  
- 📊 **Interactive Charts**: Monthly revenue trends, category breakdowns, and KPIs
- 🎛️ **Dynamic Filtering**: Filter by time period (7/30/90 days) and product categories
- 📱 **Responsive Design**: Modern, mobile-friendly interface with professional styling
- 🔄 **Live Data**: Connects to Snowflake with real sample e-commerce data

## ✨ Dashboard Features

### 📊 **Key Metrics Display**
- Total revenue with growth indicators
- Order count and average order value
- Customer count and repeat customer rate
- Real-time calculations from Snowflake data

### 📈 **Visualizations**
- **Monthly Revenue Chart**: Interactive line chart showing revenue trends
- **Category Performance**: Bar chart comparing sales across product categories  
- **Top Products**: Dynamic list of best-selling products by category
- **KPI Cards**: Color-coded metrics with trend indicators

### 🎚️ **Interactive Controls**
- **Time Period Filter**: Last 7, 30, 90 days, or all time
- **Category Filter**: All categories or specific product categories
- **Real-time Updates**: Instant chart and metric updates on filter changes

## 🏗️ Architecture

This template follows the proven **flat project structure** pattern optimized for SPCS:

- **Single `package.json`** at root level for simplified dependency management
- **Express server** serves both API routes AND static React build files  
- **Port 3002** consistently across all environments (local, Docker, SPCS)
- **Per-request Snowflake connections** to prevent timeout issues
- **Dual authentication** (SPCS OAuth + local development credentials)
- **TypeScript throughout** for type safety and better development experience

## 📁 Project Structure

```
sales-analytics-dashboard/
├── .cursorrules              # Cursor AI configuration with SPCS best practices
├── package.json              # Dependencies and scripts
├── server.js                 # Express server with 8 API endpoints
├── tsconfig.json            # TypeScript configuration
├── Dockerfile               # Multi-stage Docker build
├── deploy.sh                # 🚀 ONE-COMMAND deployment script
├── src/                     # React application source
│   ├── App.tsx              # Main app with dashboard layout
│   ├── index.tsx            # React entry point
│   └── components/          
│       ├── Dashboard.tsx    # Main dashboard with charts & filters
│       └── ErrorBoundary.tsx # Robust error handling
├── public/                  # Static assets and manifest
├── scripts/                 # Database setup scripts
│   ├── create_app_role.sql  # Creates APP_SPCS_ROLE with permissions
│   └── setup_database.sql   # Creates sample e-commerce data
└── snowflake/               # SPCS deployment files
    ├── deploy.sql           # Service deployment with resource specs
    ├── manage_service.sql   # Service management commands
    └── setup_image_repo.sql # Image repository configuration
```

## 🗄️ Database Schema

The template creates a complete e-commerce database with realistic sample data:

### **Tables Created**
```sql
-- Customer data (220 customers)
CUSTOMERS (id, name, email, registration_date, total_orders, total_spent)

-- Product catalog (220 products across 5 categories)  
PRODUCTS (id, name, category, price, cost, stock_quantity, supplier)

-- Order transactions (500+ orders with realistic patterns)
ORDERS (id, customer_id, product_id, quantity, unit_price, total_amount, order_date, status)
```

### **Sample Data Highlights**
- **$67,971.86** total revenue across all orders
- **5 product categories**: Electronics, Clothing, Home & Garden, Books, Sports
- **Realistic pricing**: $5.99 to $899.99 product range  
- **Time-series data**: Orders spanning multiple months for trend analysis
- **Customer behavior**: Repeat customers with varied order patterns

## 🚀 API Endpoints

The Express server provides 8 comprehensive API endpoints:

### **📊 Core Analytics**
- `GET /api/health` - Service health check
- `GET /api/data?period=30&category=all` - Main dashboard metrics
- `GET /api/monthly-revenue?period=90` - Revenue trends by month

### **🛍️ Product Analytics**  
- `GET /api/categories` - Available product categories
- `GET /api/category-sales?period=7&category=Electronics` - Sales by category
- `GET /api/top-products-by-category?category=all&period=30` - Best sellers

### **🔍 Detailed Views**
- `GET /api/customer-analytics?period=all` - Customer insights  
- `GET /api/product-performance?category=Clothing` - Product metrics

### **Example API Response**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 67971.86,
    "totalOrders": 504,
    "totalCustomers": 220,
    "avgOrderValue": 134.87,
    "growth": {
      "revenue": 12.5,
      "orders": 8.3,
      "customers": 15.2
    }
  }
}
```

## 🚀 Quick Start

### 1. **Get the Template**

```bash
# Clone the repository
git clone <repository-url> my-sales-dashboard
cd my-sales-dashboard

# Install dependencies
npm install --legacy-peer-deps
```

### 2. **Local Development**

```bash
# Set up database and sample data (creates realistic e-commerce data)
./deploy.sh --local

# Start the development server
npm run dev
```

**Access your dashboard**: http://localhost:3002

### 3. **Deploy to SPCS**

```bash
# Deploy everything to Snowflake SPCS with one command!
./deploy.sh --spcs

# The script will:
# ✅ Create APP_SPCS_ROLE with proper permissions
# ✅ Set up SPCS_APP_DB database with sample data  
# ✅ Build and push Docker image to Snowflake
# ✅ Deploy SPCS service with proper configuration
# ✅ Show you the public endpoint URL
```

**Your dashboard will be live** at the provided SPCS endpoint!

## 🎨 Customizing for Your Use Case

### **Change the Data Model**

1. **Update Database Schema**: Modify `scripts/setup_database.sql`
   ```sql
   -- Add your own tables
   CREATE TABLE YOUR_DATA (
       id NUMBER AUTOINCREMENT,
       your_field VARCHAR(100),
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
   );
   ```

2. **Update API Endpoints**: Modify queries in `server.js`
   ```javascript
   // Add your custom endpoint
   app.get('/api/your-data', async (req, res) => {
       const query = 'SELECT * FROM YOUR_DATA LIMIT 100';
       // ... connection handling code
   });
   ```

3. **Update Frontend**: Modify `src/components/Dashboard.tsx`
   ```typescript
   // Add your custom components
   const YourCustomChart = ({ data }: { data: YourDataType[] }) => {
       return <div>Your visualization here</div>;
   };
   ```

### **Rebrand the Dashboard**

1. **Update App Name**: Change in `package.json` and `deploy.sh`
2. **Customize Styling**: Modify `src/App.css` and component styles  
3. **Update Branding**: Replace logo and colors in `public/` and CSS files
4. **Change Endpoints**: Update API base URLs if needed

### **Add New Visualizations**

The template uses **Recharts** for visualization. Add new charts easily:

```typescript
import { LineChart, BarChart, PieChart } from 'recharts';

// Add to Dashboard.tsx
<LineChart width={600} height={300} data={yourData}>
  <XAxis dataKey="month" />
  <YAxis />
  <Line type="monotone" dataKey="value" stroke="#8884d8" />
</LineChart>
```

## 🔧 Configuration

### **Environment Variables**

The application automatically detects its environment:

**SPCS Container (automatic detection):**
- `SNOWFLAKE_DATABASE`: SPCS_APP_DB
- `SNOWFLAKE_SCHEMA`: APP_SCHEMA  
- `SNOWFLAKE_WAREHOUSE`: COMPUTE_WH
- `SNOWFLAKE_ROLE`: APP_SPCS_ROLE

**Local Development:**
- Reads from `~/.snowsql/config` default connection
- Environment variables override config file settings
- Falls back to mock data if Snowflake unavailable

### **Docker Configuration**

Multi-stage Dockerfile optimized for SPCS:
- **Builder stage**: Compiles React app with TypeScript
- **Production stage**: Minimal Node.js runtime with security hardening
- **Platform**: linux/amd64 for Snowflake compatibility
- **Security**: Non-root user, minimal attack surface

## 🐛 Troubleshooting

### **Local Development Issues**

**"Failed to fetch sales metrics":**
```bash
# Check if database was created
snowsql -q "SELECT COUNT(*) FROM SPCS_APP_DB.APP_SCHEMA.ORDERS;"

# Recreate sample data
./deploy.sh --local
```

**React build not loading:**
```bash
# Rebuild React app
npm run build

# Check static files are served
curl http://localhost:3002/static/js/main.*.js
```

### **SPCS Deployment Issues**

**Service shows PENDING:**
```bash
# Check service logs
snowsql -q "CALL SYSTEM\$GET_SERVICE_LOGS('SPCS_APP_DB.APP_SCHEMA.SPCS_APP_SERVICE', '0');"

# Verify compute pool
snowsql -q "SHOW COMPUTE POOLS;"
```

**API returns 500 errors:**
```bash
# Check role permissions
snowsql -q "SHOW GRANTS TO ROLE APP_SPCS_ROLE;"

# Test database access
snowsql -q "USE ROLE APP_SPCS_ROLE; SELECT COUNT(*) FROM SPCS_APP_DB.APP_SCHEMA.ORDERS;"
```

**Endpoint not accessible:**
```bash
# Get endpoint URL
snowsql -q "SHOW ENDPOINTS IN SERVICE SPCS_APP_DB.APP_SCHEMA.SPCS_APP_SERVICE;"

# Check service status
snowsql -q "SELECT SYSTEM\$GET_SERVICE_STATUS('SPCS_APP_DB.APP_SCHEMA.SPCS_APP_SERVICE');"
```

## 📊 Dashboard Preview

When running, your dashboard displays:

### **📈 Main Dashboard View**
- **Revenue Card**: $67,971.86 with 12.5% growth indicator
- **Orders Card**: 504 orders with average $134.87 value
- **Customers Card**: 220 customers with 15.2% growth
- **Monthly Trend**: Interactive line chart showing revenue over time

### **🛍️ Product Analytics**
- **Category Breakdown**: Bar chart comparing Electronics, Clothing, Home & Garden, Books, Sports
- **Top Products**: Dynamic list updating based on selected category and time period
- **Performance Metrics**: Revenue per category with trend indicators

### **🎛️ Interactive Filters**
- **Time Period**: Toggle between 7, 30, 90 days, or all time
- **Category**: Filter all visualizations by product category
- **Real-time Updates**: Charts update instantly without page reload

## 🏆 Production-Ready Features

This template includes enterprise-grade features:

- **🔐 Security**: Non-root Docker container, input validation, secure Snowflake connections
- **🚀 Performance**: Per-request connections, React optimizations, Docker multi-stage builds
- **📊 Monitoring**: Health check endpoint, comprehensive logging, error boundaries
- **🛡️ Error Handling**: Graceful degradation, user-friendly error messages, connection cleanup
- **📱 Responsive**: Mobile-first design, flexible layouts, accessible components
- **🔄 Scalability**: SPCS auto-scaling, stateless design, efficient queries

## 🎓 Learning Outcomes

By using this template, you'll learn:

1. **SPCS Best Practices**: Proper service configuration, image management, deployment patterns
2. **React + Express Integration**: API design, state management, component architecture  
3. **Snowflake Integration**: Authentication methods, connection management, query optimization
4. **Docker for SPCS**: Multi-stage builds, security hardening, platform targeting
5. **Production Deployment**: CI/CD patterns, monitoring, troubleshooting

## 📚 Next Steps

### **Extend the Dashboard**
- Add real-time notifications with WebSockets
- Implement user authentication and role-based access
- Add data export functionality (CSV, PDF reports)
- Create admin panel for data management

### **Advanced Features**  
- Integrate machine learning predictions
- Add caching layer (Redis/Snowflake caching)
- Implement audit logging
- Add automated testing (Jest, Cypress)

### **Scale for Production**
- Set up monitoring and alerting
- Implement proper CI/CD pipeline
- Add load balancing for high availability
- Configure backup and disaster recovery

## 📄 License

MIT License - Use this template freely for your commercial and personal SPCS applications.

---

**🚀 Ready to build your own analytics dashboard?** This template gives you everything you need to go from zero to production in minutes, not days!