/**
 * Script para criar uma nova empresa com usuário admin
 * Execute: node src/seed-nova-empresa.js
 * 
 * EDITE OS DADOS ABAIXO ANTES DE EXECUTAR!
 */

const pool = require('./config/db');
const { gerarHash } = require('./utils/hash');

// ============================================
// DADOS DA NOVA EMPRESA - EDITE AQUI!
// ============================================
const novaEmpresa = {
  nome: 'BLACKBIRD BRASIL',
  cnpj: '98.765.432/0001-00',
  email: 'yan@blackbird.com',
  telefone: '(48) 99645-4875'
};

// DADOS DO USUÁRIO ADMIN
const novoUsuario = {
  nome: 'Yan',
  login: 'myfrind',          // LOGIN ÚNICO NO SISTEMA
  email: 'yan@blackbird.com',
  senha: '123456'          // ALTERE PARA UMA SENHA SEGURA!
};
// ============================================

async function criarNovaEmpresa() {
  console.log('🚀 Criando Nova Empresa\n');
  console.log('='.repeat(50));
  console.log(`Empresa: ${novaEmpresa.nome}`);
  console.log(`CNPJ: ${novaEmpresa.cnpj}`);
  console.log(`Usuário: ${novoUsuario.login}`);
  console.log('='.repeat(50) + '\n');

  try {
    // 1. Criar/Verificar Perfis (caso não existam)
    console.log('📋 1. Verificando/Criando perfis...');
    await pool.query(`
      INSERT INTO perfis (nome, descricao, permissoes) VALUES 
        ('admin', 'Administrador do Sistema', '["*"]'),
        ('supervisor', 'Supervisor de Equipe', '["tarefas.visualizar", "tarefas.criar", "tarefas.atribuir", "tarefas.editar", "relatorios.visualizar", "dashboard.visualizar", "equipes.gerenciar"]'),
        ('colaborador', 'Colaborador Operacional', '["tarefas.visualizar", "tarefas.executar", "tarefas.minhas"]')
      ON CONFLICT (nome) DO NOTHING
    `);
    console.log('   ✅ Perfis verificados\n');

    // 2. Criar Empresa
    console.log('🏢 2. Criando empresa...');
    const empresaResult = await pool.query(`
      INSERT INTO empresas (nome, cnpj, email, telefone) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (cnpj) DO UPDATE SET nome = EXCLUDED.nome, email = EXCLUDED.email
      RETURNING id
    `, [novaEmpresa.nome, novaEmpresa.cnpj, novaEmpresa.email, novaEmpresa.telefone]);
    
    const id_empresa = empresaResult.rows[0].id;
    console.log(`   ✅ Empresa criada com ID: ${id_empresa}\n`);

    // 3. Obter ID do perfil admin
    const perfilAdmin = await pool.query("SELECT id FROM perfis WHERE nome = 'admin'");
    const id_perfil_admin = perfilAdmin.rows[0].id;

    // 4. Criar Unidades Básicas
    console.log('🏭 3. Criando unidades básicas...');
    await pool.query(`
      INSERT INTO unidades (id_empresa, nome, endereco, ativo) VALUES 
        ($1, 'Matriz', 'Endereço Principal', true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('   ✅ Unidades criadas\n');

    // 5. Criar Turnos Básicos
    console.log('⏰ 4. Criando turnos...');
    await pool.query(`
      INSERT INTO turnos (id_empresa, nome, hora_inicio, hora_fim, ativo) VALUES 
        ($1, 'Comercial', '08:00', '18:00', true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('   ✅ Turnos criados\n');

    // 6. Criar Função Admin
    console.log('👔 5. Criando funções básicas...');
    await pool.query(`
      INSERT INTO funcoes (id_empresa, nome, descricao, nivel_hierarquico, ativo) VALUES 
        ($1, 'Administrador', 'Administrador do Sistema', 1, true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('   ✅ Funções criadas\n');

    // 7. Obter ID da unidade e função
    const unidadeResult = await pool.query("SELECT id FROM unidades WHERE id_empresa = $1 LIMIT 1", [id_empresa]);
    const funcaoResult = await pool.query("SELECT id FROM funcoes WHERE id_empresa = $1 AND nome = 'Administrador' LIMIT 1", [id_empresa]);
    const turnoResult = await pool.query("SELECT id FROM turnos WHERE id_empresa = $1 LIMIT 1", [id_empresa]);

    const id_unidade = unidadeResult.rows[0]?.id || null;
    const id_funcao = funcaoResult.rows[0]?.id || null;
    const id_turno = turnoResult.rows[0]?.id || null;

    // 8. Criar Usuário Admin
    console.log('👤 6. Criando/atualizando usuário admin...');
    const senha_hash = await gerarHash(novoUsuario.senha);
    
    await pool.query(`
      INSERT INTO usuarios (
        id_empresa, id_unidade, id_funcao, id_turno, id_perfil,
        nome, login, email, telefone, senha_hash, ativo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
      ON CONFLICT (login) DO UPDATE SET
        nome = EXCLUDED.nome,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone,
        senha_hash = EXCLUDED.senha_hash,
        id_empresa = EXCLUDED.id_empresa,
        ativo = true
    `, [
      id_empresa,
      id_unidade,
      id_funcao,
      id_turno,
      id_perfil_admin,
      novoUsuario.nome,
      novoUsuario.login,
      novoUsuario.email,
      novaEmpresa.telefone,
      senha_hash
    ]);
    console.log('   ✅ Usuário admin criado\n');

    // Resumo
    console.log('='.repeat(50));
    console.log('✅ NOVA EMPRESA CRIADA COM SUCESSO!');
    console.log('='.repeat(50));
    console.log(`
📦 EMPRESA:
   ID: ${id_empresa}
   Nome: ${novaEmpresa.nome}
   CNPJ: ${novaEmpresa.cnpj}

👤 USUÁRIO ADMIN:
   Login: ${novoUsuario.login}
   Senha: ${novoUsuario.senha}
   Perfil: admin

🔗 ACESSO:
   Abra o sistema e faça login com:
   Empresa: ${novaEmpresa.nome}
   Login: ${novoUsuario.login}
   Senha: ${novoUsuario.senha}
    `);

  } catch (error) {
    console.error('❌ Erro ao criar empresa:', error.message);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

criarNovaEmpresa();
