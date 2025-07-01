"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.setupDatabase = setupDatabase;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const prisma = new client_1.PrismaClient({
    log: ['error', 'warn'],
});
exports.prisma = prisma;
async function setupDatabase() {
    try {
        await prisma.$connect();
        logger_1.logger.info('✅ Conectado ao banco de dados SQLite');
    }
    catch (error) {
        logger_1.logger.error('❌ Erro ao conectar ao banco de dados:', error);
        throw error;
    }
}
//# sourceMappingURL=database.js.map