// backend/server.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import the database module
const { authenticateToken, login } = require('./middleware/auth'); // Import auth functions
const path = require('path'); // Require path module

const projectRoutes = require('./routes/projects'); // Import project routes
const licenseRoutes = require('./routes/license'); // Import license routes
const authRoutes = require('./routes/auth'); // Import auth routes
const notificationRoutes = require('./routes/notifications'); // Import notification routes
const adminRoutes = require('./routes/admins'); // Import admin routes

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

// Middleware
app.use(cors()); // Enable CORS for all routes and origins
app.use(express.json()); // Parse JSON request bodies

// Statically serve uploaded profile pictures
app.use('/uploads/profile_pictures', express.static(path.join(__dirname, 'uploads/profile_pictures')));

// Basic route
app.get('/', (req, res) => {
  res.send('License Manager Backend is running! Database connection pending initialization.');
});

// Auth route
// app.post('/api/auth/login', login); // This is redundant, actual login is in authRoutes

// API routes
// Secure project routes with authentication middleware
app.use('/api/projects', authenticateToken, projectRoutes);
// Public license check route (no authentication needed for client apps)
app.use('/api/license', licenseRoutes);
app.use('/api/auth', authRoutes); // Use auth routes
app.use('/api/notifications', authenticateToken, notificationRoutes); // Secure notification routes
app.use('/api/admins', adminRoutes); // Use admin routes (already secured internally with authenticateToken and authorizeRole)

// Global error handler (basic example)
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err.stack);
  if (res.headersSent) {
    return next(err); // Delegate to default Express error handler if headers already sent
  }
  res.status(err.status || 500).json({ 
    error: err.message || 'Something broke!',
    detail: err.detail // Include detail if available (e.g., from DB errors)
  });
});

// Start server and initialize database
async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('FATAL ERROR: JWT_SECRET is not defined in .env file. Shutting down.');
      process.exit(1);
    }
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      console.warn('WARNING: ADMIN_USERNAME or ADMIN_PASSWORD not set in .env. Using default/insecure credentials for login.');
    }

    await db.initializeDatabase(); // Initialize DB and create table if not exists
    app.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
      console.log('Database initialized and server listening.');
      console.log(`Admin login available at POST /api/auth/login with credentials from .env (ADMIN_USERNAME, ADMIN_PASSWORD)`);
    });
  } catch (error) {
    console.error('Failed to start the server or initialize the database:', error);
    process.exit(1);
  }
}

startServer(); 