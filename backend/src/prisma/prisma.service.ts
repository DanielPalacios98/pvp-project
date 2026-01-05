import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private poolInstance: Pool; // Cambiamos el nombre para evitar conflictos

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('❌ DATABASE_URL no encontrada en el archivo .env');
    }

    // 1. Creamos el Pool en una variable local (aún no tocamos 'this')
    const pool = new Pool({ 
      connectionString,
      max: 10,
    });

    // 2. Creamos el adaptador
    const adapter = new PrismaPg(pool);

    // 3. LLAMADA OBLIGATORIA A SUPER (Debe ser lo primero con el adaptador)
    super({ adapter } as any);

    // 4. AHORA SÍ podemos usar 'this' para guardar la instancia para después
    this.poolInstance = pool;
  }

  public async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Conexión a Supabase establecida con éxito.');
    } catch (error) {
      this.logger.error('❌ Error de conexión:', error.message);
    }
  }

  public async onModuleDestroy() {
    try {
      await this.$disconnect();
      await this.poolInstance.end();
      this.logger.log('📡 Conexión a la base de datos cerrada.');
    } catch (error) {
      this.logger.error('❌ Error al cerrar conexión:', error.message);
    }
  }
}