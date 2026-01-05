import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Importamos el módulo

@Module({
  imports: [PrismaModule], // <--- ¡AÑADE ESTA LÍNEA!
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}