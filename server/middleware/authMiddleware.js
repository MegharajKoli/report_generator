const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('authMiddleware called, headers:', req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = { userId: decoded.userId };
    console.log('Token verified, user:', req.user);
    next();
  } catch (err) {
    console.error('Invalid token:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;