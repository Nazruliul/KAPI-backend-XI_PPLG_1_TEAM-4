const express    = require('express');
const router     = express.Router();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

let products = [
  { id: 1, nama: 'Kopi Arabika', harga: 45000, stok: 100 },
  { id: 2, nama: 'Teh Hijau',    harga: 25000, stok: 200 },
];
let nextId = 3;

// GET /api/products
router.get('/', (req, res) => {
  res.json({ products });
});

// POST /api/products
router.post('/', (req, res) => {
  const { nama, harga, stok } = req.body;

  if (!nama || harga == null || stok == null)
    return res.status(400).json({ message: 'nama, harga, dan stok wajib diisi' });

  const product = { id: nextId++, nama, harga, stok };
  products.push(product);
  res.status(201).json({ message: 'Produk ditambahkan', product });
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) return res.status(404).json({ message: 'Produk tidak ditemukan' });

  const { nama, harga, stok } = req.body;
  products[index] = { ...products[index], nama, harga, stok };
  res.json({ message: 'Produk diperbarui', product: products[index] });
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) return res.status(404).json({ message: 'Produk tidak ditemukan' });

  products.splice(index, 1);
  res.json({ message: 'Produk dihapus' });
});

module.exports = router;