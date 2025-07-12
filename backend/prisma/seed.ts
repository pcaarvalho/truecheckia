import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar planos se não existirem
  const plans = [
    {
      name: 'FREE',
      displayName: 'Gratuito',
      description: 'Perfeito para começar',
      price: 0,
      currency: 'BRL',
      maxAnalyses: 10,
      maxFileSize: 1048576, // 1MB
      maxVideoLength: 0,
      maxReports: 5,
      features: JSON.stringify({
        textAnalysis: true,
        imageAnalysis: false,
        videoAnalysis: false,
        apiAccess: false,
        prioritySupport: false,
        customReports: false,
        teamCollaboration: false,
        advancedFilters: false,
        exportData: false,
        whiteLabel: false
      })
    },
    {
      name: 'PRO',
      displayName: 'Profissional',
      description: 'Para usuários avançados',
      price: 29.99,
      currency: 'BRL',
      maxAnalyses: 100,
      maxFileSize: 10485760, // 10MB
      maxVideoLength: 300, // 5 minutos
      maxReports: 50,
      features: JSON.stringify({
        textAnalysis: true,
        imageAnalysis: true,
        videoAnalysis: true,
        apiAccess: true,
        prioritySupport: true,
        customReports: true,
        teamCollaboration: false,
        advancedFilters: true,
        exportData: true,
        whiteLabel: false
      })
    },
    {
      name: 'PREMIUM',
      displayName: 'Premium',
      description: 'Para empresas e equipes',
      price: 99.99,
      currency: 'BRL',
      maxAnalyses: 99999,
      maxFileSize: 104857600, // 100MB
      maxVideoLength: 1800, // 30 minutos
      maxReports: 99999,
      features: JSON.stringify({
        textAnalysis: true,
        imageAnalysis: true,
        videoAnalysis: true,
        apiAccess: true,
        prioritySupport: true,
        customReports: true,
        teamCollaboration: true,
        advancedFilters: true,
        exportData: true,
        whiteLabel: true,
        dedicatedSupport: true,
        sla: true,
        customIntegration: true
      })
    }
  ]

  for (const planData of plans) {
    const existingPlan = await prisma.plan.findUnique({
      where: { name: planData.name }
    })

    if (!existingPlan) {
      await prisma.plan.create({
        data: planData
      })
      console.log(`✅ Plano ${planData.name} criado`)
    } else {
      console.log(`ℹ️ Plano ${planData.name} já existe`)
    }
  }

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })