/**
 * Script de Setup Completo
 * Execute: node setup.js
 */

const { Pool } = require('pg');
require('dotenv').config();
const { gerarHash } = require('./src/utils/hash');

const adminPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: 'postgres', // Conectar ao banco padrão primeiro
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function setup() {
  console.log('🚀 Setup Completo do JCS-Processos\n');
  console.log('='.repeat(50));

  let appPool = null;

  try {
    // 1. Criar banco se não existir
    console.log('\n📦 1. Verificando banco de dados...');
    const dbExists = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME || 'jcs_processos']
    );
    
    if (dbExists.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${process.env.DB_NAME || 'jcs_processos'}`);
      console.log('   ✅ Banco criado!');
    } else {
      console.log('   ℹ️  Banco já existe');
    }

    // Fechar conexão e reconectar ao banco correto
    await adminPool.end();
    
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'jcs_processos',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });

    // 2. Criar tabelas
    console.log('\n📋 2. Criando schema...');
    await appPool.query(`
      -- Perfis de Usuário
      CREATE TABLE IF NOT EXISTS perfis (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(50) NOT NULL UNIQUE,
        descricao VARCHAR(200),
        permissoes JSONB DEFAULT '[]'
      );

      -- Empresas
      CREATE TABLE IF NOT EXISTS empresas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        cnpj VARCHAR(18) UNIQUE,
        email VARCHAR(100),
        telefone VARCHAR(20),
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Unidades
      CREATE TABLE IF NOT EXISTS unidades (
        id SERIAL PRIMARY KEY,
        id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        endereco TEXT,
        responsavel_id INTEGER,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Turnos
      CREATE TABLE IF NOT EXISTS turnos (
        id SERIAL PRIMARY KEY,
        id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        nome VARCHAR(50) NOT NULL,
        hora_inicio TIME NOT NULL,
        hora_fim TIME NOT NULL,
        ativo BOOLEAN DEFAULT true
      );

      -- Funções
      CREATE TABLE IF NOT EXISTS funcoes (
        id SERIAL PRIMARY KEY,
        id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        nivel_hierarquico INTEGER DEFAULT 1,
        ativo BOOLEAN DEFAULT true
      );

      -- Áreas
      CREATE TABLE IF NOT EXISTS areas (
        id SERIAL PRIMARY KEY,
        id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        responsavel_id INTEGER,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Equipes
      CREATE TABLE IF NOT EXISTS equipes (
        id SERIAL PRIMARY KEY,
        id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        id_unidade INTEGER REFERENCES unidades(id),
        nome VARCHAR(100) NOT NULL,
        id_lider INTEGER,
        descricao TEXT,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Equipe-Usuario (N:N)
      CREATE TABLE IF NOT EXISTS equipe_usuarios (
        id SERIAL PRIMARY KEY,
        id_equipe INTEGER REFERENCES equipes(id) ON DELETE CASCADE,
        id_usuario INTEGER,
        data_entrada DATE DEFAULT CURRENT_DATE
      );

      -- Usuários
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        id_unidade INTEGER REFERENCES unidades(id),
        id_funcao INTEGER REFERENCES funcoes(id),
        id_turno INTEGER REFERENCES turnos(id),
        id_perfil INTEGER REFERENCES perfis(id),
        nome VARCHAR(150) NOT NULL,
        login VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        telefone VARCHAR(20),
        senha_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        ativo BOOLEAN DEFAULT true,
        ultimo_acesso TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Atualizar equipe_usuarios com foreign key
      DO $$ BEGIN
        ALTER TABLE equipe_usuarios ADD CONSTRAINT fk_equipe_usuarios_usuario
          FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE;
      EXCEPTION WHEN others THEN null;
      END $$;

      -- Modelos
      CREATE TABLE IF NOT EXISTS modelos_checklist (
        id SERIAL PRIMARY KEY,
        id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        id_area INTEGER REFERENCES areas(id),
        nome VARCHAR(150) NOT NULL,
        descricao TEXT,
        tipo_tarefa VARCHAR(50) DEFAULT 'checklist',
        recorrencia_tipo VARCHAR(50),
        recorrencia_config JSONB,
        exige_foto BOOLEAN DEFAULT false,
        exige_observacao BOOLEAN DEFAULT false,
        tempo_estimado_minutos INTEGER,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Itens dos Modelos
      CREATE TABLE IF NOT EXISTS itens_modelo (
        id SERIAL PRIMARY KEY,
        id_modelo INTEGER REFERENCES modelos_checklist(id) ON DELETE CASCADE,
        ordem INTEGER NOT NULL,
        descricao TEXT NOT NULL,
        tipo_resposta VARCHAR(50) DEFAULT 'sim_nao',
        obrigatorio BOOLEAN DEFAULT true,
        opcoes JSONB
      );

      -- Processos
      CREATE TABLE IF NOT EXISTS processos (
        id SERIAL PRIMARY KEY,
        id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        id_modelo INTEGER REFERENCES modelos_checklist(id),
        id_area INTEGER REFERENCES areas(id),
        id_unidade INTEGER REFERENCES unidades(id),
        nome VARCHAR(150) NOT NULL,
        descricao TEXT,
        status VARCHAR(50) DEFAULT 'ativo',
        data_inicio DATE,
        data_fim DATE,
        responsavel_id INTEGER REFERENCES usuarios(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Tarefas
      CREATE TABLE IF NOT EXISTS tarefas (
        id SERIAL PRIMARY KEY,
        id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
        id_processo INTEGER REFERENCES processos(id),
        id_modelo INTEGER REFERENCES modelos_checklist(id),
        id_responsavel INTEGER REFERENCES usuarios(id),
        id_equipe INTEGER REFERENCES equipes(id),
        titulo VARCHAR(150) NOT NULL,
        descricao TEXT,
        status VARCHAR(50) DEFAULT 'pendente',
        prioridade VARCHAR(50) DEFAULT 'media',
        data_programada DATE NOT NULL,
        hora_programada TIME,
        data_execucao TIMESTAMP,
        prazo_limite TIMESTAMP,
        tempo_execucao_minutos INTEGER,
        observacao_geral TEXT,
        latitude_execucao DECIMAL(10,8),
        longitude_execucao DECIMAL(11,8),
        criado_por INTEGER REFERENCES usuarios(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Execução dos Itens
      CREATE TABLE IF NOT EXISTS tarefa_itens_execucao (
        id SERIAL PRIMARY KEY,
        id_tarefa INTEGER REFERENCES tarefas(id) ON DELETE CASCADE,
        id_item_modelo INTEGER REFERENCES itens_modelo(id),
        resposta TEXT,
        observacao TEXT,
        foto_url VARCHAR(255),
        executado_por INTEGER REFERENCES usuarios(id),
        executado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Comentários
      CREATE TABLE IF NOT EXISTS tarefa_comentarios (
        id SERIAL PRIMARY KEY,
        id_tarefa INTEGER REFERENCES tarefas(id) ON DELETE CASCADE,
        id_usuario INTEGER REFERENCES usuarios(id),
        comentario TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Anexos
      CREATE TABLE IF NOT EXISTS tarefa_anexos (
        id SERIAL PRIMARY KEY,
        id_tarefa INTEGER REFERENCES tarefas(id) ON DELETE CASCADE,
        nome_arquivo VARCHAR(255),
        url_arquivo VARCHAR(500) NOT NULL,
        tipo_arquivo VARCHAR(50),
        tamanho_bytes INTEGER,
        enviado_por INTEGER REFERENCES usuarios(id),
        enviado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Notificações
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        id_usuario INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(150) NOT NULL,
        mensagem TEXT,
        dados_json JSONB,
        lida BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Índices
      CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(id_empresa);
      CREATE INDEX IF NOT EXISTS idx_tarefas_empresa ON tarefas(id_empresa);
      CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON tarefas(id_responsavel);
      CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
      CREATE INDEX IF NOT EXISTS idx_tarefas_data ON tarefas(data_programada);
      CREATE INDEX IF NOT EXISTS idx_processos_empresa ON processos(id_empresa);
      CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(id_usuario, lida);
    `);
    console.log('   ✅ Schema criado!');

    // 3. Inserir dados iniciais
    console.log('\n👤 3. Inserindo dados iniciais...');
    
    // Perfis
    await appPool.query(`
      INSERT INTO perfis (nome, descricao, permissoes) VALUES 
        ('admin', 'Administrador do Sistema', '["*"]'),
        ('supervisor', 'Supervisor de Equipe', '["tarefas.visualizar", "tarefas.criar", "tarefas.atribuir", "relatorios.visualizar", "dashboard.visualizar"]'),
        ('colaborador', 'Colaborador Operacional', '["tarefas.visualizar", "tarefas.executar", "tarefas.minhas"]')
      ON CONFLICT (nome) DO NOTHING
    `);
    console.log('   ✅ Perfis criados');

    // Empresa
    await appPool.query(`
      INSERT INTO empresas (nome, cnpj, email, telefone) VALUES 
        ('Empresa Demo JCS', '12.345.678/0001-90', 'admin@jcs.com.br', '(11) 99999-9999')
      ON CONFLICT (cnpj) DO NOTHING
    `);
    console.log('   ✅ Empresa criada');

    // Obter IDs
    const empresaResult = await appPool.query("SELECT id FROM empresas WHERE cnpj = '12.345.678/0001-90'");
    const id_empresa = empresaResult.rows[0].id;
    
    const perfilAdmin = await appPool.query("SELECT id FROM perfis WHERE nome = 'admin'");
    const perfilSupervisor = await appPool.query("SELECT id FROM perfis WHERE nome = 'supervisor'");
    const perfilColaborador = await appPool.query("SELECT id FROM perfis WHERE nome = 'colaborador'");

    // Unidades
    await appPool.query(`
      INSERT INTO unidades (id_empresa, nome, endereco, ativo) VALUES 
        ($1, 'Matriz - São Paulo', 'Av. Paulista, 1000 - São Paulo/SP', true),
        ($1, 'Filial - Rio de Janeiro', 'Av. Brasil, 500 - Rio de Janeiro/RJ', true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('   ✅ Unidades criadas');

    // Turnos
    await appPool.query(`
      INSERT INTO turnos (id_empresa, nome, hora_inicio, hora_fim, ativo) VALUES 
        ($1, 'Manhã', '06:00', '14:00', true),
        ($1, 'Tarde', '14:00', '22:00', true),
        ($1, 'Noite', '22:00', '06:00', true),
        ($1, 'Comercial', '08:00', '18:00', true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('   ✅ Turnos criados');

    // Funções
    await appPool.query(`
      INSERT INTO funcoes (id_empresa, nome, descricao, nivel_hierarquico, ativo) VALUES 
        ($1, 'Gerente Geral', 'Gestão geral', 1, true),
        ($1, 'Supervisor', 'Supervisão de equipes', 2, true),
        ($1, 'Técnico', 'Técnico de manutenção', 3, true),
        ($1, 'Operador', 'Operador de produção', 4, true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('   ✅ Funções criadas');

    // Áreas
    await appPool.query(`
      INSERT INTO areas (id_empresa, nome, descricao, ativo) VALUES 
        ($1, 'Produção', 'Área de produção', true),
        ($1, 'Manutenção', 'Setor de manutenção', true),
        ($1, 'Qualidade', 'Controle de qualidade', true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('   ✅ Áreas criadas');

    // Equipes
    await appPool.query(`
      INSERT INTO equipes (id_empresa, nome, descricao, ativo) VALUES 
        ($1, 'Equipe Alpha', 'Produção - Manhã', true),
        ($1, 'Equipe Beta', 'Produção - Tarde', true)
      ON CONFLICT DO NOTHING
    `, [id_empresa]);
    console.log('   ✅ Equipes criadas');

    // Usuários
    const senhaHash = await gerarHash('123456');
    await appPool.query(`
      INSERT INTO usuarios (id_empresa, nome, login, email, senha_hash, id_perfil, ativo) VALUES 
        ($1, 'Administrador', 'admin', 'admin@jcs.com.br', $2, $3, true),
        ($1, 'João Supervisor', 'joao.supervisor', 'joao@jcs.com.br', $2, $4, true),
        ($1, 'Maria Colaboradora', 'maria.operadora', 'maria@jcs.com.br', $2, $5, true),
        ($1, 'Carlos Técnico', 'carlos.tecnico', 'carlos@jcs.com.br', $2, $5, true)
      ON CONFLICT (email) DO NOTHING
    `, [id_empresa, senhaHash, perfilAdmin.rows[0].id, perfilSupervisor.rows[0].id, perfilColaborador.rows[0].id]);
    console.log('   ✅ Usuários criados');

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Setup concluído com sucesso!\n');
    console.log('📋 Credenciais de acesso:');
    console.log('   Admin:        admin / 123456');
    console.log('   Supervisor:   joao.supervisor / 123456');
    console.log('   Colaborador:  maria.operadora / 123456');
    console.log('\n🚀 Execute: npm run dev');
    console.log('='.repeat(50));

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Verifique se o PostgreSQL está instalado e rodando!');
    }
  } finally {
    if (appPool) {
      await appPool.end();
    }
    await adminPool.end();
  }
}

setup();
