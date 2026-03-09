#!/usr/bin/env python3
"""
import_csv.py — bulk import pins from CSV into data/pins.json

Usage:
    python3 scripts/import_csv.py <path_to_csv>

Example:
    python3 scripts/import_csv.py scripts/my_pins.csv

CSV columns (see scripts/pin_template.csv for a blank template):
    image, name, categories, year, acquisition_type, trip, is_favorite, texture, notes

- image: filename of the photo in images/pins/, e.g. pin_001.PNG
- categories: pipe-separated for multi-category pins, e.g. NYC|Travel
- year: integer; use 2020 for any pin acquired before 2021
- acquisition_type: bought | gifted | free
- is_favorite: true | false
- texture: standard | wooden | 3d
- trip: leave blank for null
"""

import csv
import json
import os
import sys

VALID_CATEGORIES = {
    "NYC", "Bubble Tea", "Technology", "Travel",
    "Anime", "Palestine", "Books", "Miscellaneous", "Nintendo"
}
VALID_ACQUISITION = {"bought", "gifted", "free"}
VALID_TEXTURE = {"standard", "wooden", "3d", "bubble"}

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'pins.json')


def parse_row(row, row_num):
    errors = []

    name = row.get('name', '').strip()
    if not name:
        errors.append("'name' is required")

    raw_cats = row.get('categories', '').replace('|', ',')
    categories = [c.strip() for c in raw_cats.split(',') if c.strip()]
    if not categories:
        errors.append("'categories' is required")
    else:
        invalid = [c for c in categories if c not in VALID_CATEGORIES]
        if invalid:
            errors.append(f"invalid categories: {invalid}. Valid: {sorted(VALID_CATEGORIES)}")

    try:
        year = int(row.get('year', ''))
        if year < 2020:
            errors.append("'year' must be >= 2020 (use 2020 for pre-2021 pins)")
    except (ValueError, TypeError):
        errors.append("'year' must be an integer")
        year = None

    acq = row.get('acquisition_type', '').strip().lower()
    if acq not in VALID_ACQUISITION:
        errors.append(f"'acquisition_type' must be one of: {sorted(VALID_ACQUISITION)}")

    texture = row.get('texture', 'standard').strip().lower() or 'standard'
    if texture not in VALID_TEXTURE:
        errors.append(f"'texture' must be one of: {sorted(VALID_TEXTURE)}")

    fav_raw = row.get('is_favorite', 'false').strip().lower()
    is_favorite = fav_raw in ('true', 'yes', '1')

    if errors:
        print(f"\nRow {row_num} has errors:", file=sys.stderr)
        for e in errors:
            print(f"  ✗ {e}", file=sys.stderr)
        sys.exit(1)

    return {
        'name': name,
        'categories': categories,
        'year': year,
        'acquisition_type': acq,
        'trip': row.get('trip', '').strip() or None,
        'is_favorite': is_favorite,
        'texture': texture,
        'notes': row.get('notes', '').strip(),
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/import_csv.py <path_to_csv>")
        sys.exit(1)

    csv_path = sys.argv[1]
    if not os.path.exists(csv_path):
        print(f"Error: file not found: {csv_path}", file=sys.stderr)
        sys.exit(1)

    required_columns = {'image', 'name', 'categories', 'year', 'acquisition_type'}

    pins = []
    with open(csv_path, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = set(reader.fieldnames or [])
        missing = required_columns - fieldnames
        if missing:
            print(f"Error: CSV is missing required columns: {missing}", file=sys.stderr)
            sys.exit(1)

        for row_num, row in enumerate(reader, start=2):
            # Skip empty rows
            if not any(v.strip() for v in row.values()):
                continue
            pin_data = parse_row(row, row_num)
            pin_id = f"pin_{len(pins) + 1:03d}"
            image_file = row.get('image', '').strip()
            if not image_file:
                print(f"Row {len(pins) + 2}: 'image' is empty — expected a filename like pin_001.PNG", file=sys.stderr)
                sys.exit(1)
            pins.append({
                'id': pin_id,
                'name': pin_data['name'],
                'image_path': f"images/pins/{image_file}",
                'categories': pin_data['categories'],
                'year': pin_data['year'],
                'acquisition_type': pin_data['acquisition_type'],
                'trip': pin_data['trip'],
                'is_favorite': pin_data['is_favorite'],
                'texture': pin_data['texture'],
                'notes': pin_data['notes'],
            })

    if not pins:
        print("No pins found in CSV.")
        sys.exit(1)

    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(pins, f, indent=2, ensure_ascii=False)

    print(f"✓ Imported {len(pins)} pins → data/pins.json")
    print()
    print("Add your pin images to images/pins/ with these filenames:")
    for pin in pins:
        print(f"  {pin['image_path']}")


if __name__ == '__main__':
    main()
