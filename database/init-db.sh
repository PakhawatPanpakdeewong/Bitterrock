#!/bin/bash
set -e

# เชื่อมต่อกับฐานข้อมูลที่กำหนดโดยตัวแปรสภาพแวดล้อม
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

    -- =================================================================
    -- TABLE CREATION
    -- Auth tables: users and sessions
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    -- Using 'CREATE TABLE IF NOT EXISTS' is safe for re-running the script.
    -- =================================================================

    -- 1. Table: products
    CREATE TABLE IF NOT EXISTS products (
        product_id SERIAL PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        description TEXT,
        sku VARCHAR(50) UNIQUE NOT NULL,
        price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
        category_id INT,
        image_url VARCHAR(255),
        tags TEXT[],
        created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Table: customers
    CREATE TABLE IF NOT EXISTS customers (
        customer_id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        default_shipping_address TEXT,
        registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Table: warehouses (Changed to plural for consistency)
    CREATE TABLE IF NOT EXISTS warehouses (
        warehouse_id SERIAL PRIMARY KEY,
        warehouse_name VARCHAR(255) UNIQUE NOT NULL, -- Name should be unique
        location_address TEXT,
        contact_person VARCHAR(255)
    );

    -- 4. Table: inventory
    CREATE TABLE IF NOT EXISTS inventory (
        inventory_id SERIAL PRIMARY KEY,
        product_id INT NOT NULL,
        warehouse_id INT NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
        is_active BOOLEAN DEFAULT TRUE,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_product
            FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
        CONSTRAINT fk_warehouse
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id) ON DELETE CASCADE,
        -- A product can only have one inventory record per warehouse.
        CONSTRAINT unique_product_warehouse UNIQUE (product_id, warehouse_id)
    );

    -- 5. Table: orders
    CREATE TABLE IF NOT EXISTS orders (
        order_id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL,
        order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
        status VARCHAR(50) DEFAULT 'Pending',
        shipping_address TEXT,
        CONSTRAINT fk_customer
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
    );

    -- 6. Table: order_items
    CREATE TABLE IF NOT EXISTS order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
        CONSTRAINT fk_order
            FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        CONSTRAINT fk_order_product
            FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
    );

    -- 7. Table: product_reviews
    CREATE TABLE IF NOT EXISTS product_reviews (
        review_id SERIAL PRIMARY KEY,
        product_id INT NOT NULL,
        customer_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        review_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_review_product
            FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
        CONSTRAINT fk_review_customer
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
        CONSTRAINT unique_product_customer_review UNIQUE (product_id, customer_id)
    );

    -- 8. Table: categories
    CREATE TABLE IF NOT EXISTS categories (
        category_id SERIAL PRIMARY KEY,
        category_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    ); 

    -- 9. Table: payments
    CREATE TABLE IF NOT EXISTS payments (
        payment_id SERIAL PRIMARY KEY,
        order_id INT NOT NULL,
        payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        payment_amount NUMERIC(10, 2) NOT NULL CHECK (payment_amount >= 0),
        transaction_id VARCHAR(100) UNIQUE NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'Pending',
        CONSTRAINT fk_payment_order
            FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
    );

    -- 10. Table: shipping
    CREATE TABLE IF NOT EXISTS shipping (
        shipping_id SERIAL PRIMARY KEY,
        order_id INT NOT NULL,
        shipping_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        tracking_number VARCHAR(100) UNIQUE,
        shipping_method VARCHAR(50) NOT NULL,
        shipping_status VARCHAR(50) DEFAULT 'Pending',
        shipping_cost NUMERIC(10, 2) NOT NULL CHECK (shipping_cost >= 0),
        estimated_delivery_date TIMESTAMP WITH TIME ZONE,
        CONSTRAINT unique_order_shipping UNIQUE (order_id),
        CONSTRAINT fk_shipping_order
            FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
    );

    -- 11. Table: discounts
    CREATE TABLE IF NOT EXISTS discounts (
        discount_id SERIAL PRIMARY KEY,
        discount_code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('Percentage', 'Fixed Amount')),
        discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value >= 0),
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_discount_dates CHECK (start_date <= end_date)
    );

    -- 12. Table: search_history
    CREATE TABLE IF NOT EXISTS search_history (
        search_id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL,
        search_query TEXT NOT NULL,
        search_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_search_customer
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
    );

    -- 13. Table: search_results
    CREATE TABLE IF NOT EXISTS search_results (
        result_id SERIAL PRIMARY KEY,
        search_id INT NOT NULL,
        product_id INT NOT NULL,
        result_rank INT NOT NULL CHECK (result_rank > 0),
        result_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_result_search
            FOREIGN KEY (search_id) REFERENCES search_history(search_id) ON DELETE CASCADE,
        CONSTRAINT fk_result_product
            FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
        CONSTRAINT unique_search_product UNIQUE (search_id, product_id)
    );

    -- 14. Table: sales_summary
    CREATE TABLE IF NOT EXISTS sales_summary (
        summary_id SERIAL PRIMARY KEY,
        product_id INT NOT NULL,
        total_sales NUMERIC(10, 2) NOT NULL CHECK (total_sales >= 0),
        total_quantity_sold INT NOT NULL CHECK (total_quantity_sold >= 0),
        summary_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_summary_product
            FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
        CONSTRAINT unique_product_summary UNIQUE (product_id, summary_date)
    );  

    -- =================================================================
    -- DATA CLEANUP
    -- Truncate all tables to ensure a clean slate on every run.
    -- 'RESTART IDENTITY' resets the auto-incrementing IDs.
    -- 'CASCADE' removes dependent data in other tables (e.g., inventory data when products are truncated).
    -- =================================================================

    TRUNCATE TABLE sessions, users, products, customers, warehouses, inventory RESTART IDENTITY CASCADE;

    -- =================================================================
    -- DATA INSERTION
    -- We insert data into primary tables first (products, customers, warehouses),
    -- then into dependent tables (inventory).
    -- =================================================================

    -- Insert sample data for products
    INSERT INTO products (product_name, description, sku, price) VALUES
        ('ขวดนม Anti-Colic 150ml', 'ขวดนมป้องกันโคลิคสำหรับเด็กแรกเกิด 150ml พร้อมจุกนมไหลช้า', 'BN001A150', 350.00),
        ('ผ้าอ้อมเด็กไซส์ NB แพ็ค 48 ชิ้น', 'ผ้าอ้อมเด็กแรกเกิด ซึมซับดีเยี่ยม แห้งสบายผิว แพ็คประหยัด 48 ชิ้น', 'DIAPER002NB', 299.00),
        ('เครื่องปั๊มนมไฟฟ้าคู่', 'เครื่องปั๊มนมระบบไฟฟ้า ปั๊มคู่ ประหยัดเวลา ใช้งานง่าย', 'BPUMP003E', 3500.00),
        ('ชุดของเล่นยางกัดเด็กแรกเกิด', 'ชุดของเล่นยางกัดซิลิโคน ปลอดภัย ไร้สารอันตราย เสริมพัฒนาการ', 'TEETHER004', 180.00),
        ('คาร์ซีทสำหรับเด็ก 0-4 ปี', 'คาร์ซีทปรับเอนได้ 3 ระดับ สำหรับเด็กแรกเกิดถึง 4 ปี มาตรฐานความปลอดภัย', 'CARSEAT005', 4800.00);

    -- Insert sample data for customers
    INSERT INTO customers (first_name, last_name, email, password_hash, phone_number, default_shipping_address) VALUES
        ('สมชาย', 'ใจดี', 'somchai@example.com', 'hashed_pass_1', '0812345678', '123 ถนนสุขุมวิท, กรุงเทพฯ'),
        ('สมศรี', 'มณี', 'somsri@example.com', 'hashed_pass_2', '0898765432', '456 ถนนนิมมานเหมินท์, เชียงใหม่'),
        ('สุนทรี', 'สุขใจ', 'sontree@example.com', 'hashed_pass_3', '0987654321', '789 ถนนห้วยแก้ว, เชียงใหม่');

    -- Insert sample data for warehouses
    INSERT INTO warehouses (warehouse_name, location_address, contact_person) VALUES
        ('คลังหลัก กรุงเทพฯ', '789 ถนนบางนา-ตราด, สมุทรปราการ', 'คุณวิชัย'),
        ('สต็อกหน้าร้าน เชียงใหม่', '101 ถนนห้วยแก้ว, เชียงใหม่', 'คุณสุนีย์');

    -- =================================================================
    -- END OF SCRIPT
    -- This script creates the database schema and populates it with sample data.
    -- You can modify the sample data as needed.
    -- =================================================================
   
EOSQL