const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root API directory & welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Secure Note-Taking & RBAC REST API',
    status: 'online',
    version: '1.0.0',
    documentation: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      notes: {
        list_and_create: 'GET, POST /api/notes',
        manage_by_id: 'GET, PUT, DELETE /api/notes/:id',
      },
      aggregations: {
        scenario1_interests: 'GET /api/users/group-by-interests',
        scenario2_user_posts: 'GET /api/posts/user/:userId',
      },
      posts: 'GET, POST /api/posts',
      users_admin: 'GET, POST, PUT, DELETE /api/users',
    },
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Secure Note Taking API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found at ${req.originalUrl}`,
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
