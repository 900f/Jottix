const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log('Received token:', token); // Debug
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message); // Debug
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;