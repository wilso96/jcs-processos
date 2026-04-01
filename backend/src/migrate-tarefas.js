/**
 * Migration: Add missing columns to tarefas table
 * Run: node src/migrate-tarefas.js
 */

const pool = require('./config/db');

async function migrate() {
  console.log('🚀 Migration: Adding missing columns to tarefas table\n');

  try {
    // Check and add columns one by one
    const columnsToAdd = [
      {
        name: 'ordem_execucao',
        definition: 'INTEGER DEFAULT 0',
        check: "SELECT column_name FROM information_schema.columns WHERE table_name = 'tarefas' AND column_name = 'ordem_execucao'"
      },
      {
        name: 'tarefa_diaria',
        definition: 'BOOLEAN DEFAULT false',
        check: "SELECT column_name FROM information_schema.columns WHERE table_name = 'tarefas' AND column_name = 'tarefa_diaria'"
      },
      {
        name: 'dias_semana',
        definition: 'INTEGER[]',
        check: "SELECT column_name FROM information_schema.columns WHERE table_name = 'tarefas' AND column_name = 'dias_semana'"
      },
      {
        name: 'tarefa_pai_id',
        definition: 'INTEGER REFERENCES tarefas(id) ON DELETE SET NULL',
        check: "SELECT column_name FROM information_schema.columns WHERE table_name = 'tarefas' AND column_name = 'tarefa_pai_id'"
      },
      {
        name: 'gerada_automaticamente',
        definition: 'BOOLEAN DEFAULT false',
        check: "SELECT column_name FROM information_schema.columns WHERE table_name = 'tarefas' AND column_name = 'gerada_automaticamente'"
      }
    ];

    for (const col of columnsToAdd) {
      try {
        const result = await pool.query(col.check);
        
        if (result.rows.length === 0) {
          console.log(`  ➕ Adding column: ${col.name}`);
          await pool.query(`ALTER TABLE tarefas ADD COLUMN ${col.name} ${col.definition}`);
          console.log(`     ✅ Column ${col.name} added successfully`);
        } else {
          console.log(`  ✓ Column ${col.name} already exists`);
        }
      } catch (err) {
        if (err.code === '42701') { // duplicate_column
          console.log(`  ✓ Column ${col.name} already exists`);
        } else {
          console.error(`     ❌ Error adding ${col.name}:`, err.message);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (err) {
    console.error('\n❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
