#!/usr/bin/env python3
"""OCR images for 'gjevre' matches and write bounding boxes to ocr.json."""
import json
import re
import subprocess
import sys
import csv
import io
from pathlib import Path

DAYS_OF_WEEK = {"sun", "mon", "tue", "wed", "thu", "fri", "sat"}
MONTHS = {"jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec"}


def get_image_dims(filepath):
    """Get image dimensions using sips."""
    out = subprocess.run(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(filepath)],
        capture_output=True, text=True
    )
    w = h = 0
    for line in out.stdout.splitlines():
        if "pixelWidth" in line:
            w = int(line.split()[-1])
        elif "pixelHeight" in line:
            h = int(line.split()[-1])
    return w, h


def ocr_image(filepath):
    """Run tesseract and return parsed rows."""
    out = subprocess.run(
        ["tesseract", str(filepath), "stdout", "--psm", "1", "tsv"],
        capture_output=True, text=True
    )
    rows = []
    for line in out.stdout.splitlines()[1:]:  # skip header
        parts = line.split('\t')
        if len(parts) >= 12:
            rows.append({
                "left": parts[6],
                "top": parts[7],
                "width": parts[8],
                "height": parts[9],
                "conf": parts[10],
                "text": parts[11],
            })
    return rows


FAMILY_NAMES = {"gjevre", "cheryl", "wade", "clinton", "ole"}


def find_matches(filepath, terms):
    """Find occurrences of terms with bounding box percentages."""
    w, h = get_image_dims(filepath)
    if w == 0 or h == 0:
        return []

    rows = ocr_image(filepath)
    matches = []
    for row in rows:
        text = row.get("text", "").strip()
        if not text or len(text) < 3:
            continue
        cleaned = re.sub(r"[^a-zA-Z]", "", text).lower()
        if any(cleaned == term or (term == "gjevre" and term in cleaned) for term in terms):
            try:
                left = float(row["left"]) / w * 100
                top = float(row["top"]) / h * 100
                width = float(row["width"]) / w * 100
                height = float(row["height"]) / h * 100
                conf = float(row["conf"])
                matches.append({
                    "x": round(left, 2),
                    "y": round(top, 2),
                    "w": round(width, 2),
                    "h": round(height, 2),
                    "c": round(conf),
                    "t": text,
                })
            except (ValueError, KeyError):
                continue
    return matches


def find_gjevre(filepath):
    """Find 'gjevre' occurrences. Falls back to family names if none found."""
    matches = find_matches(filepath, {"gjevre"})
    if not matches:
        matches = find_matches(filepath, FAMILY_NAMES)
    return matches


def main():
    folder = Path(__file__).parent
    jpgs = sorted(folder.glob("*.jpg"))

    if len(sys.argv) > 1:
        # Process only specified files
        jpgs = [folder / f for f in sys.argv[1:] if (folder / f).exists()]

    ocr_path = folder / "ocr.json"

    # Load existing data if present
    if ocr_path.exists():
        with open(ocr_path) as f:
            data = json.load(f)
    else:
        data = {}

    for jpg in jpgs:
        key = jpg.stem
        print(f"  {jpg.name}...", end=" ", flush=True)
        matches = find_gjevre(jpg)
        if matches:
            data[key] = matches
            print(f"{len(matches)} matches")
        else:
            print("no matches")

    with open(ocr_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Done. {len(data)} images with matches in ocr.json")


if __name__ == "__main__":
    main()
