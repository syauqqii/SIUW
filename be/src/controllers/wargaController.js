const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const sheets = require('../config/sheets');

async function getAllWarga(req, res) {
  try {
    const users = db.prepare("SELECT id, phone, house_no, created_at FROM users WHERE role = 'warga'").all();
    const sheetRows = await sheets.wargaGetAll();

    const enriched = users.map((u) => {
      const info = sheetRows.find((r) => r.user_id === String(u.id)) || {};
      return { ...u, name: info.name || '', house_no: info.house_no || u.house_no };
    });

    res.json(enriched);
  } catch (err) {
    console.error('getAllWarga error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createWarga(req, res) {
  try {
    const { name, phone, house_no, password } = req.body;

    if (!name || !phone || !house_no || !password) {
      return res.status(400).json({ error: 'name, phone, house_no, and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const result = db
      .prepare('INSERT INTO users (phone, house_no, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(phone, house_no, password_hash, 'warga', now);

    const userId = result.lastInsertRowid;

    await sheets.wargaCreate({
      id: uuidv4(),
      user_id: String(userId),
      name,
      house_no,
      phone,
      created_at: now,
      updated_at: now,
    });

    res.status(201).json({ id: userId, name, phone, house_no });
  } catch (err) {
    console.error('createWarga error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateWarga(req, res) {
  try {
    const { id } = req.params;
    const { name, phone, house_no, password } = req.body;

    const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'warga'").get(id);
    if (!user) return res.status(404).json({ error: 'Warga not found' });

    const now = new Date().toISOString();

    if (phone && phone !== user.phone) {
      const conflict = db.prepare('SELECT id FROM users WHERE phone = ? AND id != ?').get(phone, id);
      if (conflict) return res.status(409).json({ error: 'Phone already in use' });
      db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(phone, id);
    }

    if (house_no) {
      db.prepare('UPDATE users SET house_no = ? WHERE id = ?').run(house_no, id);
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
    }

    const sheetData = { updated_at: now };
    if (name) sheetData.name = name;
    if (phone) sheetData.phone = phone;
    if (house_no) sheetData.house_no = house_no;

    await sheets.wargaUpdate(id, sheetData);

    res.json({ id: Number(id), name, phone, house_no });
  } catch (err) {
    console.error('updateWarga error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteWarga(req, res) {
  try {
    const { id } = req.params;

    const user = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'warga'").get(id);
    if (!user) return res.status(404).json({ error: 'Warga not found' });

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    await sheets.wargaDelete(id);

    res.json({ message: 'Warga deleted' });
  } catch (err) {
    console.error('deleteWarga error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAllWarga, createWarga, updateWarga, deleteWarga };
