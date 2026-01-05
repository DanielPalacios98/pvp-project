import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ChallengeService } from './challenge.service';

@Controller('challenges')
export class ChallengeController {
  constructor(private challengeService: ChallengeService) {}

  @Post() // Crear reto
  create(@Body() data: { creatorId: string; amount: number; gameId: string }) {
    return this.challengeService.createChallenge(data.creatorId, data.amount, data.gameId);
  }

  @Post(':id/accept') // Aceptar reto
  accept(@Param('id') challengeId: string, @Body() data: { opponentId: string }) {
    return this.challengeService.acceptChallenge(challengeId, data.opponentId);
  }

  @Get('open') // Ver mercado de retos
  getOpen() {
    return this.challengeService.getOpenChallenges();
  }
}