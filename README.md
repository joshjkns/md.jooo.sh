# md.jooo.sh

A minimal pastebin for text, code, and pressure-aware pencil sketches.

## Architecture

`md.jooo.sh` is a statically exported Next.js frontend on GitHub Pages. It calls
the Worker at `api.md.jooo.sh`, which validates and stores pastes in Cloudflare
D1. Delete tokens are returned once and kept in the creator's browser.

## Local development

```sh
npm install
cp .dev.vars.example .dev.vars
npm run worker:dev
NEXT_PUBLIC_API_URL=http://localhost:8787 npm run dev
```

## Cloudflare setup

The project is managed with Cloudflare's `cf` CLI:

```sh
cf auth whoami
cf context set zone jooo.sh --project
cf d1 create --body '{"name":"md-jooo-sh"}'
cf d1 query DATABASE_ID --body '{"sql":"PASTE THE CONTENTS OF worker/migrations/0001_initial.sql"}'
npm run worker:build
cf deploy --prebuilt --dry-run
cf deploy --prebuilt
```

Set the returned database ID in `wrangler.jsonc` and configure
`PASTE_IP_HASH_SALT` as a Worker secret. The custom-domain route in the config
attaches the Worker to `api.md.jooo.sh`.

`cloudflare.config.ts` is the source used by the current `cf` CLI. The
`wrangler.jsonc` file is kept as a portable equivalent for editor tooling and
resource metadata.

## Limits

- 100 KB of text per paste
- 40,000 drawing points and 2,000 strokes
- 20 paste creations per IP hash per hour
- Expiry options from one hour to permanent
