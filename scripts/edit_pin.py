#!/usr/bin/env python3
"""
edit_pin.py — edit a field on an existing pin

Usage:
    python3 scripts/edit_pin.py <pin_id>

Example:
    python3 scripts/edit_pin.py pin_003
"""

import json
import os
import sys

VALID_CATEGORIES = [
    "NYC", "Bubble Tea", "Technology", "Travel",
    "Anime", "Palestine", "Books", "Miscellaneous", "Nintendo"
]
VALID_ACQUISITION = ["bought", "gifted", "free"]
VALID_TEXTURE = ["standard", "wooden", "3d", "bubble"]
EDITABLE_FIELDS = ["name", "categories", "year", "acquisition_type", "trip", "is_favorite", "texture", "notes"]

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'pins.json')


def parse_value(field, raw):
    if field == 'categories':
        parts = [p.strip() for p in raw.replace('|', ',').split(',') if p.strip()]
        invalid = [p for p in parts if p not in VALID_CATEGORIES]
        if invalid:
            print(f"  ✗ Invalid categories: {invalid}")
            return None
        return parts
    elif field == 'year':
        try:
            year = int(raw)
            if year < 2020:
                print("  ✗ Must be >= 2020.")
                return None
            return year
        except ValueError:
            print("  ✗ Must be a whole number.")
            return None
    elif field == 'acquisition_type':
        if raw.lower() not in VALID_ACQUISITION:
            print(f"  ✗ Must be one of: {', '.join(VALID_ACQUISITION)}")
            return None
        return raw.lower()
    elif field == 'texture':
        if raw.lower() not in VALID_TEXTURE:
            print(f"  ✗ Must be one of: {', '.join(VALID_TEXTURE)}")
            return None
        return raw.lower()
    elif field == 'is_favorite':
        if raw.lower() in ('y', 'yes', 'true', '1'):
            return True
        if raw.lower() in ('n', 'no', 'false', '0'):
            return False
        print("  ✗ Enter y or n.")
        return None
    elif field == 'trip':
        return raw.strip() or None
    else:
        return raw.strip()


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/edit_pin.py <pin_id>")
        sys.exit(1)

    pin_id = sys.argv[1]

    if not os.path.exists(DATA_PATH):
        print(f"Error: data/pins.json not found.", file=sys.stderr)
        sys.exit(1)

    with open(DATA_PATH, encoding='utf-8') as f:
        pins = json.load(f)

    pin = next((p for p in pins if p['id'] == pin_id), None)
    if not pin:
        print(f"Error: pin '{pin_id}' not found.", file=sys.stderr)
        sys.exit(1)

    print(f"\nCurrent values for {pin_id} \"{pin['name']}\":\n")
    for field in EDITABLE_FIELDS:
        print(f"  {field:20s} {pin.get(field)}")

    print(f"\nEditable fields: {', '.join(EDITABLE_FIELDS)}")
    field = input("\nWhich field to edit? ").strip().lower()

    if field not in EDITABLE_FIELDS:
        print(f"Error: '{field}' is not an editable field.")
        sys.exit(1)

    old_value = pin.get(field)

    while True:
        raw = input(f"New value for '{field}': ").strip()
        new_value = parse_value(field, raw)
        if new_value is not None:
            break

    pin[field] = new_value

    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(pins, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Updated {pin_id} field '{field}':")
    print(f"  {old_value!r}  →  {new_value!r}")


if __name__ == '__main__':
    main()
