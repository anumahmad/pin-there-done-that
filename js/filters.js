function buildTripFilters(pins) {
  const trips = [...new Set(pins.map(p => p.trip).filter(Boolean))].sort();
  const container = document.getElementById('trip-filters');
  container.innerHTML = '';

  if (trips.length === 0) {
    container.innerHTML = '<div style="font-size:0.75rem;color:var(--text-muted);padding:2px 0;">no trips yet</div>';
    return;
  }

  // Master "all trips" checkbox
  const master = document.createElement('div');
  master.className = 'cat-filter-item';
  master.innerHTML = `
    <input type="checkbox" id="trip-all" checked>
    <label for="trip-all">All Trips</label>
  `;
  container.appendChild(master);

  // Individual trip checkboxes, indented
  const nested = document.createElement('div');
  nested.id = 'trip-nested';
  nested.style.paddingLeft = '18px';
  trips.forEach(trip => {
    const id = `trip-${trip.replace(/\s+/g, '-').toLowerCase()}`;
    const item = document.createElement('div');
    item.className = 'cat-filter-item';
    item.innerHTML = `
      <input type="checkbox" class="trip-filter" id="${id}" value="${trip}" checked>
      <label for="${id}">${trip}</label>
    `;
    nested.appendChild(item);
  });
  container.appendChild(nested);

  // Master controls all children
  const masterCb = document.getElementById('trip-all');
  masterCb.addEventListener('change', () => {
    nested.querySelectorAll('.trip-filter').forEach(cb => {
      cb.checked = masterCb.checked;
    });
    applyFilters();
  });

  // Children update master indeterminate state
  function syncMaster() {
    const all = [...nested.querySelectorAll('.trip-filter')];
    const checkedCount = all.filter(cb => cb.checked).length;
    masterCb.indeterminate = checkedCount > 0 && checkedCount < all.length;
    masterCb.checked = checkedCount === all.length;
    applyFilters();
  }

  nested.querySelectorAll('.trip-filter').forEach(cb =>
    cb.addEventListener('change', syncMaster)
  );
}

function applyFilters() {
  if (!cy) return;

  const checkedCats = new Set(
    Array.from(document.querySelectorAll('.cat-filter:checked')).map(cb => cb.value)
  );
  const showCategoryEdges = document.getElementById('edge-category').checked;
  const checkedTrips = new Set(
    Array.from(document.querySelectorAll('.trip-filter:checked')).map(cb => cb.value)
  );

  // Category hub nodes
  cy.nodes('.category-node').forEach(node => {
    const visible = checkedCats.has(node.data('label'));
    visible ? node.show() : node.hide();
  });

  // Pin nodes — visible if any of their categories are checked
  cy.nodes('.pin-node').forEach(node => {
    const cats = node.data('categories') || [];
    const visible = cats.some(c => checkedCats.has(c));
    visible ? node.show() : node.hide();
  });

  // Category edges
  cy.edges('.category-edge').forEach(edge => {
    const bothVisible = edge.source().visible() && edge.target().visible();
    bothVisible && showCategoryEdges ? edge.show() : edge.hide();
  });

  // Trip edges — filter by specific trip
  cy.edges('.trip-edge').forEach(edge => {
    const bothVisible = edge.source().visible() && edge.target().visible();
    const tripVisible = checkedTrips.has(edge.data('trip'));
    bothVisible && tripVisible ? edge.show() : edge.hide();
  });

  resetHighlights();
  document.getElementById('category-count').textContent = '';
}

function surpriseMe() {
  if (!cy) return;
  const visiblePins = cy.nodes('.pin-node').filter(':visible');
  if (visiblePins.length === 0) return;

  const target = visiblePins[Math.floor(Math.random() * visiblePins.length)];
  resetHighlights();

  cy.animate(
    { center: { eles: target }, zoom: 2.2 },
    {
      duration: 750,
      easing: 'ease-in-out-cubic',
      complete: () => {
        highlightNode(target);
        openPanel(target.data());
      },
    }
  );
}

function resetFilters() {
  document.querySelectorAll('.cat-filter').forEach(cb => (cb.checked = true));
  document.getElementById('edge-category').checked = true;
  document.querySelectorAll('.trip-filter').forEach(cb => (cb.checked = true));
  const masterCb = document.getElementById('trip-all');
  if (masterCb) { masterCb.checked = true; masterCb.indeterminate = false; }
  applyFilters();
  closePanel();
  document.getElementById('category-count').textContent = '';
  if (cy) cy.fit(undefined, 60);
}

// Wire up events
document.querySelectorAll('.cat-filter').forEach(cb =>
  cb.addEventListener('change', applyFilters)
);
document.getElementById('edge-category').addEventListener('change', applyFilters);
document.getElementById('btn-surprise').addEventListener('click', surpriseMe);
document.getElementById('btn-reset').addEventListener('click', resetFilters);

// Desktop collapse/expand
document.getElementById('controls-toggle').addEventListener('click', () => {
  const panel = document.getElementById('controls-panel');
  const label = document.getElementById('toggle-label');
  panel.classList.toggle('collapsed');
  label.textContent = panel.classList.contains('collapsed') ? '›' : '‹';
});

// Mobile filters FAB
function openMobileFilters() {
  document.getElementById('controls-panel').classList.add('mobile-open');
  document.getElementById('mobile-backdrop').classList.add('visible');
}

function closeMobileFilters() {
  document.getElementById('controls-panel').classList.remove('mobile-open');
  document.getElementById('mobile-backdrop').classList.remove('visible');
}

document.getElementById('mobile-filters-btn').addEventListener('click', () => {
  const isOpen = document.getElementById('controls-panel').classList.contains('mobile-open');
  isOpen ? closeMobileFilters() : openMobileFilters();
});

document.getElementById('mobile-surprise-btn').addEventListener('click', surpriseMe);

document.getElementById('mobile-backdrop').addEventListener('click', closeMobileFilters);
