// Wait for the web page DOM to fully load
document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Grab UI Elements
  const pingBtn = document.getElementById("pingBtn");
  const sirenBtn = document.getElementById("sirenBtn");
  const hrValue = document.getElementById("hrValue");
  const spo2Value = document.getElementById("spo2Value");

  // 2. Add Event Listener for 'Ping Wristband' button
  if (pingBtn) {
    pingBtn.addEventListener("click", () => {
      alert("📡 Pinging wristband... Signal sent via LoRa!");
    });
  }

  // 3. Add Event Listener for 'Sound Alarm' button
  if (sirenBtn) {
    sirenBtn.addEventListener("click", () => {
      const confirmAlarm = confirm("⚠️ Are you sure you want to trigger the emergency siren on the wristband?");
      if (confirmAlarm) {
        alert("🚨 Emergency Siren Activated!");
      }
    });
  }

  // 4. Simulate Live Vital Updates (Heart Rate & SpO2)
  setInterval(() => {
    if (hrValue && spo2Value) {
      // Generate slight fluctuations for a realistic live telemetry effect
      const randomHR = Math.floor(Math.random() * (85 - 72 + 1)) + 72; // 72 - 85 BPM
      const randomSpO2 = Math.floor(Math.random() * (100 - 97 + 1)) + 97; // 97 - 100%

      hrValue.textContent = randomHR;
      spo2Value.textContent = randomSpO2;
    }
  }, 3000); // Updates every 3 seconds

});
// Initialize Leaflet Interactive Map
const mapElement = document.getElementById("map");

if (mapElement) {
  // Clear the placeholder text
  mapElement.innerHTML = ""; 

  // Coordinates (e.g., Yaoundé default coords from your layout: 3.8480, 11.5021)
  const initialLat = 3.8480;
  const initialLng = 11.5021;

  // Render Map
  const map = L.map('map').setView([initialLat, initialLng], 15);

  // Add OpenStreetMap Tile Layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Add Live Pin Marker
  const marker = L.marker([initialLat, initialLng]).addTo(map)
    .bindPopup('<b>Child Location</b><br>Wristband Active')
    .openPopup();
}