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

      // Recalculate map dimensions on layout shift
      setTimeout(() => {
        if (mapInstance) mapInstance.invalidateSize();
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

  // Load online Leaflet map engine
  loadLeafletCDNAndInit();
});

/* ------------------------------------------------------------------------
   FUNCTIONALITY 4: ONLINE GPS MAP ENGINE (LEAFLET + CARTODB DARK)
   ------------------------------------------------------------------------ */
let mapInstance = null;
let wristbandMarker = null;

const YAOUNDE_CENTER = [3.8480, 11.5021];

function loadLeafletCDNAndInit() {
  if (!document.getElementById('leaflet-css')) {
    const cssLink = document.createElement('link');
    cssLink.id = 'leaflet-css';
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);
  }

  if (window.L) {
    initMap();
  } else {
    const jsScript = document.createElement('script');
    jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    jsScript.onload = () => initMap();
    document.head.appendChild(jsScript);
  }
}

function initMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  mapContainer.innerHTML = ''; 

  mapInstance = L.map('map', { 
    zoomControl: true,
    attributionControl: false 
  }).setView(YAOUNDE_CENTER, 15);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(mapInstance);

  const initLat = window.telemetryState ? window.telemetryState.lat : YAOUNDE_CENTER[0];
  const initLng = window.telemetryState ? window.telemetryState.lng : YAOUNDE_CENTER[1];

  wristbandMarker = L.marker([initLat, initLng]).addTo(mapInstance);
  wristbandMarker.bindPopup('<b>Capsule Wristband</b><br>Yaoundé Tracker').openPopup();

  console.log('🗺️ [Online Map Engine]: Online Leaflet map initialized for Yaoundé.');
}

function updateMapLocation() {
  if (mapInstance && wristbandMarker && window.telemetryState) {
    const newPos = [window.telemetryState.lat, window.telemetryState.lng];
    wristbandMarker.setLatLng(newPos);
    mapInstance.panTo(newPos, { animate: true });
  }
}