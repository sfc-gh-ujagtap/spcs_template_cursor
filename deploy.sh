#!/bin/bash

# Unified SPCS Deployment Script
# This script supports both local setup and full SPCS deployment
# Follows the .cursorrules guidelines for SPCS deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="spcs-sales-analytics"
DATABASE_NAME="SPCS_APP_DB"
SCHEMA_NAME="APP_SCHEMA"
SERVICE_NAME="SPCS_APP_SERVICE"
IMAGE_TAG="latest"

# Parse command line arguments
DEPLOYMENT_MODE="spcs"  # Default to full SPCS deployment

show_usage() {
    echo "Usage: $0 [--local|--spcs]"
    echo ""
    echo "Deployment Modes:"
    echo "  --local    Setup database and role for local development only"
    echo "  --spcs     Full SPCS deployment with Docker build and service (default)"
    echo ""
    echo "Examples:"
    echo "  $0 --local    # Setup database for local development"
    echo "  $0 --spcs     # Full SPCS deployment"
    echo "  $0            # Full SPCS deployment (default)"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            DEPLOYMENT_MODE="local"
            shift
            ;;
        --spcs)
            DEPLOYMENT_MODE="spcs"
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

if [ "$DEPLOYMENT_MODE" = "local" ]; then
    echo -e "${BLUE}🏠 Starting local development setup...${NC}"
    echo -e "${BLUE}Mode: Local Database Setup${NC}"
else
    echo -e "${BLUE}🚀 Starting full SPCS deployment...${NC}"
    echo -e "${BLUE}Mode: Complete SPCS Deployment${NC}"
fi

echo -e "${BLUE}App: ${APP_NAME}${NC}"
echo -e "${BLUE}Database: ${DATABASE_NAME}${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Step 1: Setup database and role (ALWAYS required)
echo -e "${YELLOW}🗄️  Setting up application role and warehouse...${NC}"
snowsql -c default -f scripts/create_app_role.sql
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create application role or warehouse${NC}"
    exit 1
fi

echo -e "${YELLOW}💾 Setting up database and sample data...${NC}"
snowsql -c default -f scripts/setup_database.sql
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to setup database or sample data${NC}"
    exit 1
fi

# For local mode, set up environment variables and start server
if [ "$DEPLOYMENT_MODE" = "local" ]; then
    echo -e "${YELLOW}⚙️  Setting up environment variables for local development...${NC}"
    
    # Create .env file for local development
    cat > .env.local << EOF
# Snowflake Configuration for Local Development
SNOWFLAKE_ROLE=APP_SPCS_ROLE
SNOWFLAKE_WAREHOUSE=COMPUTE_WH
SNOWFLAKE_DATABASE=${DATABASE_NAME}
SNOWFLAKE_SCHEMA=${SCHEMA_NAME}

# Note: SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, SNOWFLAKE_PASSWORD 
# should be set as environment variables or will be read from ~/.snowsql/config
EOF

    echo -e "${GREEN}🎉 Local development setup completed successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📋 Local Setup Summary:${NC}"
    echo -e "${GREEN}   • Database: ${DATABASE_NAME}${NC}"
    echo -e "${GREEN}   • Schema: ${SCHEMA_NAME}${NC}"
    echo -e "${GREEN}   • Warehouse: COMPUTE_WH${NC}"
    echo -e "${GREEN}   • Role: APP_SPCS_ROLE${NC}"
    echo -e "${GREEN}   • Sample Data: ✅ 10 customers, 10 products, 24 orders${NC}"
    echo -e "${GREEN}   • Environment: .env.local created${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}💡 Next Steps:${NC}"
    echo -e "${YELLOW}   1. Build React app: npm run build${NC}"
    echo -e "${YELLOW}   2. Start local server with env vars:${NC}"
    echo -e "${YELLOW}      export SNOWFLAKE_ROLE=APP_SPCS_ROLE${NC}"
    echo -e "${YELLOW}      export SNOWFLAKE_WAREHOUSE=COMPUTE_WH${NC}"
    echo -e "${YELLOW}      export SNOWFLAKE_DATABASE=${DATABASE_NAME}${NC}"
    echo -e "${YELLOW}      export SNOWFLAKE_SCHEMA=${SCHEMA_NAME}${NC}"
    echo -e "${YELLOW}      npm start${NC}"
    echo -e "${YELLOW}   3. Access dashboard: http://localhost:3002${NC}"
    echo -e "${YELLOW}   4. Deploy to SPCS: ./deploy.sh --spcs${NC}"
    exit 0
fi

# SPCS-only steps continue below...
echo -e "${YELLOW}📦 Setting up image repository...${NC}"
snowsql -c default -f snowflake/setup_image_repo.sql
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to setup image repository${NC}"
    exit 1
fi

# Step 3: Build the React application
echo -e "${YELLOW}⚛️  Building React application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build React application${NC}"
    exit 1
fi

# Step 4: Build Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build --platform linux/amd64 -t ${APP_NAME}:${IMAGE_TAG} .
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build Docker image${NC}"
    exit 1
fi

