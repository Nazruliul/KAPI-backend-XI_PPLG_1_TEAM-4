const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

const SECRET = 'kunci_rahasia_123';

const users = [];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: 'Username dan password wajib diisi' });

  const sudahAda = users.find(u => u.username === username);
  if (sudahAda)
    return res.status(409).json({ message: 'Username sudah dipakai' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: users.length + 1, username, password: hashedPassword };
  users.push(user);

  res.status(201).json({ message: 'Registrasi berhasil', user: { id: user.id, username } });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ message: 'Username tidak ditemukan' });

  const cocok = await bcrypt.compare(password, user.password);
  if (!cocok) return res.status(401).json({ message: 'Password salah' });

  const token = jwt.sign({ id: user.id, username }, SECRET, { expiresIn: '1h' });
  res.json({ message: 'Login berhasil', token });
});

module.exports = router;