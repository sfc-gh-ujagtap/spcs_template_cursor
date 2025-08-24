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

-- Wait for compute pool to be active
-- You may need to run this multiple times until the pool is ready
SELECT SYSTEM$WAIT_FOR_COMPUTE_POOL('APP_COMPUTE_POOL', 300);

-- Create or replace the service
CREATE SERVICE IF NOT EXISTS SPCS_APP_SERVICE
  IN COMPUTE POOL APP_COMPUTE_POOL
  FROM SPECIFICATION $$
    spec:
      container:
      - name: spcs-app-template
        image: /SPCS_APP_DB/IMAGE_SCHEMA/IMAGE_REPO/spcs-app-template:latest
        env:
          SERVER_PORT: 3002
          NODE_ENV: production
          SNOWFLAKE_DATABASE: SPCS_APP_DB
          SNOWFLAKE_SCHEMA: APP_SCHEMA
          SNOWFLAKE_WAREHOUSE: COMPUTE_WH
          SNOWFLAKE_ROLE: APP_SPCS_ROLE
      endpoint:
      - name: app-endpoint
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

