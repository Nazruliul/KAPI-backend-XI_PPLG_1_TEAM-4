require('dotenv').config();
const pool = require('../db/pool');

(async () => {
  try {
    await pool.query(
      "ALTER TABLE users MODIFY COLUMN role ENUM('owner','admin','kasir') NOT NULL DEFAULT 'kasir'"
    );
    console.log('Kolom role berhasil diupdate.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();