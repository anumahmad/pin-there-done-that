const CATEGORIES = [
  { id: 'cat_nyc',        label: 'NYC',           color: '#734f5a' }, // Mauve Shadow
  { id: 'cat_bubbletea',  label: 'Bubble Tea',    color: '#264653' }, // Charcoal Blue
  { id: 'cat_technology', label: 'Technology',    color: '#2a9d8f' }, // Verdigris
  { id: 'cat_travel',     label: 'Travel',        color: '#e9c46a' }, // Jasmine
  { id: 'cat_anime',      label: 'Anime',         color: '#f4a261' }, // Sandy Brown
  { id: 'cat_palestine',  label: 'Palestine',     color: '#e76f51' }, // Burnt Peach
  { id: 'cat_books',      label: 'Books',         color: '#941c2f' }, // Burgundy
  { id: 'cat_misc',       label: 'Miscellaneous', color: '#c05761' }, // Blushed Brick
  { id: 'cat_nintendo',   label: 'Nintendo',      color: '#5c5177' }, // Muted Indigo
];

const CATEGORY_MAP = {};
CATEGORIES.forEach(c => { CATEGORY_MAP[c.label] = c; });

function categoryHubId(label) {
  return 'cat_' + label.toLowerCase().replace(/\s+/g, '');
}
