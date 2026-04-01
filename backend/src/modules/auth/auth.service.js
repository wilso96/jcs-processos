const pool = require('../../config/db');
const { compararSenha } = require('../../utils/hash');
const { gerarToken } = require('../../utils/jwt');

async function login({ email, senha }) {
  // Aceita tanto email quanto login
  const query = `
    select 
      u.id,
      u.id_empresa,
      u.nome,
      u.login,
      u.email,
      u.senha_hash,
      p.nome as perfil
    from usuarios u
    inner join perfis p on p.id = u.id_perfil
    where (u.email ILIKE $1 or u.login ILIKE $1)
      and u.ativo = true
    limit 1
  `;

  const { rows } = await pool.query(query, [email]);

  if (!rows.length) {
    throw new Error('Usuário não encontrado.');
  }

  const usuario = rows[0];
  const senhaValida = await compararSenha(senha, usuario.senha_hash);

  if (!senhaValida) {
    throw new Error('Senha inválida.');
  }

  const token = gerarToken({
    id_usuario: usuario.id,
    id_empresa: usuario.id_empresa,
    perfil: usuario.perfil
  });

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      login: usuario.login,
      perfil: usuario.perfil,
      id_empresa: usuario.id_empresa
    }
  };
}

module.exports = { login };