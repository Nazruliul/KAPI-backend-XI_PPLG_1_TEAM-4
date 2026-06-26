-- Hapus data lama (urutan penting karena foreign key)
DELETE FROM transaksi_item;
DELETE FROM transaksi;
DELETE FROM produk;
DELETE FROM users;

-- Reset auto increment biar id mulai dari 1 lagi
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE produk AUTO_INCREMENT = 1;
ALTER TABLE transaksi AUTO_INCREMENT = 1;
ALTER TABLE transaksi_item AUTO_INCREMENT = 1;

-- User admin (password: admin123)
INSERT INTO users (nama, username, password, role) VALUES
('Admin KAPI', 'admin', '$2b$10$FffjVlItKVMQAzjoaieyfeEYdIwF4cFSuul4ji/0E0i19QjOEjaKO', 'admin');

-- User kasir (password: kasir123)
INSERT INTO users (nama, username, password, role) VALUES
('Kasir Satu', 'kasir1', '$2b$10$eu8krqNsQYRRn5ep4jYHJuMUEukL5FcpW16bHcgtG/ZSqIyl5lKGy', 'kasir');

-- 8 produk contoh
INSERT INTO produk (nama, harga, stok, kategori) VALUES
('Es Teh Manis', 5000, 120, 'Minuman'),
('Kopi Hitam', 8000, 80, 'Minuman'),
('Air Mineral', 3000, 200, 'Minuman'),
('Nasi Goreng', 20000, 45, 'Makanan'),
('Mie Ayam', 18000, 30, 'Makanan'),
('Soto Ayam', 22000, 25, 'Makanan'),
('Keripik Singkong', 7000, 8, 'Snack'),
('Biskuit Coklat', 9000, 60, 'Snack');
