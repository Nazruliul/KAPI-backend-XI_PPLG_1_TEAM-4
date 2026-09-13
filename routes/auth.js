require('dotenv').config();
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');

const router = express.Router();
const SECRET = process.env.JWT_SECRET;

// POST /api/auth/register
const { authMiddleware, authorize } = require('../middleware/auth');
const VALID_ROLES = ['owner', 'admin', 'kasir'];

router.post('/users', authMiddleware, authorize('owner', 'admin'), async (req, res) => {  
  try {
    const { nama, username, password, role } = req.body;

    if (!nama || !username || !password) {
      return res.status(400).json({ message: 'Nama, username, dan password wajib diisi' });
    }

    const cleanUsername = username.trim();

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password minimal 8 karakter' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username sudah dipakai' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Role tidak valid' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ?',
      [cleanUsername]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username sudah dipakai' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);   
    
    const [result] = await pool.query(
      'INSERT INTO users (nama, username, password, role) VALUES (?, ?, ?, ?)',
      [nama, cleanUsername, hashedPassword, role]
    );

    res.status(201).json({
      message: 'User berhasil dibuat',
      user: { id: result.insertId, nama, username: cleanUsername, role }
    });

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
      return res.status(401).json({ message: 'Username atau password salah' });
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
