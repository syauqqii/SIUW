const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function login(req, res) {
  try {
    const { role, email, phone, password } = req.body;

    if (!role || !['admin', 'warga'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    let user;
    if (role === 'admin') {
      if (!email) return res.status(400).json({ error: 'Email required for admin login' });
      user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, 'admin');
    } else {
      if (!phone) return res.status(400).json({ error: 'Phone required for warga login' });
      user = db.prepare('SELECT * FROM users WHERE phone = ? AND role = ?').get(phone, 'warga');
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, phone: user.phone, house_no: user.house_no },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, role: user.role, email: user.email, phone: user.phone, house_no: user.house_no },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { login };
