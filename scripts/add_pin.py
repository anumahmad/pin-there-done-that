#!/usr/bin/env python3
"""
add_pin.py — interactively add a single pin to data/pins.json

Usage:
    python3 scripts/add_pin.py
"""

import json
import os

VALID_CATEGORIES = [
    "NYC", "Bubble Tea", "Technology", "Travel",
    "Anime", "Palestine", "Books", "Miscellaneous", "Nintendo"
]
VALID_ACQUISITION = ["bought", "gifted", "free"]
VALID_TEXTURE = ["standard", "wooden", "3d", "bubble"]

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'pins.json')


def prompt(label, validator=None, default=None):
    while True:
        suffix = f" [{default}]" if default is not None else ""
        raw = input(f"  {label}{suffix}: ").strip()
        if not raw and default is not None:
            return default
        if validator:
            result = validator(raw)
            if result is not None:
                return result
            # validator prints its own error
        elif raw:
            return raw
        else:
            print("    ✗ This field is required.")


def validate_categories(raw):
    parts = [p.strip() for p in raw.replace('|', ',').split(',') if p.strip()]
    if not parts:
        print("    ✗ At least one category is required.")
        return None
    invalid = [p for p in parts if p not in VALID_CATEGORIES]
    if invalid:
        print(f"    ✗ Invalid: {invalid}")
        print(f"    Valid options: {', '.join(VALID_CATEGORIES)}")
        return None
    return parts


def validate_year(raw):
    try:
        year = int(raw)
        if year < 2020:
            print("    ✗ Must be >= 2020 (use 2020 for pre-2021 pins).")
            return None
        return year
    except ValueError:
        print("    ✗ Must be a whole number.")
        return None


def validate_choice(options):
    def _v(raw):
        val = raw.lower()
        if val in options:
            return val
        print(f"    ✗ Must be one of: {', '.join(options)}")
        return None
    return _v


def validate_bool(raw):
    if raw.lower() in ('y', 'yes', 'true', '1'):
        return True
    if raw.lower() in ('n', 'no', 'false', '0', ''):
        return False
    print("    ✗ Enter y or n.")
    return None


def main():
    if not os.path.exists(DATA_PATH):
        pins = []
    else:
        with open(DATA_PATH, encoding='utf-8') as f:
            pins = json.load(f)

    next_num = len(pins) + 1
    pin_id = f"pin_{next_num:03d}"

    print(f"\nAdding new pin — ID will be: {pin_id}\n")
    print(f"Categories: {', '.join(VALID_CATEGORIES)}\n")

    name = prompt("Name")
    categories = prompt("Categories (comma or pipe-separated)", validate_categories)
    year = prompt("Year (use 2020 for pre-2021)", validate_year)
    acquisition_type = prompt(
        "How you got it (bought / gifted / free)",
        validate_choice(VALID_ACQUISITION)
    )
    trip_raw = input("  Trip label (leave blank for none): ").strip()
    trip = trip_raw or None
    is_favorite = prompt("Favorite? (y/n)", validate_bool, default='n')
    texture = prompt(
        "Texture (standard / wooden / 3d)",
        validate_choice(VALID_TEXTURE),
        default='standard'
    )
    notes = input("  Notes (optional): ").strip()

    pin = {
        'id': pin_id,
        'name': name,
        'image_path': f"images/pins/{pin_id}.jpg",
        'categories': categories,
        'year': year,
        'acquisition_type': acquisition_type,
        'trip': trip,
        'is_favorite': is_favorite,
        'texture': texture,
        'notes': notes,
    }

    pins.append(pin)

    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    with open(DATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(pins, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Added: {pin_id} \"{name}\"")
    print(f"  Don't forget to add the photo: images/pins/{pin_id}.jpg")


if __name__ == '__main__':
    main()
