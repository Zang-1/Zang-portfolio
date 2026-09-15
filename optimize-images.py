"""
Build the web-sized WebP copies the site actually serves.

    python optimize-images.py

Run it again whenever you add a photo. Originals in assets/images/ are never
touched; the resized copies go to assets/opt/<size>/ with the same relative
path and a .webp extension, which is where script.js looks for them. Files
that are already up to date are skipped, so re-running it is cheap.

Sizes are chosen from how big each image is ever drawn on screen, doubled
for high-density displays:
    thumb  album grid cells     (~180px wide)  -> short side 400px
    cover  album cover cards    (~350px wide)  -> short side 760px
    full   lightbox viewer      (up to ~1100px) -> long side 1800px
"""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "assets" / "images"
OUT = ROOT / "assets" / "opt"

# (folder, limit, which side the limit applies to, webp quality)
SIZES = [
    ("thumb", 400, "short", 78),
    ("cover", 760, "short", 80),
    ("full", 1800, "long", 82),
]

EXTS = {".jpg", ".jpeg", ".png"}


def fit(im, limit, side):
    w, h = im.size
    edge = min(w, h) if side == "short" else max(w, h)
    if edge <= limit:
        return im.copy()
    scale = limit / edge
    return im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)


def save(im, dest, quality):
    dest.parent.mkdir(parents=True, exist_ok=True)
    # keep an alpha channel only when the image really uses one
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        if im.getextrema()[3][0] == 255:
            im = im.convert("RGB")
    elif im.mode != "RGB":
        im = im.convert("RGB")
    im.save(dest, "WEBP", quality=quality, method=6)


def build(src, dest, limit, side, quality):
    if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
        return False
    with Image.open(src) as im:
        # phone photos store their rotation in EXIF; WebP output would drop
        # that tag, so bake the rotation into the pixels first
        im = ImageOps.exif_transpose(im)
        save(fit(im, limit, side), dest, quality)
    return True


def main():
    made = skipped = 0
    before = after = 0

    for src in sorted(p for p in SRC.rglob("*") if p.suffix.lower() in EXTS):
        rel = src.relative_to(SRC).with_suffix(".webp")
        for folder, limit, side, quality in SIZES:
            dest = OUT / folder / rel
            if build(src, dest, limit, side, quality):
                made += 1
            else:
                skipped += 1

    # the avatar lives outside assets/images; it is drawn at ~300px
    avatar = ROOT / "assets" / "avatar.png"
    if avatar.exists():
        if build(avatar, OUT / "avatar.webp", 720, "long", 84):
            made += 1
        else:
            skipped += 1

    for p in SRC.rglob("*"):
        if p.suffix.lower() in EXTS:
            before += p.stat().st_size
    if avatar.exists():
        before += avatar.stat().st_size
    for p in OUT.rglob("*.webp"):
        after += p.stat().st_size

    print(f"built {made}, up to date {skipped}")
    print(f"originals {before / 1048576:.1f} MB -> web copies {after / 1048576:.1f} MB (all sizes)")


if __name__ == "__main__":
    main()
