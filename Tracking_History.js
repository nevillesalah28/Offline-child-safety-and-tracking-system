// ==========================================================================
// CAPSULE TRACKER - TRACKING HISTORY LOGIC & REPLAY ENGINE
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 1: SIDEBAR TOGGLE & OFF-CANVAS RESPONSIVE DRAWER
     ------------------------------------------------------------------------ */
  const sidebarToggleBtn = document.getElementById('sidebarToggle');
  const body = document.body;

  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 992) {
        body.classList.toggle('sidebar-open');
        overlay.classList.toggle('active');
      } else {
        body.classList.toggle('sidebar-collapsed');
      }

      // Resize map on drawer transition
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
     FUNCTIONALITY 2: GPS BREADCRUMB ROUTE DATA (20 WAYPOINTS)
     ------------------------------------------------------------------------ */
  const routeData = [
    { time: '08:00:00 WAT', lat: 3.8480, lng: 11.5021 },
    { time: '08:20:00 WAT', lat: 3.8485, lng: 11.5028 },
    { time: '08:40:00 WAT', lat: 3.8492, lng: 11.5034 },
    { time: '09:00:00 WAT', lat: 3.8501, lng: 11.5042 },
    { time: '09:20:00 WAT', lat: 3.8510, lng: 11.5050 },
    { time: '09:40:00 WAT', lat: 3.8518, lng: 11.5055 },
    { time: '10:00:00 WAT', lat: 3.8522, lng: 11.5060 },
    { time: '10:30:00 WAT', lat: 3.8524, lng: 11.5062 },
    { time: '11:00:00 WAT', lat: 3.8523, lng: 11.5061 },
    { time: '11:30:00 WAT', lat: 3.8525, lng: 11.5063 },
    { time: '12:00:00 WAT', lat: 3.8528, lng: 11.5065 },
    { time: '12:40:00 WAT', lat: 3.8530, lng: 11.5068 },
    { time: '13:15:00 WAT', lat: 3.8525, lng: 11.5061 },
    { time: '13:45:00 WAT', lat: 3.8521, lng: 11.5059 },
    { time: '14:10:00 WAT', lat: 3.8515, lng: 11.5052 },
    { time: '14:22:00 WAT', lat: 3.8508, lng: 11.5045 },
    { time: '14:35:00 WAT', lat: 3.8498, lng: 11.5038 },
    { time: '14:45:00 WAT', lat: 3.8490, lng: 11.5030 },
    { time: '15:00:00 WAT', lat: 3.8483, lng: 11.5024 },
    { time: '15:05:00 WAT', lat: 3.8482, lng: 11.5025 }
  ];

  const pointCountBadge = document.getElementById('pointCountBadge');
  if (pointCountBadge) {
    pointCountBadge.textContent = `${routeData.length} Points Logged`;
  }

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 3: GOOGLE MAPS ROUTE REPLAY & POLYLINE ENGINE
     ------------------------------------------------------------------------ */
  let mapInstance = null;
  let polyline = null;
  let playbackMarker = null;
  let isPlaying = false;
  let playbackInterval = null;
  let currentIndex = 0;

  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const timeSlider = document.getElementById('timeSlider');
  const currentTimeDisplay = document.getElementById('currentTimeDisplay');

  if (timeSlider) {
    timeSlider.min = 0;
    timeSlider.max = routeData.length - 1;
    timeSlider.value = 0;
  }

  function initHistoryMap() {
    const mapContainer = document.getElementById('historyMap');
    if (!mapContainer || typeof google === 'undefined') return;

    mapContainer.innerHTML = '';

    const startPos = { lat: routeData[0].lat, lng: routeData[0].lng };

    // 1. Map Initialization
    mapInstance = new google.maps.Map(mapContainer, {
      center: startPos,
      zoom: 15,
      disableDefaultUI: false,
      zoomControl: true,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1d283c" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1d283c" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c3b52" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] }
      ]
    });

    // 2. Cyan Polyline Path
    const pathCoords = routeData.map(point => ({ lat: point.lat, lng: point.lng }));
    polyline = new google.maps.Polyline({
      path: pathCoords,
      geodesic: true,
      strokeColor: '#38bdf8',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: mapInstance
    });

    // 3. Start Point Marker (A)
    new google.maps.Marker({
      position: pathCoords[0],
      map: mapInstance,
      title: "Route Start (08:00 WAT)",
      label: { text: "A", color: "#ffffff", fontWeight: "bold" }
    });

    // 4. End Point Marker (B)
    new google.maps.Marker({
      position: pathCoords[pathCoords.length - 1],
      map: mapInstance,
      title: "Route End (15:05 WAT)",
      label: { text: "B", color: "#ffffff", fontWeight: "bold" }
    });

    // 5. Animated Playback Marker
    playbackMarker = new google.maps.Marker({
      position: pathCoords[0],
      map: mapInstance,
      title: "Capsule Position",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: "#22c55e",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2
      }
    });

    updatePlaybackPosition(0);
  }

  function updatePlaybackPosition(index) {
    currentIndex = index;
    const point = routeData[index];
    if (!point) return;

    const newPos = { lat: point.lat, lng: point.lng };

    if (playbackMarker) {
      playbackMarker.setPosition(newPos);
    }
    if (mapInstance) {
      mapInstance.panTo(newPos);
    }
    if (timeSlider) {
      timeSlider.value = index;
    }
    if (currentTimeDisplay) {
      currentTimeDisplay.textContent = point.time;
    }
  }

  function startPlayback() {
    isPlaying = true;
    if (playIcon) playIcon.textContent = 'pause';

    playbackInterval = setInterval(() => {
      currentIndex++;
      if (currentIndex >= routeData.length) {
        currentIndex = 0; // Loop back
      }
      updatePlaybackPosition(currentIndex);
    }, 1000);
  }

  function pausePlayback() {
    isPlaying = false;
    if (playIcon) playIcon.textContent = 'play_arrow';
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (isPlaying) {
        pausePlayback();
      } else {
        startPlayback();
      }
    });
  }

  if (timeSlider) {
    timeSlider.addEventListener('input', (e) => {
      pausePlayback();
      updatePlaybackPosition(parseInt(e.target.value, 10));
    });
  }

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 4: TIMELINE LOG EVENT FILTERING
     ------------------------------------------------------------------------ */
  const eventFilter = document.getElementById('eventFilter');
  const timelineContainer = document.getElementById('timelineLog');

  if (eventFilter && timelineContainer) {
    eventFilter.addEventListener('change', (e) => {
      const filterValue = e.target.value.toLowerCase();
      const items = timelineContainer.querySelectorAll('.timeline-item');

      items.forEach(item => {
        const dataType = (item.getAttribute('data-type') || '').toLowerCase();
        const isAlertClass = item.classList.contains('alert');

        if (filterValue === 'all') {
          item.style.display = 'flex';
        } else if (filterValue === 'alerts') {
          item.style.display = (isAlertClass || dataType.includes('alerts') || dataType.includes('geofence')) ? 'flex' : 'none';
        } else if (filterValue === 'geofence') {
          item.style.display = dataType.includes('geofence') ? 'flex' : 'none';
        } else if (filterValue === 'vitals') {
          item.style.display = dataType.includes('vitals') ? 'flex' : 'none';
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 5: DATE FILTER LISTENER
     ------------------------------------------------------------------------ */
  const historyDate = document.getElementById('historyDate');
  if (historyDate) {
    historyDate.addEventListener('change', () => {
      pausePlayback();
      updatePlaybackPosition(0);
    });
  }

  if (typeof google !== 'undefined') {
    initHistoryMap();
  } else {
    window.addEventListener('load', initHistoryMap);
  }

});