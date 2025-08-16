import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { anthropicService } from './anthropicService';
import { imageAnalysisService } from './imageAnalysisService';

interface QueueJob {
  id?: string;
  type: string;
  data: any;
}

interface AnalysisResult {
  provider: string;
  confidence: number;
  isAIGenerated: boolean;
  details?: any;
}

// Fila simples em memória como fallback
const memoryQueue: QueueJob[] = [];
let queueProcessing = false;

export async function addToQueue(type: string, data: any): Promise<void> {
  const job: QueueJob = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
  };

  try {
    if (redis) {
      // Usa Redis se disponível
      await redis.lpush('processing-queue', JSON.stringify(job));
      logger.info(`Job ${job.id} adicionado à fila Redis`);
    } else {
      // Fallback para fila em memória
      memoryQueue.push(job);
      logger.info(`Job ${job.id} adicionado à fila em memória`);

      // Processa a fila se não estiver sendo processada
      if (!queueProcessing) {
        processMemoryQueue();
      }
    }
  } catch (error) {
    logger.error('Erro ao adicionar job à fila:', error);
    // Adiciona à fila em memória como fallback
    memoryQueue.push(job);
    if (!queueProcessing) {
      processMemoryQueue();
    }
  }
}

async function processMemoryQueue(): Promise<void> {
  if (queueProcessing) return;

  queueProcessing = true;
  logger.info('Iniciando processamento da fila em memória');

  while (memoryQueue.length > 0) {
    const job = memoryQueue.shift();
    if (job) {
      try {
        await processJob(job);
        logger.info(`Job ${job.id} processado com sucesso`);
      } catch (error) {
        logger.error(`Erro ao processar job ${job.id}:`, error);
      }
    }
  }

  queueProcessing = false;
  logger.info('Processamento da fila em memória finalizado');
}

async function processJob(job: QueueJob): Promise<void> {
  const { type, data } = job;

  switch (type) {
    case 'analysis':
      await processAnalysisJob(data);
      break;
    case 'report':
      await processReportJob(data);
      break;
    default:
      logger.warn(`Tipo de job desconhecido: ${type}`);
  }
}

async function processAnalysisJob(data: any): Promise<void> {
  logger.info(`Processando análise: ${data.analysisId} - Tipo: ${data.contentType}`);

  try {
    // Atualiza status para PROCESSING
    await prisma.analysis.update({
      where: { id: data.analysisId },
      data: { status: 'PROCESSING' },
    });

    let result: AnalysisResult;

    if (data.textContent) {
      // Analisa texto
      result = await anthropicService.analyzeText(data.textContent);
    } else if (data.contentType === 'IMAGE' && data.fileUrl) {
      // Analisa imagem
      result = await imageAnalysisService.analyzeImage(
        data.fileUrl,
        data.fileName || 'unknown.jpg'
      );
    } else if (data.contentType === 'VIDEO' && data.fileUrl) {
      // Para vídeo, usa análise simulada por enquanto
      result = {
        provider: 'TrueCheckIA Video Analyzer (Mock)',
        confidence: 65.0 + Math.random() * 20,
        isAIGenerated: Math.random() > 0.5,
        details: {
          message: 'Análise de vídeo em desenvolvimento - resultado simulado',
          processingTime: 2000 + Math.random() * 1000,
          fileName: data.fileName,
        },
      };
    } else {
      // Para outros tipos de conteúdo, usa análise genérica
      result = {
        provider: 'TrueCheckIA Generic Analyzer',
        confidence: 60.0,
        isAIGenerated: false,
        details: {
          message: 'Análise genérica aplicada - tipo de arquivo não específico',
          processingTime: 500,
          contentType: data.contentType,
        },
      };
    }

    // Atualiza análise com resultado
    await prisma.analysis.update({
      where: { id: data.analysisId },
      data: {
        status: 'COMPLETED',
        confidence: result.confidence,
        isAIGenerated: result.isAIGenerated,
        metadata: JSON.stringify(result.details || {}),
      },
    });

    // Salva resultado detalhado
    await prisma.analysisResult.create({
      data: {
        analysisId: data.analysisId,
        provider: result.provider,
        confidence: result.confidence,
        isAIGenerated: result.isAIGenerated,
        details: JSON.stringify({
          message: result.details?.message || 'Análise concluída',
          response: result.details?.response || 'Sem resposta específica',
          ...(result.details || {}),
        }),
        processingTime: result.details?.processingTime || 0,
      },
    });

    logger.info(`Análise ${data.analysisId} concluída com sucesso`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error(`Erro ao processar análise ${data.analysisId}:`, error);

    // Atualiza status para FAILED
    try {
      await prisma.analysis.update({
        where: { id: data.analysisId },
        data: {
          status: 'FAILED',
          metadata: JSON.stringify({ error: errorMessage }),
        },
      });
    } catch (updateError) {
      logger.error('Erro ao atualizar status de falha:', updateError);
    }
  }
}

async function processReportJob(data: any): Promise<void> {
  logger.info(`Processando relatório: ${data.reportId}`);
  // Implementar processamento de relatórios quando necessário
}
