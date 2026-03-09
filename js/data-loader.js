async function loadGraph() {
  const pins = await fetch('data/pins.json').then(r => r.json());

  // Resolve image paths to absolute URLs so Cytoscape's canvas renderer can load them
  const base = new URL('.', document.baseURI).href;

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
        image_path: new URL(pin.image_path, base).href,
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
