import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente para testes
dotenv.config({ path: '.env.test' });

// Mock do Redis para testes
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    flushall: jest.fn(),
    on: jest.fn(),
    ping: jest.fn(() => Promise.resolve('PONG'))
  }))
}));

// Mock do Bull para testes
jest.mock('bull', () => {
  return jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
    empty: jest.fn(),
    clean: jest.fn(),
    getJobs: jest.fn(() => Promise.resolve([])),
    getJobCounts: jest.fn(() => Promise.resolve({ active: 0, waiting: 0, completed: 0, failed: 0 }))
  }));
});

// Mock do MinIO para testes
jest.mock('minio', () => ({
  Client: jest.fn().mockImplementation(() => ({
    bucketExists: jest.fn(() => Promise.resolve(true)),
    makeBucket: jest.fn(() => Promise.resolve()),
    putObject: jest.fn(() => Promise.resolve({ etag: 'test-etag' })),
    getObject: jest.fn(() => Promise.resolve(Buffer.from('test'))),
    removeObject: jest.fn(() => Promise.resolve()),
    presignedGetObject: jest.fn(() => Promise.resolve('http://test-url'))
  }))
}));

// Mock do Winston para testes
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn()
};

jest.mock('../src/utils/logger', () => ({
  logger: mockLogger
}));

let prisma: PrismaClient;

beforeAll(async () => {
  // Configura banco de dados de teste
  process.env.DATABASE_URL = 'file:./test.db';
  
  // Executa migrações para o banco de teste
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Migration failed, continuing with tests...');
  }
  
  prisma = new PrismaClient();
  await prisma.$connect();
});

beforeEach(async () => {
  // Limpa dados entre os testes, mas mantém as tabelas
  const tablenames = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%';
  `;
  
  for (const { name } of tablenames) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`);
    await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence WHERE name="${name}";`);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Utilitários para testes
export const testUtils = {
  createTestUser: async (email = 'test@test.com', password = '123456') => {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Test User',
        plan: {
          create: {
            planType: 'FREE',
            maxAnalyses: 10,
            maxFileSize: 10
          }
        }
      },
      include: {
        plan: true
      }
    });
  },
  
  createTestJWT: (userId: string, email: string) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },
  
  clearMocks: () => {
    Object.values(mockLogger).forEach(fn => (fn as jest.Mock).mockClear());
  }
};

export { prisma, mockLogger }; 