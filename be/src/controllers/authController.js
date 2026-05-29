const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const sheets = require('../config/sheets');

const CREDS_PATH = path.join(__dirname, '../../creds.json');

function loadCreds() {
  if (!fs.existsSync(CREDS_PATH)) return [];
  return JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
}

async function login(req, res) {
  try {
    const { role, email, phone, password } = req.body;

    if (!role || !['admin', 'warga'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (role === 'admin') {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const admins = loadCreds();
      const admin = admins.find((a) => a.email === email);
      if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, admin.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { email: admin.email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        token,
        user: { email: admin.email, role: 'admin' },
      });
    }

    // Warga — cukup nomor telepon
    if (!phone) {
      return res.status(400).json({ error: 'Phone required' });
    }

    const warga = await sheets.wargaGetByPhone(phone);
    if (!warga) {
      return res.status(401).json({ error: 'Nomor telepon tidak terdaftar' });
    }

    const token = jwt.sign(
      { phone: warga.phone, role: 'warga', name: warga.name, house_no: warga.house_no },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { phone: warga.phone, role: 'warga', name: warga.name, house_no: warga.house_no },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { login };
