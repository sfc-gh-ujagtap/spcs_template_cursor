#!/bin/bash

# Build and upload script for SPCS deployment
# This script builds the Docker image and uploads it to Snowflake

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏗️  Building and uploading SPCS application...${NC}"

# Configuration - update these values for your application
APP_NAME="spcs-app-template"
IMAGE_TAG="latest"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Step 1: Build the React application
echo -e "${YELLOW}📦 Building React application...${NC}"
npm run build

# Step 2: Build Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build --platform linux/amd64 -t ${APP_NAME}:${IMAGE_TAG} .

# Step 3: Tag image for Snowflake
echo -e "${YELLOW}🏷️  Tagging image for Snowflake...${NC}"
SNOWFLAKE_IMAGE_URL="spcs_app_db/image_schema/image_repo/${APP_NAME}:${IMAGE_TAG}"
docker tag ${APP_NAME}:${IMAGE_TAG} ${SNOWFLAKE_IMAGE_URL}

# Step 4: Get repository login token
echo -e "${YELLOW}🔑 Getting Snowflake repository login token...${NC}"
TOKEN=$(snowsql -q "SELECT SYSTEM\$REGISTRY_TOKEN();" --output-format plain)

# Clean the token (remove header and whitespace)
TOKEN=$(echo "$TOKEN" | tail -n +2 | tr -d '[:space:]')

# Step 5: Login to Snowflake registry
echo -e "${YELLOW}🔐 Logging into Snowflake registry...${NC}"
echo $TOKEN | docker login -u 0sessiontoken --password-stdin $(snowsql -q "SELECT SYSTEM\$REGISTRY_HOSTNAME();" --output-format plain | tail -n +2 | tr -d '[:space:]')

# Step 6: Push image to Snowflake
echo -e "${YELLOW}🚀 Pushing image to Snowflake...${NC}"
docker push ${SNOWFLAKE_IMAGE_URL}

echo -e "${GREEN}✅ Build and upload complete!${NC}"
echo -e "${GREEN}📋 Image uploaded to: ${SNOWFLAKE_IMAGE_URL}${NC}"
echo -e "${YELLOW}💡 Next step: Run deployment script${NC}"
echo -e "${YELLOW}   snowsql -f snowflake/deploy.sql${NC}"
