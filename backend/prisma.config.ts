// backend/prisma.config.ts
import { defineConfig } from 'prisma/config';
import * as dotenv from 'dotenv';

// Importante: Cargamos el .env para que la terminal lo vea
dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});