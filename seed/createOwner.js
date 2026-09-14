require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function seedOwner() {
  try {
    const username = 'owner';
    const password = 'ownerPS778'; // ganti sebelum dijalankan

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existing.length > 0) {
      console.log('Akun owner sudah ada, seeder dibatalkan.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)',
      ['Owner', username, hashedPassword, 'owner']
    );

    console.log('Akun owner berhasil dibuat.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedOwner();