-- Setup image repository for SPCS deployment
-- This script creates the necessary database, schema, and image repository

USE ROLE APP_SPCS_ROLE;
USE WAREHOUSE COMPUTE_WH;

-- Use the application database created earlier
USE DATABASE SPCS_APP_DB;

-- Create image schema for storing container images
CREATE SCHEMA IF NOT EXISTS IMAGE_SCHEMA
COMMENT = 'Schema for storing SPCS container images';

USE SCHEMA IMAGE_SCHEMA;

-- Create image repository
CREATE IMAGE REPOSITORY IF NOT EXISTS IMAGE_REPO
COMMENT = 'Repository for application container images';

-- Show the repository URL for buildAndUpload.sh script
SHOW IMAGE REPOSITORIES;

SELECT 'Image repository setup complete' as status;
