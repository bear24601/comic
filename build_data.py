from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
IMAGES_DIR = ROOT / "images"
METADATA_FILE = ROOT / "chapters.json"
OUTPUT_FILE = ROOT / "data.js"
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def natural_key(path: Path) -> list[object]:
    """讓 2.jpg 排在 10.jpg 前面，也支援 001.jpg 格式。"""
    return [
        int(part) if part.isdigit() else part.casefold()
        for part in re.split(r"(\d+)", path.name)
    ]


def list_pages(chapter_number: int) -> list[str]:
    folder = IMAGES_DIR / f"chapter{chapter_number}"
    if not folder.is_dir():
        print(f"警告：找不到 {folder.relative_to(ROOT)}")
        return []

    files = sorted(
        (
            path
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
        ),
        key=natural_key,
    )

    return [path.relative_to(ROOT).as_posix() for path in files]


def main() -> None:
    metadata = json.loads(METADATA_FILE.read_text(encoding="utf-8"))
    output = {
        "siteTitle": metadata.get("siteTitle", "噩盡島"),
        "description": metadata.get("description", "請選擇話數開始閱讀。"),
        "chapters": [],
    }

    for chapter in metadata.get("chapters", []):
        number = int(chapter["number"])
        pages = list_pages(number)
        item = {
            "number": number,
            "title": chapter.get("title", f"第{number}話"),
            "cover": chapter.get(
                "cover", f"images/covers/chapter{number}.jpg"
            ),
            "pages": pages,
        }

        # 之後若 chapters.json 有其他設定，也一併保留。
        for key, value in chapter.items():
            if key not in item:
                item[key] = value

        output["chapters"].append(item)
        print(f"第{number}話：偵測到 {len(pages)} 頁")

    json_text = json.dumps(output, ensure_ascii=False, indent=2)
    OUTPUT_FILE.write_text(
        "const comicData = " + json_text + ";\n",
        encoding="utf-8",
    )
    print(f"已更新：{OUTPUT_FILE.name}")


if __name__ == "__main__":
    main()
