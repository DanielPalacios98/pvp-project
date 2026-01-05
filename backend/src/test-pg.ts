import { Client } from 'pg';

// Copia aquí tu URL (igual que en test-ledger.ts)
const DATABASE_DIRECT_URL = "postgresql://postgres.pysihcxpctlhjznhgrzy:Gallardo%123456789.1@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

function encodePasswordInUrl(url: string) {
  const protocolIndex = url.indexOf('://');
  if (protocolIndex === -1) return url;
  const afterProtocol = url.slice(protocolIndex + 3);
  const lastAt = afterProtocol.lastIndexOf('@');
  if (lastAt === -1) return url;
  const userPass = afterProtocol.slice(0, lastAt);
  const rest = afterProtocol.slice(lastAt + 1);
  const colonIndex = userPass.indexOf(':');
  if (colonIndex === -1) return url;
  const prefix = url.slice(0, protocolIndex + 3) + userPass.slice(0, colonIndex + 1);
  const password = userPass.slice(colonIndex + 1);
  return prefix + encodeURIComponent(password) + '@' + rest;
}

const connectionString = encodePasswordInUrl(DATABASE_DIRECT_URL);
console.log('🔧 Probing DB with URL:', connectionString);

async function test() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as connected');
    console.log('✅ PG response:', res.rows);
    await client.end();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ PG connection error:', err.message || err);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
}

test();
