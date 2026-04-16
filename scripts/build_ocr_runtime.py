from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TOOLS_DIR = ROOT / "tools"
BUILD_DIR = TOOLS_DIR / "ocr-build"
DIST_DIR = TOOLS_DIR / "ocr-dist"
RUNTIME_DIR = TOOLS_DIR / "ocr-runtime"
PY_SCRIPT = ROOT / "scripts" / "pdf_ocr.py"
TESSERACT_DIR = Path(r"C:\Program Files\Tesseract-OCR")

TESSERACT_FILES = [
    "tesseract.exe",
    "libtesseract-5.dll",
    "libleptonica-6.dll",
    "libarchive-13.dll",
    "libbz2-1.dll",
    "libcairo-2.dll",
    "libcrypto-3-x64.dll",
    "libcurl-4.dll",
    "libdeflate.dll",
    "libexpat-1.dll",
    "libffi-8.dll",
    "libfontconfig-1.dll",
    "libfreetype-6.dll",
    "libfribidi-0.dll",
    "libgcc_s_seh-1.dll",
    "libgif-7.dll",
    "libgio-2.0-0.dll",
    "libglib-2.0-0.dll",
    "libgmodule-2.0-0.dll",
    "libgobject-2.0-0.dll",
    "libgraphite2.dll",
    "libharfbuzz-0.dll",
    "libiconv-2.dll",
    "libicudt75.dll",
    "libicuin75.dll",
    "libicuuc75.dll",
    "libidn2-0.dll",
    "libintl-8.dll",
    "libjbig-0.dll",
    "libjpeg-8.dll",
    "libLerc.dll",
    "liblz4.dll",
    "liblzma-5.dll",
    "libopenjp2-7.dll",
    "libpango-1.0-0.dll",
    "libpangocairo-1.0-0.dll",
    "libpangoft2-1.0-0.dll",
    "libpangowin32-1.0-0.dll",
    "libpcre2-8-0.dll",
    "libpixman-1-0.dll",
    "libpng16-16.dll",
    "libpsl-5.dll",
    "libsharpyuv-0.dll",
    "libssh2-1.dll",
    "libstdc++-6.dll",
    "libthai-0.dll",
    "libtiff-6.dll",
    "libunistring-5.dll",
    "libwebp-7.dll",
    "libwebpmux-3.dll",
    "libwinpthread-1.dll",
    "libzstd.dll",
    "zlib1.dll",
]

TRAINEDDATA_FILES = [
    "eng.traineddata",
    "por.traineddata",
    "osd.traineddata",
]


def ensure_clean_dir(path: Path) -> None:
    if path.exists():
      shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def run_pyinstaller() -> Path:
    ensure_clean_dir(BUILD_DIR)
    ensure_clean_dir(DIST_DIR)
    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--name",
        "mdword-ocr",
        "--distpath",
        str(DIST_DIR),
        "--workpath",
        str(BUILD_DIR),
        "--specpath",
        str(BUILD_DIR),
        str(PY_SCRIPT),
    ]
    subprocess.run(command, cwd=ROOT, check=True)
    exe_path = DIST_DIR / "mdword-ocr.exe"
    if not exe_path.exists():
        raise FileNotFoundError(f"helper OCR nao gerado em {exe_path}")
    return exe_path


def copy_tesseract_runtime(target: Path) -> None:
    if not TESSERACT_DIR.exists():
        raise FileNotFoundError("Tesseract nao encontrado em C:\\Program Files\\Tesseract-OCR")

    tesseract_target = target / "tesseract"
    tessdata_target = tesseract_target / "tessdata"
    tesseract_target.mkdir(parents=True, exist_ok=True)
    tessdata_target.mkdir(parents=True, exist_ok=True)

    for file_name in TESSERACT_FILES:
        source = TESSERACT_DIR / file_name
        if source.exists():
            shutil.copy2(source, tesseract_target / file_name)

    for file_name in TRAINEDDATA_FILES:
        source = TESSERACT_DIR / "tessdata" / file_name
        if source.exists():
            shutil.copy2(source, tessdata_target / file_name)

    for folder_name in ["configs", "tessconfigs"]:
        source_folder = TESSERACT_DIR / "tessdata" / folder_name
        target_folder = tessdata_target / folder_name
        if source_folder.exists():
            shutil.copytree(source_folder, target_folder, dirs_exist_ok=True)


def main() -> int:
    RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
    ensure_clean_dir(RUNTIME_DIR)
    exe_path = run_pyinstaller()
    shutil.copy2(exe_path, RUNTIME_DIR / "mdword-ocr.exe")
    copy_tesseract_runtime(RUNTIME_DIR)
    print(f"runtime OCR preparado em {RUNTIME_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
