require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const wargaRoutes = require('./routes/warga');
const paymentRoutes = require('./routes/payment');

const app = express();

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // izinkan non-browser calls (curl, server-to-server) & origin yang terdaftar
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // izinkan semua preview/production URL Vercel (*.vercel.app)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(new Error(`CORS: origin tidak diizinkan — ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/warga', wargaRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
