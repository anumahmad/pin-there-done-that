function openPanel(pinData) {
  const panel = document.getElementById('detail-panel');

  // Image — graceful fallback if photo not yet added
  const img = document.getElementById('dp-image');
  const imgContainer = document.querySelector('.dp-image-container');
  img.style.display = 'block';
  img.onerror = function () {
    this.style.display = 'none';
    imgContainer.style.backgroundColor = pinData.primaryColor || '#1a1a1a';
    imgContainer.style.minHeight = '80px';
  };
  img.src = pinData.image_path;
  img.alt = pinData.name;

  // Favorite badge
  const favEl = document.getElementById('dp-favorite');
  favEl.style.display = pinData.is_favorite ? 'block' : 'none';

  // Name, pin number & year
  document.getElementById('dp-name').textContent = pinData.name;
  const num = pinData.id.replace('pin_', '');
  document.getElementById('dp-pin-number').textContent = `pin #${num}`;
  document.getElementById('dp-year').textContent =
    pinData.year === 2020 ? 'before 2021' : String(pinData.year);

  // Category pills
  const pillsContainer = document.getElementById('dp-categories');
  pillsContainer.innerHTML = '';
  pinData.categories.forEach(catLabel => {
    const cat = CATEGORY_MAP[catLabel];
    if (!cat) return;
    const pill = document.createElement('span');
    pill.className = 'category-pill';
    pill.textContent = catLabel;
    pill.style.backgroundColor = cat.color;
    pillsContainer.appendChild(pill);
  });

  // Trip
  const tripRow = document.getElementById('dp-trip-row');
  if (pinData.trip) {
    document.getElementById('dp-trip').textContent = pinData.trip;
    tripRow.style.display = 'flex';
  } else {
    tripRow.style.display = 'none';
  }

  // Acquisition
  document.getElementById('dp-acquisition').textContent = pinData.acquisition_type;

  // Texture
  const textureRow = document.getElementById('dp-texture-row');
  if (pinData.texture && pinData.texture !== 'standard') {
    document.getElementById('dp-texture').textContent = pinData.texture;
    textureRow.style.display = 'flex';
  } else {
    textureRow.style.display = 'none';
  }

  // Notes
  const notesRow = document.getElementById('dp-notes-row');
  if (pinData.notes && pinData.notes.trim()) {
    document.getElementById('dp-notes').textContent = pinData.notes;
    notesRow.style.display = 'block';
  } else {
    notesRow.style.display = 'none';
  }

  panel.classList.add('open');
}

function closePanel() {
  document.getElementById('detail-panel').classList.remove('open');
}

document.getElementById('dp-close').addEventListener('click', closePanel);
