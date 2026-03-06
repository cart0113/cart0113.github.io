#!/usr/bin/env python3
"""Run ocr.py on all images using multiple processes."""
import json
import subprocess
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

FOLDER = Path(__file__).parent
OCR_SCRIPT = FOLDER / "ocr.py"
PYTHON = "python-main"


def process_image(filename):
    """Run ocr.py on a single image and return (filename, result)."""
    result = subprocess.run(
        [PYTHON, str(OCR_SCRIPT), filename],
        capture_output=True, text=True, cwd=str(FOLDER)
    )
    # ocr.py writes to ocr.json, but in parallel that's a race condition.
    # Instead, import the functions directly.
    return result.stdout.strip()


def ocr_single(filepath):
    """OCR a single image and return (key, matches)."""
    # Import inline to work in subprocess
    sys.path.insert(0, str(FOLDER))
    from ocr import get_image_dims, ocr_image, find_gjevre
    matches = find_gjevre(filepath)
    return (filepath.stem, matches)


def main():
    jpgs = sorted(FOLDER.glob("*.jpg"))
    print(f"Processing {len(jpgs)} images with parallel workers...")

    workers = 8
    results = {}

    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(ocr_single, jpg): jpg for jpg in jpgs}
        done = 0
        for future in as_completed(futures):
            jpg = futures[future]
            done += 1
            try:
                key, matches = future.result()
                if matches:
                    results[key] = matches
                    print(f"  [{done}/{len(jpgs)}] {jpg.name}: {len(matches)} matches")
                else:
                    print(f"  [{done}/{len(jpgs)}] {jpg.name}: no matches")
            except Exception as e:
                print(f"  [{done}/{len(jpgs)}] {jpg.name}: ERROR {e}")

    ocr_path = FOLDER / "ocr.json"
    with open(ocr_path, "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nDone. {len(results)} images with matches out of {len(jpgs)} total.")
    print(f"Written to {ocr_path}")


if __name__ == "__main__":
    main()
