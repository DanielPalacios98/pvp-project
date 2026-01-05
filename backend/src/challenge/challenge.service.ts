import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChallengeService {
  constructor(private prisma: PrismaService) {}

  // 1. CREAR RETO (El sistema retiene las monedas del creador)
  async createChallenge(creatorId: string, amount: number, gameId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: creatorId } });
      
      if (!user || user.coins.toNumber() < amount) {
        throw new BadRequestException('Saldo insuficiente para crear el reto');
      }

      const challenge = await tx.challenge.create({
        data: { creatorId, stakeAmount: amount, gameId, status: 'OPEN' },
      });

      // Retirar monedas del creador (Escrow)
      await tx.user.update({
        where: { id: creatorId },
        data: { coins: { decrement: amount } },
      });

      // Auditoría
      await tx.walletLedger.create({
        data: {
          userId: creatorId,
          type: 'STAKE_HOLD',
          amount: amount,
          description: `Bloqueo saldo reto: ${challenge.id}`,
          idempotencyKey: `create_${challenge.id}`,
        },
      });

      return challenge;
    });
  }

  // 2. ACEPTAR RETO (El sistema retiene las monedas del oponente)
  async acceptChallenge(challengeId: string, opponentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const challenge = await tx.challenge.findUnique({ where: { id: challengeId } });
      
      if (!challenge || challenge.status !== 'OPEN') {
        throw new BadRequestException('El reto no está disponible');
      }

      if (challenge.creatorId === opponentId) {
        throw new BadRequestException('No puedes retarte a ti mismo');
      }

      const opponent = await tx.user.findUnique({ where: { id: opponentId } });
      if (!opponent || opponent.coins.toNumber() < challenge.stakeAmount.toNumber()) {
        throw new BadRequestException('No tienes saldo suficiente para aceptar');
      }

      // Actualizar reto
      const updatedChallenge = await tx.challenge.update({
        where: { id: challengeId },
        data: { opponentId, status: 'ACCEPTED' },
      });

      // Retirar monedas del oponente (Escrow)
      await tx.user.update({
        where: { id: opponentId },
        data: { coins: { decrement: challenge.stakeAmount } },
      });

      // Auditoría
      await tx.walletLedger.create({
        data: {
          userId: opponentId,
          type: 'STAKE_HOLD',
          amount: challenge.stakeAmount,
          description: `Bloqueo saldo aceptación reto: ${challenge.id}`,
          idempotencyKey: `accept_${challenge.id}`,
        },
      });

      return updatedChallenge;
    });
  }

  // 3. LISTAR RETOS ABIERTOS
  async getOpenChallenges() {
    return this.prisma.challenge.findMany({
      where: { status: 'OPEN' },
      include: { creator: { select: { username: true } } }
    });
  }
}