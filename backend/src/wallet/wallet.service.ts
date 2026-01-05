import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';



@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true, username: true }
    });
    return user;
  }

  // ... (manten lo que ya tenías)
  async findAllUsers() {
    return this.prisma.user.findMany();
  }
// ...

  async deposit(userId: string, amount: number, description: string) {
    // Transacción Atómica: O se hacen las dos cosas o ninguna
    return this.prisma.$transaction(async (tx) => {
      // 1. Aumentar saldo del usuario
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { coins: { increment: amount } },
      });

      // 2. Crear registro en el Ledger para auditoría
      await tx.walletLedger.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount,
          description,
          idempotencyKey: `dep_${userId}_${Date.now()}`,
        },
      });

      return updatedUser;
    });
  }
}