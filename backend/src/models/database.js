const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskmanager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Test database connection
const testConnection = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await pool.query('SELECT NOW()');
      console.log('Database connected successfully');
      return;
    } catch (error) {
      console.log(`Database connection failed. Retries left: ${retries - 1}`);
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Initialize database tables
const initializeDatabase = async () => {
  await testConnection();

  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(20) DEFAULT 'medium',
        due_date TIMESTAMP,
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create task_documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_documents (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default users
    await createDefaultUsers();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Create default admin and test users
const createDefaultUsers = async () => {
  try {
    const hashedPassword = await bcrypt.hash('password', 12);
    
    // Create admin user
    await pool.query(`
      INSERT INTO users (email, password, role) 
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@test.com', hashedPassword, 'admin']);

    // Create test user
    await pool.query(`
      INSERT INTO users (email, password, role) 
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
    `, ['user@test.com', hashedPassword, 'user']);

    console.log('Default users created');
  } catch (error) {
    console.error('Error creating default users:', error);
  }
};

module.exports = {
  pool,
  initializeDatabase
};