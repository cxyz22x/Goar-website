# Goar

A Goar product website linked to the user-supplied standalone browser demo. The demo is not Goar or a browser edition of Goar.

## Run & operate

- Managed workflow: `artifacts/goar: web`
- Frontend typecheck: `pnpm --filter @workspace/goar run typecheck`
- Product pages and launch page live in `artifacts/goar/src/site`.
- The supplied application is served at `/workspace/index.html`.
- Original legal text is extracted into `artifacts/goar/src/data/legal.json`.

## Scope

- The website describes the Android product's builds, communications, payment automation and team workspaces.
- The supplied browser build exposes chat, Files, Terminal, Browser, Computer, Creative, Toolkit and provider configuration.
- Do not represent Android-only capabilities as implemented in this browser build.
- No APK or verified store URL has been supplied. Do not invent download links.
- Original contact address needs confirmation before publishing.

## Runtime boundary

Preserve the uploaded standalone HTML as a separate application rather than importing its global scripts into React. Opening the launch link starts its embedded Go/WASM runtime; visiting marketing pages must not start it.

The supplied application uses external fonts, a configured/default AI provider and a third-party Wisp relay. Its browser persistence is not guaranteed by this integration. No backend, authentication or provider proxy was added.

## Content

Use concrete tasks and qualified outcomes. No emojis, repeated feature grids, fabricated live metrics or absolute claims about uptime, backups or enterprise security.

`scripts/prepare-goar-assets.py` extracts original legal pages from an archive unpacked at `/tmp/goar-source` and prepares the brand assets. The original uploads remain in `.local/conversation-workspace/files/attached_assets`.