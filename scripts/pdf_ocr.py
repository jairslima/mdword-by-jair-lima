from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

import fitz
import pytesseract
from PIL import Image


def get_base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[1]


def configure_tesseract() -> None:
    base_dir = get_base_dir()
    bundled_tesseract = base_dir / "tesseract" / "tesseract.exe"
    bundled_tessdata = base_dir / "tesseract" / "tessdata"

    if bundled_tesseract.exists():
        pytesseract.pytesseract.tesseract_cmd = str(bundled_tesseract)
    elif Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe").exists():
        pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

    if bundled_tessdata.exists():
        os.environ["TESSDATA_PREFIX"] = str(bundled_tessdata)


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def page_to_image(page: fitz.Page, scale: float = 2.5) -> Image.Image:
    matrix = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=matrix, alpha=False)
    mode = "RGB"
    return Image.frombytes(mode, [pix.width, pix.height], pix.samples)


def ocr_pdf(pdf_path: Path, language: str = "por+eng") -> dict:
    doc = fitz.open(pdf_path)
    pages = []
    for page in doc:
        image = page_to_image(page)
        text = pytesseract.image_to_string(image, lang=language)
        pages.append(normalize_text(text))
    doc.close()
    return {
        "text": "\n\n".join(page for page in pages if page).strip(),
        "pages": len(pages),
    }


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "pdf_path is required"}))
        return 1

    pdf_path = Path(sys.argv[1]).resolve()
    language = sys.argv[2] if len(sys.argv) > 2 else "por+eng"
    configure_tesseract()

    try:
        result = ocr_pdf(pdf_path, language=language)
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        return 1

    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
