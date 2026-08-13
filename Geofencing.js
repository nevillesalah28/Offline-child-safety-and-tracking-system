// ==========================================================================
// CAPSULE TRACKER - GEOFENCING LOGIC & MAP ENGINE
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 1: REAL-TIME RADIUS SLIDER DISPLAY
     ------------------------------------------------------------------------ */
  const zoneRadiusInput = document.getElementById('zoneRadius');
  const radiusValueDisplay = document.getElementById('radiusValue');

  if (zoneRadiusInput && radiusValueDisplay) {
    zoneRadiusInput.addEventListener('input', (event) => {
      radiusValueDisplay.textContent = event.target.value;
    });
  }

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 2: SIDEBAR TOGGLE & OFF-CANVAS RESPONSIVE DRAWER
     ------------------------------------------------------------------------ */
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

      setTimeout(() => {
        if (mapInstance && typeof google !== 'undefined') {
          google.maps.event.trigger(mapInstance, 'resize');
        }
      }, 300);
    });
  }

  overlay.addEventListener('click', () => {
    body.classList.remove('sidebar-open');
    overlay.classList.remove('active');
  });

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 3: BOUNDARIES DATA & API INTEGRATION
     ------------------------------------------------------------------------ */
  let geofenceZones = [];

  const activeZonesList = document.getElementById('activeZonesList');
  const activeZoneCount = document.getElementById('activeZoneCount');

  // FETCH ALL GEOFENCES FROM DATABASE
  async function loadGeofences() {
    try {
      const response = await fetch('get_geofences.php');
      const rawText = await response.text();
      let data;

      try {
        data = JSON.parse(rawText);
      } catch (e) {
        console.error('Invalid JSON from get_geofences.php:', rawText);
        return;
      }

      if (data.status === 'success') {
        geofenceZones = data.geofences.map(zone => ({
          id: zone.id,
          name: zone.name,
          type: zone.type,
          radius: zone.radius,
          lat: zone.centerLat,
          lng: zone.centerLng,
          isActive: zone.isActive
        }));

        renderGeofenceList();
        updateMapCircles();
      } else {
        console.error('Failed to load geofences:', data.message);
      }
    } catch (error) {
      console.error('API Error (loadGeofences):', error);
    }
  }

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

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 4: SAVE NEW BOUNDARY TO DATABASE VIA API
     ------------------------------------------------------------------------ */
  const geofenceForm = document.getElementById('geofenceForm');
  const zoneNameInput = document.getElementById('zoneName');
  const zoneTypeSelect = document.getElementById('zoneType');

  let currentSelectedPos = { lat: 3.8480, lng: 11.5021 };

  if (geofenceForm) {
    geofenceForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const submitBtn = geofenceForm.querySelector('button[type="submit"]');
      const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

      const name = zoneNameInput.value.trim();
      const type = zoneTypeSelect.value;
      const radius = parseInt(zoneRadiusInput.value, 10);

      if (!name) {
        alert('Please enter a boundary name.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> Saving...';
      }

      const payload = {
        name: name,
        type: type,
        radius: radius,
        centerLat: currentSelectedPos.lat,
        centerLng: currentSelectedPos.lng
      };

      try {
        const response = await fetch('save_geofence.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const rawText = await response.text();
        let data;

        try {
          data = JSON.parse(rawText);
        } catch (jsonErr) {
          console.error('PHP Output error:', rawText);
          alert('Backend PHP Error:\n' + rawText.substring(0, 300));
          return;
        }

        if (data.status === 'success') {
          await loadGeofences();
          geofenceForm.reset();
          if (radiusValueDisplay) {
            radiusValueDisplay.textContent = '200';
          }
        } else {
          alert('Error saving geofence: ' + data.message);
        }
      } catch (error) {
        console.error('API Error (save_geofence):', error);
        alert('Network Error: Could not reach save_geofence.php');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    });
  }

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 5: TOGGLING ACTIVE STATES & DELETING FROM DATABASE
     ------------------------------------------------------------------------ */
  if (activeZonesList) {

    // DELETE GEOFENCE
    activeZonesList.addEventListener('click', async (event) => {
      const deleteBtn = event.target.closest('.btn-delete-zone');
      
      if (deleteBtn) {
        const zoneId = Number(deleteBtn.dataset.id);

        try {
          const response = await fetch('delete_geofence.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: zoneId })
          });

          const rawText = await response.text();
          let data;
          try {
            data = JSON.parse(rawText);
          } catch (e) {
            alert('Backend error deleting boundary:\n' + rawText.substring(0, 200));
            return;
          }

          if (data.status === 'success') {
            await loadGeofences();
          } else {
            alert('Error deleting zone: ' + data.message);
          }
        } catch (error) {
          console.error('API Error (delete_geofence):', error);
        }
      }
    });

    // TOGGLE GEOFENCE ACTIVE STATE
    activeZonesList.addEventListener('change', async (event) => {
      if (event.target.classList.contains('zone-toggle')) {
        const zoneId = Number(event.target.dataset.id);
        const isChecked = event.target.checked;

        try {
          const response = await fetch('toggle_geofence.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: zoneId, isActive: isChecked })
          });

          const rawText = await response.text();
          let data;
          try {
            data = JSON.parse(rawText);
          } catch (e) {
            event.target.checked = !isChecked;
            alert('Backend error updating status:\n' + rawText.substring(0, 200));
            return;
          }

          if (data.status === 'success') {
            const targetZone = geofenceZones.find(z => z.id === zoneId);
            if (targetZone) targetZone.isActive = isChecked;
            updateActiveCount();
            updateMapCircles();
          } else {
            event.target.checked = !isChecked;
            alert('Failed to update zone status: ' + data.message);
          }
        } catch (error) {
          console.error('API Error (toggle_geofence):', error);
          event.target.checked = !isChecked;
        }
      }
    });

  }

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 6: LIVE GOOGLE MAP INTEGRATION & DYNAMIC RADIUS CIRCLES
     ------------------------------------------------------------------------ */
  let mapInstance = null;
  let previewMarker = null;
  let previewCircle = null;
  let activeMapCircles = [];

  const YAOUNDE_CENTER = { lat: 3.8480, lng: 11.5021 };

  function initGeofenceMap() {
    const mapElement = document.getElementById('geofenceMap');
    if (!mapElement || typeof google === 'undefined') return;

    mapElement.innerHTML = '';

    mapInstance = new google.maps.Map(mapElement, {
      center: YAOUNDE_CENTER,
      zoom: 14,
      disableDefaultUI: false,
      zoomControl: true,
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

    previewMarker = new google.maps.Marker({
      position: YAOUNDE_CENTER,
      map: mapInstance,
      title: "New Boundary Center",
      draggable: true
    });

    let currentRadius = parseInt(zoneRadiusInput ? zoneRadiusInput.value : 200, 10);
    previewCircle = new google.maps.Circle({
      strokeColor: "#38bdf8",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#38bdf8",
      fillOpacity: 0.15,
      map: mapInstance,
      center: YAOUNDE_CENTER,
      radius: currentRadius
    });

    if (zoneRadiusInput) {
      zoneRadiusInput.addEventListener('input', (e) => {
        const newRadius = parseInt(e.target.value, 10);
        previewCircle.setRadius(newRadius);
      });
    }

    if (zoneTypeSelect) {
      zoneTypeSelect.addEventListener('change', (e) => {
        const isSafe = e.target.value === 'safe';
        const color = isSafe ? '#10b981' : '#ef4444';
        previewCircle.setOptions({ strokeColor: color, fillColor: color });
      });
    }

    mapInstance.addListener('click', (event) => {
      currentSelectedPos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      previewMarker.setPosition(currentSelectedPos);
      previewCircle.setCenter(currentSelectedPos);
    });

    previewMarker.addListener('dragend', (event) => {
      currentSelectedPos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      previewCircle.setCenter(currentSelectedPos);
    });

    updateMapCircles();
  }

  function updateMapCircles() {
    if (!mapInstance) return;

    activeMapCircles.forEach(circle => circle.setMap(null));
    activeMapCircles = [];

    geofenceZones.forEach(zone => {
      if (!zone.isActive) return;

      const isSafe = zone.type === 'safe';
      const color = isSafe ? '#22c55e' : '#ef4444';

      const circle = new google.maps.Circle({
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.2,
        map: mapInstance,
        center: { lat: zone.lat, lng: zone.lng },
        radius: zone.radius
      });

      activeMapCircles.push(circle);
    });
  }

  // Load geofences independently on DOM ready
  loadGeofences();

  // Initialize Map Engine
  if (typeof google !== 'undefined') {
    initGeofenceMap();
  } else {
    window.addEventListener('load', initGeofenceMap);
  }

});