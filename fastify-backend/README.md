# FreshShare Backend (Fastify + Postgres)

Single-file Fastify service exposing:

- POST /parse-label — parse GS1-128 case label text
- GET /case-pack — fetch case_pack by gtin_case
- POST /case-pack — upsert case_pack + trade_item
- GET /resolve/case-weight — resolve case size from sources (CASEPACK → COMMODITYPACK → HEURISTIC)
- POST /autosplit — compute auto-split suggestions
- GET /health

## Requirements
- Node 20+
- Docker (optional for Postgres via docker-compose)

## Setup
```bash
cd fastify-backend
cp .env.example .env
npm i
```

## Start Postgres (optional)
```bash
docker-compose up -d
```

## Run the service (dev)
```bash
npm run dev
# or
npm start
```

## Smoke tests
```bash
curl -s http://localhost:8080/health
```

Additional cURL examples are embedded at the bottom of `server.ts`.

## Notes
- Keep ESM modules ("type": "module").
- Zod validates inputs; add more as needed.
- SQL DDL is included at the bottom of `server.ts` for initial migration.
