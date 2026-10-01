# Goar

A Goar product website with connected online-agent, media, music and games services. Marketing remains the primary page at `/`. The supplied browser agent is not Goar or a browser edition of Goar.

## Run & operate

- Managed workflow: `artifacts/goar: web`
- Frontend typecheck: `pnpm --filter @workspace/goar run typecheck`
- Production build check: `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/goar run build`
- Agent status regression checks: `node --experimental-strip-types --test artifacts/goar/src/agent/runtime-dom.test.ts`
- Media extraction regression checks: `node --test scripts/media-regressions.test.mjs`
- Main-page reference and mobile Menu/theme comparison: `node scripts/check-agent-boundary.mjs --preview`
- Product pages and launch page live in `artifacts/goar/src/site`.
- Connection cards and app-facing link instructions live in `artifacts/goar/src/connections`, at `/connections`.
- The authored agent wrapper is in `artifacts/goar/src/agent`, at `/agent`; the original supplied application is served unchanged at `/workspace/index.html`.
- The modular media service is served at `/media/index.html`, with `?view=watch`, `?view=music` and `?view=games` entry links.
- Media HTML templates, view controllers, interactions, adapters, catalogue data and styles are separate files under `artifacts/goar/public/media`. They are composed by its ES-module entry, not imported into the marketing app.
- `scripts/media-modularize.mjs` reproduces the extracted modules from the preserved media upload. Keep fixes in the generator as well as generated files so regeneration cannot revert them.
- Original legal text is extracted into `artifacts/goar/src/data/legal.json`.

## Scope

- The website describes the Android product's builds, communications, payment automation and team workspaces.
- The supplied browser build exposes chat, Files, Terminal, Browser, Computer, Creative, Toolkit and provider configuration.
- Do not represent Android-only capabilities as implemented in this browser build.
- No APK or verified store URL has been supplied. Do not invent download links.
- Original contact address needs confirmation before publishing.
- The latest main-page reference is `attached_assets/goar_preview_1790871320377.html`; it supersedes `goar_v5.html` for the homepage. Preserve its design, source interactions and content. Keep the media upload’s original Inter/Space Grotesk interface as well. Modularisation is not permission to redesign either.
- App-facing links are ordinary website URLs, not invented native deep links or MCP endpoints.

## Runtime boundary

Preserve the uploaded agent HTML unchanged and isolated in its same-origin frame. The embedded Go/WASM source is unavailable. `/launch` is an information page; only `/agent` or the standalone agent URL starts the runtime. Visiting marketing and connection pages must not initialise it.

The supplied application uses external fonts, a configured/default AI provider and a third-party Wisp relay. Its browser persistence is not guaranteed by this integration. The wrapper observes only boot/connection status elements and opens the original Settings and Terminal controls; it must not read or copy credential fields, chats or terminal contents.

Do not claim the default SSH endpoint works unless an actual authorised SSH connection succeeds. A local browser shell is not remote SSH or free dedicated compute. Free service access does not promise unlimited provider allowances.

For the supplied SSH setup, finish provider setup and choose **Default SSH** in the wrapper, or **Default** and **Save** in the original Settings. The wrapper activates the source controls without reading credentials and reports the source connection status.

Media templates and legacy inline-handler compatibility bridges stay confined to the media document. Media storage is namespaced and no root-scope service worker is registered. The existing third-party sources are retained; do not add new sources or make licensing/availability claims. Missing external dependencies must surface errors or retries rather than fabricated catalogue/playback results.

No new backend, authentication, SSH gateway or provider proxy was added.

## Content

Use concrete tasks and qualified outcomes. No emojis, repeated feature grids, fabricated live metrics or absolute claims about uptime, backups or enterprise security.

`scripts/prepare-goar-assets.py` extracts original legal pages from an archive unpacked at `/tmp/goar-source` and prepares the brand assets. The original uploads remain in `.local/conversation-workspace/files/attached_assets`.