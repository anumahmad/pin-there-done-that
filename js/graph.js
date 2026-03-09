let cy = null;

async function initGraph() {
  const { nodes, edges, pins } = await loadGraph();

  document.getElementById('loading').style.display = 'none';
  buildTripFilters(pins);

  cy = cytoscape({
    container: document.getElementById('cy'),
    elements: { nodes, edges },
    style: buildCyStyle(),
    layout: {
      name: 'cose',
      animate: true,
      animationDuration: 1000,
      randomize: true,
      idealEdgeLength: 120,
      nodeRepulsion: 450000,
      nodeOverlap: 20,
      gravity: 80,
      edgeElasticity: 100,
      nestingFactor: 5,
      fit: true,
      padding: 60,
    },
    minZoom: 0.3,
    maxZoom: 4,
    wheelSensitivity: 0.3,
  });

  // Give category hubs more mass so they anchor clusters
  cy.nodes('.category-node').forEach(n => n.scratch('mass', 12));

  // Events
  cy.on('tap', 'node.pin-node', function (e) {
    highlightNode(e.target);
    openPanel(e.target.data());
    document.getElementById('category-count').textContent = '';
  });

  cy.on('tap', 'node.category-node', function (e) {
    highlightCategory(e.target);
    const count = e.target.neighborhood('node.pin-node').filter(':visible').length;
    document.getElementById('category-count').textContent =
      `${e.target.data('label')} — ${count} pin${count !== 1 ? 's' : ''}`;
    closePanel();
  });

  cy.on('tap', function (e) {
    if (e.target === cy) {
      resetHighlights();
      closePanel();
      document.getElementById('category-count').textContent = '';
    }
  });

  cy.on('dbltap', 'node.pin-node', function (e) {
    cy.animate({ center: { eles: e.target }, zoom: 2.5 }, { duration: 500 });
  });
}

function buildCyStyle() {
  return [
    {
      selector: 'node.pin-node',
      style: {
        width: 90,
        height: 90,
        shape: 'rectangle',
        'background-color': 'transparent',
        'background-opacity': 0,
        'background-image': 'data(image_path)',
        'background-fit': 'contain',
        'background-clip': 'none',
        'border-width': 0,
        label: '',
        'overlay-opacity': 0,
      },
    },
    {
      // Favorite pins: gold star label below node
      selector: 'node.pin-node[?is_favorite]',
      style: {
        label: '★',
        color: '#FFD700',
        'font-size': '13px',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 4,
      },
    },
    {
      selector: 'node.category-node',
      style: {
        width: 110,
        height: 95,
        shape: 'hexagon',
        'background-color': 'data(color)',
        'background-opacity': 0.9,
        label: 'data(label)',
        color: '#000000',
        'font-weight': 'bold',
        'font-size': '12px',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': '88px',
        'overlay-padding': 8,
      },
    },
    {
      selector: 'edge.category-edge',
      style: {
        'line-color': 'data(color)',
        opacity: 0.5,
        width: 2,
        'curve-style': 'bezier',
        'target-arrow-shape': 'none',
      },
    },
    {
      selector: 'edge.trip-edge',
      style: {
        'line-color': '#bbbbbb',
        'line-style': 'dashed',
        'line-dash-pattern': [6, 4],
        opacity: 0.6,
        width: 1.5,
        'curve-style': 'bezier',
      },
    },
    {
      selector: '.dimmed',
      style: {
        opacity: 0.07,
      },
    },
  ];
}

function highlightNode(node) {
  cy.elements().addClass('dimmed');
  node.removeClass('dimmed');
  node.neighborhood().removeClass('dimmed');
}

function highlightCategory(catNode) {
  cy.elements().addClass('dimmed');
  catNode.removeClass('dimmed');
  catNode.neighborhood('node.pin-node').filter(':visible').removeClass('dimmed');
  catNode.connectedEdges().filter(':visible').removeClass('dimmed');
}

function resetHighlights() {
  if (cy) cy.elements().removeClass('dimmed');
}
