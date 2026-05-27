"""
gen-icon.py — สร้าง icon-512.png + icon-192.png
ใช้ logo-white.png (transparent bg) เป็น source

โลโก้จะอยู่กลางกรอบ ขนาด 50% ของ canvas (256px บน 512px)
พื้นหลัง: Daisi teal #0b4651
"""

from PIL import Image
import os

SRC   = os.path.join(os.path.dirname(__file__), "../public/logo-white.png")
OUT512 = os.path.join(os.path.dirname(__file__), "../public/icon-512.png")
OUT192 = os.path.join(os.path.dirname(__file__), "../public/icon-192.png")

TEAL = (11, 70, 81, 255)   # #0b4651 Daisi deep teal

def make_icon(size: int, logo_pct: float = 0.50):
    canvas = Image.new("RGBA", (size, size), TEAL)

    logo_src = Image.open(SRC).convert("RGBA")

    # scale logo to logo_pct of the canvas (longest edge)
    logo_size = int(size * logo_pct)
    logo_src.thumbnail((logo_size, logo_size), Image.LANCZOS)

    # center
    x = (size - logo_src.width)  // 2
    y = (size - logo_src.height) // 2

    canvas.paste(logo_src, (x, y), logo_src)
    return canvas.convert("RGB")

if not os.path.exists(SRC):
    print(f"❌  ไม่พบ {SRC}\n   วาง logo-white.png (transparent PNG) ใน public/ ก่อนนะคะ")
    exit(1)

make_icon(512, 0.50).save(OUT512, "PNG", optimize=True)
make_icon(192, 0.50).save(OUT192, "PNG", optimize=True)
print("✅  icon-512.png + icon-192.png สร้างเสร็จค่ะ")
