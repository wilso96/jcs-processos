// Schema do banco SQLite local
export const SCHEMA = `
-- Tabela de usuários (cache local)
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  login TEXT,
  email TEXT,
  perfil TEXT,
  id_empresa INTEGER
);

-- Tabela de tarefas (cache local)
CREATE TABLE IF NOT EXISTS tarefas (
  id INTEGER PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'pendente',
  prioridade TEXT DEFAULT 'media',
  data_programada TEXT,
  hora_programada TEXT,
  id_responsavel INTEGER,
  responsavel_nome TEXT,
  equipe_nome TEXT,
  modelo_nome TEXT,
  processo_nome TEXT,
  sincronizado INTEGER DEFAULT 0,
  updated_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de itens do checklist (cache local)
CREATE TABLE IF NOT EXISTS itens_checklist (
  id INTEGER PRIMARY KEY,
  id_item_modelo INTEGER,
  tarefa_id INTEGER,
  ordem INTEGER,
  descricao TEXT NOT NULL,
  tipo_resposta TEXT DEFAULT 'sim_nao',
  obrigatorio INTEGER DEFAULT 1,
  opcoes TEXT,
  resposta TEXT,
  observacao TEXT,
  foto_url TEXT,
  sincronizado INTEGER DEFAULT 0,
  updated_at TEXT,
  FOREIGN KEY (tarefa_id) REFERENCES tarefas(id)
);

-- Tabela de fila de sincronização
CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tabela TEXT NOT NULL,
  acao TEXT NOT NULL,
  registro_id INTEGER NOT NULL,
  dados_json TEXT NOT NULL,
  tentativas INTEGER DEFAULT 0,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_sincronizado ON tarefas(sincronizado);
CREATE INDEX IF NOT EXISTS idx_itens_tarefa ON itens_checklist(tarefa_id);
CREATE INDEX IF NOT EXISTS idx_itens_sincronizado ON itens_checklist(sincronizado);
CREATE INDEX IF NOT EXISTS idx_sync_queue_tabela ON sync_queue(tabela);
`;

export const TABLES = {
  USUARIOS: 'usuarios',
  TAREFAS: 'tarefas',
  ITENS_CHECKLIST: 'itens_checklist',
  SYNC_QUEUE: 'sync_queue',
};
