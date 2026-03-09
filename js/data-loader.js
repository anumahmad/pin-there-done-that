function preloadImages(pins) {
  return Promise.all(pins.map(pin => new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = resolve;
    img.onerror = resolve;
    img.src = pin.image_path;
  })));
}

async function loadGraph() {
  const pins = await fetch('data/pins.json').then(r => r.json());

  await preloadImages(pins);

  const nodes = [];
  const edges = [];

  // Pin nodes
  pins.forEach(pin => {
    const primaryCat = pin.categories[0];
    const primaryColor = CATEGORY_MAP[primaryCat]?.color || '#888888';

    nodes.push({
      data: {
        ...pin,
        primaryColor,
        label: pin.name,
        image_path: pin.image_path,
      },
      classes: 'pin-node',
    });
  });

  // Category hub nodes
  CATEGORIES.forEach(cat => {
    nodes.push({
      data: {
        id: cat.id,
        label: cat.label,
        color: cat.color,
        type: 'category',
      },
      classes: 'category-node',
    });
  });

  // CATEGORY edges (pin → hub)
  pins.forEach(pin => {
    pin.categories.forEach(catLabel => {
      const cat = CATEGORY_MAP[catLabel];
      if (!cat) return;
      edges.push({
        data: {
          id: `${pin.id}_${cat.id}`,
          source: pin.id,
          target: cat.id,
          type: 'CATEGORY',
          color: cat.color,
        },
        classes: 'category-edge',
      });
    });
  });

  // SHARED_TRIP edges (pin ↔ pin, same non-null trip)
  const tripGroups = {};
  pins.filter(p => p.trip).forEach(p => {
    if (!tripGroups[p.trip]) tripGroups[p.trip] = [];
    tripGroups[p.trip].push(p);
  });
  Object.entries(tripGroups).forEach(([trip, group]) => {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        edges.push({
          data: {
            id: `trip_${group[i].id}_${group[j].id}`,
            source: group[i].id,
            target: group[j].id,
            type: 'SHARED_TRIP',
            trip,
          },
          classes: 'trip-edge',
        });
      }
    }
  });

  return { nodes, edges, pins };
}
