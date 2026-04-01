/**
 * Script para corrigir/atualizar usuário existente
 * Execute: node src/fix-usuario.js
 */

const pool = require('./config/db');
const { gerarHash } = require('./utils/hash');

async function fixUsuario() {
  console.log('🔧 Corrigindo usuário...\n');

  try {
    // Primeiro, vamos ver todos os usuários da empresa BLACKBIRD
    const usuarios = await pool.query(`
      SELECT id, nome, login, email, id_empresa 
      FROM usuarios 
      WHERE login ILIKE '%yan%' OR email ILIKE '%blackbird%'
    `);
    
    console.log('Usuários encontrados:');
    usuarios.rows.forEach(u => {
      console.log(`  ID: ${u.id}, Login: ${u.login}, Email: ${u.email}, Empresa: ${u.id_empresa}`);
    });

    // Buscar empresa BLACKBIRD
    const empresa = await pool.query(`SELECT id FROM empresas WHERE nome ILIKE '%BLACKBIRD%'`);
    if (empresa.rows.length === 0) {
      console.log('❌ Empresa BLACKBIRD não encontrada');
      return;
    }
    const id_empresa = empresa.rows[0].id;
    console.log(`\nEmpresa BLACKBIRD ID: ${id_empresa}`);

    // Buscar ID do perfil admin
    const perfil = await pool.query(`SELECT id FROM perfis WHERE nome = 'admin'`);
    const id_perfil = perfil.rows[0].id;
    console.log(`Perfil admin ID: ${id_perfil}`);

    // Deletar usuário YAN existente se houver
    await pool.query(`DELETE FROM usuarios WHERE login = 'YAN'`);
    console.log('✅ Usuário YAN deletado');

    // Atualizar ou criar usuário myfrind
    const senha_hash = await gerarHash('123456');
    
    // Tentar atualizar primeiro
    const updateResult = await pool.query(`
      UPDATE usuarios SET 
        login = 'myfrind',
        nome = 'Yan',
        email = 'yan@blackbird.com',
        senha_hash = $1,
        id_empresa = $2,
        id_perfil = $3,
        ativo = true
      WHERE login ILIKE '%yan%' AND id_empresa = $2
      RETURNING id, login, nome
    `, [senha_hash, id_empresa, id_perfil]);

    if (updateResult.rows.length > 0) {
      console.log(`✅ Usuário atualizado: ${updateResult.rows[0].login}`);
    } else {
      // Criar novo usuário
      await pool.query(`
        INSERT INTO usuarios (id_empresa, id_perfil, nome, login, email, senha_hash, ativo)
        VALUES ($1, $2, 'Yan', 'myfrind', 'yan@blackbird.com', $3, true)
      `, [id_empresa, id_perfil, senha_hash]);
      console.log('✅ Usuário myfrind criado');
    }

    // Verificar resultado final
    const finalUser = await pool.query(`
      SELECT id, nome, login, email, id_empresa, ativo 
      FROM usuarios 
      WHERE login = 'myfrind'
    `);
    
    console.log('\n📋 Resultado final:');
    finalUser.rows.forEach(u => {
      console.log(`  ID: ${u.id}`);
      console.log(`  Nome: ${u.nome}`);
      console.log(`  Login: ${u.login}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Empresa ID: ${u.id_empresa}`);
      console.log(`  Ativo: ${u.ativo}`);
    });

    console.log('\n✅ Login: myfrind | Senha: 123456');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixUsuario();
