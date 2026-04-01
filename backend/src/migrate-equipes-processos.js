// ============================================
// Migration: Adicionar id_equipe em processos
// Executar: node src/migrate-equipes-processos.js
// ============================================

const pool = require('./config/db');

async function migrate() {
    console.log('🔄 Iniciando migration: Adicionar id_equipe em processos...\n');
    
    try {
        // Verificar se a coluna já existe
        const checkQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'processos' AND column_name = 'id_equipe'
        `;
        const { rows } = await pool.query(checkQuery);
        
        if (rows.length > 0) {
            console.log('✅ Coluna id_equipe já existe na tabela processos.');
            console.log('   Nenhuma alteração necessária.');
            process.exit(0);
        }
        
        // Adicionar a coluna id_equipe
        console.log('📝 Adicionando coluna id_equipe na tabela processos...');
        
        const alterQuery = `
            ALTER TABLE processos 
            ADD COLUMN id_equipe INTEGER REFERENCES equipes(id) ON DELETE SET NULL
        `;
        await pool.query(alterQuery);
        
        console.log('✅ Coluna id_equipe adicionada com sucesso!');
        
        // Criar índice para melhorar performance
        console.log('📝 Criando índice idx_processos_equipe...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_processos_equipe ON processos(id_equipe)
        `);
        console.log('✅ Índice criado com sucesso!');
        
        console.log('\n🎉 Migration concluída com sucesso!');
        
    } catch (err) {
        console.error('❌ Erro durante a migration:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();
