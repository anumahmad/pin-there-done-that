# pin there, done that

An interactive graph visualization of my personal enamel pin collection (100+). Pins are nodes. 


**[→ View live](https://anumahmad.github.io/pin-there-done-that/)**

---

## Running locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

A local server is required — `fetch()` won't work over `file://`.

## Managing pins

```bash
# Add a single pin interactively
python3 scripts/add_pin.py

# Bulk import from a spreadsheet (export as CSV first)
python3 scripts/import_csv.py scripts/my_pins.csv

# Edit a field on an existing pin
python3 scripts/edit_pin.py pin_042
```

After any script runs, drop the pin photo into `images/pins/` and push to GitHub. The live site updates immediately.

See `scripts/pin_template.csv` for the CSV format. The `image` column links a row to its photo filename.

## Stack

| | |
|---|---|
| Hosting | GitHub Pages |
| Graph | Cytoscape.js (force-directed layout) |
| Data | `data/pins.json` — a flat JSON array |
| Frontend | Vanilla HTML, CSS, JS — no build step |
| Tooling | Python 3 standard library only |

## Adding a category

1. `js/constants.js` — add to `CATEGORIES` array
2. `index.html` — add a checkbox in the controls panel
3. `scripts/import_csv.py`, `add_pin.py`, `edit_pin.py` — add to `VALID_CATEGORIES`

## Project structure

```
├── index.html
├── how.html              # how this was made
├── style.css
├── js/
│   ├── constants.js      # category definitions + colors
│   ├── data-loader.js    # fetches pins.json, computes edges
│   ├── graph.js          # cytoscape init + interactions
│   ├── detail-panel.js   # pin detail side panel
│   └── filters.js        # filter + surprise me logic
├── data/
│   └── pins.json
├── images/pins/          # one .PNG per pin
└── scripts/              # local Python data tooling
```
