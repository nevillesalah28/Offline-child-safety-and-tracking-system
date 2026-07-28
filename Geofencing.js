// ==========================================================================
// CAPSULE TRACKER - GEOFENCING CONTROLLER
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------------
     1. SIDEBAR & RESPONSIVE DRAWER CONTROLLER
     ------------------------------------------------------------------------ */
  const sidebarToggleBtn = document.getElementById('sidebarToggle');
  const body = document.body;

  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 992) {
        body.classList.toggle('sidebar-open');
        overlay.classList.toggle('active');
      } else {
        body.classList.toggle('sidebar-collapsed');
      }
    });
  }

  overlay.addEventListener('click', () => {
    body.classList.remove('sidebar-open');
    overlay.classList.remove('active');
  });

  /* ------------------------------------------------------------------------
     2. LEAFLET MAP & GEOFENCE ZONE INITIALIZATION
     ------------------------------------------------------------------------ */
  // Default coordinates (e.g., Yaoundé central focus)
  const defaultCoords = [3.8480, 11.5021];
  const mapElement = document.getElementById('geofenceMap') || document.getElementById('map');

  let map, selectedMarker, previewCircle;
  let activeZones = [
    { id: 1, name: "Home Safe Zone", lat: 3.8480, lng: 11.5021, radius: 250, color: '#38bdf8', active: true },
    { id: 2, name: "Pinnacle Academy", lat: 3.8540, lng: 11.5120, radius: 400, color: '#22c55e', active: true }
  ];
  let mapCircles = {};

  if (mapElement && typeof L !== 'undefined') {
    map = L.map(mapElement.id, { zoomControl: false }).setView(defaultCoords, 14);

    // Dark theme OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Render initial zones
    renderMapZones();

    // Map click handler to set new zone center
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setNewZoneCenter(lat, lng);
    });
  }

  /* ------------------------------------------------------------------------
     3. ZONE RENDERING & MAP LAYER MANAGEMENT
     ------------------------------------------------------------------------ */
  function renderMapZones() {
    if (!map) return;

    // Clear existing rendered circles
    Object.values(mapCircles).forEach(circle => map.removeLayer(circle));
    mapCircles = {};

    activeZones.forEach(zone => {
      if (!zone.active) return;

      const circle = L.circle([zone.lat, zone.lng], {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: 0.2,
        radius: zone.radius,
        weight: 2
      }).addTo(map);

      circle.bindPopup(`<b>${zone.name}</b><br>Radius: ${zone.radius}m`);
      mapCircles[zone.id] = circle;
    });
  }

  function setNewZoneCenter(lat, lng) {
    const latInput = document.getElementById('zone-lat');
    const lngInput = document.getElementById('zone-lng');

    if (latInput) latInput.value = lat.toFixed(6);
    if (lngInput) lngInput.value = lng.toFixed(6);

    if (selectedMarker) map.removeLayer(selectedMarker);
    if (previewCircle) map.removeLayer(previewCircle);

    selectedMarker = L.marker([lat, lng]).addTo(map);

    const radiusInput = document.getElementById('zone-radius');
    const currentRadius = radiusInput ? parseInt(radiusInput.value, 10) : 200;

    previewCircle = L.circle([lat, lng], {
      color: '#f59e0b',
      fillColor: '#f59e0b',
      fillOpacity: 0.15,
      radius: currentRadius,
      dashArray: '6, 6',
      weight: 2
    }).addTo(map);

    showToast(`Center coordinates updated: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'info');
  }

  /* ------------------------------------------------------------------------
     4. FORM CONTROLS & DYNAMIC RADIUS SLIDER
     ------------------------------------------------------------------------ */
  const radiusSlider = document.getElementById('zone-radius');
  const radiusValDisplay = document.getElementById('radius-val');

  if (radiusSlider && radiusValDisplay) {
    radiusSlider.addEventListener('input', (e) => {
      const rad = e.target.value;
      radiusValDisplay.textContent = `${rad} m`;

      if (previewCircle) {
        previewCircle.setRadius(parseInt(rad, 10));
      }
    });
  }

  // Create Zone Form Submit
  const geofenceForm = document.getElementById('geofence-form');
  if (geofenceForm) {
    geofenceForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('zone-name');
      const latInput = document.getElementById('zone-lat');
      const lngInput = document.getElementById('zone-lng');
      const radiusInput = document.getElementById('zone-radius');

      if (!nameInput || !nameInput.value.trim()) {
        showToast('Please enter a valid Zone Name.', 'error');
        return;
      }

      const newZone = {
        id: Date.now(),
        name: nameInput.value.trim(),
        lat: parseFloat(latInput.value) || defaultCoords[0],
        lng: parseFloat(lngInput.value) || defaultCoords[1],
        radius: parseInt(radiusInput.value, 10) || 200,
        color: '#38bdf8',
        active: true
      };

      activeZones.push(newZone);
      renderMapZones();
      appendZoneToList(newZone);

      // Clean preview markers
      if (selectedMarker) map.removeLayer(selectedMarker);
      if (previewCircle) map.removeLayer(previewCircle);

      nameInput.value = '';
      showToast(`Geofence "${newZone.name}" created and armed!`, 'success');
    });
  }

  /* ------------------------------------------------------------------------
     5. DYNAMIC ZONE LIST & INTERACTIVE DELEGATION
     ------------------------------------------------------------------------ */
  function appendZoneToList(zone) {
    const zoneListContainer = document.getElementById('zoneList');
    if (!zoneListContainer) return;

    const card = document.createElement('div');
    card.className = 'zone-item-card';
    card.dataset.id = zone.id;
    card.innerHTML = `
      <div class="zone-info">
        <h4>${zone.name}</h4>
        <p class="text-muted">Radius: ${zone.radius}m | Coords: ${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)}</p>
      </div>
      <div class="zone-actions">
        <label class="toggle-switch">
          <input type="checkbox" class="zone-toggle" ${zone.active ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <button type="button" class="btn-icon delete-zone-btn" title="Delete Zone">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    `;

    zoneListContainer.appendChild(card);
  }

  // Event delegation for zone toggle and deletion
  document.addEventListener('click', (e) => {
    // Delete action
    const deleteBtn = e.target.closest('.delete-zone-btn');
    if (deleteBtn) {
      const card = deleteBtn.closest('.zone-item-card');
      const id = parseInt(card.dataset.id, 10);

      activeZones = activeZones.filter(z => z.id !== id);
      renderMapZones();
      card.remove();
      showToast('Geofence zone deleted.', 'info');
    }
  });

  document.addEventListener('change', (e) => {
    // Active state toggle action
    if (e.target.classList.contains('zone-toggle')) {
      const card = e.target.closest('.zone-item-card');
      const id = parseInt(card.dataset.id, 10);
      const zone = activeZones.find(z => z.id === id);

      if (zone) {
        zone.active = e.target.checked;
        renderMapZones();
        showToast(`Geofence "${zone.name}" ${zone.active ? 'enabled' : 'disabled'}.`, 'info');
      }
    }
  });

  /* ------------------------------------------------------------------------
     6. TOAST UTILITY
     ------------------------------------------------------------------------ */
  function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info');

    toast.innerHTML = `
      <span class="material-symbols-outlined">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});