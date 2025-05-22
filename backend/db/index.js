const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Ensure .env from project root is loaded

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
        license_status VARCHAR(50) NOT NULL DEFAULT 'NOT_PAID' CHECK (license_status IN ('NOT_PAID', 'PARTIALLY_PAID', 'FULLY_PAID')),
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