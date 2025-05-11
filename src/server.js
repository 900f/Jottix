const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

dotenv.config();
connectDB();

const app = express();

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../Uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));

// Serve HTML pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));
app.get('/explore', (req, res) => res.sendFile(path.join(__dirname, '../public/explore.html')));
app.get('/inspiration', (req, res) => res.sendFile(path.join(__dirname, '../public/inspiration.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '../public/signup.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, '../public/profile.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, '../public/about.html')));

// Fallback for placeholder images
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  res.redirect(`https://via.placeholder.com/${width}x${height}`);
});

// API error handler
app.use('/api/*', (req, res) => {
  console.log(`API 404: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Handle 404 for non-API routes
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.url}`);
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
