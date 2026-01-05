import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  // 1. Mueve esta función AQUÍ ADENTRO
  @Get('users')
  getAllUsers() {
    return this.walletService.findAllUsers();
  }

  @Get(':id/balance')
  getBalance(@Param('id') userId: string) {
    return this.walletService.getBalance(userId);
  }

  @Post('deposit')
  deposit(@Body() data: { userId: string; amount: number; description: string }) {
    return this.walletService.deposit(data.userId, data.amount, data.description);
  }
}