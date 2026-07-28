// Global State variables tracking latest biometrics
let currentHR = 84;
let currentTemp = 34.0;

// Helper function to push new log entries into the Telemetry Table
function logTelemetry(statusText, statusClass) {
  const telemetryTable = document.getElementById('telemetryTable').querySelector('tbody');
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newRow = document.createElement('tr');
  
  newRow.innerHTML = `
    <td>${currentTime}</td>
    <td>${currentHR} BPM</td>
    <td>${currentTemp}°C</td>
    <td class="${statusClass}">${statusText}</td>
  `;
  telemetryTable.insertBefore(newRow, telemetryTable.firstChild);
}

// 1. Heart Rate Logic Handler
function updateHeartRate(hrVal) {
  currentHR = hrVal;
  const hrValueEl = document.getElementById('hrValue');
  const hrStatusEl = document.getElementById('hrStatus');
  const hrAlertBox = document.getElementById('hrAlertBox');

  hrValueEl.textContent = hrVal;

  let statusText = '';
  let statusClass = '';
  let alertMsg = '';

  // High Heart Rate threshold (> 100 BPM)
  if (hrVal > 100) {
    statusText = 'Abnormal (High)';
    statusClass = 'rose';
    alertMsg = '⚠️ Warning: High heart rate detected! Child may be stressed, exercising, or feverish.';
    hrAlertBox.className = 'alert-box high';
  } 
  // Low Heart Rate threshold (< 60 BPM)
  else if (hrVal < 60) {
    statusText = 'Abnormal (Low)';
    statusClass = 'amber';
    alertMsg = '⚠️ Warning: Low heart rate detected! Pulse rate is abnormally low.';
    hrAlertBox.className = 'alert-box low';
  } 
  // Normal Resting Range
  else {
    statusText = 'Normal Resting';
    statusClass = 'green';
    alertMsg = '';
    hrAlertBox.className = 'alert-box';
  }

  hrStatusEl.textContent = statusText;
  hrStatusEl.className = statusClass;
  hrAlertBox.textContent = alertMsg;

  logTelemetry(statusText, statusClass);
}

// 2. Temperature Logic Handler
function updateTemperature(tempVal) {
  currentTemp = tempVal;
  const tempValueEl = document.getElementById('tempValue');
  const tempStatusEl = document.getElementById('tempStatus');
  const tempAlertBox = document.getElementById('tempAlertBox');

  tempValueEl.textContent = tempVal;

  let statusText = '';
  let statusClass = '';
  let alertMsg = '';

  // High Temperature threshold (> 37.5°C)
  if (tempVal > 37.5) {
    statusText = 'Abnormal (High)';
    statusClass = 'rose';
    alertMsg = '⚠️ Warning: High temperature detected. Child may be sick or feverish!';
    tempAlertBox.className = 'alert-box high';
  } 
  // Low Temperature threshold (< 35.0°C)
  else if (tempVal < 35.0) {
    statusText = 'Abnormal (Low)';
    statusClass = 'amber';
    alertMsg = '⚠️ Warning: Low temperature detected. Hypothermia risk!';
    tempAlertBox.className = 'alert-box low';
  } 
  // Optimal range
  else {
    statusText = 'Optimal Range';
    statusClass = 'green';
    alertMsg = '';
    tempAlertBox.className = 'alert-box';
  }

  tempStatusEl.textContent = statusText;
  tempStatusEl.className = statusClass;
  tempAlertBox.textContent = alertMsg;

  logTelemetry(statusText, statusClass);
}

// DOM Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const addBandBtn = document.getElementById('addBandBtn');
  const addBandModal = document.getElementById('addBandModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const addBandForm = document.getElementById('addBandForm');
  const sidebarNav = document.getElementById('sidebarNav');

  // Modal Triggers
  addBandBtn.addEventListener('click', () => addBandModal.classList.add('active'));
  closeModalBtn.addEventListener('click', () => addBandModal.classList.remove('active'));
  addBandModal.addEventListener('click', (e) => {
    if (e.target === addBandModal) addBandModal.classList.remove('active');
  });

  // Add New Band Dynamic Handler
  addBandForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('childName').value.trim();
    const bandId = document.getElementById('bandId').value.trim();
    const radius = document.getElementById('safeRadius').value.trim();

    if (!name || !bandId) return;

    const newCard = document.createElement('div');
    newCard.className = 'card full-width device-card';
    newCard.innerHTML = `
      <div class="status">
        <div class="child-info">
          <h3>
            <svg class="icon icon-blue" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            ${name}'s Smart Safety Band
          </h3>
          <p class="device-name">Band ID: ${bandId}</p>
          <div class="active-indicator">
            <span class="dot"></span>
            <span class="green">Active & Synchronized</span>
            <span class="small">• ${radius || 300} Meter Safe Radius</span>
          </div>
        </div>
        <div class="badge">Connected</div>
      </div>
    `;

    addBandBtn.parentNode.insertBefore(newCard, addBandBtn);
    addBandForm.reset();
    addBandModal.classList.remove('active');
  });

  // Sidebar Active Navigation Switcher
  const links = sidebarNav.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
});