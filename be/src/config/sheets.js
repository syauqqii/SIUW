const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SHEET_TITLES = {
  WARGA: 'Warga Info',
  PAYMENTS: 'Payments',
  SUMMARY: 'Payment Summary',
};

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

let _docPromise = null;

async function getDoc() {
  if (!_docPromise) {
    _docPromise = (async () => {
      const auth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
      await doc.loadInfo();
      await ensureSheets(doc);
      return doc;
    })().catch((err) => {
      _docPromise = null;
      throw err;
    });
  }
  return _docPromise;
}

async function ensureSheets(doc) {
  const existing = Object.values(doc.sheetsByTitle).map((s) => s.title);

  if (!existing.includes(SHEET_TITLES.WARGA)) {
    await doc.addSheet({
      title: SHEET_TITLES.WARGA,
      headerValues: ['id', 'phone', 'name', 'house_no', 'created_at', 'updated_at'],
    });
  }

  if (!existing.includes(SHEET_TITLES.PAYMENTS)) {
    await doc.addSheet({
      title: SHEET_TITLES.PAYMENTS,
      headerValues: ['id', 'phone', 'month', 'year', 'amount', 'image_url', 'status', 'created_at', 'updated_at'],
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

function rowToObj(row, headers) {
  const obj = {};
  headers.forEach((h) => { obj[h] = row.get(h); });
  return obj;
}

// Warga Info operations
async function wargaGetAll() {
  const sheet = await getSheet(SHEET_TITLES.WARGA);
  const rows = await sheet.getRows();
  return rows.map((r) => rowToObj(r, sheet.headerValues));
}

async function wargaGetByPhone(phone) {
  const sheet = await getSheet(SHEET_TITLES.WARGA);
  const rows = await sheet.getRows();
  const row = rows.find((r) => r.get('phone') === String(phone));
  return row ? rowToObj(row, sheet.headerValues) : null;
}

async function wargaCreate(data) {
  return writeQueue.enqueue(async () => {
    const sheet = await getSheet(SHEET_TITLES.WARGA);
    await sheet.addRow(data);
  });
}

async function wargaUpdate(phone, data) {
  return writeQueue.enqueue(async () => {
    const sheet = await getSheet(SHEET_TITLES.WARGA);
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('phone') === String(phone));
    if (!row) throw new Error('Warga not found in sheet');
    Object.entries(data).forEach(([k, v]) => row.set(k, v));
    await row.save();
  });
}

async function wargaDelete(phone) {
  return writeQueue.enqueue(async () => {
    const sheet = await getSheet(SHEET_TITLES.WARGA);
    const rows = await sheet.getRows();
    const row = rows.find((r) => r.get('phone') === String(phone));
    if (row) await row.delete();
  });
}

// Payment operations
async function paymentGetAll() {
  const sheet = await getSheet(SHEET_TITLES.PAYMENTS);
  const rows = await sheet.getRows();
  return rows.map((r) => rowToObj(r, sheet.headerValues));
}

async function paymentGetByPhone(phone) {
  const sheet = await getSheet(SHEET_TITLES.PAYMENTS);
  const rows = await sheet.getRows();
  return rows
    .filter((r) => r.get('phone') === String(phone))
    .map((r) => rowToObj(r, sheet.headerValues));
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
    return rowToObj(row, sheet.headerValues);
  });
}

async function paymentFindByPhoneMonth(phone, month, year) {
  const sheet = await getSheet(SHEET_TITLES.PAYMENTS);
  const rows = await sheet.getRows();
  const row = rows.find(
    (r) =>
      r.get('phone') === String(phone) &&
      r.get('month') === String(month) &&
      r.get('year') === String(year)
  );
  return row ? rowToObj(row, sheet.headerValues) : null;
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
  return rows.map((r) => rowToObj(r, sheet.headerValues));
}

module.exports = {
  getDoc,
  wargaGetAll,
  wargaGetByPhone,
  wargaCreate,
  wargaUpdate,
  wargaDelete,
  paymentGetAll,
  paymentGetByPhone,
  paymentCreate,
  paymentUpdate,
  paymentFindByPhoneMonth,
  summaryUpsert,
  summaryGetAll,
};
