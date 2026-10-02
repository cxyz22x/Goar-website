---
name: Goar PWA cache boundary
description: Share one PWA identity across the Goar website without caching large or live content.
---

Use one Goar manifest and service-worker scope for the product landing page, Agent workspace, media pages, and legal/contact routes. Precache the static site shell and page assets, but exclude the 7 MB Agent HTML document and do not add runtime caching for live media or API requests.

**Why:** The Agent depends on external providers and relay traffic, so precaching its large document adds download/storage cost without making its live features usable offline. The creator wants the website unified, not its dynamic traffic cached.

**How to apply:** Keep standalone pages under the shared manifest and worker scope. Use the Vite PWA plugin's generated Workbox worker; exclude `workspace/**` from precache and avoid cache-first/network-first rules for APIs, streams, or external providers.