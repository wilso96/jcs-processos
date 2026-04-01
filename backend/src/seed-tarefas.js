/**
 * Script de Seed - Tarefas de Exemplo
 * Execute: node src/seed-tarefas.js
 */

const pool = require('./config/db');

async function seedTarefas() {
  console.log('🚀 Iniciando seed de tarefas...\n');
  
  try {
    // 1. Obter empresa
    const empresaResult = await pool.query("SELECT id FROM empresas LIMIT 1");
    if (empresaResult.rows.length === 0) {
      console.log('❌ Nenhuma empresa encontrada. Execute o seed principal primeiro.');
      return;
    }
    const id_empresa = empresaResult.rows[0].id;
    console.log('📦 Empresa ID:', id_empresa);

    // 2. Obter usuários
    const usuariosResult = await pool.query("SELECT id FROM usuarios LIMIT 4");
    const usuarios = usuariosResult.rows.map(r => r.id);
    console.log('👥 Usuários encontrados:', usuarios.length);

    // 3. Obter equipes
    const equipesResult = await pool.query("SELECT id, nome FROM equipes");
    const equipes = equipesResult.rows;
    console.log('👥 Equipes encontradas:', equipes.length);

    // 4. Criar tarefas de exemplo
    console.log('\n📋 Criando tarefas de exemplo...\n');

    const tarefas = [
      {
        titulo: 'Verificar EPI da equipe - Turno Manhã',
        descricao: 'Conferir uso de EPIs completos (bota, óculos, protetor auricular, capacete) na entrada do turno.',
        prioridade: 'alta',
        status: 'pendente',
        data_programada: new Date().toISOString().split('T')[0],
        hora_programada: '06:00',
        id_responsavel: usuarios[0],
        id_equipe: equipes[0]?.id || null
      },
      {
        titulo: 'Limpeza do banheiro A - Setor Produção',
        descricao: 'Realizar limpeza completa do banheiro A incluindo piso, vasos, pias e reposição de materiais.',
        prioridade: 'media',
        status: 'pendente',
        data_programada: new Date().toISOString().split('T')[0],
        hora_programada: '08:00',
        id_responsavel: usuarios[1],
        id_equipe: equipes[1]?.id || null
      },
      {
        titulo: 'Inspeção visual do equipamento de corte',
        descricao: 'Verificar condições gerais do equipamento, lubricantação e possíveis ruídos anormais.',
        prioridade: 'alta',
        status: 'em_andamento',
        data_programada: new Date().toISOString().split('T')[0],
        hora_programada: '09:00',
        id_responsavel: usuarios[2],
        id_equipe: equipes[2]?.id || null
      },
      {
        titulo: 'Conferir pallets organizados na área de expedição',
        descricao: 'Verificar organização dos pallets e disponibilidade para embarque.',
        prioridade: 'media',
        status: 'concluida',
        data_programada: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        hora_programada: '07:00',
        id_responsavel: usuarios[3],
        id_equipe: equipes[3]?.id || null
      },
      {
        titulo: 'Verificar nível de sabonete e papel higiênico',
        descricao: 'Repor sabonete líquido e papel higiênico nos banheiros do segundo andar.',
        prioridade: 'baixa',
        status: 'pendente',
        data_programada: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        hora_programada: '10:00',
        id_responsavel: usuarios[0],
        id_equipe: equipes[0]?.id || null
      },
      {
        titulo: 'Checar Vazamentos aparentes - Setor Manutenção',
        descricao: 'Inspecionar tubulações e conexões em busca de vazamentos aparentes.',
        prioridade: 'urgente',
        status: 'pendente',
        data_programada: new Date().toISOString().split('T')[0],
        hora_programada: '11:00',
        id_responsavel: usuarios[2],
        id_equipe: equipes[2]?.id || null
      },
      {
        titulo: 'Organizar ferramentas do almoxarifado',
        descricao: 'Organizar e etiquetar ferramentas no almoxarifado central.',
        prioridade: 'media',
        status: 'pendente',
        data_programada: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        hora_programada: '14:00',
        id_responsavel: usuarios[1],
        id_equipe: equipes[1]?.id || null
      },
      {
        titulo: 'Verificar extintores - Andar térreo',
        descricao: 'Conferir validade e posicionamento dos extintores do andar térreo.',
        prioridade: 'alta',
        status: 'concluida',
        data_programada: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        hora_programada: '15:00',
        id_responsavel: usuarios[3],
        id_equipe: equipes[3]?.id || null
      },
      {
        titulo: 'Lavar área de carga e descarga',
        descricao: 'Realizar limpeza da área de carga e descarga para próximo embarque.',
        prioridade: 'baixa',
        status: 'em_andamento',
        data_programada: new Date().toISOString().split('T')[0],
        hora_programada: '13:00',
        id_responsavel: usuarios[0],
        id_equipe: equipes[0]?.id || null
      },
      {
        titulo: 'Atualizar planilha de controle de qualidade',
        descricao: 'Registrar dados de qualidade do dia no sistema.',
        prioridade: 'media',
        status: 'pendente',
        data_programada: new Date().toISOString().split('T')[0],
        hora_programada: '17:00',
        id_responsavel: usuarios[2],
        id_equipe: equipes[2]?.id || null
      }
    ];

    for (let i = 0; i < tarefas.length; i++) {
      const t = tarefas[i];
      const query = `
        INSERT INTO tarefas (id_empresa, criado_por, titulo, descricao, prioridade, status, data_programada, hora_programada, id_responsavel, id_equipe)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      const values = [id_empresa, usuarios[0], t.titulo, t.descricao, t.prioridade, t.status, t.data_programada, t.hora_programada, t.id_responsavel, t.id_equipe];
      
      const result = await pool.query(query, values);
      if (result.rows.length > 0) {
        console.log(`✅ Tarefa criada: ${t.titulo.substring(0, 50)}...`);
      } else {
        console.log(`ℹ️  Tarefa já existia: ${t.titulo.substring(0, 50)}...`);
      }
    }

    console.log('\n✅ Seed de tarefas concluído com sucesso!\n');
    console.log('📝 Acesse a aplicação e faça login para ver as tarefas.');

  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
  } finally {
    await pool.end();
  }
}

seedTarefas();
