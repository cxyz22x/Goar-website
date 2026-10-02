---
name: Goar website and Android product scope
description: Keep Goar's website unified while distinguishing it from the native Android app.
---

The creator wants the Android product page, standalone browser workspace, media pages, and legal/contact pages treated as one Goar website for shared navigation and PWA behavior. The supplied browser workspace remains a browser demo, not the native Android app or a browser edition of it. Describe native payments, marketing, and workspace sharing as Android product capabilities.

**Why:** The creator clarified both the shared website scope and the native-app boundary. A unified site experience must not imply the browser demo includes Android-only integrations.

**How to apply:** Share the site navigation, manifest, and service-worker scope across product, Agent, media, and legal/contact pages. Keep platform claims explicit. Do not initialise the supplied browser workspace while viewing marketing pages, because its boot makes external provider and relay requests.