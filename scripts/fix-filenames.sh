#!/bin/bash

# Fix problematic filenames for web deployment
# - Replaces spaces with hyphens
# - Removes colons
# - Converts Danish characters: æ→ae, ø→oe, å→aa
# - Lowercase extensions

cd "/Users/Anton/Documents/Rudme festival/Rudme 2026/Hjemmeside-firkant"

# Create a mapping file for reference updates
MAPPING_FILE="scripts/filename-mapping.txt"
> "$MAPPING_FILE"

echo "Fixing filenames..."
echo ""

# Function to sanitize filename
sanitize_name() {
    local name="$1"
    # Replace Danish characters
    name=$(echo "$name" | sed 's/æ/ae/g; s/Æ/Ae/g; s/ø/oe/g; s/Ø/Oe/g; s/å/aa/g; s/Å/Aa/g')
    # Remove colons
    name=$(echo "$name" | sed 's/:/-/g')
    # Replace spaces with hyphens
    name=$(echo "$name" | sed 's/ /-/g')
    # Lowercase the extension
    name=$(echo "$name" | sed -E 's/\.(JPG|JPEG|PNG|GIF)$/.\L\1/')
    echo "$name"
}

# First, rename directories with spaces or special chars
find pictures ArtistPictures -type d -name "* *" 2>/dev/null | sort -r | while read -r dir; do
    parent=$(dirname "$dir")
    basename=$(basename "$dir")
    newname=$(sanitize_name "$basename")
    if [ "$basename" != "$newname" ]; then
        echo "📁 Renaming dir: $basename → $newname"
        mv "$dir" "$parent/$newname"
        echo "$dir|$parent/$newname" >> "$MAPPING_FILE"
    fi
done

# Now rename files
find pictures ArtistPictures -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" \) 2>/dev/null | while read -r file; do
    dir=$(dirname "$file")
    basename=$(basename "$file")
    newname=$(sanitize_name "$basename")

    if [ "$basename" != "$newname" ]; then
        echo "📄 Renaming: $basename → $newname"
        mv "$file" "$dir/$newname"
        # Store relative path mapping
        echo "$file|$dir/$newname" >> "$MAPPING_FILE"
    fi
done

echo ""
echo "Done! Mapping saved to $MAPPING_FILE"
