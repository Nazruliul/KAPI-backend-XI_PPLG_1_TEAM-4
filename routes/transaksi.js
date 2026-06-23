const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// POST /api/transaksi - buat transaksi baru (checkout)
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { items, bayar } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      connection.release();
      return res.status(400).json({ message: 'Item transaksi tidak boleh kosong' });
    }
    if (bayar == null) {
      connection.release();
      return res.status(400).json({ message: 'Jumlah bayar wajib diisi' });
    }

    await connection.beginTransaction();

    let total = 0;
    const detailItems = [];

    for (const item of items) {
      const [rows] = await connection.query(
        'SELECT * FROM produk WHERE id = ? FOR UPDATE',
        [item.produk_id]
      );

      if (rows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ message: `Produk dengan id ${item.produk_id} tidak ditemukan` });
      }

      const produk = rows[0];

      if (produk.stok < item.qty) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ message: `Stok ${produk.nama} tidak cukup (tersisa ${produk.stok})` });
      }

      const subtotal = produk.harga * item.qty;
      total += subtotal;
      detailItems.push({ produk_id: produk.id, nama: produk.nama, qty: item.qty, harga: produk.harga, subtotal });

      await connection.query(
        'UPDATE produk SET stok = stok - ? WHERE id = ?',
        [item.qty, produk.id]
      );
    }

    if (bayar < total) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ message: `Bayar kurang. Total ${total}, bayar ${bayar}` });
    }

    const kembalian = bayar - total;

    const [trxResult] = await connection.query(
      'INSERT INTO transaksi (user_id, total, bayar, kembalian) VALUES (?, ?, ?, ?)',
      [userId, total, bayar, kembalian]
    );
    const transaksiId = trxResult.insertId;

    for (const item of detailItems) {
      await connection.query(
        'INSERT INTO transaksi_item (transaksi_id, produk_id, qty, subtotal) VALUES (?, ?, ?, ?)',
        [transaksiId, item.produk_id, item.qty, item.subtotal]
      );
    }

    await connection.commit();
    connection.release();

    res.status(201).json({
      message: 'Transaksi berhasil',
      transaksi: {
        id: transaksiId,
        total,
        bayar,
        kembalian,
        items: detailItems,
        created_at: new Date()
      }
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/transaksi - lihat riwayat transaksi
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.total, t.bayar, t.kembalian, t.created_at,
             u.nama AS kasir_nama
      FROM transaksi t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json({ transaksi: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET /api/transaksi/:id - detail satu transaksi beserta item-nya
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const [trxRows] = await pool.query(`
      SELECT t.id, t.total, t.bayar, t.kembalian, t.created_at,
             u.nama AS kasir_nama
      FROM transaksi t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [id]);

    if (trxRows.length === 0) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    const [itemRows] = await pool.query(`
      SELECT ti.qty, ti.subtotal, p.nama, p.harga
      FROM transaksi_item ti
      JOIN produk p ON ti.produk_id = p.id
      WHERE ti.transaksi_id = ?
    `, [id]);

    res.json({ transaksi: { ...trxRows[0], items: itemRows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
