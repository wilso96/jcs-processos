require('dotenv').config();
const app = require('./app');
const { initScheduler } = require('./scheduler');

const PORT = process.env.PORT || 3001;

// Inicializar o scheduler de tarefas automáticas
initScheduler();

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});