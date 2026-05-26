const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
const { verifyEmailTransporter } = require('./utils/emailService');

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// API routes
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const contactRoutes = require('./routes/contact');
const locationRoutes = require('./routes/locations');

app.use('/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/locations', locationRoutes);

// Serve React frontend build in production
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(buildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lostfound')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('MongoDB connection error:', err.message));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);

  verifyEmailTransporter()
    .then((status) => {
      if (status.ok) {
        console.log('Email transporter is ready');
        return;
      }

      console.warn(`Email transporter is not ready: ${status.reason}`);
    })
    .catch((error) => {
      console.warn(`Email transporter verification failed: ${error.message}`);
    });
});
