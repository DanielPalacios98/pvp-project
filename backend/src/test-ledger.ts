import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando prueba de Ledger real...');

  const user = await prisma.user.upsert({
    where: { email: 'daniel@test.com' },
    update: {},
    create: {
      username: 'DanielAdmin',
      email: 'daniel@test.com',
      coins: 100,
    },
  });

  console.log(`✅ Usuario: ${user.username}`);

  const transaction = await prisma.walletLedger.create({
    data: {
      userId: user.id,
      type: 'DEPOSIT',
      amount: 100,
      description: 'Carga inicial exitosa',
      idempotencyKey: `test_${Date.now()}`,
    },
  });

  console.log(`💰 Ledger ID: ${transaction.id}`);
  console.log('--- TODO FUNCIONA PERFECTO ---');
}

main()
  .catch((e) => console.error('❌ Error:', e))
  .finally(() => prisma.$disconnect());