"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUCKET_NAME = exports.minioClient = void 0;
exports.setupMinIO = setupMinIO;
const minio_1 = require("minio");
const logger_1 = require("../utils/logger");
let minioClient = null;
exports.minioClient = minioClient;
const BUCKET_NAME = 'ai-detector-files';
exports.BUCKET_NAME = BUCKET_NAME;
if (process.env['MINIO_ENDPOINT'] && process.env['MINIO_ACCESS_KEY'] && process.env['MINIO_SECRET_KEY']) {
    exports.minioClient = minioClient = new minio_1.Client({
        endPoint: process.env['MINIO_ENDPOINT'],
        port: parseInt(process.env['MINIO_PORT'] || '9000'),
        useSSL: process.env['MINIO_USE_SSL'] === 'true',
        accessKey: process.env['MINIO_ACCESS_KEY'],
        secretKey: process.env['MINIO_SECRET_KEY']
    });
}
async function setupMinIO() {
    try {
        if (!minioClient) {
            logger_1.logger.warn('⚠️ MinIO não configurado - uploads de arquivo serão desabilitados');
            return;
        }
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
        if (!bucketExists) {
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
            logger_1.logger.info(`✅ Bucket ${BUCKET_NAME} criado`);
        }
        logger_1.logger.info('✅ Conectado ao MinIO');
    }
    catch (error) {
        logger_1.logger.warn('⚠️ MinIO não disponível - uploads de arquivo serão desabilitados:', error);
    }
}
//# sourceMappingURL=minio.js.map