from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ICO_PATH = ASSETS / "app-icon.ico"
PNG_PATH = ASSETS / "app-icon.png"


def build_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle(
        (12, 12, size - 12, size - 12),
        radius=size // 6,
        fill=(191, 126, 54, 255),
        outline=(115, 66, 16, 255),
        width=max(2, size // 40),
    )
    draw.rounded_rectangle(
        (24, 24, size - 24, size - 24),
        radius=size // 7,
        fill=(251, 244, 233, 255),
    )
    draw.rectangle(
        (size * 0.29, size * 0.22, size * 0.71, size * 0.31),
        fill=(232, 194, 140, 255),
    )

    try:
        font = ImageFont.truetype("segoeuib.ttf", size=int(size * 0.25))
    except OSError:
        font = ImageFont.load_default()

    text = "MD"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(
        ((size - tw) / 2, size * 0.46 - th / 2),
        text,
        font=font,
        fill=(111, 60, 13, 255),
    )

    for i in range(3):
      y = int(size * (0.63 + i * 0.09))
      draw.rounded_rectangle(
          (int(size * 0.28), y, int(size * 0.72), y + int(size * 0.035)),
          radius=int(size * 0.015),
          fill=(207, 176, 132, 255),
      )

    return img


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    base = build_icon(512)
    base.save(PNG_PATH)
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    base.save(ICO_PATH, sizes=sizes)
    print(f"icone salvo em {ICO_PATH}")


if __name__ == "__main__":
    main()
