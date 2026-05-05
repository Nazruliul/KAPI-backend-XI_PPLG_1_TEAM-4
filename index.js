const express = require('express');
const app = express();

app.use(express.json());

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));

app.listen(3000, () => console.log('Server jalan di http://localhost:3000'));