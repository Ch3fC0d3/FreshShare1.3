// FreshShare Backend (Fastify + Postgres)
// Single-file service exposing:
//  - POST   /parse-label            → parse GS1-128 case label text
//  - GET    /case-pack              → fetch case_pack by gtin_case
//  - POST   /case-pack              → upsert case_pack + trade_item
//  - GET    /resolve/case-weight    → resolve case size from sources
//  - POST   /autosplit              → compute auto-split suggestions
//  - GET    /health
//
// ENV: DATABASE_URL=postgres://user:pass@host:5432/db  PORT=8080
// Run:  npm i fastify pg zod                   (or pnpm/yarn)
//       npx ts-node server.ts (or ts-node-dev)

import 'dotenv/config';
import Fastify from 'fastify';
import { Pool } from 'pg';
import { z } from 'zod';

// ---------- Config ----------
const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/freshshare';
// Some providers require SSL; detect via env or URL parameters
const USE_SSL = (process.env.DATABASE_SSL || '').toLowerCase() === 'true'
  || /sslmode=require|ssl=true|sslmode=no-verify/i.test(DATABASE_URL);
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: USE_SSL ? { rejectUnauthorized: false } : undefined,
});

const app = Fastify({ logger: true });

// ---------- Health ----------
app.get('/health', async () => ({ ok: true }));

// ---------- Utilities ----------
function assertNever(x: never): never { throw new Error(`Unexpected: ${x}`); }

// GS1-128 minimal parser: (01)=GTIN-14, (37)=units per case, (310x)=net kg w/ x decimals
function parseGS1128(text: string) {
  function get(ai: string): string | null {
    const marker = `(${ai})`;
    const idx = text.indexOf(marker);
    if (idx === -1) return null;
    const start = idx + marker.length;
    let j = start, out = '';
    while (j < text.length) {
      const ch = text[j];
      if (ch < '0' || ch > '9') break;
      out += ch; j++;
    }
    return out || null;
  }
  const gtinCase = get('01');
  const unitsStr = get('37');
  let weightDigits: string | null = null;
  let dec: number | null = null;
  for (let d = 0; d <= 9; d++) {
    const v = get('310' + d);
    if (v) { weightDigits = v; dec = d; break; }
  }
  const unitsPerCase = unitsStr ? parseInt(unitsStr, 10) : null;
  const caseKg = (weightDigits != null && dec != null)
    ? (parseInt(weightDigits, 10) / Math.pow(10, dec))
    : null;
  return { gtinCase, unitsPerCase, caseKg };
}

// Auto-split core math
function computeSuggestions(caseSize: number, shareSize: number, currentShares: number) {
  const safe = (n: number) => Number.isFinite(n) && n > 0;
  let warn = '' as string | null;
  if (!safe(caseSize) || !safe(shareSize)) {
    return { warn: 'Enter a positive case size and share size to see suggestions.', K: 0, KDisplay: '—', neededToFill: '—', divisorOptions: [] as number[], suggestions: [] as any[] };
  }
  const Kraw = caseSize / shareSize;
  const isInt = Number.isInteger(Kraw);
  const K = isInt ? Kraw : Math.round(Kraw * 1000) / 1000;
  if (!isInt) {
    warn = `This share size doesn’t divide the case exactly.`;
  }
  const neededToFill = isInt ? ((K - (currentShares % K)) % K) : '—';
  const divisorOptions = isInt ? factors(K).filter((d) => d <= Math.min(10, K)) : [];
  const suggestions: Array<{ buy: number; completes: number }> = [];
  if (isInt) {
    const need = (K - (currentShares % K)) % K;
    if (need > 0) suggestions.push({ buy: need, completes: 1 });
    [1,2,3,4,5].forEach((m) => {
      if (m <= K && (K % m) === 0 && !suggestions.find(s => s.buy === m)) {
        const completes = Math.floor((currentShares + m) / K) - Math.floor(currentShares / K);
        suggestions.push({ buy: m, completes: Math.max(completes, 0) });
      }
    });
  }
  return { warn, K, KDisplay: isInt ? String(K) : `${K} (not even)`, neededToFill, divisorOptions, suggestions };
}

