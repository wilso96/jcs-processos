/**
 * Scheduler para tarefas automáticas
 * Usa node-cron para agendar tarefas recorrentes
 */
const cron = require('node-cron');
const TarefasRecorrentesService = require('./modules/tarefas-recorrentes/tarefas-recorrentes.service');

/**
 * Inicializa o scheduler com as tarefas automáticas
 */
function initScheduler() {
    console.log('[Scheduler] Inicializando scheduler de tarefas...');
    
    // Agendar geração de tarefas diárias às 00:05 todos os dias
    // O horário 00:05 garante que o dia já mudou completamente
    cron.schedule('5 0 * * *', async () => {
        console.log('[Scheduler] Executando geração automática de tarefas do dia...');
        try {
            // Busca todas as empresas ativas para gerar tarefas para cada uma
            const pool = require('./config/db');
            const { rows: empresas } = await pool.query('SELECT id FROM empresas WHERE ativo = true');
            
            let totalGeradas = 0;
            for (const empresa of empresas) {
                const tarefasGeradas = await TarefasRecorrentesService.gerarTarefasDoDia(empresa.id);
                totalGeradas += tarefasGeradas.length;
            }
            
            console.log(`[Scheduler] Resultado: ${totalGeradas} tarefas geradas para ${empresas.length} empresa(s)`);
        } catch (error) {
            console.error('[Scheduler] Erro ao gerar tarefas diárias:', error);
        }
    }, {
        timezone: 'America/Sao_Paulo' // Fuso horário do Brasil
    });
    
    console.log('[Scheduler] Scheduler inicializado com sucesso!');
    console.log('[Scheduler] Tarefa agendada: Geração de tarefas diárias às 00:05 (horário de Brasília)');
}

module.exports = { initScheduler };
