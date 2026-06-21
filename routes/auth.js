require('dotenv').config();
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nama, username, password, role } = req.body;

    if (!nama || !username || !password) {
      return res.status(400).json({ message: 'Nama, username, dan password wajib diisi' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username sudah dipakai' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalRole = role === 'admin' ? 'admin' : 'kasir';

    const [result] = await pool.query(
      'INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)',
      [nama, username, hashedPassword, finalRole]
    );

    res.status(201).json({
      message: 'Registrasi berhasil',
      user: { id: result.insertId, nama, username, role: finalRole }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Username tidak ditemukan' });
    }

    const user = rows[0];
    const cocok = await bcrypt.compare(password, user.password);
    if (!cocok) {
      return res.status(401).json({ message: 'Password salah' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, nama: user.nama, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
