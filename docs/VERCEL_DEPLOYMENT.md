# Vercel Deployment — Nexus

## Repository
`tmwe-dev/nexus`

## Framework
Other / Node.js serverless functions + static `public` console.

## Required environment variables

### Base runtime
- `NEXUS_ENV=production`
- `WCA_BASE_URL=<WCA App production base URL>`
- `WCA_SERVICE_TOKEN=<optional until WCA App enforces service auth>`
- `WCA_DETAIL_MAX_PAGES=20`

### Shadow comparison only
- `NAVIGATOR_SUPABASE_URL=<Navigator Supabase URL>`
- `NAVIGATOR_SUPABASE_KEY=<server-side read credential>`

Never commit real values.

## Smoke endpoints after deploy

1. `GET /api/health`
2. `GET /api/connections`
3. `GET /api/wca/health`
4. `GET /api/wca/partners?limit=5`
5. `GET /api/wca/partner-detail?wca_id=<known id>`
6. `GET /api/wca/contacts?wca_id=<known id>`
7. `GET /api/wca/business-cards`
8. `GET /api/wca/shadow-compare?limit=20`

## Production gate

Do not route Navigator through Nexus until:
- WCA health is green;
- partner list works;
- partner detail works for known IDs;
- contacts work for known IDs;
- shadow comparison reports understood differences;
- no WCA/Navigator secrets exist in Git history.

## Vercel project settings

- Production Branch: `main`
- Root Directory: repository root
- Install Command: none required
- Build Command: none required
- Output Directory: leave default

`vercel.json` provides root rewrite and Node runtime configuration.
