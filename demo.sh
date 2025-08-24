#!/bin/bash

# Demo script for SPCS Template
# This script demonstrates the complete deployment flow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 SPCS Template Demo${NC}"
echo -e "${YELLOW}This script will demonstrate the complete deployment flow${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if snowsql is available
if ! command -v snowsql &> /dev/null; then
    echo -e "${RED}❌ snowsql not found. Please install Snowflake CLI.${NC}"
    exit 1
fi

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker.${NC}"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install Node.js.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --legacy-peer-deps

# Step 2: Build React app
echo -e "${YELLOW}🏗️  Building React application...${NC}"
npm run build

# Step 3: Test locally
echo -e "${YELLOW}🧪 Testing Docker build locally...${NC}"
npm run docker:build

echo -e "${GREEN}✅ Local build successful${NC}"
echo ""

# Show next steps
echo -e "${BLUE}🎯 Next Steps for SPCS Deployment:${NC}"
echo -e "${YELLOW}1. Setup database:${NC} snowsql -f scripts/create_app_role.sql"
echo -e "${YELLOW}2. Setup schema:${NC} snowsql -f scripts/setup_database.sql" 
echo -e "${YELLOW}3. Setup image repo:${NC} snowsql -f snowflake/setup_image_repo.sql"
echo -e "${YELLOW}4. Build and upload:${NC} cd snowflake && ./buildAndUpload.sh"
echo -e "${YELLOW}5. Deploy service:${NC} snowsql -f snowflake/deploy.sql"
echo ""
echo -e "${GREEN}🏆 Demo completed successfully!${NC}"

