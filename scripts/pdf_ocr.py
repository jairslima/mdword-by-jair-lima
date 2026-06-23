from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import fitz


def get_base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[1]


def get_tesseract() -> tuple[Path, dict[str, str]]:
    base_dir = get_base_dir()
    bundled_tesseract = base_dir / "tesseract" / "tesseract.exe"
    bundled_tessdata = base_dir / "tesseract" / "tessdata"
    system_tesseract = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")

    if bundled_tesseract.exists():
        executable = bundled_tesseract
    elif system_tesseract.exists():
        executable = system_tesseract
    else:
        raise FileNotFoundError("Tesseract OCR nao encontrado")

    environment = os.environ.copy()
    if bundled_tessdata.exists():
        environment["TESSDATA_PREFIX"] = str(bundled_tessdata)

    return executable, environment


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def save_page_image(page: fitz.Page, image_path: Path, scale: float = 2.5) -> None:
    matrix = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=matrix, alpha=False)
    pix.save(image_path)


def ocr_pdf(pdf_path: Path, language: str = "por+eng") -> dict:
    tesseract, environment = get_tesseract()
    pages: list[str] = []

    with fitz.open(pdf_path) as doc, tempfile.TemporaryDirectory(prefix="mdword-ocr-") as temp_dir:
        image_path = Path(temp_dir) / "page.png"
        for page in doc:
            save_page_image(page, image_path)
            result = subprocess.run(
                [str(tesseract), str(image_path), "stdout", "-l", language],
                check=True,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                env=environment,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            pages.append(normalize_text(result.stdout))

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
    try:
        result = ocr_pdf(pdf_path, language=language)
    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        return 1

    print(json.dumps(result, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
