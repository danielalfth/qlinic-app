/**
 * Role-Based Access Control (RBAC) Middleware Factory
 * Usage: rbac('admin', 'dokter') — only allows those roles
 */
export const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses resource ini.' 
      });
    }

    next();
  };
};
