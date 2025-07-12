import { Client } from 'minio';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

let minioClient: Client | null = null;
const BUCKET_NAME = process.env['MINIO_BUCKET'] || 'truecheckia';

// Diretório local para uploads quando MinIO não está disponível
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Interface comum para storage
interface FileStorage {
  uploadFile(fileName: string, buffer: Buffer, contentType: string): Promise<string>;
  deleteFile(fileName: string): Promise<void>;
  getFileUrl(fileName: string): Promise<string>;
}

// Implementação MinIO
class MinIOStorage implements FileStorage {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async uploadFile(fileName: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.putObject(BUCKET_NAME, fileName, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    return fileName;
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.client.removeObject(BUCKET_NAME, fileName);
  }

  async getFileUrl(fileName: string): Promise<string> {
    // Gera URL presigned válida por 24 horas
    return await this.client.presignedGetObject(BUCKET_NAME, fileName, 24 * 60 * 60);
  }
}

// Implementação Local
class LocalStorage implements FileStorage {
  constructor() {
    // Cria diretório de uploads se não existir
    if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
      fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
      logger.info(`📁 Diretório de uploads criado: ${LOCAL_UPLOADS_DIR}`);
    }
  }

  async uploadFile(fileName: string, buffer: Buffer, contentType: string): Promise<string> {
    const filePath = path.join(LOCAL_UPLOADS_DIR, fileName);
    
    // Criar diretório se não existir
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      await fs.promises.mkdir(fileDir, { recursive: true });
    }
    
    await fs.promises.writeFile(filePath, buffer);
    logger.info(`📄 Arquivo salvo localmente: ${fileName}`);
    return fileName;
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(LOCAL_UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.info(`🗑️ Arquivo removido: ${fileName}`);
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    // Para desenvolvimento local, retorna URL do servidor estático
    const baseUrl = process.env['SERVER_URL'] || `http://localhost:${process.env['PORT'] || 3001}`;
    return `${baseUrl}/uploads/${fileName}`;
  }
}

let fileStorage: FileStorage;

// Configura MinIO se disponível, senão usa storage local
export async function setupFileStorage() {
  try {
    if (process.env['SKIP_MINIO'] === 'true') {
      logger.info('📁 Usando storage local para desenvolvimento');
      fileStorage = new LocalStorage();
      return;
    }

    if (process.env['MINIO_ENDPOINT'] && process.env['MINIO_ACCESS_KEY'] && process.env['MINIO_SECRET_KEY']) {
      minioClient = new Client({
        endPoint: process.env['MINIO_ENDPOINT'],
        port: parseInt(process.env['MINIO_PORT'] || '9000'),
        useSSL: process.env['MINIO_USE_SSL'] === 'true',
        accessKey: process.env['MINIO_ACCESS_KEY'],
        secretKey: process.env['MINIO_SECRET_KEY']
      });

      // Testa conexão
      await minioClient.listBuckets();
      
      // Verifica se o bucket existe, se não, cria
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
      if (!bucketExists) {
        await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
        logger.info(`✅ Bucket ${BUCKET_NAME} criado`);
      }
      
      fileStorage = new MinIOStorage(minioClient);
      logger.info('✅ MinIO conectado');
    } else {
      throw new Error('Configurações do MinIO não encontradas');
    }
  } catch (error) {
    logger.warn('⚠️ MinIO não disponível, usando storage local:', error);
    fileStorage = new LocalStorage();
  }
}

export { fileStorage, BUCKET_NAME, LOCAL_UPLOADS_DIR };