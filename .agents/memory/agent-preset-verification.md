---
name: Agent preset verification
description: Reproducing the supplied browser agent connection correctly in a fresh browser profile.
---

Apply the supplied SSH Default preset through the original Settings UI before testing the expected default connection in a fresh browser profile. Do not infer the effective runtime connection from HTML placeholders alone.

**Why:** Fresh-profile checks of both the unchanged source and its wrapper failed before the preset was applied. Applying the source's Default preset and saving established SSH in both. The initial failures did not establish that the supplied service was broken.

**How to apply:** Compare source and integration on the same HTTPS origin and settings. Use the source's own preset/save controls without reading or copying credential fields. Keep transport connection proof separate from command-output verification; a canvas-backed terminal does not expose its full output through DOM text.