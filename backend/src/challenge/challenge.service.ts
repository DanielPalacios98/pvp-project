import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CREAR RETO
  async createChallenge(creatorId: string, amount: number, gameId: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: creatorId } });
      
      if (!user || user.coins.toNumber() < amount) {
        throw new BadRequestException('Saldo insuficiente para crear el reto');
      }

      const challenge = await tx.challenge.create({
        data: { creatorId, stakeAmount: amount, gameId, status: 'OPEN' },
      });

      await tx.user.update({
        where: { id: creatorId },
        data: { coins: { decrement: amount } },
      });

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

  // 2. ACEPTAR RETO
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

      const updatedChallenge = await tx.challenge.update({
        where: { id: challengeId },
        data: { opponentId, status: 'ACCEPTED' },
      });

      await tx.user.update({
        where: { id: opponentId },
        data: { coins: { decrement: challenge.stakeAmount } },
      });

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

  // 3. RESOLVER RETO (La función que daba el error)
  async resolveChallenge(challengeId: string, winnerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const challenge = await tx.challenge.findUnique({
        where: { id: challengeId },
      });

      if (!challenge) throw new NotFoundException('El reto no existe');
      
      if (challenge.status !== 'ACCEPTED') {
        throw new BadRequestException('El reto no está aceptado o ya fue resuelto');
      }

      if (winnerId !== challenge.creatorId && winnerId !== challenge.opponentId) {
        throw new ForbiddenException('El ganador debe ser un participante del reto');
      }

      const totalPot = challenge.stakeAmount.toNumber() * 2;
      const commissionRate = 0.10; 
      const platformFee = totalPot * commissionRate;
      const winnerPrize = totalPot - platformFee;

      await tx.challeng