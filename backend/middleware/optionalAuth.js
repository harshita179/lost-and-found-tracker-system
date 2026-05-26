const jwt = require('jsonwebtoken');

/**
 * Optional auth middleware — extracts user info from token if present,
 * but does NOT reject the request if no token is provided.
 * Sets req.userId and req.userRole if authenticated, otherwise leaves them undefined.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
  } catch (err) {
    // Token invalid/expired — treat as unauthenticated, don't block
  }

  next();
};

module.exports = optionalAuth;
