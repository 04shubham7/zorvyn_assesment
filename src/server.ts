import 'dotenv/config';
import { createApp } from './app';
import runMigrations from './db/migrate';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Test database connection (non-blocking)
    console.log('Checking database connection...');
    await runMigrations();

    // Create and start Express app (always succeeds)
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Health check: GET http://localhost:${PORT}/api/v1/health`);
      console.log(`✓ API docs: See README.md and docs/Api.md`);
    });
  } catch (error) {
    // Don't exit - server can still run without DB for now
    console.error('✗ Server start error:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  try {
    // Dynamically import prisma only when needed
    const { default: prisma } = await import('./db/connection');
    await prisma.$disconnect();
  } catch (e) {
    // Silently ignore if not initialized
  }
  process.exit(0);
});

start();
