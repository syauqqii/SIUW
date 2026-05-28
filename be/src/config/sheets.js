const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SHEET_TITLES = {
  WARGA: 'Warga Info',
  PAYMENTS: 'Payments',
  SUMMARY: 'Payment Summary',
};

// Sequential write queue to avoid race conditions
class WriteQueue {
  constructor() {
    this._queue = [];
    this._running = false;
  }

  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this._queue.push({ fn, resolve, reject });
      this._drain();
    });
  }

  async _drain() {
    if (this._running) return;
    this._running = true;
    while (this._queue.length > 0) {
      const { fn, resolve, reject } = this._queue.shift();
      try {
        resolve(await fn());
      } catch (err) {
        reject(err);
      }
    }
    this._running = false;
  }
}

const writeQueue = new WriteQueue();

let _doc = null;

async function getDoc() {
  if (_doc) return _doc;

  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  _doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
  await _doc.loadInfo();
  await ensureSheets(_doc);
  return _doc;
}

async function ensureSheets(doc) {
  const existing = Object.values(doc.sheetsByTitle).map((s) => s.title);

  if (!existing.includes(SHEET_TITLES.WARGA)) {
    await doc.addSheet({
      title: SHEET_TITLES.WARGA,
      headerValues: ['id', 'user_id', 'name', 'house_no', 'phone', 'created_at', 'updated_at'],
    });
  }

  if (!existing.includes(SHEET_TITLES.PAYMENTS)) {
    await doc.addSheet({
      title: SHEET_TITLES.PAYMENTS,
      headerValues: ['id', 'user_id', 'month', 'year', 'amount', 'image_url', 'status', 'created_at', 'updated_at'],
    });
  }

  if (!existing.includes(SHEET_TITLES.SUMMARY)) {
    await doc.addSheet({
      title: SHEET_TITLES.SUMMARY,
      headerValues: ['user_name', 'house_no', 'phone', 'month', 'year', 'amount', 'image_url', 'status'],
    });
  }
}

async function getSheet(title) {
  const doc = await getDoc();
  return doc.sheetsByTitle[title];
}

// Warga Info operations
async function wargaGetAll() {
  const sheet = await getSheet(SHEET_TITLES.WARGA);
  const rows = await sheet.getRows();
  return rows.map(rowToObj);
}

async function wargaGetByUserId(userId) {
  const sheet = await getSheet(SHEET_TITLES.WARGA);
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('user_id') === String(userId));
  return row ? rowToObj(row) : null;
}

async function wargaCreate(data) {
  return writeQueue.enqueue(async () => {
    const sheet = await getSheet(SHEET_TITLES.WARGA);
    await sheet.addRow(data);
  });
}

async function wargaUpdate(userId, data) {
  return writeQueue.enqueue(async () => {
    const sheet = await getSheet(SHEET_TITLES.WARGA);
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('user_id') === String(userId));
    if (!row) throw new Error('Warga not found in sheet');
    Object.entries(data).forEach(([k, v]) => row.set(k, v));
    await row.save();
  });
}

async function wargaDelete(userId) {
  return writeQueue.enqueue(async () => {
    const sheet = await getSheet(SHEET_TITLES.WARGA);
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('user_id') === String(userId));
    if (row) await row.delete();
  });
}

// Payment operations
async function paymentGetAll() {
  const sheet = await getSheet(SHEET_TITLES.PAYMENTS);
  const rows = await sheet.getRows();
  return rows.map(rowToObj);
}

async function paymentGetByUserId(userId) {
  const sheet = await getSheet(SHEET_TITLES.PAYMENTS);
  const rows = await sheet.getRows();
  return rows.filter((r) => r.get('user_id') === String(userId)).map(rowToObj);
}

async function paymentCreate(data) {
  return writeQueue.enqueue(async () => {
    const sheet = await getSheet(SHEET_TITLES.PAYMENTS);
    await sheet.addRow(data);
  });
}

async function paymentUpdate(paymentId, data) {
  return writeQueue.enqueue(async () => {
    const sheet = await getSheet(SHEET_TITLES.PAYMENTS);
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('id') === String(paymentId));
    if (!row) throw new Error('Payment not found');
    Object.entries(data).forEach(([k, v]) => row.set(k, v));
    await row.save();
    return rowToObj(row);
  });
}

async function paymentFindByUserMonth(userId, month, year) {
  const sheet = await getSheet(SHEET_TITLES.PAYMENTS);
  const rows = await sheet.getRows();
  const row = rows.find(
    (r) =>
      r.get('user_id') === String(userId) &&
      r.get('month') === String(month) &&
      r.get('year') === String(year)
  );
  return row ? rowToObj(row) : null;
}

// Payment Summary operations
async function summaryUpsert(key, data) {
  return writeQueue.enqueue(async () => {
    const sheet = await getSheet(SHEET_TITLES.SUMMARY);
    const rows = await sheet.getRows();
    const existing = rows.find(
      (r) =>
        r.get('house_no') === String(key.house_no) &&
        r.get('month') === String(key.month) &&
        r.get('year') === String(key.year)
    );

    if (existing) {
      Object.entries(data).forEach(([k, v]) => existing.set(k, v));
      await existing.save();
    } else {
      await sheet.addRow(data);
    }
  });
}

async function summaryGetAll() {
  const sheet = await getSheet(SHEET_TITLES.SUMMARY);
  const rows = await sheet.getRows();
  return rows.map(rowToObj);
}

function rowToObj(row) {
  const headers = row._sheet.headerValues;
  const obj = {};
  headers.forEach((h) => {
    obj[h] = row.get(h);
  });
  return obj;
}

module.exports = {
  getDoc,
  wargaGetAll,
  wargaGetByUserId,
  wargaCreate,
  wargaUpdate,
  wargaDelete,
  paymentGetAll,
  paymentGetByUserId,
  paymentCreate,
  paymentUpdate,
  paymentFindByUserMonth,
  summaryUpsert,
  summaryGetAll,
};
