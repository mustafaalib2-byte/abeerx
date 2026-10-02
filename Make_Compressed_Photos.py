"""
Make_Compressed_Photos.py
Creates a compressed copy of every photo in Desktop\\Perfume_Images:
  - fits inside 800 x 800 pixels (never enlarged, never distorted)
  - saved as WebP (keeps the transparent background)
Your ORIGINAL photos are never changed. Compressed copies go to Desktop\\Perfume_Images_800.
Already-converted photos are skipped, so it is safe to run again.

Quality: edit QUALITY below (85 = very good; 90 = better but bigger files).
"""
import os, sys, traceback
from PIL import Image

DESKTOP = os.path.join(os.path.expanduser("~"), "Desktop")
SRC = os.path.join(DESKTOP, "Perfume_Images")
DST = os.path.join(DESKTOP, "Perfume_Images_800")
MAX_SIZE = 800
QUALITY = 85
FLATTEN_WHITE = False  # True = white background instead of transparent (use if Google shows black backgrounds)


def main():
    os.makedirs(DST, exist_ok=True)
    files = [f for f in os.listdir(SRC)
             if os.path.isfile(os.path.join(SRC, f)) and f.lower().endswith((".png", ".jpg", ".jpeg"))]
    done = skipped = failed = 0
    before = after = 0
    for n, f in enumerate(files, 1):
        src = os.path.join(SRC, f)
        out = os.path.join(DST, os.path.splitext(f)[0].lower() + ".webp")
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
            skipped += 1
            continue
        try:
            img = Image.open(src)
            img.load()
            img = img.convert("RGBA")
            img.thumbnail((MAX_SIZE, MAX_SIZE), Image.LANCZOS)
            if FLATTEN_WHITE:
                bg = Image.new("RGB", img.size, (255, 255, 255))
                bg.paste(img, mask=img.split()[-1])
                img = bg
            img.save(out, "WEBP", quality=QUALITY, method=4)
            before += os.path.getsize(src)
            after += os.path.getsize(out)
            done += 1
        except Exception as e:
            failed += 1
            print(f"FAILED {f}: {e}")
        if n % 250 == 0:
            print(f"  ...{n}/{len(files)}")
    print(f"Compressed {done}, already done {skipped}, failed {failed}.")
    if done:
        print(f"Size of the newly compressed photos: {before/1e6:.0f} MB -> {after/1e6:.0f} MB")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        raise
    except Exception:
        traceback.print_exc()
        sys.exit(1)
