const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

// Load env vars before anything reads process.env
dotenv.config();

const { validateEnv, isProd } = require('./config/env');
const User = require('./models/User');
const { loadAccessibleFIR } = require('./utils/access');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { logError } = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const firRoutes = require('./routes/firRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const caseLogRoutes = require('./routes/caseLogRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
app.set('trust proxy', 1); // behind Render / a reverse proxy: needed for correct client IPs (rate limiting)

// ── CORS: one allow-list shared by REST and Socket.io ──
const allowedOrigins = [
  process.env.FRONTEND_URL,
  !isProd && 'http://localhost:5173',
].filter(Boolean);
const vercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/; // Vercel preview/production URLs

const originAllowed = (origin) =>
  !origin || allowedOrigins.includes(origin) || (process.env.ALLOW_VERCEL_PREVIEWS === 'true' && vercelPreview.test(origin));

app.use(cors({
  origin: (origin, callback) => (originAllowed(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'))),
  credentials: true,
}));

app.use(helmet());
if (!isProd) app.use(morgan('dev'));
else app.use(morgan('combined'));
app.use(express.json({ limit: '100kb' }));

// NOTE: /uploads is intentionally NOT served statically. Evidence is streamed through
// GET /api/evidence/file/:id, which checks authentication and case access first.

app.get('/', (req, res) => res.json({ message: 'Secure Justice Backend API', status: 'running', version: '1.1.0' }));
app.get('/health', (req, res) => res.status(200).send('OK')); // health check for Render

app.use('/api/auth', authRoutes);
app.use('/api/fir', firRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/caselogs', caseLogRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

// ── Socket.io ──
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => (originAllowed(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'))),
    methods: ['GET', 'POST'],
  },
});
app.set('io', io);

// Authenticate every socket with the same JWT used for REST.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role status name');
    if (!user || user.status !== 'active') return next(new Error('Authentication failed'));
    socket.data.user = { id: user._id.toString(), role: user.role, name: user.name };
    return next();
  } catch {
    return next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  const { user } = socket.data;
  socket.join(user.id); // personal room, derived from the verified token, not from client input

  // A client may only join the room of a case it is allowed to see.
  socket.on('join-fir', async (firId, ack) => {
    try {
      const fir = await loadAccessibleFIR(user, firId);
      if (!fir) return typeof ack === 'function' && ack({ ok: false });
      socket.join(`fir_${fir._id}`);
      return typeof ack === 'function' && ack({ ok: true });
    } catch (err) {
      logError('socket:join-fir', err);
      return typeof ack === 'function' && ack({ ok: false });
    }
  });

  socket.on('leave-fir', (firId) => {
    if (typeof firId === 'string') socket.leave(`fir_${firId}`);
  });
});

// ── Startup ──
const start = async () => {
  validateEnv();
  const PORT = process.env.PORT || 5000;
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/securejustice';
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB Connected');
  server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
};

if (require.main === module) {
  start().catch((err) => {
    console.error(`Startup failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { app, server, io };
