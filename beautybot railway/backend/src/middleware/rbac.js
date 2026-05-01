// Role-Based Access Control middleware

const ROLE = {
  USER: 'user',
  MASTER: 'master',
  ADMIN: 'admin'
};

function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role || ROLE.USER;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

function requireAdminOrMaster(req, res, next) {
  return requireRole(ROLE.ADMIN, ROLE.MASTER)(req, res, next);
}

module.exports = {
  ROLE,
  requireRole,
  requireAdminOrMaster
};
