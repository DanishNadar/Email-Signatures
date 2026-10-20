"""Generate the raster brand assets used by the email signatures.

Email clients (Gmail, Outlook) do not render SVG, so every mark is exported
as a PNG at 2-4x its display size for sharp Retina rendering.

    python scripts/build_assets.py

Requires Pillow. The Illinois Tech wordmark is rasterized from the official
SVG (assets/source/) with headless Chrome or Edge.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "source"
BRAND = ROOT / "assets" / "brand"
LOGOS = ROOT / "assets" / "logos"

NAVY = (11, 45, 92, 255)          # #0B2D5C
BLUE = (31, 95, 173, 255)         # #1F5FAD
SKY = (96, 158, 235, 255)         # #609EEB — blue that reads on navy
RED = (200, 16, 46, 255)          # #C8102E — Illinois Tech scarlet
WHITE = (248, 250, 252, 255)      # #F8FAFC

SS = 4  # supersampling factor for anti-aliased shapes


def _crop_portrait(size: int) -> Image.Image:
    """Head-and-shoulders square crop of the provided portrait."""
    src = Image.open(ROOT / "images" / "DN_Headshot.png").convert("RGB")
    w, h = src.size
    side = int(w * 0.70)
    cx, top = int(w * 0.50), 0
    box = (cx - side // 2, top, cx + side // 2, top + side)
    return src.crop(box).resize((size, size), Image.LANCZOS)


def _circle_mask(size: int, inset: float = 0) -> Image.Image:
    s = size * SS
    mask = Image.new("L", (s, s), 0)
    i = int(inset * SS)
    ImageDraw.Draw(mask).ellipse((i, i, s - 1 - i, s - 1 - i), fill=255)
    return mask.resize((size, size), Image.LANCZOS)


def _gradient_ring(size: int, width: float) -> Image.Image:
    """Ring sweeping scarlet (top-left) to navy and blue (bottom-right)."""
    import numpy as np

    s = size * SS
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    # Diagonal gradient position 0..1 from top-left to bottom-right.
    t = np.clip((xx + yy) / (2 * (s - 1)), 0, 1)[..., None]
    stops = [(0.0, RED), (0.45, (150, 22, 60, 255)), (0.62, NAVY), (1.0, BLUE)]
    rgba = np.zeros((s, s, 4), np.float32)
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        seg = ((t >= t0) & (t <= t1)).astype(np.float32)
        k = np.clip((t - t0) / (t1 - t0), 0, 1)
        rgba += seg * (np.array(c0, np.float32) * (1 - k) + np.array(c1, np.float32) * k)
    rgba = np.clip(rgba, 0, 255)
    ring = Image.fromarray(rgba.astype(np.uint8), "RGBA").resize((size, size), Image.LANCZOS)
    alpha = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(alpha)
    d.ellipse((0, 0, s - 1, s - 1), fill=255)
    wi = int(width * SS)
    d.ellipse((wi, wi, s - 1 - wi, s - 1 - wi), fill=0)
    ring.putalpha(alpha.resize((size, size), Image.LANCZOS))
    return ring


def headshot(size: int = 240) -> None:
    """Circular portraits with transparent corners.

    Circles are baked into the PNGs because Outlook desktop ignores
    border-radius; a square photo would otherwise appear there.
    """
    plain = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    plain.paste(_crop_portrait(size), (0, 0), _circle_mask(size))
    plain.save(BRAND / "headshot-circle.png", optimize=True)

    # Brand version: red-to-blue ring, transparent gap, photo inside.
    ring_w, gap = size * 0.035, size * 0.025
    inner = int(round(size - 2 * (ring_w + gap)))
    off = (size - inner) // 2
    ringed = _gradient_ring(size, ring_w)
    ringed.paste(_crop_portrait(inner), (off, off), _circle_mask(inner))
    ringed.save(BRAND / "headshot-ring.png", optimize=True)


def _font(size: int) -> ImageFont.FreeTypeFont:
    for name, variation in (("bahnschrift.ttf", b"Bold"), ("arialbd.ttf", None)):
        path = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts" / name
        if path.exists():
            font = ImageFont.truetype(str(path), size)
            if variation:
                try:
                    font.set_variation_by_name(variation)
                except (OSError, ValueError):
                    pass
            return font
    return ImageFont.load_default(size)


def monogram(size: int = 192) -> None:
    """Proposed DN personal mark: navy tile, precise letterforms, and a
    scarlet-to-blue trace ending in a node (a nod to circuits/graphs)."""
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.2), fill=NAVY)

    font = _font(int(s * 0.42))
    text = "DN"
    l, t, r, b = d.textbbox((0, 0), text, font=font)
    tx = (s - (r - l)) / 2 - l
    ty = s * 0.44 - (b - t) / 2 - t
    d.text((tx, ty), text, font=font, fill=WHITE)

    # Trace: aligned to the letter block, crimson origin tick, cyan run, node.
    y = int(s * 0.74)
    lw = max(2, int(s * 0.022))
    x0 = int(tx + l)
    x1 = int(tx + r)
    d.rectangle((x0, y - lw // 2, x0 + int(s * 0.05), y + lw // 2), fill=RED)
    d.rectangle((x0 + int(s * 0.075), y - lw // 2, x1 - int(s * 0.04), y + lw // 2), fill=SKY)
    rad = int(s * 0.03)
    d.ellipse((x1 - 2 * rad, y - rad, x1, y + rad), fill=SKY)

    img.resize((size, size), Image.LANCZOS).save(BRAND / "dn-monogram.png", optimize=True)


def _browser() -> str | None:
    candidates = [
        os.environ.get("CHROME_PATH", ""),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for c in candidates:
        if c and Path(c).exists():
            return c
    return shutil.which("google-chrome") or shutil.which("chromium")


def wordmark(svg_name: str, out_name: str, height: int = 64) -> None:
    """Rasterize an official SVG wordmark to a transparent PNG, preserving
    its aspect ratio exactly (no redrawing)."""
    browser = _browser()
    if not browser:
        print(f"  ! no Chrome/Edge found, skipped {out_name}")
        return
    svg = SRC / svg_name
    vb = svg.read_text(encoding="utf-8").split('viewBox="', 1)[1].split('"', 1)[0].split()
    ratio = float(vb[2]) / float(vb[3])
    width = round(height * ratio)
    with tempfile.TemporaryDirectory() as tmp:
        page = Path(tmp) / "page.html"
        page.write_text(
            f'<html><body style="margin:0;background:transparent">'
            f'<img src="{svg.as_uri()}" style="display:block;width:{width}px;height:{height}px">'
            f"</body></html>",
            encoding="utf-8",
        )
        shot = Path(tmp) / "shot.png"
        subprocess.run(
            [browser, "--headless=new", "--disable-gpu", "--hide-scrollbars",
             "--default-background-color=00000000", "--allow-file-access-from-files",
             f"--window-size={width},{height}", f"--screenshot={shot}", page.as_uri()],
            check=True, capture_output=True, timeout=60,
        )
        Image.open(shot).convert("RGBA").crop((0, 0, width, height)).save(LOGOS / out_name, optimize=True)


NEON_RED = (255, 46, 77)     # #FF2E4D
NEON_BLUE = (46, 139, 255)   # #2E8BFF
VIOLET = (139, 61, 255)      # #8B3DFF
DIM = (40, 58, 110)          # #283A6E


def _glow(layer: Image.Image, radius: float) -> Image.Image:
    """Soft neon bloom under a sharp layer."""
    from PIL import ImageFilter

    bloom = layer.filter(ImageFilter.GaussianBlur(radius))
    out = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    out.alpha_composite(bloom)
    out.alpha_composite(bloom)
    out.alpha_composite(layer)
    return out


def hud_headshot(size: int = 240) -> None:
    """Perception-HUD portrait for the flagship: neon ring arcs, tick marks,
    and detection-box corners around the photo. Transparent background so it
    sits on the dark card (or any background)."""
    s = size * SS
    c = s / 2
    fx = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(fx)

    def circle_box(r):
        return (c - r, c - r, c + r, c + r)

    # Dim full ring + tick marks.
    d.ellipse(circle_box(s * 0.385), outline=DIM + (255,), width=int(SS * 1.2))
    import math
    for i in range(48):
        a = math.radians(i * 7.5)
        major = i % 6 == 0
        r0, r1 = s * (0.415 if major else 0.425), s * 0.442
        col = (NEON_BLUE + (230,)) if major else (DIM + (255,))
        d.line((c + r0 * math.cos(a), c + r0 * math.sin(a), c + r1 * math.cos(a), c + r1 * math.sin(a)),
               fill=col, width=int(SS * (1.6 if major else 1)))

    # Neon arcs: scarlet sweeping the top-left, blue the bottom-right.
    w = int(SS * 3.2)
    d.arc(circle_box(s * 0.40), 150, 285, fill=NEON_RED + (255,), width=w)
    d.arc(circle_box(s * 0.40), 330, 105, fill=NEON_BLUE + (255,), width=w)
    d.arc(circle_box(s * 0.40), 292, 322, fill=VIOLET + (255,), width=w)

    # Detection-box corners.
    m, L, bw = s * 0.03, s * 0.12, int(SS * 2.6)
    corners = [
        ((m, m), (1, 1), NEON_RED), ((s - m, m), (-1, 1), NEON_BLUE),
        ((m, s - m), (1, -1), NEON_BLUE), ((s - m, s - m), (-1, -1), NEON_RED),
    ]
    for (x, y), (dx, dy), col in corners:
        d.line((x, y, x + dx * L, y), fill=col + (255,), width=bw)
        d.line((x, y, x, y + dy * L), fill=col + (255,), width=bw)
        d.ellipse((x + dx * L - bw, y - bw, x + dx * L + bw, y + bw), fill=col + (255,))

    fx = _glow(fx, SS * 3).resize((size, size), Image.LANCZOS)

    photo_d = int(size * 0.70)
    off = (size - photo_d) // 2
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.alpha_composite(fx)
    out.paste(_crop_portrait(photo_d), (off, off), _circle_mask(photo_d))
    out.save(BRAND / "headshot-hud.png", optimize=True)


def gradient_strip(width: int = 1120, height: int = 6) -> None:
    """Scarlet → violet → electric-blue bar with rounded ends (displayed at half size)."""
    import numpy as np

    x = np.linspace(0, 1, width)[None, :, None]
    stops = [(0.0, NEON_RED), (0.5, VIOLET), (1.0, NEON_BLUE)]
    rgb = np.zeros((1, width, 3))
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        k = np.clip((x - t0) / (t1 - t0), 0, 1)
        seg = ((x >= t0) & (x <= t1))
        rgb = np.where(seg, np.array(c0) * (1 - k) + np.array(c1) * k, rgb)
    img = Image.fromarray(np.repeat(rgb, height, axis=0).astype(np.uint8), "RGB").convert("RGBA")
    mask = Image.new("L", (width * SS, height * SS), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width * SS - 1, height * SS - 1), radius=height * SS // 2, fill=255)
    img.putalpha(mask.resize((width, height), Image.LANCZOS))
    img.save(BRAND / "gradient-strip.png", optimize=True)


def main() -> None:
    BRAND.mkdir(parents=True, exist_ok=True)
    LOGOS.mkdir(parents=True, exist_ok=True)
    headshot()
    hud_headshot()
    gradient_strip()
    monogram()
    wordmark("illinois-tech-red.svg", "illinois-tech-red.png")
    wordmark("illinois-tech-black.svg", "illinois-tech-black.png")
    wordmark("illinois-tech-white.svg", "illinois-tech-white.png", height=40)
    for p in sorted(list(BRAND.glob("*.png")) + list(LOGOS.glob("*.png"))):
        print(f"  {p.relative_to(ROOT)}  {Image.open(p).size}  {p.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