function factors(n: number) {
  const out = new Set<number>();
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) { out.add(i); out.add(n / i); }
  }
  return Array.from(out).sort((a, b) => a - b);
}

// ---------- Zod Schemas ----------
const ParseLabelBody = z.object({ text: z.string().min(3) });
const CasePackSource = z.enum(['GDSN','DISTRIBUTOR','ORG_PHOTO','HEURISTIC']);
const UpsertCasePackBody = z.object({
  gtin_each: z.string().optional(),
  gtin_case: z.string().min(8),
  category: z.string().optional(),
  units_per_case: z.number().int().positive().optional(),
  case_net_weight: z.number().positive().optional(),
  case_uom: z.string().default('lb').optional(),
  source: CasePackSource,
  confidence: z.number().min(0).max(1).default(0.9).optional(),
  evidence_url: z.string().url().optional(),
  unit_net: z.number().positive().optional(),
  unit_uom: z.string().optional()
});

const ResolveQuery = z.object({
  gtin_case: z.string().optional(),
  category: z.string().optional(),
  unit_net: z.coerce.number().optional(),
  unit_uom: z.string().optional()
});

const AutoSplitBody = z.object({
  case_size: z.number().positive(),
  share_size: z.number().positive(),
  current_pledged: z.number().int().nonnegative()
});

// ---------- Routes ----------
app.post('/parse-label', async (req, reply) => {
  const body = ParseLabelBody.parse((req as any).body);
  return parseGS1128(body.text);
});

app.get('/case-pack', async (req, reply) => {
  const gtin_case = (req.query as any)?.gtin_case as string | undefined;
  if (!gtin_case) return reply.code(400).send({ error: 'gtin_case required' });
  const { rows } = await pool.query(
    `SELECT cp.*, ti.gtin_each, ti.gtin_case, ti.category, ti.unit_net, ti.unit_uom
     FROM case_pack cp
     LEFT JOIN trade_item ti ON ti.gtin_case = $1 AND cp.trade_item_id = ti.id
     WHERE ti.gtin_case = $1
     ORDER BY cp.created_at DESC`,
    [gtin_case]
  );
  return { items: rows };
});

