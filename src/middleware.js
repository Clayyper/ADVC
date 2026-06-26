function requireAdmin(req, res, next) {
  if (!req.session || !req.session.admin) {
    return res.status(401).json({
      error: "Acesso restrito ao administrador."
    });
  }

  next();
}

module.exports = {
  requireAdmin
};
