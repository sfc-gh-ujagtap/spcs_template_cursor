-- Database setup script for SPCS applications
-- Replace SPCS_APP_DB with your actual database name

USE ROLE APP_SPCS_ROLE;
USE WAREHOUSE COMPUTE_WH;

-- Create application database (APP_SPCS_ROLE automatically owns what it creates)
CREATE DATABASE IF NOT EXISTS SPCS_APP_DB
COMMENT = 'Database for SPCS application';

-- Create application schema (APP_SPCS_ROLE automatically owns what it creates)
CREATE SCHEMA IF NOT EXISTS SPCS_APP_DB.APP_SCHEMA
COMMENT = 'Main schema for application data and objects';

USE DATABASE SPCS_APP_DB;
USE SCHEMA APP_SCHEMA;

-- Create realistic sales analytics tables
CREATE TABLE IF NOT EXISTS CUSTOMERS (
    customer_id INTEGER AUTOINCREMENT,
    customer_name STRING NOT NULL,
    email STRING,
    city STRING,
    state STRING,
    signup_date DATE,
    PRIMARY KEY (customer_id)
)
COMMENT = 'Customer information for sales analytics';

CREATE TABLE IF NOT EXISTS PRODUCTS (
    product_id INTEGER AUTOINCREMENT,
    product_name STRING NOT NULL,
    category STRING,
    price DECIMAL(10,2),
    PRIMARY KEY (product_id)
)
COMMENT = 'Product catalog for sales analytics';

CREATE TABLE IF NOT EXISTS ORDERS (
    order_id INTEGER AUTOINCREMENT,
    customer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    order_date DATE,
    total_amount DECIMAL(10,2),
    status STRING DEFAULT 'completed',
    PRIMARY KEY (order_id),
    FOREIGN KEY (customer_id) REFERENCES CUSTOMERS(customer_id),
    FOREIGN KEY (product_id) REFERENCES PRODUCTS(product_id)
)
COMMENT = 'Sales orders for analytics dashboard';

-- Insert sample customers
INSERT INTO CUSTOMERS (customer_name, email, city, state, signup_date) VALUES 
    ('Alice Johnson', 'alice@email.com', 'Seattle', 'WA', '2023-01-15'),
    ('Bob Smith', 'bob@email.com', 'Portland', 'OR', '2023-02-20'),
    ('Carol Davis', 'carol@email.com', 'San Francisco', 'CA', '2023-03-10'),
    ('David Wilson', 'david@email.com', 'Denver', 'CO', '2023-04-05'),
    ('Emma Brown', 'emma@email.com', 'Austin', 'TX', '2023-05-12'),
    ('Frank Miller', 'frank@email.com', 'Chicago', 'IL', '2023-06-18'),
    ('Grace Lee', 'grace@email.com', 'Boston', 'MA', '2023-07-22'),
    ('Henry Taylor', 'henry@email.com', 'Miami', 'FL', '2023-08-30'),
    ('Ivy Chen', 'ivy@email.com', 'Los Angeles', 'CA', '2023-09-14'),
    ('Jack Garcia', 'jack@email.com', 'Phoenix', 'AZ', '2023-10-08');

-- Insert sample products
INSERT INTO PRODUCTS (product_name, category, price) VALUES 
    ('Wireless Headphones', 'Electronics', 129.99),
    ('Coffee Maker', 'Appliances', 89.99),
    ('Running Shoes', 'Sports', 149.99),
    ('Laptop Stand', 'Electronics', 39.99),
    ('Yoga Mat', 'Sports', 29.99),
    ('Smart Watch', 'Electronics', 299.99),
    ('Blender', 'Appliances', 79.99),
    ('Desk Lamp', 'Furniture', 49.99),
    ('Water Bottle', 'Sports', 19.99),
    ('Bluetooth Speaker', 'Electronics', 79.99);

-- Insert sample orders (last 6 months of realistic sales data)
INSERT INTO ORDERS (customer_id, product_id, quantity, order_date, total_amount) VALUES 
    (1, 1, 1, '2024-01-15', 129.99),
    (2, 3, 1, '2024-01-18', 149.99),
    (3, 2, 2, '2024-01-22', 179.98),
    (1, 6, 1, '2024-02-05', 299.99),
    (4, 4, 1, '2024-02-10', 39.99),
    (5, 5, 3, '2024-02-14', 89.97),
    (2, 8, 1, '2024-02-20', 49.99),
    (6, 1, 2, '2024-03-01', 259.98),
    (7, 7, 1, '2024-03-08', 79.99),
    (3, 9, 4, '2024-03-15', 79.96),
    (8, 10, 1, '2024-03-22', 79.99),
    (9, 6, 1, '2024-04-02', 299.99),
    (1, 5, 1, '2024-04-10', 29.99),
    (10, 3, 1, '2024-04-18', 149.99),
    (4, 2, 1, '2024-04-25', 89.99),
    (5, 8, 2, '2024-05-05', 99.98),
    (6, 4, 3, '2024-05-12', 119.97),
    (2, 9, 2, '2024-05-20', 39.98),
    (7, 1, 1, '2024-05-28', 129.99),
    (8, 7, 1, '2024-06-03', 79.99),
    (9, 10, 2, '2024-06-10', 159.98),
    (10, 6, 1, '2024-06-15', 299.99),
    (3, 5, 2, '2024-06-22', 59.98),
    (1, 2, 1, '2024-06-28', 89.99);

-- Verify setup
SELECT 'Sales Analytics Database created successfully' as status;
SELECT COUNT(*) as customer_count FROM CUSTOMERS;
SELECT COUNT(*) as product_count FROM PRODUCTS;
SELECT COUNT(*) as order_count FROM ORDERS;
SELECT SUM(total_amount) as total_revenue FROM ORDERS;

-- Show current configuration
SELECT CURRENT_DATABASE() as database_name, 
       CURRENT_SCHEMA() as schema_name,
       CURRENT_ROLE() as role_name,
       CURRENT_WAREHOUSE() as warehouse_name;

