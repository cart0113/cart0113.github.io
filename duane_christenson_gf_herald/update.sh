#!/bin/bash
# Scans for .jpg files and generates manifest.js
# Run this after adding/removing images to update the page
cd "$(dirname "$0")"
echo "const IMAGE_FILES = [" > manifest.js
for f in *.jpg; do
  [ -f "$f" ] && echo "  \"$f\"," >> manifest.js
done
echo "];" >> manifest.js
echo "Updated manifest.js with $(ls *.jpg 2>/dev/null | wc -l | tr -d ' ') images."
