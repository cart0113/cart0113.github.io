#!/bin/bash
# OCR all images and generate ocr.json with word positions
# Searches for "gjevre" (case-insensitive) and stores bounding boxes as percentages
cd "$(dirname "$0")"

echo "{" > ocr.json
first=true

for f in *.jpg; do
  [ -f "$f" ] || continue

  # Get image dimensions
  dims=$(identify -format "%w %h" "$f" 2>/dev/null || sips -g pixelWidth -g pixelHeight "$f" 2>/dev/null | awk '/pixel/{print $2}' | tr '\n' ' ')
  imgW=$(echo "$dims" | awk '{print $1}')
  imgH=$(echo "$dims" | awk '{print $2}')

  if [ -z "$imgW" ] || [ -z "$imgH" ] || [ "$imgW" = "0" ] || [ "$imgH" = "0" ]; then
    echo "  SKIP (no dims): $f" >&2
    continue
  fi

  # Run tesseract TSV
  tsv=$(tesseract "$f" stdout --psm 6 tsv 2>/dev/null)

  # Find "gjevre" matches (case-insensitive) and compute percentage coordinates
  matches=$(echo "$tsv" | awk -F'\t' -v w="$imgW" -v h="$imgH" '
    tolower($12) ~ /gjevre/ && $7+0 > 0 {
      left = ($7 / w) * 100
      top = ($8 / h) * 100
      width = ($9 / w) * 100
      height = ($10 / h) * 100
      conf = $11
      gsub(/[^a-zA-Z0-9 .,;:!?'\''()-]/, "", $12)
      printf "{\"x\":%.2f,\"y\":%.2f,\"w\":%.2f,\"h\":%.2f,\"c\":%.0f,\"t\":\"%s\"},", left, top, width, height, conf, $12
    }
  ')

  # Strip trailing comma
  matches=$(echo "$matches" | sed 's/,$//')

  if [ -n "$matches" ]; then
    key=$(echo "$f" | sed 's/\.jpg$//')
    if [ "$first" = true ]; then
      first=false
    else
      echo "," >> ocr.json
    fi
    printf '  "%s": [%s]' "$key" "$matches" >> ocr.json
    count=$(echo "$matches" | tr ',' '\n' | wc -l | tr -d ' ')
    echo "  $f: $count matches" >&2
  else
    echo "  $f: no matches" >&2
  fi
done

echo "" >> ocr.json
echo "}" >> ocr.json
echo "Done. Output: ocr.json" >&2
