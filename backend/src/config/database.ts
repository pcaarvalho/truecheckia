import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export async function setupDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Conectado ao banco de dados SQLite');
  } catch (error) {
    logger.error('❌ Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

export { prisma }; 