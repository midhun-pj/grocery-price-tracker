import { verifyAccessToken } from '../utils/tokenUtils.js';

const authenticateToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired' });
    }
    return res.status(403).json({ error: 'Invalid access token' });
  }
};

module.exports = { authenticateToken };
