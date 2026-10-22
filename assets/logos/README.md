# Organization logos

Only **official** artwork goes here. Do not redraw, retype, or AI-generate logos.

Originals live in `assets/source/logos/`. `npm run assets` fits each one, unaltered, into a
rounded 72×72 tile in `assets/logos/tiles/`, displayed at 34px in the signature (16px in the
leadership row). Two wordmark-heavy logos are cropped to their symbol, because their text is
unreadable at 34px.

| Organization | Tile | Source |
|---|---|---|
| Competiscan | `competiscan.png` | Site icon, competiscan.com |
| Grupo Eloria | `grupo-eloria.png` | Provided by Danish |
| Griffin Museum of Science and Industry | `griffin-msi.png` | GMSI logo SVG, msichicago.org |
| Technology Transition Paradigm | `technology-transition-paradigm.png` | Provided by Danish (emblem only) |
| Illinois Tech Leadership Academy | `leadership-academy.png` | Provided by Danish (the "i" mark only) |
| Illinois Tech Lunabotics | `lunabotics.png` | Provided by Danish |
| ML@IIT | `ml-iit.png` | Provided by Danish |
| Illinois Tech Robotics | `illinois-tech-robotics.png` | Logo on the organization's GitHub (github.com/illinoistechrobotics) |
| Illinois Tech IGDA | `illinois-tech-igda.png` | Provided by Danish |
| Podium Pros | `podium-pros.png` | Logo on 312.iit.edu/podium |
| Illinois Tech wordmark | `../illinois-tech-white.png` (+ red/black) | Official SVGs from iit.edu |

## Adding or replacing a logo

1. Save the official file (PNG/JPG, or SVG) in `assets/source/logos/`.
2. Add a line to `LOGO_TILES` in `scripts/build_assets.py` with the file, the tile name, the
   background (white, or the logo's own color for full-bleed square artwork), the padding
   (0 for full-bleed), and an optional crop box.
3. Set `logo: "assets/logos/tiles/<name>.png"` on the role in `signature.config.js`.
4. `npm run assets && npm run build`, then **commit and push**. The signature loads tiles from
   GitHub Pages, so a logo shows as broken in Outlook until it's pushed.
