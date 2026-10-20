# Organization logos

Only **official** artwork goes here. Do not redraw, retype, or AI-generate logos.

| Mark | Status | Source |
|---|---|---|
| Illinois Tech wordmark | ✅ `illinois-tech-red.png`, `illinois-tech-black.png` | Rasterized from the official SVGs served by iit.edu (`assets/source/`) |
| ML@IIT | ⏳ needed | Ask the org for the original black-line / red-brain artwork |
| A Little Tech For You (ALT4U) | ⏳ needed | Company brand files |
| Illinois Tech Robotics | ⏳ needed | No logo file is published on illinoistechrobotics.org; ask the org |
| Illinois Tech Lunabotics | ⏳ needed | Team brand files |

## Adding a logo

1. Export a PNG with a transparent background at **3–4× its display height**
   (e.g. 88 px tall for a 22 px mark). Email clients do not render SVG.
2. Save it here, e.g. `assets/logos/ml-iit.png`.
3. In `signature.config.js`, set the logo's `src`, `width`, and `heightPx` (the
   file's pixel size, used to preserve its aspect ratio) and list the variants
   it should appear in.
4. `npm run build`, then push so GitHub Pages hosts it.

Before using the Illinois Tech wordmark, check that it fits the university's
brand guidelines for personal/student use. You can turn it off in the Studio
or remove `"A"`, `"B"`, `"C"` from its `variants`.
