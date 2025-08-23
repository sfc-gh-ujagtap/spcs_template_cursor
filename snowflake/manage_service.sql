-- Service management commands for SPCS applications
-- Run these commands as needed for service lifecycle management

USE ROLE APP_SPCS_ROLE;
USE WAREHOUSE COMPUTE_WH;
USE DATABASE SPCS_APP_DB;
USE SCHEMA APP_SCHEMA;

-- Check service status
SELECT SYSTEM$GET_SERVICE_STATUS('SPCS_APP_SERVICE') as service_status;

-- View service logs (helpful for debugging)
CALL SYSTEM$GET_SERVICE_LOGS('SPCS_APP_SERVICE', '0');

-- Show service details
SHOW SERVICES;
DESCRIBE SERVICE SPCS_APP_SERVICE;

-- Show service endpoints
SHOW ENDPOINTS IN SERVICE SPCS_APP_SERVICE;

-- Suspend service (to save costs when not in use)
-- ALTER SERVICE SPCS_APP_SERVICE SUSPEND;

-- Resume service
-- ALTER SERVICE SPCS_APP_SERVICE RESUME;

-- Drop service (for cleanup or redeployment)
-- DROP SERVICE IF EXISTS SPCS_APP_SERVICE;

-- Drop compute pool (for complete cleanup)
-- DROP COMPUTE POOL IF EXISTS APP_COMPUTE_POOL;

-- Show all compute pools
SHOW COMPUTE POOLS;
