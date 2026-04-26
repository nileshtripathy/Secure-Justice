const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');

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

// Middleware
app.use(express.json());
app.use(cors());

// Static folder for evidence uploads
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}
app.use('/uploads', express.static('uploads'));

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
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log(`Error connecting to MongoDB: ${err.message}`));
