import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';
import { ChallengeModule } from './challenge/challenge.module';

@Module({
  imports: [PrismaModule, WalletModule, ChallengeModule],
  controllers: [],
  providers: [],
})
export class AppModule {}