#!/usr/bin/env node
/**
 * Kelola admin di creds.json
 *
 * Usage:
 *   npm run setup-admin list
 *   npm run setup-admin add <email> <password>
 *   npm run setup-admin remove <email>
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const CREDS_PATH = path.join(__dirname, '../../creds.json');

function loadCreds() {
  if (!fs.existsSync(CREDS_PATH)) return [];
  return JSON.parse(fs.readFileSync(CREDS_PATH, 'utf8'));
}

function saveCreds(admins) {
  fs.writeFileSync(CREDS_PATH, JSON.stringify(admins, null, 2) + '\n');
}

async function main() {
  const [, , command, ...args] = process.argv;

  if (!command || command === 'list') {
    const admins = loadCreds();
    if (!admins.length) {
      console.log('Belum ada admin terdaftar.');
    } else {
      console.log(`Admin terdaftar (${admins.length}):`);
      admins.forEach((a) => console.log(`  - ${a.email}`));
    }
    return;
  }

  if (command === 'add') {
    const [email, password] = args;
    if (!email || !password) {
      console.error('Usage: npm run setup-admin add <email> <password>');
      process.exit(1);
    }

    const admins = loadCreds();
    if (admins.find((a) => a.email === email)) {
      console.error(`Admin dengan email "${email}" sudah ada.`);
      process.exit(1);
    }

    const password_hash = await bcrypt.hash(password, 10);
    admins.push({ email, password_hash });
    saveCreds(admins);
    console.log(`Admin "${email}" berhasil ditambahkan.`);
    return;
  }

  if (command === 'remove') {
    const [email] = args;
    if (!email) {
      console.error('Usage: npm run setup-admin remove <email>');
      process.exit(1);
    }

    const admins = loadCreds();
    const filtered = admins.filter((a) => a.email !== email);
    if (filtered.length === admins.length) {
      console.error(`Admin "${email}" tidak ditemukan.`);
      process.exit(1);
    }

    saveCreds(filtered);
    console.log(`Admin "${email}" berhasil dihapus.`);
    return;
  }

  console.error(`Perintah tidak dikenal: ${command}`);
  console.error('Gunakan: list | add <email> <password> | remove <email>');
  process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
