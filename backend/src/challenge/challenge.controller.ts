import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ChallengeService } from './challenge.service';

@Controller('challenges')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Post() // 1. Crear reto
  create(@Body() data: { creatorId: string; amount: number; gameId: string }) {
    return this.challengeService.createChallenge(data.creatorId, data.amount, data.gameId);
  }

  @Post(':id/accept') // 2. Aceptar reto
  accept(@Param('id') challengeId: string, @Body() data: { opponentId: string }) {
    return this.challengeService.acceptChallenge(challengeId, data.opponentId);
  }

  @Post(':id/resolve') // 3. Resolver reto y pagar premios
  async resolve(
    @Param('id') challengeId: string,
    @Body() data: { winnerId: string },
  ) {
    return this.challengeService.resolveChallenge(challengeId, data.winnerId);
  }

  @Get('open') // 4. Ver mercado de retos
  getOpen() {
    return this.challengeService.getOpenChallenges();
  }
}