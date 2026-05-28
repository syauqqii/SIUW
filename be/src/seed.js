require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const email = process.env.ADMIN_EMAIL || 'admin@siuw.local';
const password = process.env.ADMIN_PASSWORD || 'admin123';

async function seed() {
  const existing = db.prepare("SELECT id FROM users WHERE role = 'admin' AND email = ?").get(email);
  if (existing) {
    console.log('Admin already exists:', email);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  db.prepare('INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)')
    .run(email, hash, 'admin', new Date().toISOString());

  console.log('Admin created:', email);
}

seed().catch(console.error);
