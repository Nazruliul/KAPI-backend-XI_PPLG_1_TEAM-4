const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

function validasiProduk(body) {
  const { nama, harga, stok } = body;
  if (!nama || typeof nama !== 'string' || nama.trim() === '') {
    return 'Nama produk wajib diisi';
  }
  if (harga == null || isNaN(harga) || harga < 0) {
    return 'Harga harus berupa angka dan tidak boleh negatif';
  }
  if (stok == null || isNaN(stok) || stok < 0 || !Number.isInteger(Number(stok))) {
    return 'Stok harus berupa angka bulat dan tidak boleh negatif';
  }
  return null;
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM produk ORDER BY id DESC');
    res.json({ products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM produk WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    res.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST /api/products  (khusus admin)
router.post('/', adminOnly, async (req, res) => {
  try {
    const errorMsg = validasiProduk(req.body);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    const { nama, harga, stok, kategori } = req.body;
    const [result] = await pool.query(
      'INSERT INTO produk (nama, harga, stok, kategori) VALUES (?, ?, ?, ?)',
      [nama.trim(), harga, stok, kategori || null]
    );

    res.status(201).json({
      message: 'Produk ditambahkan',
      product: { id: result.insertId, nama: nama.trim(), harga, stok, kategori: kategori || null }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT /api/products/:id  (khusus admin)
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const errorMsg = validasiProduk(req.body);
    if (errorMsg) {
      return res.status(400).json({ message: errorMsg });
    }

    const { nama, harga, stok, kategori } = req.body;

    const [existing] = await pool.query('SELECT * FROM produk WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    await pool.query(
      'UPDATE produk SET nama = ?, harga = ?, stok = ?, kategori = ? WHERE id = ?',
      [nama.trim(), harga, stok, kategori || null, id]
    );

    res.json({
      message: 'Produk diperbarui',
      product: { id, nama: nama.trim(), harga, stok, kategori: kategori || null }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE /api/products/:id  (khusus admin)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [existing] = await pool.query('SELECT * FROM produk WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    await pool.query('DELETE FROM produk WHERE id = ?', [id]);
    res.json({ message: 'Produk dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
