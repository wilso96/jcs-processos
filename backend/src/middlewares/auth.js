const { verificarToken } = require('../utils/jwt');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = verificarToken(token);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido.' });
  }
}

// Middleware para verificar se está autenticado
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ erro: 'Token não informado.' });
  }
  
  const [, token] = authHeader.split(' ');
  
  try {
    const decoded = verificarToken(token);
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido.' });
  }
}

// Middleware para verificar perfil do usuário
function requireRole(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Não autenticado.' });
    }
    
    const perfil = req.usuario.perfil;
    
    // Admin tem acesso a tudo
    if (perfil === 'admin') {
      return next();
    }
    
    // Verifica se o perfil está na lista de permitidos
    if (perfisPermitidos.includes(perfil)) {
      return next();
    }
    
    return res.status(403).json({ erro: 'Acesso negado. Permissão insuficiente.' });
  };
}

module.exports = { 
  auth, 
  requireAuth, 
  requireRole 
};