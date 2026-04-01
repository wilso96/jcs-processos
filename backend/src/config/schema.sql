-- ============================================
-- SISTEMA JCS-PROCESSOS - SCHEMA COMPLETO
-- ============================================

-- Tabela de Empresas (multitenancy)
CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(100),
  telefone VARCHAR(20),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Perfis de Usuário
CREATE TABLE perfis (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  descricao VARCHAR(200),
  permissoes JSONB DEFAULT '[]'
);

-- Unidades de Negócio
CREATE TABLE unidades (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  endereco TEXT,
  responsavel_id INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Turnos de Trabalho
CREATE TABLE turnos (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(50) NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  ativo BOOLEAN DEFAULT true
);

-- Funções/Cargos
CREATE TABLE funcoes (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  nivel_hierarquico INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true
);

-- Equipes
CREATE TABLE equipes (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  id_unidade INTEGER REFERENCES unidades(id),
  nome VARCHAR(100) NOT NULL,
  id_lider INTEGER,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Áreas
CREATE TABLE areas (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  responsavel_id INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuários
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  id_unidade INTEGER REFERENCES unidades(id),
  id_funcao INTEGER REFERENCES funcoes(id),
  id_turno INTEGER REFERENCES turnos(id),
  id_perfil INTEGER REFERENCES perfis(id),
  nome VARCHAR(150) NOT NULL,
  login VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100),
  telefone VARCHAR(20),
  senha_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipe-Usuario (N:N)
CREATE TABLE equipe_usuarios (
  id SERIAL PRIMARY KEY,
  id_equipe INTEGER REFERENCES equipes(id) ON DELETE CASCADE,
  id_usuario INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  data_entrada DATE DEFAULT CURRENT_DATE
);

-- Modelos de Checklist
CREATE TABLE modelos_checklist (
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
CREATE TABLE itens_modelo (
  id SERIAL PRIMARY KEY,
  id_modelo INTEGER REFERENCES modelos_checklist(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  tipo_resposta VARCHAR(50) DEFAULT 'sim_nao',
  obrigatorio BOOLEAN DEFAULT true,
  opcoes JSONB
);

-- Processos
CREATE TABLE processos (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  id_modelo INTEGER REFERENCES modelos_checklist(id),
  id_area INTEGER REFERENCES areas(id),
  id_unidade INTEGER REFERENCES unidades(id),
  id_equipe INTEGER REFERENCES equipes(id) ON DELETE SET NULL,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  status VARCHAR(50) DEFAULT 'ativo',
  data_inicio DATE,
  data_fim DATE,
  responsavel_id INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tarefas
CREATE TABLE tarefas (
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
  -- Campos para recorrência
  ordem_execucao INTEGER DEFAULT 0,
  tarefa_diaria BOOLEAN DEFAULT false,
  dias_semana INTEGER[], -- [2,4,6] = Seg, Qua, Sex (1=Dom, 2=Seg, ... 7=Sáb)
  tarefa_pai_id INTEGER REFERENCES tarefas(id) ON DELETE SET NULL,
  gerada_automaticamente BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modelos de Tarefas Recorrentes
CREATE TABLE tarefas_modelo_recorrente (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
  id_processo INTEGER REFERENCES processos(id),
  id_responsavel INTEGER REFERENCES usuarios(id),
  id_equipe INTEGER REFERENCES equipes(id),
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  ordem_execucao INTEGER DEFAULT 0,
  tarefa_diaria BOOLEAN DEFAULT false,
  dias_semana INTEGER[], -- [2,4,6] = Seg, Qua, Sex
  prioridade VARCHAR(50) DEFAULT 'media',
  hora_programada TIME,
  ativo BOOLEAN DEFAULT true,
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Execução dos Itens
CREATE TABLE tarefa_itens_execucao (
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
CREATE TABLE tarefa_comentarios (
  id SERIAL PRIMARY KEY,
  id_tarefa INTEGER REFERENCES tarefas(id) ON DELETE CASCADE,
  id_usuario INTEGER REFERENCES usuarios(id),
  comentario TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anexos
CREATE TABLE tarefa_anexos (
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
CREATE TABLE notificacoes (
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
CREATE INDEX idx_usuarios_empresa ON usuarios(id_empresa);
CREATE INDEX idx_tarefas_empresa ON tarefas(id_empresa);
CREATE INDEX idx_tarefas_responsavel ON tarefas(id_responsavel);
CREATE INDEX idx_tarefas_status ON tarefas(status);
CREATE INDEX idx_tarefas_data ON tarefas(data_programada);
CREATE INDEX idx_tarefas_processo_ordem ON tarefas(id_processo, ordem_execucao);
CREATE INDEX idx_tarefas_modelo_recorrente ON tarefas_modelo_recorrente(id_empresa, ativo);
CREATE INDEX idx_processos_empresa ON processos(id_empresa);
CREATE INDEX idx_notificacoes_usuario ON notificacoes(id_usuario, lida);

-- SEEDS
INSERT INTO perfis (nome, descricao, permissoes) VALUES 
  ('admin', 'Administrador do Sistema', '["*"]'),
  ('supervisor', 'Supervisor de Equipe', '["tarefas.visualizar", "tarefas.criar", "tarefas.atribuir", "relatorios.visualizar", "dashboard.visualizar"]'),
  ('colaborador', 'Colaborador Operacional', '["tarefas.visualizar", "tarefas.executar", "tarefas.minhas"]');

INSERT INTO empresas (nome, cnpj, email) VALUES 
  ('Empresa Demo', '00.000.000/0000-00', 'admin@demo.com');
