const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);
router.use(adminOnly);

// GET /api/laporan/harian - total penjualan per hari
router.get('/harian', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE(created_at) AS tanggal,
             COUNT(*) AS jumlah_transaksi,
             SUM(total) AS total_penjualan
      FROM transaksi
      GROUP BY DATE(created_at)
      ORDER BY tanggal DESC
      LIMIT 30
    `);
    res.json({ laporan_harian: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/laporan/terlaris - produk dengan jumlah terjual terbanyak
router.get('/terlaris', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.nama, p.kategori,
             SUM(ti.qty) AS total_terjual,
             SUM(ti.subtotal) AS total_pendapatan
      FROM transaksi_item ti
      JOIN produk p ON ti.produk_id = p.id
      GROUP BY p.id, p.nama, p.kategori
      ORDER BY total_terjual DESC
      LIMIT 10
    `);
    res.json({ produk_terlaris: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/laporan/ringkasan - ringkasan untuk dashboard
router.get('/ringkasan', async (req, res) => {
  try {
    const [[today]] = await pool.query(`
      SELECT COUNT(*) AS jumlah_transaksi, COALESCE(SUM(total), 0) AS total_penjualan
      FROM transaksi
      WHERE DATE(created_at) = CURDATE()
    `);
    const [[stokMenipis]] = await pool.query(`
      SELECT COUNT(*) AS jumlah FROM produk WHERE stok <= 10
    `);
    res.json({
      transaksi_hari_ini: today.jumlah_transaksi,
      penjualan_hari_ini: today.total_penjualan,
      produk_stok_menipis: stokMenipis.jumlah
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
