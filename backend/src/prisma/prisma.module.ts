import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Hacemos que sea Global para no tener que importarlo en cada módulo
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <--- ¡ESTO ES LO QUE FALTA!
})
export class PrismaModule {}