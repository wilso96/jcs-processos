const jwt = require('jsonwebtoken');
require('dotenv').config();

function gerarToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
}

function verificarToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { gerarToken, verificarToken };