/**
 * Script de Seed - Dados Iniciais do Sistema
 * Execute: node src/seed.js
 */

const pool = require('./config/db');
const { gerarHash } = require('./utils/hash');

async function seed() {
  console.log('🚀 Iniciando seed do banco de dados...\n');
  
  try {
    // 1. Perfis
    console.log('📋 Criando perfis...');
    await pool.query(`
      INSERT INTO perfis (nome, descricao, permissoes) VALUES 
        ('admin', 'Administrador do Sistema', '["*"]'),
        ('supervisor', 'Supervisor de Equipe', '["tarefas.visualizar", "tarefas.criar", "tarefas.atribuir", "tarefas.editar", "relatorios.visualizar", "dashboard.visualizar", "equipes.gerenciar"]'),
        ('colaborador', 'Colaborador Operacional', '["tarefas.visualizar", "tarefas.executar", "tarefas.minhas"]')
      ON CONFLICT (nome) DO NOTHING
    `);
    console.log('✅ Perfis criados\n');

    // 2. Empresa Demo
    console.log('🏢 Criando empresa demo...');
    await pool.query(`
      INSERT INTO empresas (nome, cnpj, email, telefone) VALUES 
        ('Empresa Demo JCS', '12.345.678/0001-90', 'admin@jcs.com.br', '(11) 99999-9999')
      ON CONFLICT (cnpj) DO NOTHING
    `);
    console.log('✅ Empresa demo criada\n');

    // 3. Obter IDs
    const empresaResult = await pool.query("SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-90'");
    const id_empresa = empresaResult.rows[0].id;
    
    const perfilAdmin = await pool.query("SELECT id FROM perfis WHERE nome = 'admin'");
    const perfilSupervisor = await pool.query("SELECT id FROM perfis WHERE nome = 'supervisor'");
    const perfilColaborador = await pool.query("SELECT id FROM perfis WHERE nome = 'colaborador'");
    
    // 4. Unidades
    console.log('🏭 Criando unidades...');
    await pool.query(`
      INSERT INTO unidades (id_empresa, nome, endereco, ativo) VALUES 
        ($1, 'Matriz - São Paulo', 'Av. Paulista, 1000 - São Paulo/SP', true),
        ($1, 'Filial - Rio de Janeiro', 'Av. Brasil, 500 - Rio de Janeiro/RJ', true),
        ($1, 'Filial - Belo Horizonte', 'Av. Afonso Pena, 200 - Belo Horizonte/MG', true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('✅ Unidades criadas\n');

    // 5. Turnos
    console.log('⏰ Criando turnos...');
    await pool.query(`
      INSERT INTO turnos (id_empresa, nome, hora_inicio, hora_fim, ativo) VALUES 
        ($1, 'Manhã', '06:00', '14:00', true),
        ($1, 'Tarde', '14:00', '22:00', true),
        ($1, 'Noite', '22:00', '06:00', true),
        ($1, 'Comercial', '08:00', '18:00', true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('✅ Turnos criados\n');

    // 6. Funções
    console.log('👔 Criando funções...');
    await pool.query(`
      INSERT INTO funcoes (id_empresa, nome, descricao, nivel_hierarquico, ativo) VALUES 
        ($1, 'Gerente Geral', 'Responsável pela gestão geral da empresa', 1, true),
        ($1, 'Supervisor de Operações', 'Supervisiona as operações diarias', 2, true),
        ($1, 'Técnico de Manutenção', 'Executa manutenções preventivas e corretivas', 3, true),
        ($1, 'Operador de Produção', 'Opera equipamentos de produção', 4, true),
        ($1, 'Auxiliar Administrativo', 'Apoio administrativo', 4, true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('✅ Funções criadas\n');

    // 7. Áreas
    console.log('📂 Criando áreas...');
    await pool.query(`
      INSERT INTO areas (id_empresa, nome, descricao, ativo) VALUES 
        ($1, 'Produção', 'Área de produção industrial', true),
        ($1, 'Manutenção', 'Setor de manutenção de equipamentos', true),
        ($1, 'Qualidade', 'Controle de qualidade', true),
        ($1, 'Logística', 'Operações logísticas', true),
        ($1, 'Administrativo', 'Setor administrativo', true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('✅ Áreas criadas\n');

    // 8. Equipes
    console.log('👥 Criando equipes...');
    await pool.query(`
      INSERT INTO equipes (id_empresa, nome, descricao, ativo) VALUES 
        ($1, 'Equipe Alpha', 'Equipe de produção - Turno Manhã', true),
        ($1, 'Equipe Beta', 'Equipe de produção - Turno Tarde', true),
        ($1, 'Equipe Gamma', 'Equipe de manutenção', true),
        ($1, 'Equipe Delta', 'Equipe de qualidade', true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('✅ Equipes criadas\n');

    // 9. Usuários de demonstração
    console.log('👤 Criando usuários demo...');
    const senhaHash = await gerarHash('123456');
    
    await pool.query(`
      INSERT INTO usuarios (id_empresa, nome, login, email, senha_hash, id_perfil, ativo) VALUES 
        ($1, 'Administrador', 'admin', 'admin@jcs.com.br', $2, $3, true),
        ($1, 'João Supervisor', 'joao.supervisor', 'joao@jcs.com.br', $2, $4, true),
        ($1, 'Maria Colaboradora', 'maria.operadora', 'maria@jcs.com.br', $2, $5, true),
        ($1, 'Carlos Técnico', 'carlos.tecnico', 'carlos@jcs.com.br', $2, $5, true)
      ON CONFLICT (login) DO NOTHING
    `, [id_empresa, senhaHash, perfilAdmin.rows[0].id, perfilSupervisor.rows[0].id, perfilColaborador.rows[0].id]);
    console.log('✅ Usuários demo criados\n');

    // 10. Modelo de Checklist
    console.log('📝 Criando modelo de checklist...');
    const modeloResult = await pool.query(`
      INSERT INTO modelos_checklist (id_empresa, id_area, nome, descricao, tipo_tarefa, recorrencia_tipo, exige_foto, exige_observacao, ativo) VALUES 
        ($1, 1, 'Checklist Diário de Produção', 'Verificação diária de equipamentos de produção', 'checklist', 'diaria', true, true, true)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [id_empresa]);
    
    if (modeloResult.rows.length > 0) {
      const id_modelo = modeloResult.rows[0].id;
      
      await pool.query(`
        INSERT INTO itens_modelo (id_modelo, ordem, descricao, tipo_resposta, obrigatorio) VALUES 
          ($1, 1, 'Verificar temperatura dos motores', 'sim_nao', true),
          ($1, 2, 'Checar nível de óleo', 'sim_nao', true),
          ($1, 3, 'Inspecionar correias transportadoras', 'sim_nao', true),
          ($1, 4, 'Verificar pressão hidráulica', 'sim_nao', true),
          ($1, 5, 'Registrar horas de operação', 'numero', true),
          ($1, 6, 'Observações gerais', 'texto', false)
        ON CONFLICT DO NOTHING
      `, [id_modelo]);
    }
    console.log('✅ Modelo de checklist criado\n');

    console.log('🎉 Seed concluído com sucesso!\n');
    console.log('📋 Credenciais de acesso:');
    console.log('   Admin: admin / 123456');
    console.log('   Supervisor: joao.supervisor / 123456');
    console.log('   Colaborador: maria.operadora / 123456');

  } catch (err) {
    console.error('❌ Erro ao executar seed:', err);
  } finally {
    await pool.end();
  }
}

seed();
