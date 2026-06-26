function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso restrito ao administrador." });
  }
  next();
}

function requireUser(req, res, next) {
  if (!req.session || !req.session.user || req.session.user.role !== "user") {
    return res.status(403).json({ error: "Acesso restrito ao usuário comum." });
  }
  next();
}

module.exports = {
  requireLogin,
  requireAdmin,
  requireUser
};
