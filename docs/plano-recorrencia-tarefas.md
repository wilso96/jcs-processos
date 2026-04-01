# Plano de Implementação - Recorrência de Tarefas

## Visão Geral
Sistema para criar tarefas recorrentes (diárias ou dias específicos da semana) com geração automática.

## Funcionalidades

### 1. Configuração de Recorrência
- **Tarefa Diária**: Aparece todos os dias
- **Dias da Semana**: Aparece em dias específicos (Seg, Qua, Sex)
- **Ordem de Execução**: Sequência dentro do processo (1, 2, 3...)

### 2. Fluxo de Recorrência
```
Dia 1: Sistema gera tarefa "Limpar área" (ordem: 1, diária: true)
       → Colaborador marca como CONCLUÍDA
       → Tarefa fica com status concluída

Dia 2: Sistema verifica - é tarefa diária e não existe tarefa pendente para hoje
       → Gera NOVA tarefa "Limpar área" (ordem: 1, diária: true)
       → Colaborador vê a tarefa na lista
```

## Estrutura do Banco de Dados

### Alterações na Tabela `tarefas`
```sql
-- Campos novos
ALTER TABLE tarefas ADD COLUMN ordem_execucao INTEGER DEFAULT 0;
ALTER TABLE tarefas ADD COLUMN tarefa_diaria BOOLEAN DEFAULT false;
ALTER TABLE tarefas ADD COLUMN dias_semana INTEGER[]; -- [2,4,6] = Seg, Qua, Sex
ALTER TABLE tarefas ADD COLUMN tarefa_pai_id INTEGER REFERENCES tarefas(id); -- Referência à tarefa original
ALTER TABLE tarefas ADD COLUMN gerada_automaticamente BOOLEAN DEFAULT false;
```

### Nova Tabela: `tarefas_modelo_recorrente`
Guarda os modelos das tarefas recorrentes para geração automática:
```sql
CREATE TABLE tarefas_modelo_recorrente (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER REFERENCES empresas(id),
  id_processo INTEGER REFERENCES processos(id),
  id_responsavel INTEGER REFERENCES usuarios(id),
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  ordem_execucao INTEGER DEFAULT 0,
  tarefa_diaria BOOLEAN DEFAULT false,
  dias_semana INTEGER[],
  prioridade VARCHAR(50) DEFAULT 'media',
  ativo BOOLEAN DEFAULT true,
  hora_programada TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Novos Endpoints
```
POST   /tarefas/gerar-diarias          - Gera tarefas do dia (executado automaticamente)
GET    /tarefas-modelo-recorrente      - Lista modelos de tarefas recorrentes
POST   /tarefas-modelo-recorrente      - Cria modelo de tarefa recorrente
PUT    /tarefas-modelo-recorrente/:id  - Atualiza modelo
DELETE /tarefas-modelo-recorrente/:id  - Desativa modelo
```

## Lógica de Geração Automática

### Algoritmo (executar todo dia às 00:01)
```javascript
function gerarTarefasDoDia() {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
  
  // Buscar todos os modelos ativos
  const modelos = await buscarModelosAtivos();
  
  for (const modelo of modelos) {
    // Verificar se deve gerar hoje
    const deveGerar = modelo.tarefa_diaria || 
                      (modelo.dias_semana && modelo.dias_semana.includes(diaSemana));
    
    if (deveGerar) {
      // Verificar se já existe tarefa para hoje
      const existe = await verificarTarefaExistente(modelo.id, hoje);
      
      if (!existe) {
        // Criar nova tarefa baseada no modelo
        await criarTarefaDoModelo(modelo, hoje);
      }
    }
  }
}
```

## Interface do Colaborador

### Visualização
```
┌─────────────────────────────────────────┐
│ Minhas Tarefas - Quarta-feira, 25/03   │
├─────────────────────────────────────────┤
│                                         │
│ Processo: Limpeza Diária               │
│ ┌─────────────────────────────────┐    │
│ │ 🔢 1  [✓] Limpar área produção  │    │
│ │      └─ Diária • Concluída      │    │
│ ├─────────────────────────────────┤    │
│ │ 🔢 2  [ ] Verificar equipamentos│    │
│ │      └─ Diária • Pendente       │    │
│ └─────────────────────────────────┘    │
│                                         │
│ Processo: Manutenção Semanal           │
│ ┌─────────────────────────────────┐    │
│ │ 🔢 1  [ ] Trocar filtros        │    │
│ │      └─ Seg, Qua, Sex • Alta    │    │
│ └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### Ordenação
1. Agrupar por Processo
2. Dentro de cada processo, ordenar por `ordem_execucao` ASC
3. Mostrar número da ordem (🔢 1, 🔢 2, etc.)

## Cron Job
Executar diariamente às 00:01 para gerar tarefas do dia:

```javascript
// Usando node-cron ou similar
const cron = require('node-cron');

cron.schedule('1 0 * * *', () => {
  console.log('Gerando tarefas do dia...');
  gerarTarefasDoDia();
});
```

## Resumo das Alterações

### Backend
1. Migration SQL com novos campos
2. Novo service: `tarefas-recorrentes.service.js`
3. Novo controller: `tarefas-recorrentes.controller.js`
4. Novas rotas em `tarefas.routes.js`
5. Script de geração automática

### Frontend
1. Tela de Tarefas: campos de recorrência e ordem
2. Tela Minhas Tarefas: mostrar ordem e ordenar
3. Indicadores visuais (badge "Diária", "Seg, Qua")

## Próximos Passos
Aprovar este plano para iniciar a implementação.
