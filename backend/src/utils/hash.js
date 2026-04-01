const bcrypt = require('bcryptjs');

async function gerarHash(senha) {
  return bcrypt.hash(senha, 10);
}

async function compararSenha(senha, hash) {
  return bcrypt.compare(senha, hash);
}

module.exports = { gerarHash, compararSenha };