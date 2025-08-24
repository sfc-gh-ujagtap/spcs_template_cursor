-- Database setup script for SPCS applications
-- Replace SPCS_APP_DB with your actual database name

USE ROLE APP_SPCS_ROLE;
USE WAREHOUSE COMPUTE_WH;

-- Create application database
CREATE DATABASE IF NOT EXISTS SPCS_APP_DB
COMMENT = 'Database for SPCS application';

-- Create application schema
CREATE SCHEMA IF NOT EXISTS SPCS_APP_DB.APP_SCHEMA
COMMENT = 'Main schema for application data and objects';

USE DATABASE SPCS_APP_DB;
USE SCHEMA APP_SCHEMA;

-- Create sample table (replace with your actual tables)
CREATE TABLE IF NOT EXISTS SAMPLE_DATA (
    id INTEGER AUTOINCREMENT,
    name STRING,
    value NUMBER,
    created_at TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP(),
    PRIMARY KEY (id)
)
COMMENT = 'Sample table - replace with your actual data structure';

-- Insert sample data
INSERT INTO SAMPLE_DATA (name, value) VALUES 
    ('Sample Record 1', 100),
    ('Sample Record 2', 200),
    ('Sample Record 3', 300);

-- Verify setup
SELECT 'Database created successfully' as status;
SELECT COUNT(*) as sample_record_count FROM SAMPLE_DATA;

-- Show current configuration
SELECT CURRENT_DATABASE() as database_name, 
       CURRENT_SCHEMA() as schema_name,
       CURRENT_ROLE() as role_name,
       CURRENT_WAREHOUSE() as warehouse_name;

