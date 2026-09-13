require('dotenv').config();
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ada' });
  }

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(403).json({ message: 'Token tidak valid' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Anda tidak punya akses untuk aksi ini' });
    }
    next();
  };
}


module.exports = { authMiddleware, adminOnly };
