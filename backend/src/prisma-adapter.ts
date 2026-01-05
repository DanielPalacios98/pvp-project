import { Pool } from 'pg';

// Adaptador mínimo para usar como `adapter` en PrismaClient
// NOTE: Es un shim simple para propósitos de desarrollo / pruebas. No cubre todas las APIs.
export function createPgPrismaAdapter(connectionString: string) {
  const pool = new Pool({ connectionString });

  return {
    adapterName: 'pg-adapter',
    provider: 'postgres', // debe coincidir con lo que Prisma espera (see activeProvider remap)
    driverAdapterFactory: {
      async connect() {
        // Retorna un "driverAdapter" con las funciones mínimas que Prisma usará
        return {
          async dispose() {
            try {
              await pool.end();
            } catch (e) {
              console.warn('adapter.dispose error', e);
            }
          },

          async getConnectionInfo() {
            return { provider: 'postgres', connectionInfo: { supportsRelationJoins: true } };
          },

          async startTransaction(_options: any = {}) {
            const client = await pool.connect();
            await client.query('BEGIN');

            return {
              async executeRaw({ sql, args }: { sql: string; args?: any[] }) {
                const res = await client.query(sql, args);
                return { rows: res.rows, lastInsertId: (res as any).insertId };
              },
              async queryRaw({ sql, args }: { sql: string; args?: any[] }) {
                const res = await client.query(sql, args);
                return { rows: res.rows, columnNames: res.fields?.map((f: any) => f.name) };
              },
              async commit() {
                await client.query('COMMIT');
                client.release();
              },
              async rollback() {
                await client.query('ROLLBACK');
                client.release();
              },
            };
          },

          // Ejecutar sin transacción
          async executeRaw({ sql, args }: { sql: string; args?: any[] }) {
            const res = await pool.query(sql, args);
            return { rows: res.rows, lastInsertId: (res as any).insertId };
          },

          async queryRaw({ sql, args }: { sql: string; args?: any[] }) {
            const res = await pool.query(sql, args);
            return { rows: res.rows, columnNames: res.fields?.map((f: any) => f.name) };
          },
        };
      },
    },
  };
}
