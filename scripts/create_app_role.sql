-- Create dedicated application role for SPCS deployment
-- This role follows the principle of least privilege

USE ROLE ACCOUNTADMIN;

-- Create the application role
CREATE ROLE IF NOT EXISTS APP_SPCS_ROLE 
COMMENT = 'Role for SPCS application with minimal required permissions';

-- Grant basic permissions needed for SPCS applications
GRANT USAGE ON WAREHOUSE COMPUTE_WH TO ROLE APP_SPCS_ROLE;

-- Grant permission to create databases (for new applications)
GRANT CREATE DATABASE ON ACCOUNT TO ROLE APP_SPCS_ROLE;

-- For SPCS service management
GRANT CREATE COMPUTE POOL ON ACCOUNT TO ROLE APP_SPCS_ROLE;
GRANT CREATE SERVICE ON ACCOUNT TO ROLE APP_SPCS_ROLE;
GRANT BIND SERVICE ENDPOINT ON ACCOUNT TO ROLE APP_SPCS_ROLE;

-- Grant role to current user for testing
GRANT ROLE APP_SPCS_ROLE TO USER CURRENT_USER();

SHOW GRANTS TO ROLE APP_SPCS_ROLE;
