# Anum's Enamel Pin Collection — Graph Visualization Website
### Project Specification

**Author:** Anum Ahmad
**Date:** March 2026
**Status:** Pre-development

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Decision: Why JSON-as-Graph-DB](#2-architecture-decision-why-json-as-graph-db)
3. [Data Model](#3-data-model)
4. [Graph Visualization](#4-graph-visualization)
5. [Page Structure](#5-page-structure)
6. [Data Management Tooling (Python Scripts)](#6-data-management-tooling-python-scripts)
7. [File Structure](#7-file-structure)
8. [Category Color Palette](#8-category-color-palette)
9. [Build & Development](#9-build--development)
10. [Phased Implementation Plan](#10-phased-implementation-plan)

---

## 1. Project Overview

This is a personal portfolio piece and interactive experience built around Anum Ahmad's enamel pin collection (150+ pins). The site presents the collection not as a flat grid or slideshow, but as a **graph visualization** — pins are nodes, and edges encode relationships between them: shared categories, shared trips, shared acquisition types.

The experience is deliberately explorative. Visitors don't browse a list; they wander a graph. Clicking a pin surfaces a detail panel with its photo, story, and metadata. Clicking a category hub lights up every pin in that group. The "Surprise me" button teleports the visitor to a random pin. The cumulative effect is what the project is actually about: **exploring the collection is exploring who Anum is**.

The site is fully static, hosted on GitHub Pages, and requires no backend to run. All data lives in a single JSON file in the repo. Python scripts handle data entry and maintenance locally.

**Tech stack at a glance:**

| Layer | Choice |
|---|---|
| Hosting | GitHub Pages (static) |
| Graph rendering | Cytoscape.js |
| Layout engine | cose-bilkert (Cytoscape extension) |
| Data store | `data/pins.json` in the repo |
| Data tooling | Python 3 scripts (local CLI) |
| Styling | Vanilla CSS (dark theme, matches portfolio) |
| JavaScript | Vanilla JS, no framework, no bundler |

---

## 2. Architecture Decision: Why JSON-as-Graph-DB

### The GitHub Pages constraint

GitHub Pages serves static files only. There is no server-side runtime — no Node, no Python, no PHP, no database connections. Any request the browser makes goes to static files already in the repo. This rules out traditional graph databases (Neo4j, ArangoDB, etc.) as hosted services.

### Why JSON is sufficient

150 pins with full metadata (name, image path, categories, year, acquisition type, trip, texture, notes, favorite flag) will produce a JSON file of roughly **20–50KB**. That is trivially small. A graph database is architecture for problems that don't exist at this scale. JSON loaded via `fetch()` and parsed in-browser is faster, simpler, and deployable for free.

The JSON file **is** the graph database:
- Nodes are defined in the JSON (pin objects).
- Category hub nodes are static constants defined in JavaScript (they never change — there are exactly 8).
- Edges are **computed at page load** from the JSON data. They are not stored explicitly. This means there's no edge maintenance burden; edges are always consistent with the data.

### Data flow

```
pins.json  ──fetch()──▶  data-loader.js  ──▶  graph.js (Cytoscape)
                              │
                              └── computes edges:
                                    CATEGORY (pin → category hub)
                                    SHARED_TRIP (pin ↔ pin, same trip)
                                    SHARED_ACQUISITION (pin ↔ pin, same type)
```

### Python scripts (local data management)

Python scripts run locally on Anum's machine to manage the JSON file. They are **not** part of the website — they're developer tooling. After editing data, the updated `pins.json` is committed and pushed to GitHub, and the live site reflects the change immediately on next page load.

```
CSV spreadsheet  ──import_csv.py──▶  pins.json  ──git push──▶  GitHub Pages
                                         ▲
                              add_pin.py / edit_pin.py
```

### Options for adding pins via a web form (future)

**Option A — Local Python CLI (recommended for MVP):**
Run `python3 scripts/add_pin.py` locally, answer prompts, drop the image in `images/pins/`, commit, push. Done. No infrastructure, no cost, no cold starts. This is the right choice for a solo project where the only person adding pins is Anum.

**Option B — Render free tier backend (future enhancement):**
Deploy a small Flask or Node API on [Render](https://render.com) (free tier). The GitHub Pages frontend calls this API to POST new pins. The backend writes to a database (SQLite or Render's PostgreSQL free tier) and optionally commits back to the repo via the GitHub API. This enables a real web form for adding pins from any device without touching local files.

Caveat: Render's free tier spins down after 15 minutes of inactivity, causing cold starts of 30–60 seconds on the first request. For a personal project used infrequently, this is acceptable.

**Recommendation:** Build with Option A. Implement Option B in Phase 3 only if the local CLI workflow becomes inconvenient.

---

## 3. Data Model

### Pin node attributes

Each pin is one object in the `pins.json` array.

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | Sequential, e.g. `"pin_001"`. Never reused, never changed after assignment. |
| `name` | string | yes | Human-readable pin name, e.g. `"Brooklyn Bridge"` |
| `image_path` | string | yes | Relative path from project root, e.g. `"images/pins/pin_001.jpg"` |
| `categories` | array of strings | yes | One or more from the 8 fixed categories. Must match exactly. |
| `year` | integer | yes | Year acquired. Use `2020` as a sentinel for "acquired before 2021". |
| `acquisition_type` | string (enum) | yes | `"bought"` \| `"gifted"` \| `"free"` |
| `trip` | string or null | yes | Trip label if pin is trip-specific, e.g. `"Japan 2023"`. `null` otherwise. |
| `is_favorite` | boolean | yes | `true` if this is a favorite pin. |
| `texture` | string (enum) | yes | `"standard"` \| `"wooden"` \| `"3d"` |
| `notes` | string | no | Optional freeform text. Can be empty string or omitted. |

**Valid category values (exact strings):**
```
"NYC"
"Bubble Tea"
"Technology"
"Travel"
"Anime"
"Palestine"
"Books"
"Miscellaneous"
```

### Category hub nodes

8 fixed hub nodes, defined as constants in JavaScript (not in `pins.json`). They never change.

| id | label | Role |
|---|---|---|
| `"cat_nyc"` | NYC | Category hub |
| `"cat_bubbletea"` | Bubble Tea | Category hub |
| `"cat_technology"` | Technology | Category hub |
| `"cat_travel"` | Travel | Category hub |
| `"cat_anime"` | Anime | Category hub |
| `"cat_palestine"` | Palestine | Category hub |
| `"cat_books"` | Books | Category hub |
| `"cat_misc"` | Miscellaneous | Category hub |

Each category hub has an associated color (see [Section 8](#8-category-color-palette)).

### Edge types

Edges are not stored — they are computed at page load in `data-loader.js`.

| Type | Between | Computation | Color |
|---|---|---|---|
| `CATEGORY` | pin node → category hub node | For each category in `pin.categories`, create one edge to the matching category hub | Matches the category hub's color |
| `SHARED_TRIP` | pin node ↔ pin node | For all pairs of pins where `trip` is non-null and equal | Bright white/silver, dashed |
| `SHARED_ACQUISITION` | pin node ↔ pin node | For all pairs of pins sharing the same `acquisition_type` | Subtle gray, dotted, low opacity |

`SHARED_ACQUISITION` edges will produce a very dense graph (most pins are "bought"). They should default to **hidden** and be toggle-able via the controls panel.

### JSON file structure

**Location:** `data/pins.json`

```json
[
  {
    "id": "pin_001",
    "name": "Brooklyn Bridge",
    "image_path": "images/pins/pin_001.jpg",
    "categories": ["NYC", "Travel"],
    "year": 2022,
    "acquisition_type": "bought",
    "trip": "NYC Summer 2022",
    "is_favorite": true,
    "texture": "standard",
    "notes": "Got this at a tiny gift shop in DUMBO."
  },
  {
    "id": "pin_002",
    "name": "Taro Bubble Tea",
    "image_path": "images/pins/pin_002.jpg",
    "categories": ["Bubble Tea"],
    "year": 2023,
    "acquisition_type": "bought",
    "trip": null,
    "is_favorite": false,
    "texture": "standard",
    "notes": ""
  }
]
```

The file is a flat array. No nesting, no separate edge definitions, no metadata wrapper object. Keep it simple.

### CSV template columns

For bulk import via `import_csv.py`:

```
name,categories,year,acquisition_type,trip,is_favorite,texture,notes
```

- `categories`: pipe-separated for multi-category pins, e.g. `NYC|Travel`
- `is_favorite`: `true` or `false` (case-insensitive)
- `trip`: leave blank for null
- `notes`: wrap in quotes if it contains commas

**Example CSV row:**
```csv
Brooklyn Bridge,"NYC|Travel",2022,bought,NYC Summer 2022,true,standard,"Got this at a tiny gift shop in DUMBO."
```

---

## 4. Graph Visualization

### Library: Cytoscape.js

[Cytoscape.js](https://js.cytoscape.org/) is the right choice here:
- Free and open source, no API key, no usage limits
- Handles images as node backgrounds natively
- Supports click events, hover events, programmatic highlighting
- Has a robust extension ecosystem (layouts, tooltips, etc.)
- Works fully in-browser with no build step required

Load via CDN:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.29.2/cytoscape.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/cytoscape-cose-bilkent@4.1.0/cytoscape-cose-bilkent.js"></script>
```

### Node rendering

**Pin nodes:**
- Shape: `ellipse` (circle)
- Size: 60–80px diameter
- Background: pin photo as `background-image` in Cytoscape style
- Background fit: `cover` so the image fills the circle
- Border: 2px solid, color matches the pin's primary category (first in array), low opacity by default
- **Favorite pins:** border changes to `#FFD700` (gold), border width 4px — visually distinctive at a glance
- Label: hidden by default, shown in tooltip on hover

**Category hub nodes:**
- Shape: `hexagon` (or `roundrectangle` if hexagon feels off — test both)
- Size: 120px
- Background: the category's assigned color (solid, no image)
- Label: category name, centered, white text, bold, always visible
- Border: none

**Texture badges:**
- For pins where `texture !== "standard"`: render a small icon in the bottom-right of the node
- `"wooden"` → small wood grain icon or 🌲 emoji rendered as an overlay element
- `"3d"` → small cube icon
- Implementation: use Cytoscape's `label` position tricks or a second overlapping node element. Simplest approach: add a CSS class and use a `::after` pseudo-element on the canvas overlay (non-trivial with Cytoscape — see note below).

> **Implementation note on texture badges:** Cytoscape renders to a canvas element, which means CSS pseudo-elements won't work on individual nodes. The cleanest approach for badges is to use Cytoscape's `content` style property with an emoji character, or to draw a second tiny node (positioned programmatically) that overlaps the pin node. The second-tiny-node approach is more robust. Position it at the pin node's coordinates + an offset equal to half the node radius.

### Layout

**Default layout:** `cose-bilkent` (force-directed)

This layout treats edges as springs and nodes as repelling charges. Because category hub nodes have many edges (every pin in a category connects to its hub), the hubs naturally become gravitational centers, and pins cluster around their categories. Pins in multiple categories will sit between their hubs.

Recommended `cose-bilkent` options:
```javascript
{
  name: 'cose-bilkent',
  animate: 'end',
  animationDuration: 800,
  randomize: false,
  nodeDimensionsIncludeLabels: false,
  idealEdgeLength: 120,
  nodeRepulsion: 8000,
  gravity: 0.4,
  gravityRange: 3.8,
}
```

Category hub nodes should be given a higher `mass` value (or locked position) to anchor the clusters. In Cytoscape, set `node.data('mass', 10)` for hub nodes vs. `1` for pin nodes.

**Alternative layout:** `fcose` (also force-directed, often faster for larger graphs). Keep as a switchable option if cose-bilkent performance is poor.

### Interaction model

**Hover a pin node:**
- Show a tooltip (use [Tippy.js](https://atomiks.github.io/tippyjs/) + [cytoscape-popper](https://github.com/cytoscape/cytoscape.js-popper) for clean tooltips) displaying:
  - Pin name
  - Primary category (as a colored pill)
- Tooltip disappears on mouseout

**Click a pin node:**
- Slide in the Pin Detail Panel from the right (see Section 5)
- Highlight connected nodes: set opacity to 1.0 on the clicked node and all its neighbors
- Dim all other nodes and edges: set opacity to 0.15
- If another pin was previously selected, deselect it first (reset highlights, then apply new selection)

**Click a category hub node:**
- Highlight all pins that have this category (i.e., have an edge to this hub)
- Dim all other nodes
- Do not open the detail panel (category hubs are not pins)
- Show a small label somewhere indicating how many pins are in this category, e.g. "NYC — 23 pins"

**Click the background (canvas, not a node):**
- Reset all highlights (set all nodes and edges back to full opacity)
- Close the detail panel if open

**Double-click a pin node:**
- Zoom the camera to center on that node (Cytoscape's `cy.animate()` with `zoom` and `center`)

### Edge rendering

| Edge type | Style | Color | Opacity |
|---|---|---|---|
| `CATEGORY` | solid, thin (1px) | Matches category hub color | 0.3 default, 0.8 on hover/selection |
| `SHARED_TRIP` | dashed (dash pattern: 6,4) | `#C0C0C0` (silver) | 0.5 default |
| `SHARED_ACQUISITION` | dotted (dash pattern: 2,4) | `#555555` | 0.15, hidden by default |

Edge width: 1px for all types. Do not make edges thick — the visual weight should be on the nodes (pin photos).

### Controls panel

The controls panel is a collapsible sidebar (left side) or a top strip. Left sidebar is preferred for desktop since the right side is occupied by the detail panel.

**Controls:**

| Control | Type | Behavior |
|---|---|---|
| Filter by category | 8 checkboxes (one per category, colored dot next to label) | Unchecking a category hides that hub node and all pins *exclusively* in that category. Pins in multiple categories stay visible if any checked category matches. |
| Filter by year | Range slider (2020–current year) | Hides pins outside the selected year range. 2020 displays as "Before 2021". |
| Filter by acquisition type | 3 toggles: bought / gifted / free | Hides pins not matching any checked type. |
| Show only favorites | Single checkbox/toggle | When on, only `is_favorite: true` pins are shown. |
| Show CATEGORY edges | Toggle (default: on) | Hides/shows all CATEGORY edges. |
| Show SHARED_TRIP edges | Toggle (default: on) | Hides/shows all SHARED_TRIP edges. |
| Show SHARED_ACQUISITION edges | Toggle (default: off) | Hides/shows all SHARED_ACQUISITION edges. |
| "Surprise me" button | Button | Picks a random visible pin node, animates the camera to it (`cy.animate()`), then opens its detail panel. This is the core "walk through me" interaction. |
| Reset button | Button | Resets all filters to defaults, re-runs layout, clears any selection. |

**"Surprise me" implementation detail:**
```javascript
function surpriseMe() {
  const visiblePins = cy.nodes('.pin-node').filter(':visible');
  const target = visiblePins[Math.floor(Math.random() * visiblePins.length)];
  cy.animate({
    center: { eles: target },
    zoom: 2.5
  }, {
    duration: 800,
    easing: 'ease-in-out-cubic',
    complete: () => openDetailPanel(target.data())
  });
}
```

---

## 5. Page Structure

Single-page application. No routing. Everything lives in `index.html`.

### Layout sketch

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: "anum's pin collection"                   [nav?]   │
├──────────┬──────────────────────────────────┬───────────────┤
│          │                                  │               │
│ CONTROLS │         GRAPH CANVAS             │  DETAIL PANEL │
│  PANEL   │        (Cytoscape)               │  (slides in   │
│          │                                  │   on click)   │
│          │                                  │               │
│          │                                  │               │
└──────────┴──────────────────────────────────┴───────────────┘
│  FOOTER                                                      │
└─────────────────────────────────────────────────────────────┘
```

### Section specifications

**1. Header bar**
- Fixed to top
- Background: `#0a0a0a` (slightly off-black, distinct from body `#000`)
- Left: site title — `anum's pin collection` in lowercase, ghostwhite, ~1.2rem, light weight font
- Right: optional minimal nav link back to main portfolio
- Height: ~50px
- No heavy decoration — let the graph be the visual centerpiece

**2. Intro blurb**
- Sits just below the header, above the graph
- 2–3 lines max. Suggested copy:

> *every pin tells a story. some are from cities i've wandered through, some arrived as gifts, some just had to be mine. explore.*

- Text color: `#a0a0a0` (muted, doesn't compete with the graph)
- Italic, centered or left-aligned under the header
- Disappears or collapses when the controls panel is open on mobile

**3. Graph canvas**
- Cytoscape mounts here: `<div id="cy"></div>`
- Height: `calc(100vh - 50px - intro_height)` — fills the rest of the viewport
- Background: `#000000` (pure black or `#0d0d0d`)
- The canvas is the main content area. Give it space.

**4. Controls panel**
- Fixed left sidebar, 240px wide
- Collapsible: clicking a `<` chevron button collapses it to an icon strip (~40px wide)
- Background: `#1a1a1a` (matching portfolio card color)
- Border-right: 1px solid `#2a2a2a`
- Scrollable if content overflows
- Section headers within the panel (e.g. "CATEGORIES", "FILTERS", "EDGES") in small uppercase, `#666`, 0.7rem

**5. Pin detail panel**
- Fixed right sidebar, 320px wide
- Slides in from the right (CSS `transform: translateX(100%)` → `translateX(0)` transition, 300ms ease)
- Background: `#1a1a1a`
- Border-left: 1px solid `#2a2a2a`
- Content:
  - Large pin photo (full width of panel, aspect ratio preserved, rounded corners)
  - Pin name: white, ~1.2rem, bold
  - Year: muted, e.g. "2022" or "before 2021"
  - Categories: colored pill badges (each pill uses the category's assigned color as background)
  - Trip: if non-null, shown with a small map pin icon
  - Acquisition type: small label, muted
  - Texture: shown only if not "standard"
  - Favorite: if `true`, show a gold star icon
  - Notes: if non-empty, italic, muted, below a divider
  - Close button: `×` in top-right corner of the panel
- When closed, panel slides back out to the right

**6. Footer**
- Minimal: "made with obsession by anum ahmad"
- Dark background matching header
- Small text, centered, muted color
- Links to portfolio/GitHub optional

### Dark theme CSS variables

Define these at `:root` and use throughout:

```css
:root {
  --bg: #000000;
  --bg-card: #1a1a1a;
  --bg-header: #0a0a0a;
  --text-primary: ghostwhite;         /* #f8f8ff */
  --text-secondary: azure;            /* #f0ffff */
  --text-muted: #666666;
  --border: #2a2a2a;
  --border-light: #333333;
  --gold: #FFD700;
  --transition-panel: 300ms ease;
}
```

---

## 6. Data Management Tooling (Python Scripts)

All scripts live in `scripts/`. They run locally, modify `data/pins.json`, and require Python 3.8+. No third-party libraries required — only `json`, `csv`, `os`, `sys` from the standard library.

### `scripts/import_csv.py`

Reads a CSV file and either creates or overwrites `data/pins.json`.

**Usage:**
```bash
python3 scripts/import_csv.py scripts/pin_template.csv
```

**Behavior:**
1. Opens the CSV, reads header row, validates that all required columns are present.
2. Iterates rows. For each row:
   - Validates `categories`: splits on `|`, checks each against the 8 valid values. Exits with error if invalid.
   - Validates `acquisition_type`: must be `bought`, `gifted`, or `free`.
   - Validates `texture`: must be `standard`, `wooden`, or `3d`.
   - Validates `year`: must be an integer ≥ 2020.
   - Validates `is_favorite`: must be `true` or `false` (case-insensitive), converts to boolean.
   - Converts `trip` blank/empty → `null`.
   - Assigns sequential IDs starting from `pin_001`, zero-padded to 3 digits.
3. Writes the resulting list to `data/pins.json` (pretty-printed, 2-space indent).
4. Prints: `Imported N pins to data/pins.json.`
5. Prints a reminder: `Don't forget to add images to images/pins/ — expected filenames: [list]`

**Error handling:** Print a clear error with the row number and field name on validation failure. Do not silently skip rows.

### `scripts/add_pin.py`

Interactive CLI for adding a single pin.

**Usage:**
```bash
python3 scripts/add_pin.py
```

**Behavior:**
1. Load `data/pins.json`, determine the next available ID (find max numeric suffix, increment by 1).
2. Print: `Next pin ID: pin_042`
3. Prompt for each field in order:
   ```
   Name:
   Categories (comma or pipe-separated, options: NYC, Bubble Tea, Technology, Travel, Anime, Palestine, Books, Miscellaneous):
   Year (integer, use 2020 for pre-2021):
   Acquisition type (bought/gifted/free):
   Trip (leave blank for none):
   Is favorite? (y/n):
   Texture (standard/wooden/3d):
   Notes (optional, leave blank to skip):
   ```
4. Validate each input as entered. Re-prompt on invalid input (don't crash).
5. Construct the pin object, append to the loaded JSON array.
6. Write back to `data/pins.json`.
7. Print confirmation:
   ```
   Added: pin_042 "Brooklyn Bridge"
   Remember to add the image: images/pins/pin_042.jpg
   ```

### `scripts/edit_pin.py`

Edit a specific field on an existing pin.

**Usage:**
```bash
python3 scripts/edit_pin.py pin_042
```

**Behavior:**
1. Load `data/pins.json`, find the pin with the given ID. Exit with error if not found.
2. Print the current values of all fields.
3. Prompt: `Which field to edit? (name / categories / year / acquisition_type / trip / is_favorite / texture / notes):`
4. Prompt for the new value of that field.
5. Validate (same rules as `add_pin.py`).
6. Update the field in the JSON and write back.
7. Print: `Updated pin_042 field "name": "Brooklyn Bridge" → "Brooklyn Bridge (DUMBO)"`

### `scripts/pin_template.csv`

An empty CSV with just the header row, for starting a fresh import:

```csv
name,categories,year,acquisition_type,trip,is_favorite,texture,notes
```

Include 2–3 example rows commented out (or in a separate `pin_template_example.csv`) so the format is clear.

---

## 7. File Structure

```
pin-collection/
├── index.html                  # Single page app shell
├── style.css                   # All styles, dark theme
├── js/
│   ├── graph.js                # Cytoscape init, layout config, node/edge building
│   ├── filters.js              # Filter state, apply-filter logic, control panel events
│   ├── detail-panel.js         # Open/close/populate the pin detail side panel
│   └── data-loader.js          # fetch() pins.json, compute edges, return graph elements
├── data/
│   └── pins.json               # The graph database — array of pin objects
├── images/
│   └── pins/                   # pin_001.jpg, pin_002.jpg, ... (one per pin)
├── scripts/
│   ├── import_csv.py           # Bulk import from CSV → pins.json
│   ├── add_pin.py              # Interactive single-pin add CLI
│   ├── edit_pin.py             # Edit existing pin by ID
│   └── pin_template.csv        # Empty CSV template with header row
└── CLAUDE.md                   # Project context, architecture notes for AI assistants
```

### Script responsibilities in detail

**`data-loader.js`**

```javascript
// Pseudocode
async function loadGraph() {
  const pins = await fetch('data/pins.json').then(r => r.json());
  const nodes = buildPinNodes(pins);        // one node per pin
  nodes.push(...buildCategoryHubNodes());   // 8 fixed hub nodes
  const edges = computeEdges(pins);         // CATEGORY, SHARED_TRIP, SHARED_ACQUISITION
  return { nodes, edges };
}

function computeEdges(pins) {
  const edges = [];

  // CATEGORY edges
  for (const pin of pins) {
    for (const cat of pin.categories) {
      edges.push({ data: { source: pin.id, target: categoryHubId(cat), type: 'CATEGORY' } });
    }
  }

  // SHARED_TRIP edges
  const tripGroups = groupBy(pins.filter(p => p.trip), 'trip');
  for (const [trip, group] of Object.entries(tripGroups)) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        edges.push({ data: { source: group[i].id, target: group[j].id, type: 'SHARED_TRIP', trip } });
      }
    }
  }

  // SHARED_ACQUISITION edges
  const acqGroups = groupBy(pins, 'acquisition_type');
  for (const [type, group] of Object.entries(acqGroups)) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        edges.push({ data: { source: group[i].id, target: group[j].id, type: 'SHARED_ACQUISITION' } });
      }
    }
  }

  return edges;
}
```

> **Performance note:** `SHARED_ACQUISITION` for 150 pins produces up to ~11,000 edges for the "bought" group alone. This is why these edges are hidden by default. If performance degrades, consider computing SHARED_ACQUISITION edges lazily (only when the toggle is turned on) rather than at initial load.

**`graph.js`**

Responsibilities:
- Initialize Cytoscape with the element set from `data-loader.js`
- Apply visual styles (node images, colors, sizes, edge styles)
- Run the `cose-bilkent` layout
- Register event listeners: `cy.on('tap', 'node.pin-node', ...)`, `cy.on('tap', 'node.category-node', ...)`, `cy.on('tap', ...)` (background)
- Export functions: `highlightNode(id)`, `resetHighlights()`, `zoomToNode(id)`

**`filters.js`**

Responsibilities:
- Read the current filter state from the controls panel DOM
- Apply filters to Cytoscape by showing/hiding nodes and edges: `node.hide()`, `node.show()`
- When a filter changes, call `applyFilters()` which re-evaluates visibility for every element
- Export: `applyFilters()`, `resetFilters()`
- Implement `surpriseMe()` — picks a random visible pin and calls `graph.zoomToNode()` then `detailPanel.open()`

**`detail-panel.js`**

Responsibilities:
- Maintain panel open/closed state
- `open(pinData)`: populate DOM with pin data, apply CSS class to slide panel in
- `close()`: remove CSS class to slide panel out
- Populate image, name, year, category pills (each pill colored with its category color), trip, acquisition type, texture, favorite star, notes

**`CLAUDE.md`**

This file provides project context for AI assistants. Include:
- Project purpose (one paragraph)
- Architecture summary (JSON as graph DB, static hosting)
- The 8 categories and their IDs
- Edge computation logic
- File structure
- Instructions for running locally
- Where to find the data model (this spec, or inline)

---

## 8. Category Color Palette

All colors are designed for legibility on a pure black (`#000`) or near-black (`#0d0d0d`) background. They are vivid enough to be distinct at a glance but chosen to coexist without clashing.

| Category | Color Name | Hex | Usage |
|---|---|---|---|
| NYC | Taxi Yellow | `#F5C518` | Warm gold-yellow; NYC energy |
| Bubble Tea | Lavender Pink | `#D48CE8` | Soft purple-pink; boba vibes |
| Technology | Electric Cyan | `#00D4FF` | Bright cyan; digital/tech feel |
| Travel | Coral Orange | `#FF6B4A` | Warm coral; adventure and warmth |
| Anime | Hot Magenta | `#FF3DAE` | Vivid pink-magenta; anime aesthetic |
| Palestine | Olive Green | `#6BB86B` | Muted green; the flag's green |
| Books | Warm Amber | `#E8A838` | Book-cover amber; cozy and warm |
| Miscellaneous | Soft Slate | `#8899BB` | Muted blue-gray; neutral anchor |

These 8 colors are used for:
- Category hub node backgrounds
- CATEGORY edge colors (matching their hub)
- Category pill badges in the detail panel
- Colored dots next to category checkboxes in the controls panel

Define them as JS constants alongside the hub node definitions:

```javascript
const CATEGORIES = [
  { id: 'cat_nyc',        label: 'NYC',           color: '#F5C518' },
  { id: 'cat_bubbletea',  label: 'Bubble Tea',    color: '#D48CE8' },
  { id: 'cat_technology', label: 'Technology',    color: '#00D4FF' },
  { id: 'cat_travel',     label: 'Travel',        color: '#FF6B4A' },
  { id: 'cat_anime',      label: 'Anime',         color: '#FF3DAE' },
  { id: 'cat_palestine',  label: 'Palestine',     color: '#6BB86B' },
  { id: 'cat_books',      label: 'Books',         color: '#E8A838' },
  { id: 'cat_misc',       label: 'Miscellaneous', color: '#8899BB' },
];
```

---

## 9. Common Changes

### Adding a new category

Touch these 5 files in order:

1. **`js/constants.js`** — add an entry to the `CATEGORIES` array:
   ```javascript
   { id: 'cat_yourname', label: 'Your Label', color: '#hexcolor' },
   ```
   The `id` must be `cat_` + the label lowercased with spaces removed.

2. **`index.html`** — add a checkbox to the controls panel (copy any existing `.cat-filter-item` block and update the `id`, `value`, dot `background` color, and label text).

3. **`scripts/import_csv.py`** — add the label string to `VALID_CATEGORIES`.

4. **`scripts/add_pin.py`** — add the label string to `VALID_CATEGORIES`.

5. **`scripts/edit_pin.py`** — add the label string to `VALID_CATEGORIES`.

### Adding a new texture type

Touch these 3 files:

1. **`scripts/import_csv.py`** — add to `VALID_TEXTURE`.
2. **`scripts/add_pin.py`** — add to `VALID_TEXTURE`.
3. **`scripts/edit_pin.py`** — add to `VALID_TEXTURE`.

The frontend displays texture as-is from the JSON, so no frontend change needed.

---

## 10. Build & Development

### Running locally

The site requires a local HTTP server because `fetch('data/pins.json')` is blocked by the browser's CORS policy when loading from `file://` protocol. Use Python's built-in server:

```bash
cd pin-collection
python3 -m http.server 8080
```

Then open `http://localhost:8080` in a browser.

No npm. No bundler. No build step. Open the browser, reload to see changes.

### Editing styles and JS

Edit `style.css` and the files in `js/` directly. Hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) to clear browser cache during development.

### Adding pins (workflow)

```bash
# Option 1: one at a time
python3 scripts/add_pin.py
# follow prompts
# then drop the image in images/pins/pin_XXX.jpg

# Option 2: bulk (from a spreadsheet)
# export your spreadsheet as CSV, save to scripts/my_pins.csv
python3 scripts/import_csv.py scripts/my_pins.csv
# then add all images

# Commit and push
git add data/pins.json images/pins/
git commit -m "add N new pins"
git push
```

### Dependencies (all CDN, no install)

```html
<!-- In index.html <head> -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.29.2/cytoscape.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/cytoscape-cose-bilkent@4.1.0/cytoscape-cose-bilkent.js"></script>
<!-- For tooltips on hover (optional but recommended) -->
<script src="https://unpkg.com/@popperjs/core@2"></script>
<script src="https://unpkg.com/tippy.js@6"></script>
<script src="https://cdn.jsdelivr.net/npm/cytoscape-popper@2.0.0/cytoscape-popper.js"></script>
```

### Deployment

1. Create a GitHub repository named `pin-collection` (or any name).
2. Push the project root.
3. Go to **Settings → Pages → Source → Deploy from branch → main → / (root)**.
4. GitHub Pages will serve `index.html` at `https://anumahmad.github.io/pin-collection/`.

**Note:** Image paths in `pins.json` use relative paths (`images/pins/pin_001.jpg`). These work correctly both locally (via `python3 -m http.server`) and on GitHub Pages because both serve from the project root.

### Python requirements

Python 3.8 or later. No pip installs required. All scripts use the standard library only.

---

## 10. Phased Implementation Plan

### Phase 1 — MVP

**Goal:** A working, live site with all pins visible in a graph, basic interaction, and the detail panel. Something Anum can show people.

**Scope:**

- [ ] Set up the file structure and `index.html` shell
- [ ] Write `pin_template.csv` and `import_csv.py`; import all current pins
- [ ] Add all pin images to `images/pins/`
- [ ] Implement `data-loader.js`: fetch JSON, build pin nodes + category hub nodes, compute CATEGORY edges only (skip SHARED_TRIP and SHARED_ACQUISITION for now)
- [ ] Implement `graph.js`: initialize Cytoscape, apply basic styles (pin images, hub colors, edge colors), run `cose-bilkent` layout
- [ ] Implement pin node click → `detail-panel.js` opens with: photo, name, year, categories (pills), trip, acquisition type, notes
- [ ] Implement category hub click → highlight connected pins, dim others
- [ ] Implement background click → reset highlights, close panel
- [ ] Implement controls panel with category filter checkboxes (show/hide hub + its pins)
- [ ] Apply dark theme CSS across all elements
- [ ] Deploy to GitHub Pages

**Definition of done for Phase 1:** A visitor can open the site, see all pins in the graph clustered by category, click any pin and see its details.

---

### Phase 2 — Full Feature Set

**Goal:** All edges, all filters, the "walk through" discovery experience.

**Scope:**

- [ ] Add `SHARED_TRIP` edge computation and rendering (dashed, silver, medium opacity)
- [ ] Add `SHARED_ACQUISITION` edge computation and rendering (dotted, hidden by default)
- [ ] Add edge type toggles to the controls panel
- [ ] Add year range slider filter
- [ ] Add acquisition type filter toggles
- [ ] Add "show only favorites" toggle
- [ ] Implement texture badges on wooden and 3d pin nodes
- [ ] Implement hover tooltip (pin name + primary category)
- [ ] Implement `surpriseMe()` — random pin selection with camera animation and panel open
- [ ] Implement double-click → zoom to node
- [ ] Implement Reset button
- [ ] Write `add_pin.py` and `edit_pin.py`
- [ ] Add gold border ring on favorite pin nodes
- [ ] Tune `cose-bilkert` layout parameters after all edges are present (the graph will look different with trip edges)

**Definition of done for Phase 2:** All filters work. "Surprise me" works. Every edge type is visible and toggleable. The site feels complete as a portfolio piece.

---

### Phase 3 — Polish and Optional Backend

**Goal:** Production-quality feel, mobile consideration, optional web-based data entry.

**Scope:**

- [ ] Smooth transitions: panel slide, highlight fade, layout animation on filter change
- [ ] Mobile responsiveness: touch events instead of hover, collapsible controls panel, readable detail panel on small screens (full-width overlay instead of sidebar)
- [ ] Performance audit: if SHARED_ACQUISITION edges cause lag, move their computation to lazy/on-demand
- [ ] Accessibility pass: keyboard navigation for the controls panel, ARIA labels on interactive elements
- [ ] `CLAUDE.md` — write the AI context file for future development sessions
- [ ] **Optional:** Render backend — Flask API with endpoints `POST /pins` and `GET /pins`, frontend form in the detail panel area, deploy on Render free tier. Evaluate whether the local CLI workflow is actually painful before investing in this.

**Definition of done for Phase 3:** The site is portfolio-ready on both desktop and mobile. All animations are smooth. The codebase is clean enough for a future collaborator (or an LLM) to work in.

---

*This document is the source of truth for the project. Update it as decisions change.*
