const sheets = require('../config/sheets');
const cloudinary = require('../config/cloudinary');
const { isValidImageBuffer } = require('../middleware/upload');

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'siuw/receipts', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

async function getPayments(req, res) {
  try {
    if (req.user.role === 'admin') {
      const all = await sheets.paymentGetAll();
      return res.json(all);
    }
    const payments = await sheets.paymentGetByPhone(req.user.phone);
    res.json(payments);
  } catch (err) {
    console.error('getPayments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getSummary(req, res) {
  try {
    const rows = await sheets.summaryGetAll();
    const allPayments = await sheets.paymentGetAll();
    const allWarga = await sheets.wargaGetAll();

    const totalCollected = allPayments
      .filter((p) => p.status === 'approved')
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    const totalPending = allPayments
      .filter((p) => p.status === 'pending')
      .reduce((s, p) => s + Number(p.amount || 0), 0);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const paidThisMonth = new Set(
      allPayments
        .filter(
          (p) =>
            p.status === 'approved' &&
            Number(p.month) === currentMonth &&
            Number(p.year) === currentYear
        )
        .map((p) => p.phone)
    );

    const totalUnpaid = allWarga.length - paidThisMonth.size;

    res.json({
      total_collected: totalCollected,
      total_pending: totalPending,
      total_unpaid: Math.max(0, totalUnpaid),
      rows,
    });
  } catch (err) {
    console.error('getSummary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getPendingApprovals(req, res) {
  try {
    const all = await sheets.paymentGetAll();
    const pending = all.filter((p) => p.status === 'pending');

    const wargaRows = await sheets.wargaGetAll();
    const enriched = pending.map((p) => {
      const info = wargaRows.find((w) => w.phone === p.phone) || {};
      return { ...p, user_name: info.name || '', house_no: info.house_no || '' };
    });

    res.json(enriched);
  } catch (err) {
    console.error('getPendingApprovals error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createPayment(req, res) {
  try {
    const { month, year, amount } = req.body;
    const phone = req.user.phone;

    if (!month || !year || !amount) {
      return res.status(400).json({ error: 'month, year, and amount are required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Receipt image is required' });
    }
    if (!isValidImageBuffer(req.file.buffer)) {
      return res.status(400).json({ error: 'File bukan gambar yang valid' });
    }

    const existing = await sheets.paymentFindByPhoneMonth(phone, month, year);
    if (existing && existing.status !== 'rejected') {
      return res.status(409).json({ error: 'Payment for this month already submitted' });
    }

    const uploaded = await uploadToCloudinary(req.file.buffer);

    const now = new Date().toISOString();
    const paymentData = {
      id: crypto.randomUUID(),
      phone: String(phone),
      month: String(month),
      year: String(year),
      amount: String(amount),
      image_url: uploaded.secure_url,
      status: 'pending',
      created_at: now,
      updated_at: now,
    };

    await sheets.paymentCreate(paymentData);
    await updateSummary(paymentData);

    res.status(201).json(paymentData);
  } catch (err) {
    console.error('createPayment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updatePaymentStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const updated = await sheets.paymentUpdate(id, {
      status,
      updated_at: new Date().toISOString(),
    });

    await updateSummary(updated);
    res.json(updated);
  } catch (err) {
    console.error('updatePaymentStatus error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function manualPaymentStatus(req, res) {
  try {
    const { phone, month, year, status, amount } = req.body;

    if (!phone || !month || !year || !status) {
      return res.status(400).json({ error: 'phone, month, year, status are required' });
    }
    if (!['paid', 'unpaid'].includes(status)) {
      return res.status(400).json({ error: 'Status must be paid or unpaid' });
    }

    const warga = await sheets.wargaGetByPhone(phone);
    if (!warga) return res.status(404).json({ error: 'Warga not found' });

    const now = new Date().toISOString();
    const existing = await sheets.paymentFindByPhoneMonth(phone, month, year);

    if (status === 'paid') {
      if (existing) {
        const updated = await sheets.paymentUpdate(existing.id, {
          status: 'approved',
          amount: String(amount || existing.amount || 0),
          updated_at: now,
        });
        await updateSummary(updated);
        return res.json(updated);
      }

      const paymentData = {
        id: crypto.randomUUID(),
        phone: String(phone),
        month: String(month),
        year: String(year),
        amount: String(amount || 0),
        image_url: '',
        status: 'approved',
        created_at: now,
        updated_at: now,
      };
      await sheets.paymentCreate(paymentData);
      await updateSummary(paymentData);
      return res.status(201).json(paymentData);
    }

    // status === 'unpaid'
    if (existing) {
      const updated = await sheets.paymentUpdate(existing.id, {
        status: 'rejected',
        updated_at: now,
      });
      await updateSummary(updated);
      return res.json(updated);
    }

    res.json({ message: 'No payment record found for this period' });
  } catch (err) {
    console.error('manualPaymentStatus error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateSummary(paymentData) {
  try {
    const wargaRows = await sheets.wargaGetAll();
    const info = wargaRows.find((w) => w.phone === paymentData.phone) || {};

    await sheets.summaryUpsert(
      { house_no: info.house_no || '', month: paymentData.month, year: paymentData.year },
      {
        user_name: info.name || '',
        house_no: info.house_no || '',
        phone: info.phone || '',
        month: paymentData.month,
        year: paymentData.year,
        amount: paymentData.amount,
        image_url: paymentData.image_url || '',
        status: paymentData.status,
      }
    );
  } catch (err) {
    console.error('updateSummary error:', err);
  }
}

module.exports = {
  getPayments,
  getSummary,
  getPendingApprovals,
  createPayment,
  updatePaymentStatus,
  manualPaymentStatus,
};
