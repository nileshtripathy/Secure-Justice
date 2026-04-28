const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const http = require('http');
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
    origin: '*',
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
app.use(express.json());
app.use(cors());

// Static folder for evidence uploads
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static('uploads'));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Secure Justice Backend API', version: '1.0.0' });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/fir', firRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/caselogs', caseLogRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securejustice';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
    server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(`Error connecting to MongoDB: ${err.message}`));
