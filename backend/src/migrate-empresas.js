/**
 * Migration: Adicionar campos responsavel e whatsapp na tabela empresas
 * Executar: node src/migrate-empresas.js
 */

const pool = require('./config/db');

async function migrate() {
    console.log('🚀 Iniciando migration de empresas...\n');

    try {
        // Verificar se a coluna responsavel já existe
        const checkResponsavel = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' AND column_name = 'responsavel'
        `);

        if (checkResponsavel.rows.length === 0) {
            console.log('📝 Adicionando coluna responsavel...');
            await pool.query(`
                ALTER TABLE empresas 
                ADD COLUMN responsavel VARCHAR(150)
            `);
            console.log('✅ Coluna responsavel adicionada!\n');
        } else {
            console.log('ℹ️ Coluna responsavel já existe.\n');
        }

        // Verificar se a coluna whatsapp já existe
        const checkWhatsapp = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'empresas' AND column_name = 'whatsapp'
        `);

        if (checkWhatsapp.rows.length === 0) {
            console.log('📝 Adicionando coluna whatsapp...');
            await pool.query(`
                ALTER TABLE empresas 
                ADD COLUMN whatsapp VARCHAR(20)
            `);
            console.log('✅ Coluna whatsapp adicionada!\n');
        } else {
            console.log('ℹ️ Coluna whatsapp já existe.\n');
        }

        console.log('✅ Migration concluída com sucesso!');
        console.log('\n📋 Campos adicionados à tabela empresas:');
        console.log('   - responsavel (VARCHAR 150)');
        console.log('   - whatsapp (VARCHAR 20)');

    } catch (error) {
        console.error('❌ Erro na migration:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

migrate().catch(console.error);
