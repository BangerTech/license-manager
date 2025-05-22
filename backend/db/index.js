const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Ensure .env from project root is loaded
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: Add SSL configuration if your PostgreSQL server requires it (e.g., for production)
  // ssl: {
  //   rejectUnauthorized: false // Adjust as per your security requirements
  // }
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database!');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Function to test the connection and create table
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to database for initial setup.');

    // Create the projects table if it doesn't exist (schema from license-manager.md)
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_name VARCHAR(255) NOT NULL UNIQUE,
        project_identifier VARCHAR(255) NOT NULL UNIQUE,
        client_ip_address VARCHAR(255),
        license_status VARCHAR(50) NOT NULL DEFAULT 'FULLY_PAID' CHECK (license_status IN ('NOT_PAID', 'PARTIALLY_PAID', 'FULLY_PAID')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
    `;
    // Enable pgcrypto extension if not enabled, for gen_random_uuid()
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    await client.query(createTableQuery);
    console.log('Table "projects" checked/created successfully.');

    // Trigger to update updated_at timestamp
    const createTriggerFunctionQuery = `
      CREATE OR REPLACE FUNCTION trigger_set_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    await client.query(createTriggerFunctionQuery);
    console.log('Trigger function "trigger_set_timestamp" checked/created successfully.');

    const createTriggerQuery = `
      DROP TRIGGER IF EXISTS set_timestamp ON projects;
      CREATE TRIGGER set_timestamp
      BEFORE UPDATE ON projects
      FOR EACH ROW
      EXECUTE PROCEDURE trigger_set_timestamp();
    `;
    await client.query(createTriggerQuery);
    console.log('Trigger "set_timestamp" for "projects" table checked/created successfully.');

    // Create admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'administrator',
        profile_image_url TEXT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Table "admins" initialized.');

    // Check if default admin needs to be created
    const adminRes = await client.query('SELECT COUNT(*) FROM admins');
    if (parseInt(adminRes.rows[0].count, 10) === 0) {
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;
      const adminRole = 'administrator';
      if (adminUsername && adminPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);
        await client.query(
          'INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)',
          [adminUsername, hashedPassword, adminRole]
        );
        console.log(`Default admin user "${adminUsername}" created with role "${adminRole}".`);
      } else {
        console.error('ADMIN_USERNAME or ADMIN_PASSWORD environment variables are not set. Cannot create default admin.');
      }
    }

    // Create notifications table
    const createNotificationsTableQuery = `
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL, -- e.g., 'PROJECT_CREATED', 'STATUS_UPDATED', 'ADMIN_LOGIN_SUCCESS', 'ADMIN_PASSWORD_CHANGED'
        message TEXT NOT NULL,
        project_id UUID,
        admin_id INTEGER,
        details JSONB, -- For storing additional structured data, like old/new values
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_project FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
        CONSTRAINT fk_admin FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE SET NULL
      );
    `;
    await client.query(createNotificationsTableQuery);
    console.log('Table "notifications" checked/created successfully.');

    client.release();
  } catch (err) {
    console.error('Error initializing database:', err.stack);
    // process.exit(1); // Optionally exit if DB init fails critically
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  initializeDatabase,
  pool // Export pool directly if needed for more complex scenarios
}; 