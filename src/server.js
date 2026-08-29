import app from './app.js';
import db from '../database/connection.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await db.raw('SELECT 1+1 AS result');
    console.log('✅ Conexão com o banco de dados SQLite estabelecida com sucesso.');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor AccessTrip rodando na porta ${PORT}`);
      console.log(`📍 URL base: http://localhost:${PORT}`);
      console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Erro fatal ao iniciar o servidor:', error);
    process.exit(1);
  }
}

startServer();
