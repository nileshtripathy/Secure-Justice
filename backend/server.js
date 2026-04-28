const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const http = require('http');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

// Load env vars
dotenv.config();

// Route files
const authRoutes = require('./routes/authRoutes');
const firRoutes = require('./routes/firRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const caseLogRoutes = require('./routes/caseLogRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Create HTTP server and initialize Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Make io accessible globally via app
app.set('io', io);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('join-fir', (firId) => {
    socket.join(`fir_${firId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  /\.vercel\.app$/ // Allow all Vercel preview/production URLs
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => 
      allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Static folder for evidence uploads
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static('uploads'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Secure Justice Backend API', status: 'running', version: '1.0.0' });
});

// Health check for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/fir', firRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/caselogs', caseLogRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve frontend in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securejustice';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
    server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(`Error connecting to MongoDB: ${err.message}`));