# Step 5: Get registry URL first for proper tagging
echo -e "${YELLOW}🔍 Getting Snowflake registry URL for tagging...${NC}"
REGISTRY_URL=$(snowsql -c default -q "SHOW IMAGE REPOSITORIES IN SCHEMA ${DATABASE_NAME}.IMAGE_SCHEMA;" -o output_format=plain -o header=false -o friendly=false -o timing=false | awk '{print $7}')
if [ -z "$REGISTRY_URL" ]; then
    echo -e "${RED}❌ Failed to get registry URL${NC}"
    exit 1
fi
echo -e "${GREEN}Registry URL: ${REGISTRY_URL}${NC}"

# Step 6: Tag image for Snowflake
echo -e "${YELLOW}🏷️  Tagging image for Snowflake...${NC}"
SNOWFLAKE_IMAGE_URL="${REGISTRY_URL}/${APP_NAME}:${IMAGE_TAG}"
docker tag ${APP_NAME}:${IMAGE_TAG} ${SNOWFLAKE_IMAGE_URL}
echo -e "${GREEN}Tagged as: ${SNOWFLAKE_IMAGE_URL}${NC}"

# Step 7: Login to Snowflake SPCS registry
echo -e "${YELLOW}🔐 Logging into Snowflake SPCS registry...${NC}"
snow spcs image-registry login
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to login to Snowflake SPCS registry${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Successfully logged into Snowflake SPCS registry${NC}"

# Step 8: Push image to Snowflake
echo -e "${YELLOW}🚀 Pushing image to Snowflake...${NC}"
docker push ${SNOWFLAKE_IMAGE_URL}
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to push image to Snowflake${NC}"
    exit 1
fi

# Step 9: Deploy service
echo -e "${YELLOW}☁️  Deploying SPCS service...${NC}"
snowsql -c default -f snowflake/deploy.sql
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to deploy service${NC}"
    exit 1
fi

# Step 10: Wait for service to be ready and get endpoint
echo -e "${YELLOW}⏳ Waiting for service to be ready...${NC}"
sleep 10

for i in {1..30}; do
    STATUS=$(snowsql -c default -q "SELECT SYSTEM\$GET_SERVICE_STATUS('${DATABASE_NAME}.${SCHEMA_NAME}.${SERVICE_NAME}');" -o output_format=plain -o header=false -o friendly=false -o timing=false | tr -d '[:space:]')
    echo -e "${BLUE}Service status: ${STATUS}${NC}"
    
    if [[ "$STATUS" == *"READY"* ]]; then
        echo -e "${GREEN}✅ Service is ready!${NC}"
        break
    elif [[ "$STATUS" == *"FAILED"* ]]; then
        echo -e "${RED}❌ Service deployment failed${NC}"
        echo -e "${YELLOW}Check logs with: CALL SYSTEM\$GET_SERVICE_LOGS('${DATABASE_NAME}.${SCHEMA_NAME}.${SERVICE_NAME}', '0');${NC}"
        exit 1
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Service did not become ready within 5 minutes${NC}"
        exit 1
    fi
    
    sleep 10
done

# Step 11: Get service endpoint
echo -e "${YELLOW}🔗 Getting service endpoint...${NC}"
ENDPOINT=$(snowsql -c default -q "SHOW ENDPOINTS IN SERVICE ${DATABASE_NAME}.${SCHEMA_NAME}.${SERVICE_NAME};" -o output_format=plain -o header=false -o friendly=false -o timing=false | grep -E 'https://' | head -1 | awk '{print $NF}')

# Final summary for SPCS deployment
echo -e "${GREEN}🎉 SPCS deployment completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📋 SPCS Deployment Summary:${NC}"
echo -e "${GREEN}   • Database: ${DATABASE_NAME}${NC}"
echo -e "${GREEN}   • Schema: ${SCHEMA_NAME}${NC}"
echo -e "${GREEN}   • Service: ${SERVICE_NAME}${NC}"
echo -e "${GREEN}   • Image: ${SNOWFLAKE_IMAGE_URL}${NC}"
echo -e "${GREEN}   • Sample Data: ✅ 10 customers, 10 products, 24 orders${NC}"
if [ ! -z "$ENDPOINT" ]; then
    echo -e "${GREEN}   • Endpoint: ${ENDPOINT}${NC}"
    echo -e "${GREEN}   • Health Check: ${ENDPOINT}/api/health${NC}"
fi
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}💡 Useful Commands:${NC}"
echo -e "${YELLOW}   • Check logs: CALL SYSTEM\$GET_SERVICE_LOGS('${DATABASE_NAME}.${SCHEMA_NAME}.${SERVICE_NAME}', '0');${NC}"
echo -e "${YELLOW}   • Check status: SELECT SYSTEM\$GET_SERVICE_STATUS('${DATABASE_NAME}.${SCHEMA_NAME}.${SERVICE_NAME}');${NC}"
echo -e "${YELLOW}   • Stop service: ALTER SERVICE ${DATABASE_NAME}.${SCHEMA_NAME}.${SERVICE_NAME} SUSPEND;${NC}"
echo -e "${YELLOW}   • Start service: ALTER SERVICE ${DATABASE_NAME}.${SCHEMA_NAME}.${SERVICE_NAME} RESUME;${NC}"
echo -e "${YELLOW}   • Local development: ./deploy.sh --local${NC}"
