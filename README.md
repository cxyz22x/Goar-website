# Goar

A Goar product website with connected online-agent, media, music and games services. Marketing remains the primary page at `/`. The supplied browser agent is not Goar or a browser edition of Goar.

## Games

Games launch through our own player shell at `artifacts/goar/public/pages/games/play.html`. The shell loads the real marketjs game from `cdn-factory.marketjs.com` / `cdn-consumer.marketjs.com` inside a same-origin frame and keeps a loading cover over the frame until the game document has actually loaded; the cover exposes retry and status if the publisher or network fails. The catalogue is `artifacts/goar/public/games.json`.

## Run & operate

- Managed workflow: `artifacts/goar: web`
- Frontend typecheck: `pnpm --filter @workspace/goar run typecheck`
- Production build check: `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/goar run build`

- Media extraction regression checks: `node --test scripts/media-regressions.test.mjs`
- Main-page reference and mobile Menu/theme comparison: `GOAR_ORIGIN=http://localhost:5000 node scripts/check-agent-boundary.mjs --preview` (with the preview server running)
- Product pages and launch page live in `artifacts/goar/src/site`.
- Connection cards and app-facing link instructions live in `artifacts/goar/src/connections`, at `/connections`.
- The authored agent wrapper is in `artifacts/goar/src/agent`, at `/agent`; the original supplied application is served unchanged at `/workspace/index.html`.
- The latest supplied media pages are standalone documents at `/pages/watch`, `/pages/music`, `/pages/games`, `/pages/live` and `/pages/anime`. Their shared menu and game catalogue are under `artifacts/goar/public/shared` and `artifacts/goar/public/games.json`.
- Keep the existing React marketing page at `/`; do not substitute the archive's media overview for it. The marketing page defaults to matte black and bone white, while an explicitly saved light-theme preference is retained.
- The earlier extracted media app and its module regression checks remain under `artifacts/goar/public/media`; they are separate from the latest standalone pages.
- Original legal text is extracted into `artifacts/goar/src/data/legal.json`.

## Scope

- The website describes the Android product's builds, communications, payment automation and team workspaces.
- The supplied browser build exposes chat, Files, Terminal, Browser, Computer, Creative, Toolkit and provider configuration.
- Do not represent Android-only capabilities as implemented in this browser build.
- No APK or verified store URL has been supplied. Do not invent download links.
- Original contact address needs confirmation before publishing.
- The latest main-page reference is `attached_assets/goar_preview_1790871320377.html`; it supersedes `goar_v5.html` for the homepage. Preserve its design, source interactions and content. Keep the media pages' supplied interfaces and behavior; adapt their local links to work under the artifact base path and return to Goar's `/` and `/agent`.
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