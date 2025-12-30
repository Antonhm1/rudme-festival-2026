#!/bin/bash

# Image compression script for Rudme Festival website
# Resizes images to max 2000px width and compresses JPEGs to 80% quality

MAX_WIDTH=2000
JPEG_QUALITY=80

cd "/Users/Anton/Documents/Rudme festival/Rudme 2026/Hjemmeside-firkant"

processed=0
skipped=0
total_saved=0

echo "Starting image compression..."
echo "Max width: ${MAX_WIDTH}px, JPEG quality: ${JPEG_QUALITY}%"
echo ""

# Find all JPG/JPEG/PNG files
find pictures ArtistPictures -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) 2>/dev/null | while read -r img; do
    # Get original size
    original_size=$(stat -f%z "$img")

    # Get dimensions
    width=$(sips -g pixelWidth "$img" 2>/dev/null | tail -n1 | awk '{print $2}')

    if [ -z "$width" ]; then
        echo "⚠️  Skipping (can't read): $img"
        continue
    fi

    # Get file extension
    ext="${img##*.}"
    ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

    # Determine if we need to process
    needs_resize=false
    if [ "$width" -gt "$MAX_WIDTH" ]; then
        needs_resize=true
    fi

    # Process based on file type
    if [ "$ext_lower" = "png" ]; then
        # For PNG: just resize if needed (sips preserves format)
        if [ "$needs_resize" = true ]; then
            echo "📐 Resizing PNG: $(basename "$img") (${width}px → ${MAX_WIDTH}px)"
            sips --resampleWidth $MAX_WIDTH "$img" --out "$img" >/dev/null 2>&1
            ((processed++))
        else
            echo "✅ PNG OK: $(basename "$img")"
            ((skipped++))
        fi
    else
        # For JPEG: resize if needed, then recompress
        if [ "$needs_resize" = true ]; then
            echo "📐 Resizing & compressing: $(basename "$img") (${width}px → ${MAX_WIDTH}px)"
            # Create temp file for resize
            sips --resampleWidth $MAX_WIDTH "$img" --out "$img" >/dev/null 2>&1
        fi

        # Recompress JPEG with quality setting
        # sips can set formatOptions for JPEG quality
        sips -s format jpeg -s formatOptions $JPEG_QUALITY "$img" --out "$img" >/dev/null 2>&1

        new_size=$(stat -f%z "$img")
        saved=$((original_size - new_size))

        if [ $saved -gt 0 ]; then
            saved_kb=$((saved / 1024))
            echo "✅ Compressed: $(basename "$img") (-${saved_kb}KB)"
            ((processed++))
        else
            echo "✅ Already optimal: $(basename "$img")"
            ((skipped++))
        fi
    fi
done

echo ""
echo "Done! Processed images."
