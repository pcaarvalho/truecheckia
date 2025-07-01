import { Client } from 'minio';
import { logger } from '../utils/logger';

let minioClient: Client | null = null;
const BUCKET_NAME = 'ai-detector-files';

// Inicializa MinIO apenas se as configurações estiverem disponíveis
if (process.env['MINIO_ENDPOINT'] && process.env['MINIO_ACCESS_KEY'] && process.env['MINIO_SECRET_KEY']) {
  minioClient = new Client({
    endPoint: process.env['MINIO_ENDPOINT'],
    port: parseInt(process.env['MINIO_PORT'] || '9000'),
    useSSL: process.env['MINIO_USE_SSL'] === 'true',
    accessKey: process.env['MINIO_ACCESS_KEY'],
    secretKey: process.env['MINIO_SECRET_KEY']
  });
}

export async function setupMinIO() {
  try {
    if (!minioClient) {
      logger.warn('⚠️ MinIO não configurado - uploads de arquivo serão desabilitados');
      return;
    }

    // Verifica se o bucket existe, se não, cria
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      logger.info(`✅ Bucket ${BUCKET_NAME} criado`);
    }
    logger.info('✅ Conectado ao MinIO');
  } catch (error) {
    logger.warn('⚠️ MinIO não disponível - uploads de arquivo serão desabilitados:', error);
  }
}

export { minioClient, BUCKET_NAME }; 