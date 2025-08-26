-- SPCS deployment script
-- This script creates the compute pool and service

USE ROLE APP_SPCS_ROLE;
USE WAREHOUSE COMPUTE_WH;
USE DATABASE SPCS_APP_DB;
USE SCHEMA APP_SCHEMA;

-- Create compute pool if it doesn't exist
CREATE COMPUTE POOL IF NOT EXISTS APP_COMPUTE_POOL
  MIN_NODES = 1
  MAX_NODES = 2
  INSTANCE_FAMILY = CPU_X64_XS
  AUTO_RESUME = TRUE
  AUTO_SUSPEND_SECS = 300
  COMMENT = 'Compute pool for SPCS application';

-- Note: Compute pool will be created and may take time to become active
-- Check compute pool status with: DESCRIBE COMPUTE POOL APP_COMPUTE_POOL;

-- Create the service with explicit account
DROP SERVICE IF EXISTS SPCS_APP_SERVICE;

CREATE SERVICE IF NOT EXISTS SPCS_APP_SERVICE
  IN COMPUTE POOL APP_COMPUTE_POOL
  FROM SPECIFICATION $$
    spec:
      containers:
      - name: "sales-analytics-app"
        image: "/SPCS_APP_DB/IMAGE_SCHEMA/IMAGE_REPO/spcs-sales-analytics:latest"
        env:
          PORT: "3002"
          SNOWFLAKE_WAREHOUSE: "COMPUTE_WH"
          SNOWFLAKE_ROLE: "APP_SPCS_ROLE"
          SNOWFLAKE_DATABASE: "SPCS_APP_DB"
          SNOWFLAKE_SCHEMA: "APP_SCHEMA"
        resources:
          limits:
            memory: "6Gi"
            cpu: "1"
          requests:
            memory: "0.5Gi"
            cpu: "0.5"
      endpoints:
      - name: "app-endpoint"
        port: 3002
        public: true
  $$
  COMMENT = 'SPCS Application Service';

-- Check service status
SELECT SYSTEM$GET_SERVICE_STATUS('SPCS_APP_SERVICE') as service_status;

-- Show service details
SHOW SERVICES;
DESCRIBE SERVICE SPCS_APP_SERVICE;

-- Get service endpoints (run after service is ready)
SHOW ENDPOINTS IN SERVICE SPCS_APP_SERVICE;

