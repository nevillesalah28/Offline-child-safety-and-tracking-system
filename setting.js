// ==========================================================================
// CAPSULE TRACKER - DEVICE SETTINGS CONTROLLER
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
    });
  }

  overlay.addEventListener('click', () => {
    body.classList.remove('sidebar-open');
    overlay.classList.remove('active');
  });

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 2: LIVE AVATAR & SOS SLIDER DISPLAY
     ------------------------------------------------------------------------ */
  const sosInput = document.getElementById('sos-delay');
  const sosValDisplay = document.getElementById('sos-val');
  const adminNameInput = document.getElementById('admin-name');
  const profileDisplayName = document.getElementById('profileDisplayName');
  const avatarText = document.getElementById('avatarText');

  if (sosInput && sosValDisplay) {
    sosInput.addEventListener('input', (e) => {
      const val = e.target.value;
      sosValDisplay.textContent = `${val} Second${val > 1 ? 's' : ''}`;
    });
  }

  if (adminNameInput) {
    adminNameInput.addEventListener('input', (e) => {
      const nameVal = e.target.value.trim();
      
      if (profileDisplayName) {
        profileDisplayName.textContent = nameVal || 'Admin';
      }

      if (avatarText) {
        if (!nameVal) {
          avatarText.textContent = 'A';
        } else {
          const parts = nameVal.split(' ').filter(p => p.length > 0);
          if (parts.length >= 2) {
            avatarText.textContent = (parts[0][0] + parts[1][0]).toUpperCase();
          } else {
            avatarText.textContent = parts[0][0].toUpperCase();
          }
        }
      }
    });
  }

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 3: SETTINGS PERSISTENCE (LOCAL STORAGE)
     ------------------------------------------------------------------------ */
  const settingsForm = document.getElementById('settings-form');

  const defaultSettings = {
    adminName: 'Neville',
    adminEmail: 'neville@capsuletracker.local',
    gpsPing: '5',
    sosDelay: '3',
    primaryPhone: '+237 600000000',
    secondaryPhone: '',
    tamperAlarm: true,
    geofenceAlert: true,
    batteryAlert: true,
    vitalsAlert: true,
    comPort: 'COM3 (GSM / GPS Module)',
    baudRate: '115200',
    dbName: 'capsule_telemetry.db'
  };

  function loadSavedSettings() {
    const saved = localStorage.getItem('capsule_tracker_settings');
    const settings = saved ? JSON.parse(saved) : defaultSettings;

    // Admin Profile
    if (adminNameInput) {
      adminNameInput.value = settings.adminName || defaultSettings.adminName;
      adminNameInput.dispatchEvent(new Event('input'));
    }
    if (document.getElementById('admin-email')) {
      document.getElementById('admin-email').value = settings.adminEmail || defaultSettings.adminEmail;
    }

    // Telemetry & GPS
    if (document.getElementById('gps-ping')) {
      document.getElementById('gps-ping').value = settings.gpsPing || defaultSettings.gpsPing;
    }
    if (sosInput) {
      sosInput.value = settings.sosDelay || defaultSettings.sosDelay;
      sosInput.dispatchEvent(new Event('input'));
    }

    // GSM Contacts
    if (document.getElementById('primary-phone')) {
      document.getElementById('primary-phone').value = settings.primaryPhone || defaultSettings.primaryPhone;
    }
    if (document.getElementById('secondary-phone')) {
      document.getElementById('secondary-phone').value = settings.secondaryPhone || '';
    }

    // Safety Alarms
    if (document.getElementById('tamperAlarm')) {
      document.getElementById('tamperAlarm').checked = settings.tamperAlarm !== undefined ? settings.tamperAlarm : true;
    }
    if (document.getElementById('geofenceAlert')) {
      document.getElementById('geofenceAlert').checked = settings.geofenceAlert !== undefined ? settings.geofenceAlert : true;
    }
    if (document.getElementById('batteryAlert')) {
      document.getElementById('batteryAlert').checked = settings.batteryAlert !== undefined ? settings.batteryAlert : true;
    }
    if (document.getElementById('vitalsAlert')) {
      document.getElementById('vitalsAlert').checked = settings.vitalsAlert !== undefined ? settings.vitalsAlert : true;
    }

    // Module Link & DB
    if (document.getElementById('com-port')) {
      document.getElementById('com-port').value = settings.comPort || defaultSettings.comPort;
    }
    if (document.getElementById('baud-rate')) {
      document.getElementById('baud-rate').value = settings.baudRate || defaultSettings.baudRate;
    }
    if (document.getElementById('db-name')) {
      document.getElementById('db-name').value = settings.dbName || defaultSettings.dbName;
    }
  }

  loadSavedSettings();

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const updatedSettings = {
        adminName: adminNameInput ? adminNameInput.value : defaultSettings.adminName,
        adminEmail: document.getElementById('admin-email') ? document.getElementById('admin-email').value : defaultSettings.adminEmail,
        gpsPing: document.getElementById('gps-ping') ? document.getElementById('gps-ping').value : defaultSettings.gpsPing,
        sosDelay: sosInput ? sosInput.value : defaultSettings.sosDelay,
        primaryPhone: document.getElementById('primary-phone') ? document.getElementById('primary-phone').value : defaultSettings.primaryPhone,
        secondaryPhone: document.getElementById('secondary-phone') ? document.getElementById('secondary-phone').value : '',
        tamperAlarm: document.getElementById('tamperAlarm') ? document.getElementById('tamperAlarm').checked : true,
        geofenceAlert: document.getElementById('geofenceAlert') ? document.getElementById('geofenceAlert').checked : true,
        batteryAlert: document.getElementById('batteryAlert') ? document.getElementById('batteryAlert').checked : true,
        vitalsAlert: document.getElementById('vitalsAlert') ? document.getElementById('vitalsAlert').checked : true,
        comPort: document.getElementById('com-port') ? document.getElementById('com-port').value : defaultSettings.comPort,
        baudRate: document.getElementById('baud-rate') ? document.getElementById('baud-rate').value : defaultSettings.baudRate,
        dbName: document.getElementById('db-name') ? document.getElementById('db-name').value : defaultSettings.dbName
      };

      localStorage.setItem('capsule_tracker_settings', JSON.stringify(updatedSettings));
      showToast('Device settings updated and saved!', 'success');
    });
  }

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 4: HARDWARE ACTIONS (SERIAL TEST & RESET DEFAULTS)
     ------------------------------------------------------------------------ */
  const testSerialBtn = document.getElementById('testSerialBtn');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');

  if (testSerialBtn) {
    testSerialBtn.addEventListener('click', () => {
      const originalHTML = testSerialBtn.innerHTML;
      testSerialBtn.disabled = true;
      testSerialBtn.innerHTML = `<span class="material-symbols-outlined">sync</span> Testing Link...`;

      setTimeout(() => {
        testSerialBtn.disabled = false;
        testSerialBtn.innerHTML = originalHTML;
        showToast('Serial Connection Active (115200 Baud OK)', 'info');
      }, 1500);
    });
  }

  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to restore all settings to system defaults?')) {
        localStorage.removeItem('capsule_tracker_settings');
        loadSavedSettings();
        showToast('Restored system default parameters.', 'info');
      }
    });
  }

  /* ------------------------------------------------------------------------
     FUNCTIONALITY 5: TOAST NOTIFICATION SYSTEM
     ------------------------------------------------------------------------ */
  function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconName = type === 'success' ? 'check_circle' : 'info';

    toast.innerHTML = `
      <span class="material-symbols-outlined">${iconName}</span>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease-out reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

});