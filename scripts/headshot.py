"""Square-crop and compress the headshot into public/ (all EXIF stripped)."""
import sys
from PIL import Image, ImageOps

src, dst = sys.argv[1], sys.argv[2]
cx, top, side = 3400, 150, 3600  # crop box in source pixels (_SID0566, 7008x4672)
im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
im = im.crop((cx - side // 2, top, cx + side // 2, top + side)).resize((800, 800), Image.LANCZOS)
im.save(dst, "JPEG", quality=82, optimize=True, progressive=True)  # no exif= → metadata dropped
print(im.size)
