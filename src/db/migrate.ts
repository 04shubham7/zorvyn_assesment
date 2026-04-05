import prisma from './connection';

/**
 * Run Prisma migrations (production-style)
 * For development, use: npm run prisma:migrate
 * This gracefully handles connection failures
 */
async function runMigrations() {
  try {
    console.log('Checking database connection...');
    // Test connection with timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      ),
    ]);
    console.log('✓ Database connection successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      '⚠ Database connection unavailable: ' + message
    );
    console.warn(
      'Server starting anyway. Run "npm run prisma:migrate" when database is ready.'
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      // Silently ignore disconnect errors if connection never succeeded
    }
  }
}

// Run if executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigrations;
