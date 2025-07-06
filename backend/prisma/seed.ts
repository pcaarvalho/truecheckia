import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Criar planos
  const plans = [
    {
      name: 'FREE',
      displayName: 'Gratuito',
      description: 'Perfeito para começar a explorar nossa plataforma',
      price: 0,
      maxAnalyses: 5,
      maxFileSize: 10,
      maxVideoLength: 5,
      maxReports: 2,
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
      }),
      sortOrder: 1
    },
    {
      name: 'STARTER',
      displayName: 'Iniciante',
      description: 'Ideal para profissionais individuais',
      price: 49.90,
      maxAnalyses: 100,
      maxFileSize: 50,
      maxVideoLength: 15,
      maxReports: 20,
      features: JSON.stringify({
        textAnalysis: true,
        imageAnalysis: true,
        videoAnalysis: false,
        apiAccess: false,
        prioritySupport: false,
        customReports: true,
        teamCollaboration: false,
        advancedFilters: true,
        exportData: true,
        whiteLabel: false
      }),
      sortOrder: 2
    },
    {
      name: 'PRO',
      displayName: 'Profissional',
      description: 'Para equipes e uso intensivo',
      price: 149.90,
      maxAnalyses: 500,
      maxFileSize: 200,
      maxVideoLength: 30,
      maxReports: 100,
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
        whiteLabel: false
      }),
      sortOrder: 3
    },
    {
      name: 'ENTERPRISE',
      displayName: 'Empresarial',
      description: 'Solução completa para grandes organizações',
      price: 499.90,
      maxAnalyses: 99999,
      maxFileSize: 1000,
      maxVideoLength: 120,
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
      }),
      sortOrder: 4
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    });
    console.log(`✅ Plan ${plan.displayName} created/updated`);
  }

  // Criar usuário admin de exemplo
  const adminEmail = 'admin@truecheckia.com';
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: '$2b$10$K7L1OzF9.zEkJXO5JqxGOOqHmRJXH5EKdRqWmVfLTXYwFwBtLMiDm', // senha: admin123
      name: 'Admin TrueCheckIA',
      role: 'ADMIN',
      isActive: true
    }
  });

  // Dar plano Enterprise ao admin
  const enterprisePlan = await prisma.plan.findUnique({
    where: { name: 'ENTERPRISE' }
  });

  if (enterprisePlan && adminUser) {
    await prisma.userPlan.upsert({
      where: { userId: adminUser.id },
      update: {
        planId: enterprisePlan.id,
        planType: enterprisePlan.name,
        status: 'ACTIVE',
        analysesUsed: 0,
        reportsUsed: 0
      },
      create: {
        userId: adminUser.id,
        planId: enterprisePlan.id,
        planType: enterprisePlan.name,
        status: 'ACTIVE',
        analysesUsed: 0,
        reportsUsed: 0
      }
    });
    console.log(`✅ Admin user created with Enterprise plan`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });