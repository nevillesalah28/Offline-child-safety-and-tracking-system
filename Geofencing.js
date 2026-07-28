// Geofencing.js

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // FUNCTIONALITY 1: REAL-TIME RADIUS SLIDER DISPLAY
  // =========================================================================
  const zoneRadiusInput = document.getElementById('zoneRadius');
  const radiusValueDisplay = document.getElementById('radiusValue');

  if (zoneRadiusInput && radiusValueDisplay) {
    zoneRadiusInput.addEventListener('input', (event) => {
      radiusValueDisplay.textContent = event.target.value;
    });
  }


  // =========================================================================
  // FUNCTIONALITY 2: SIDEBAR TOGGLE & OFF-CANVAS RESPONSIVE DRAWER
  // =========================================================================
  const sidebarToggleBtn = document.getElementById('sidebarToggle');
  const body = document.body;

  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  body.appendChild(overlay);

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


  // =========================================================================
  // FUNCTIONALITY 3: BOUNDARIES DATA & DYNAMIC UI RENDERING
  // =========================================================================
  let geofenceZones = [
    {
      id: 1,
      name: 'Home Perimeter',
      type: 'safe',
      radius: 200,
      isActive: true
    },
    {
      id: 2,
      name: 'Busy Road Highway',
      type: 'danger',
      radius: 350,
      isActive: true
    }
  ];

  const activeZonesList = document.getElementById('activeZonesList');
  const activeZoneCount = document.getElementById('activeZoneCount');

  function renderGeofenceList() {
    if (!activeZonesList) return;

    activeZonesList.innerHTML = '';

    if (geofenceZones.length === 0) {
      activeZonesList.innerHTML = `
        <p class="text-muted" style="text-align: center; padding: 16px;">
          No boundaries configured yet. Use the form above to add one.
        </p>
      `;
      if (activeZoneCount) activeZoneCount.textContent = '0 Active';
      return;
    }

    geofenceZones.forEach((zone) => {
      const isSafe = zone.type === 'safe';
      const zoneClass = isSafe ? 'safe-zone' : 'danger-zone';
      const zoneIcon = isSafe ? 'verified_user' : 'warning';
      const typeLabel = isSafe ? 'Safe Zone' : 'Danger Zone';

      const zoneCardHtml = `
        <div class="zone-item ${zoneClass}" data-id="${zone.id}">
          <div class="zone-icon">
            <span class="material-symbols-outlined">${zoneIcon}</span>
          </div>

          <div class="zone-details">
            <h4>${zone.name}</h4>
            <span class="zone-meta">${typeLabel} • ${zone.radius}m radius</span>
          </div>

          <div class="zone-actions">
            <label class="toggle-switch" title="Enable/Disable Zone">
              <input 
                type="checkbox" 
                class="zone-toggle" 
                data-id="${zone.id}" 
                ${zone.isActive ? 'checked' : ''}
              >
              <span class="slider"></span>
            </label>

            <button 
              class="btn-icon danger btn-delete-zone" 
              data-id="${zone.id}" 
              title="Delete Boundary"
            >
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      `;

      activeZonesList.insertAdjacentHTML('beforeend', zoneCardHtml);
    });

    updateActiveCount();
  }

  function updateActiveCount() {
    const activeCount = geofenceZones.filter(z => z.isActive).length;
    if (activeZoneCount) {
      activeZoneCount.textContent = `${activeCount} Active`;
    }
  }

  renderGeofenceList();


  // =========================================================================
  // FUNCTIONALITY 4: ADD NEW BOUNDARY VIA FORM SUBMISSION
  // =========================================================================
  const geofenceForm = document.getElementById('geofenceForm');
  const zoneNameInput = document.getElementById('zoneName');
  const zoneTypeSelect = document.getElementById('zoneType');

  if (geofenceForm) {
    geofenceForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = zoneNameInput.value.trim();
      const type = zoneTypeSelect.value;
      const radius = parseInt(zoneRadiusInput.value, 10);

      if (!name) return;

      const newZone = {
        id: Date.now(),
        name: name,
        type: type,
        radius: radius,
        isActive: true
      };

      geofenceZones.push(newZone);
      renderGeofenceList();

      geofenceForm.reset();
      if (radiusValueDisplay) {
        radiusValueDisplay.textContent = '200';
      }
    });
  }


  // =========================================================================
  // FUNCTIONALITY 5: TOGGLING ACTIVE STATES & DELETING BOUNDARIES
  // =========================================================================
  if (activeZonesList) {

    activeZonesList.addEventListener('click', (event) => {
      const deleteBtn = event.target.closest('.btn-delete-zone');
      
      if (deleteBtn) {
        const zoneId = Number(deleteBtn.dataset.id);
        geofenceZones = geofenceZones.filter(zone => zone.id !== zoneId);
        renderGeofenceList();
      }
    });

    activeZonesList.addEventListener('change', (event) => {
      if (event.target.classList.contains('zone-toggle')) {
        const zoneId = Number(event.target.dataset.id);
        const targetZone = geofenceZones.find(zone => zone.id === zoneId);
        if (targetZone) {
          targetZone.isActive = event.target.checked;
          updateActiveCount();
        }
      }
    });

  }


// =========================================================================
  // FUNCTIONALITY 6: LIVE GOOGLE MAP INTEGRATION & DYNAMIC RADIUS CIRCLE
  // =========================================================================
  const mapElement = document.getElementById('geofenceMap');

  if (mapElement && typeof google !== 'undefined') {
    // 1. Clear placeholder HTML text
    mapElement.innerHTML = '';

    // Default map coordinates (Yaoundé center)
    const defaultPos = { lat: 3.8480, lng: 11.5021 };

    // 2. Initialize Google Map with Dark Theme Styling
    const map = new google.maps.Map(mapElement, {
      center: defaultPos,
      zoom: 14,
      disableDefaultUI: false,
      zoomControl: true,
      // Custom Dark Theme styles matching your interface
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1d283c" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1d283c" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#182333" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c3b52" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1f293d" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] }
      ]
    });

    // 3. Create initial Center Pin Marker
    const marker = new google.maps.Marker({
      position: defaultPos,
      map: map,
      title: "Selected Zone Center"
    });

    // 4. Create Geofence Perimeter Visual Circle
    let currentRadius = parseInt(zoneRadiusInput ? zoneRadiusInput.value : 200, 10);

    const fenceCircle = new google.maps.Circle({
      strokeColor: "#10b981",    // Green boundary line
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#10b981",      // Semi-transparent green fill
      fillOpacity: 0.2,
      map: map,
      center: defaultPos,
      radius: currentRadius      // In meters
    });

    // 5. Connect Radius Slider to Google Maps Circle
    if (zoneRadiusInput) {
      zoneRadiusInput.addEventListener('input', (e) => {
        const newRadius = parseInt(e.target.value, 10);
        fenceCircle.setRadius(newRadius);
      });
    }

    // 6. Handle Clicks on Map to Reposition Pin & Boundary Circle
    map.addListener('click', (event) => {
      const clickedPos = event.latLng;

      // Move marker and fence circle center
      marker.setPosition(clickedPos);
      fenceCircle.setCenter(clickedPos);
    });
  }

});