app.post('/case-pack', async (req, reply) => {
  const b = UpsertCasePackBody.parse((req as any).body);
  // upsert trade_item by gtin_case
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ti = await client.query(
      `INSERT INTO trade_item (gtin_each, gtin_case, category, unit_net, unit_uom)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (gtin_case)
       DO UPDATE SET gtin_each=COALESCE(EXCLUDED.gtin_each, trade_item.gtin_each),
                     category=COALESCE(EXCLUDED.category, trade_item.category),
                     unit_net=COALESCE(EXCLUDED.unit_net, trade_item.unit_net),
                     unit_uom=COALESCE(EXCLUDED.unit_uom, trade_item.unit_uom)
       RETURNING id`,
      [b.gtin_each || null, b.gtin_case, b.category || null, b.unit_net || null, b.unit_uom || null]
    );
    const trade_item_id = ti.rows[0].id;
    const cp = await client.query(
      `INSERT INTO case_pack (trade_item_id, units_per_case, case_net_weight, case_uom, source, confidence, evidence_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [trade_item_id, b.units_per_case || null, b.case_net_weight || null, b.case_uom || 'lb', b.source, b.confidence || 0.9, b.evidence_url || null]
    );
    await client.query('COMMIT');
    return { ok: true, case_pack: cp.rows[0] };
  } catch (e: any) {
    await client.query('ROLLBACK');
    (req as any).log?.error?.(e);
    return reply.code(500).send({ error: 'upsert failed' });
  } finally {
    client.release();
  }
});

app.get('/resolve/case-weight', async (req, reply) => {
  const q = ResolveQuery.parse((req as any).query);
  // 1) CasePack by gtin_case
  if (q.gtin_case) {
    const { rows } = await pool.query(
      `SELECT cp.case_net_weight, cp.case_uom, cp.source
       FROM case_pack cp
       JOIN trade_item ti ON ti.id = cp.trade_item_id
       WHERE ti.gtin_case = $1
       ORDER BY cp.confidence DESC, cp.created_at DESC
       LIMIT 1`, [q.gtin_case]
    );
    if (rows[0]?.case_net_weight && rows[0]?.case_uom) {
      return { caseWeight: Number(rows[0].case_net_weight), uom: rows[0].case_uom, source: rows[0].source };
    }
  }
  // 2) Commodity defaults
  if (q.category) {
    const { rows } = await pool.query(
      `SELECT default_case_weight, uom FROM commodity_pack
       WHERE commodity_code = $1
       ORDER BY created_at DESC
       LIMIT 1`, [q.category]
    );
    if (rows[0]?.default_case_weight) {
      return { caseWeight: Number(rows[0].default_case_weight), uom: rows[0].uom || 'lb', source: 'COMMODITYPACK' };
    }
  }
  // 3) Heuristic (unit_net * typical units per case)
  const typicalUPC = 12;
  const est = (q.unit_net || 1) * typicalUPC;
  return { caseWeight: Math.round(est * 100) / 100, uom: q.unit_uom || 'lb', source: 'HEURISTIC' };
});

app.post('/autosplit', async (req, reply) => {
  const b = AutoSplitBody.parse((req as any).body);
  return computeSuggestions(b.case_size, b.share_size, b.current_pledged);
});

// ---------- Start ----------
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => app.log.info(`FreshShare backend listening on :${PORT}`))
  .catch((err) => { app.log.error(err); process.exit(1); });

/* -------------------------
SQL Migration (apply once)
--------------------------

-- Trade items (each & case-level GTIN)
CREATE TABLE IF NOT EXISTS trade_item (
  id BIGSERIAL PRIMARY KEY,
  gtin_each TEXT UNIQUE,
  gtin_case TEXT UNIQUE,
  category TEXT,
  unit_net NUMERIC(12,4),
  unit_uom TEXT DEFAULT 'lb',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE pack_source AS ENUM ('GDSN','DISTRIBUTOR','ORG_PHOTO','HEURISTIC');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS case_pack (
  id BIGSERIAL PRIMARY KEY,
  trade_item_id BIGINT REFERENCES trade_item(id) ON DELETE CASCADE,
  units_per_case INTEGER CHECK (units_per_case > 0),
  case_net_weight NUMERIC(12,4),
  case_uom TEXT DEFAULT 'lb',
  source pack_source NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.90,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_pack_trade_item ON case_pack(trade_item_id);

CREATE TABLE IF NOT EXISTS commodity_pack (
  id BIGSERIAL PRIMARY KEY,
  commodity_code TEXT,
  default_case_weight NUMERIC(12,4),
  uom TEXT DEFAULT 'lb',
  region_code TEXT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_commodity_region ON commodity_pack(commodity_code, COALESCE(region_code,'__ANY__'));

*/

/* -------------------------
Curl smoke tests
--------------------------
# 1) Parse GS1-128
curl -s -X POST http://localhost:8080/parse-label \
  -H 'Content-Type: application/json' \
  -d '{"text":"(01)10812345678903(37)12(3102)018144"}' | jq

# 2) Upsert a case pack row
curl -s -X POST http://localhost:8080/case-pack \
  -H 'Content-Type: application/json' \
  -d '{
    "gtin_case":"10812345678903",
    "gtin_each":"081234567890",
    "category":"onions",
    "units_per_case":12,
    "case_net_weight":27.56,
    "case_uom":"lb",
    "source":"GDSN",
    "confidence":0.95
  }' | jq

# 3) Resolve case weight (prefers case_pack, falls back to commodity, else heuristic)
curl -s 'http://localhost:8080/resolve/case-weight?gtin_case=10812345678903' | jq
curl -s 'http://localhost:8080/resolve/case-weight?category=onions' | jq

# 4) Auto-split suggestions
curl -s -X POST http://localhost:8080/autosplit \
  -H 'Content-Type: application/json' \
  -d '{"case_size":40, "share_size":2, "current_pledged":13}' | jq
*/
