const authService = require('./auth.service');

async function login(req, res) {
  try {
    const resultado = await authService.login(req.body);
    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({ erro: error.message });
  }
}

module.exports = { login };