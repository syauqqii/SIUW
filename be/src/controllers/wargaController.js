const sheets = require('../config/sheets');

async function getAllWarga(req, res) {
  try {
    const rows = await sheets.wargaGetAll();
    res.json(rows);
  } catch (err) {
    console.error('getAllWarga error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createWarga(req, res) {
  try {
    const { name, phone, house_no } = req.body;

    if (!name || !phone || !house_no) {
      return res.status(400).json({ error: 'name, phone, and house_no are required' });
    }

    const existing = await sheets.wargaGetByPhone(phone);
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    const now = new Date().toISOString();
    const data = {
      id: crypto.randomUUID(),
      phone,
      name,
      house_no,
      created_at: now,
      updated_at: now,
    };

    await sheets.wargaCreate(data);

    res.status(201).json({ id: data.id, name, phone, house_no });
  } catch (err) {
    console.error('createWarga error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateWarga(req, res) {
  try {
    const { phone } = req.params;
    const { name, phone: newPhone, house_no } = req.body;

    const existing = await sheets.wargaGetByPhone(phone);
    if (!existing) return res.status(404).json({ error: 'Warga not found' });

    if (newPhone && newPhone !== phone) {
      const conflict = await sheets.wargaGetByPhone(newPhone);
      if (conflict) return res.status(409).json({ error: 'Phone already in use' });
    }

    const now = new Date().toISOString();
    const updates = { updated_at: now };
    if (name) updates.name = name;
    if (newPhone) updates.phone = newPhone;
    if (house_no) updates.house_no = house_no;

    await sheets.wargaUpdate(phone, updates);

    res.json({ phone: newPhone || phone, name: name || existing.name, house_no: house_no || existing.house_no });
  } catch (err) {
    console.error('updateWarga error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteWarga(req, res) {
  try {
    const { phone } = req.params;

    const existing = await sheets.wargaGetByPhone(phone);
    if (!existing) return res.status(404).json({ error: 'Warga not found' });

    await sheets.wargaDelete(phone);

    res.json({ message: 'Warga deleted' });
  } catch (err) {
    console.error('deleteWarga error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getAllWarga, createWarga, updateWarga, deleteWarga };
