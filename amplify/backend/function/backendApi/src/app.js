// app.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(express.json());
app.use(cors());

// In-memory user storage (use a real database in production)
const users = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$5K9Y7O1FZN3jKH2ZGfpzXe1qJ2vM3nE4gL6dC7sA9fK8rP0tQ3yBu' // password: 'admin123'
  }
];

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Public route - Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Simple Node.js Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Public route - Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route - Get user profile
app.get('/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'Protected route accessed successfully',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Protected route - Get some data
app.get('/data', authenticateToken, (req, res) => {
  const sampleData = [
    { id: 1, name: 'Item 1', description: 'First item' },
    { id: 2, name: 'Item 2', description: 'Second item' },
    { id: 3, name: 'Item 3', description: 'Third item' }
  ];

  res.json({
    message: 'Data retrieved successfully',
    data: sampleData,
    user: req.user.username,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server (for local development)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET  / - Health check');
    console.log('  POST /login - Login (username: admin, password: admin123)');
    console.log('  GET  /profile - Get user profile (requires token)');
    console.log('  GET  /data - Get sample data (requires token)');
  });
}

module.exports = app;