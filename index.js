// ==========================================================================
// CAPSULE TRACKER - LIVE DASHBOARD & MAP LOGIC
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 1: SIDEBAR TOGGLE & OFF-CANVAS RESPONSIVE DRAWER
     ------------------------------------------------------------------------ */
  const sidebarToggleBtn = document.getElementById('sidebarToggle');
  const body = document.body;

  // Create dynamic dim backdrop overlay for mobile screen drawer view
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      // Small screen view toggle (< 992px)
      if (window.innerWidth <= 992) {
        body.classList.toggle('sidebar-open');
        overlay.classList.toggle('active');
      } else {
        // Desktop collapse view toggle
        body.classList.toggle('sidebar-collapsed');
      }

      // Trigger Google Map resize on layout shift
      setTimeout(() => {
        if (mapInstance && typeof google !== 'undefined') {
          google.maps.event.trigger(mapInstance, 'resize');
          if (window.telemetryState) {
            mapInstance.setCenter({ 
              lat: window.telemetryState.lat, 
              lng: window.telemetryState.lng 
            });
          }
        }
      }, 300);
    });
  }

  // Close sidebar drawer when clicking on the dark backdrop
  overlay.addEventListener('click', () => {
    body.classList.remove('sidebar-open');
    overlay.classList.remove('active');
  });

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 2: REAL-TIME VITALS & TELEMETRY STREAM ENGINE
     ------------------------------------------------------------------------ */
  const hrElement = document.getElementById('hrValue');
  const spo2Element = document.getElementById('spo2Value');
  const bandBatElement = document.getElementById('bandBatValue');
  const gpsCoordsElement = document.getElementById('gpsCoords');

  window.telemetryState = {
    heartRate: 78,
    spo2: 98,
    battery: 92,
    lat: 3.8480,
    lng: 11.5021,
    lastUpdated: new Date()
  };

  function renderVitals() {
    if (hrElement) hrElement.textContent = telemetryState.heartRate;
    if (spo2Element) spo2Element.textContent = telemetryState.spo2;
    if (bandBatElement) bandBatElement.textContent = telemetryState.battery;
    
    if (gpsCoordsElement) {
      const latFormatted = telemetryState.lat.toFixed(4);
      const lngFormatted = telemetryState.lng.toFixed(4);
      gpsCoordsElement.textContent = `${latFormatted}° N, ${lngFormatted}° E`;
    }
  }

  function simulateIncomingLoRaPacket() {
    telemetryState.heartRate = Math.floor(72 + Math.random() * 12);
    telemetryState.spo2 = Math.floor(96 + Math.random() * 4);
    telemetryState.lat += (Math.random() - 0.5) * 0.0001;
    telemetryState.lng += (Math.random() - 0.5) * 0.0001;
    telemetryState.lastUpdated = new Date();

    renderVitals();
    updateMapLocation();
  }

  renderVitals();
  setInterval(simulateIncomingLoRaPacket, 3000);

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 3: EMERGENCY & DEVICE QUICK CONTROLS
     ------------------------------------------------------------------------ */
  const pingBtn = document.getElementById('pingBtn');
  const sirenBtn = document.getElementById('sirenBtn');
  const tamperBadge = document.getElementById('tamperBadge');

  let isSirenActive = false;

  if (pingBtn) {
    pingBtn.addEventListener('click', () => {
      const originalHTML = pingBtn.innerHTML;
      pingBtn.disabled = true;
      pingBtn.innerHTML = `<span class="material-symbols-outlined">radar</span> Pinging...`;

      console.log('📡 [LoRa Tx]: Transmitting ping command to device...');

      setTimeout(() => {
        pingBtn.disabled = false;
        pingBtn.innerHTML = originalHTML;
      }, 2000);
    });
  }

  if (sirenBtn) {
    sirenBtn.addEventListener('click', () => {
      isSirenActive = !isSirenActive;

      if (isSirenActive) {
        sirenBtn.innerHTML = `<span class="material-symbols-outlined">volume_off</span> Silence Alarm`;
        
        if (tamperBadge) {
          tamperBadge.style.borderColor = 'rgba(239, 68, 68, 0.6)';
          tamperBadge.style.color = 'var(--status-danger)';
          tamperBadge.innerHTML = `<span class="material-symbols-outlined">warning</span> Wristband: <strong>SIREN ACTIVE</strong>`;
        }

        console.warn('🚨 [EMERGENCY COMMAND]: Broadcasted Siren Activation payload via LoRa!');
      } else {
        sirenBtn.innerHTML = `<span class="material-symbols-outlined">campaign</span> Sound Alarm`;

        if (tamperBadge) {
          tamperBadge.style.borderColor = 'rgba(34, 197, 94, 0.4)';
          tamperBadge.style.color = 'var(--status-success)';
          tamperBadge.innerHTML = `<span class="material-symbols-outlined">lock</span> Wristband: <strong>Secured</strong>`;
        }

        console.log('✅ [Command Sent]: Alarm silenced, returning to normal state.');
      }
    });
  }

  /* Initialize Google Maps Engine */
  if (typeof google !== 'undefined') {
    initGoogleMap();
  } else {
    window.addEventListener('load', initGoogleMap);
  }

});

/* ------------------------------------------------------------------------
   FUNCTIONALITY 4: LIVE GPS MAP ENGINE (GOOGLE MAPS DARK THEME)
   ------------------------------------------------------------------------ */
let mapInstance = null;
let wristbandMarker = null;

const YAOUNDE_CENTER = { lat: 3.8480, lng: 11.5021 };

function initGoogleMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer || typeof google === 'undefined') return;

  mapContainer.innerHTML = ''; 

  const initLat = window.telemetryState ? window.telemetryState.lat : YAOUNDE_CENTER.lat;
  const initLng = window.telemetryState ? window.telemetryState.lng : YAOUNDE_CENTER.lng;
  const initialPos = { lat: initLat, lng: initLng };

  // 1. Initialize Google Map with Custom Dark Theme Styling
  mapInstance = new google.maps.Map(mapContainer, { 
    center: initialPos,
    zoom: 15,
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

  // 2. Place Live Wristband Pin Marker
  wristbandMarker = new google.maps.Marker({
    position: initialPos,
    map: mapInstance,
    title: "Capsule Wristband"
  });

  // 3. Info Popup Window
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="color: #0f172a; font-family: sans-serif; font-size: 0.9rem;">
        <strong>Capsule Wristband</strong><br/>
        <span>Yaoundé Live Tracker</span>
      </div>
    `
  });

  wristbandMarker.addListener('click', () => {
    infoWindow.open(mapInstance, wristbandMarker);
  });

  console.log('🗺️ [Google Maps Engine]: Live Dashboard map initialized successfully.');
}

function updateMapLocation() {
  if (mapInstance && wristbandMarker && window.telemetryState) {
    const newPos = { lat: window.telemetryState.lat, lng: window.telemetryState.lng };
    
    // Smoothly pan map and relocate the pin marker when telemetry arrives
    wristbandMarker.setPosition(newPos);
    mapInstance.panTo(newPos);
  }
}