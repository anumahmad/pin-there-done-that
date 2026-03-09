# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**pin there, done that** — a personal enamel pin collection (150+) visualized as an interactive graph. Pins are nodes; shared categories, trips, and acquisition methods are edges. The experience is meant to feel like "exploring who Anum is" through her pins.

Full spec: `pin-graph-spec.md` (sibling directory, or check CODING4FUN root).

## Running locally

```bash
cd pin-there-done-that
python3 -m http.server 8080
# open http://localhost:8080
```

`fetch('data/pins.json')` requires a server — `file://` protocol won't work.

## Architecture

**Fully static.** No build step, no npm, no framework. Everything loads from CDN or local files.

- `data/pins.json` — the graph database (flat array of pin objects)
- `js/constants.js` → `js/data-loader.js` → `js/detail-panel.js` → `js/graph.js` → `js/filters.js` — load order matters; `initGraph()` is called inline at the end of `index.html`
- Cytoscape.js renders the graph in-browser; edges are computed at page load from the JSON, never stored explicitly

## JS module responsibilities

| File | Owns |
|---|---|
| `constants.js` | `CATEGORIES` array, `CATEGORY_MAP` lookup, `categoryHubId()` |
| `data-loader.js` | `loadGraph()` — fetches JSON, builds nodes + edges |
| `graph.js` | `cy` (global), `initGraph()`, `buildCyStyle()`, `highlightNode()`, `highlightCategory()`, `resetHighlights()` |
| `detail-panel.js` | `openPanel(pinData)`, `closePanel()` |
| `filters.js` | `applyFilters()`, `surpriseMe()`, `resetFilters()`, panel collapse |

`cy` is a global defined in `graph.js` and referenced by `filters.js` at call time (after `initGraph()` runs).

## Data model

Pin object fields: `id`, `name`, `image_path`, `categories` (array), `year` (int; 2020 = "pre-2021" sentinel), `acquisition_type` (bought|gifted|free), `trip` (string|null), `is_favorite` (bool), `texture` (standard|wooden|3d), `notes` (string).

Category hub nodes are static JS constants (8 fixed categories) — not in `pins.json`.

## Edge types

- `CATEGORY` — pin → category hub, color matches hub, computed for each entry in `pin.categories`
- `SHARED_TRIP` — pin ↔ pin, dashed silver, all pairs with same non-null `trip` value
- `SHARED_ACQUISITION` — pin ↔ pin, not implemented yet (Phase 2)

## Data management

```bash
# Add one pin interactively
python3 scripts/add_pin.py

# Bulk import from CSV
python3 scripts/import_csv.py scripts/my_pins.csv

# Edit a field on an existing pin
python3 scripts/edit_pin.py pin_003
```

After any script, drop the corresponding image at `images/pins/pin_XXX.jpg` and the site reflects the change on next page load (no rebuild needed).

## 8 categories and their colors

| Label | Hex |
|---|---|
| NYC | #F5C518 |
| Bubble Tea | #D48CE8 |
| Technology | #00D4FF |
| Travel | #FF6B4A |
| Anime | #FF3DAE |
| Palestine | #6BB86B |
| Books | #E8A838 |
| Miscellaneous | #8899BB |

## Adding a new category

1. `js/constants.js` — add `{ id: 'cat_yourname', label: 'Your Label', color: '#hex' }` to `CATEGORIES`
2. `index.html` — add a `.cat-filter-item` checkbox block to the controls panel
3. `scripts/import_csv.py`, `scripts/add_pin.py`, `scripts/edit_pin.py` — add the label to `VALID_CATEGORIES` in each

## Adding a new texture type

Add the string to `VALID_TEXTURE` in all three Python scripts. No frontend change needed.

## Phased plan

- **Phase 1 (current):** Graph renders, CATEGORY + SHARED_TRIP edges, click interactions, detail panel, category filters
- **Phase 2:** Favorites toggle, year range slider, acquisition filter, texture badges, SHARED_ACQUISITION edges
- **Phase 3:** Animations, mobile, optional Render backend for web-based pin adding
