function normalizePhone(phone) {
  let p = String(phone).trim().replace(/\s+/g, '');
  if (p.startsWith('+62')) return p.slice(1);  // +628xxx → 628xxx
  if (p.startsWith('0')) return '62' + p.slice(1); // 08xxx → 628xxx
  return p; // sudah 628xxx atau format lain
}

module.exports = { normalizePhone };
