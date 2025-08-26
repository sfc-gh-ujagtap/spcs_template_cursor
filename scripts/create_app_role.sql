-- Create dedicated application role for SPCS deployment
-- This role follows the principle of least privilege

USE ROLE ACCOUNTADMIN;

-- Create warehouse if not specified (per .cursorrules requirement)
CREATE WAREHOUSE IF NOT EXISTS COMPUTE_WH
  WAREHOUSE_SIZE = 'X-SMALL'
  AUTO_SUSPEND = 300
  AUTO_RESUME = TRUE
  COMMENT = 'Warehouse for SPCS application';

-- Create the application role
CREATE ROLE IF NOT EXISTS APP_SPCS_ROLE 
COMMENT = 'Role for SPCS application with minimal required permissions';

-- Grant basic permissions needed for SPCS applications
GRANT USAGE ON WAREHOUSE COMPUTE_WH TO ROLE APP_SPCS_ROLE;

-- Grant ownership of warehouse (per .cursorrules requirement)
GRANT OWNERSHIP ON WAREHOUSE COMPUTE_WH TO ROLE APP_SPCS_ROLE COPY CURRENT GRANTS;

-- Grant permission to create databases (for new applications)
GRANT CREATE DATABASE ON ACCOUNT TO ROLE APP_SPCS_ROLE;

-- For SPCS service management
GRANT CREATE COMPUTE POOL ON ACCOUNT TO ROLE APP_SPCS_ROLE;
-- Note: CREATE SERVICE privilege might need to be granted on specific database/schema
-- GRANT CREATE SERVICE ON ACCOUNT TO ROLE APP_SPCS_ROLE;
GRANT BIND SERVICE ENDPOINT ON ACCOUNT TO ROLE APP_SPCS_ROLE;

-- Grant role to current user for testing
SET current_username = (SELECT CURRENT_USER());
GRANT ROLE APP_SPCS_ROLE TO USER IDENTIFIER($current_username);

-- Show grants to verify role setup
SHOW GRANTS TO ROLE APP_SPCS_ROLE;

