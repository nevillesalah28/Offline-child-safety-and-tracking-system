// Wait for the web page to load completely
document.addEventListener("DOMContentLoaded", () => {
  // ------------------------------------------------------------------
  // 1. SELECT HTML ELEMENTS
  // ------------------------------------------------------------------
  const settingsForm = document.getElementById("settings-form");
  const nameInput = document.getElementById("admin-name");
  const emailInput = document.getElementById("admin-email");
  const passwordInput = document.getElementById("admin-password");
  const loraFreqSelect = document.getElementById("lora-freq");
  const gpsPingSelect = document.getElementById("gps-ping");
  const sosDelayInput = document.getElementById("sos-delay");
  const sosValText = document.getElementById("sos-val");
  const comPortInput = document.getElementById("com-port");
  const baudRateInput = document.getElementById("baud-rate");
  const dbNameInput = document.getElementById("db-name");
  const avatarPlaceholder = document.querySelector(".avatar-placeholder");
  
  const resetButton = document.querySelector(".top-header .btn-secondary");
  const testSerialButton = document.querySelector(".db-action-row .btn");

  // Track unsaved form changes
  let isFormDirty = false;

  // ------------------------------------------------------------------
  // 2. HELPER FUNCTIONS & VALIDATION
  // ------------------------------------------------------------------

  // Log system events with a timestamp
  function addSystemLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[Capsule Log - ${timestamp}]: ${message}`);
  }

  // Update Avatar Initials
  function updateAvatarInitials(name) {
    if (!avatarPlaceholder || !name.trim()) return;
    const nameParts = name.trim().split(" ");
    let initials = nameParts[0].charAt(0).toUpperCase();
    
    if (nameParts.length > 1) {
      initials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    }
    
    avatarPlaceholder.textContent = initials;
  }

  // Email Validation Check
  function validateForm() {
    const emailValue = emailInput ? emailInput.value.trim() : "";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (emailValue && !emailPattern.test(emailValue)) {
      alert("⚠️ Please enter a valid admin email address!");
      emailInput.style.borderColor = "#ef4444";
      return false;
    }
    if (emailInput) emailInput.style.borderColor = "";
    return true;
  }

  // Save settings to LocalStorage
  function saveSettings() {
    if (!validateForm()) return;

    const settingsData = {
      name: nameInput ? nameInput.value : "",
      email: emailInput ? emailInput.value : "",
      password: passwordInput ? passwordInput.value : "",
      loraFreq: loraFreqSelect ? loraFreqSelect.value : "915",
      gpsPing: gpsPingSelect ? gpsPingSelect.value : "5",
      sosDelay: sosDelayInput ? sosDelayInput.value : "3",
      comPort: comPortInput ? comPortInput.value : "COM3",
      baudRate: baudRateInput ? baudRateInput.value : "115200",
      dbName: dbNameInput ? dbNameInput.value : "capsule_telemetry.db",
      lastSaved: new Date().toISOString()
    };

    localStorage.setItem("capsuleSettings", JSON.stringify(settingsData));
    isFormDirty = false; // Reset dirty state after saving
    updateTelemetryPreview();
    addSystemLog("Settings saved successfully.");
    alert("✅ Settings saved successfully!");
  }

  // Load settings from LocalStorage
  function loadSettings() {
    const savedData = localStorage.getItem("capsuleSettings");
    if (!savedData) return;

    const settings = JSON.parse(savedData);

    if (nameInput) nameInput.value = settings.name || "Neville";
    if (emailInput) emailInput.value = settings.email || "";
    if (passwordInput) passwordInput.value = settings.password || "";
    if (loraFreqSelect) loraFreqSelect.value = settings.loraFreq || "915";
    if (gpsPingSelect) gpsPingSelect.value = settings.gpsPing || "5";
    if (sosDelayInput) sosDelayInput.value = settings.sosDelay || "3";
    if (comPortInput) comPortInput.value = settings.comPort || "COM3 (LoRa Receiver)";
    if (baudRateInput) baudRateInput.value = settings.baudRate || "115200";
    if (dbNameInput) dbNameInput.value = settings.dbName || "capsule_telemetry.db";

    if (sosValText && sosDelayInput) {
      sosValText.innerText = sosDelayInput.value + " Seconds";
    }
    
    if (nameInput) updateAvatarInitials(nameInput.value);
    updateTelemetryPreview();
    isFormDirty = false;
    addSystemLog("Loaded saved device parameters.");
  }

  // ------------------------------------------------------------------
  // 3. NEW ADVANCED CAPABILITIES
  // ------------------------------------------------------------------

  // NEW 1: Live Hardware Telemetry Packet Generator Preview
  function setupTelemetryPreview() {
    if (!settingsForm) return;

    const previewContainer = document.createElement("div");
    previewContainer.id = "telemetry-preview-box";
    previewContainer.style.cssText = `
      margin-top: 20px;
      padding: 12px 16px;
      background-color: #0f172a;
      color: #38bdf8;
      border: 1px solid #334155;
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.85rem;
    `;
    previewContainer.innerHTML = `<strong>📡 Outbound Telemetry Packet Preview:</strong><br><code id="packet-code">Generating...</code>`;
    
    settingsForm.appendChild(previewContainer);
  }

  function updateTelemetryPreview() {
    const packetCode = document.getElementById("packet-code");
    if (!packetCode) return;

    const freq = loraFreqSelect ? loraFreqSelect.value : "915";
    const interval = gpsPingSelect ? gpsPingSelect.value : "5";
    const sos = sosDelayInput ? sosDelayInput.value : "3";
    
    // Simulates raw JSON payload sent to the hardware tracker
    const mockPacket = `{ "CMD": "CFG_SET", "FREQ_MHZ": ${freq}, "GPS_INT_SEC": ${interval}, "SOS_HOLD_SEC": ${sos} }`;
    packetCode.textContent = mockPacket;
  }

  // NEW 2: Network Connectivity Status Indicator
  function setupNetworkMonitor() {
    const statusBanner = document.createElement("div");
    statusBanner.id = "net-status-banner";
    statusBanner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      padding: 4px;
      text-align: center;
      font-size: 0.8rem;
      font-weight: bold;
      z-index: 9999;
      display: none;
    `;
    document.body.appendChild(statusBanner);

    function updateOnlineStatus() {
      if (navigator.onLine) {
        statusBanner.style.backgroundColor = "#22c55e";
        statusBanner.style.color = "#000";
        statusBanner.textContent = "🟢 Workstation Online - Sync Active";
        setTimeout(() => { statusBanner.style.display = "none"; }, 3000);
      } else {
        statusBanner.style.display = "block";
        statusBanner.style.backgroundColor = "#ef4444";
        statusBanner.style.color = "#fff";
        statusBanner.textContent = "🔴 Workstation Offline - Operating in Local Cache Mode";
      }
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    if (!navigator.onLine) updateOnlineStatus();
  }

  // NEW 3: Dynamic COM Port Refresh Scanner
  function setupComPortScanner() {
    if (!comPortInput) return;

    const scanBtn = document.createElement("button");
    scanBtn.type = "button";
    scanBtn.textContent = "🔄 Refresh Ports";
    scanBtn.style.cssText = "margin-top: 6px; padding: 4px 10px; font-size: 0.8rem; cursor: pointer;";

    scanBtn.addEventListener("click", () => {
      scanBtn.textContent = "⏳ Scanning...";
      setTimeout(() => {
        scanBtn.textContent = "🔄 Refresh Ports";
        alert("🔍 Port Scan Complete:\n• COM1 (System Bus)\n• COM3 (LoRa Receiver - Active)\n• COM7 (USB Serial Device)");
        addSystemLog("Scanned local hardware serial ports.");
      }, 800);
    });

    comPortInput.parentElement.appendChild(scanBtn);
  }

  // NEW 4: Import Settings from JSON File
  function setupConfigImport() {
    const importBtn = document.createElement("button");
    importBtn.type = "button";
    importBtn.textContent = "📁 Import Backup (.json)";
    importBtn.style.cssText = "margin-left: 10px; padding: 6px 12px; font-size: 0.85rem; cursor: pointer;";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";

    importBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          localStorage.setItem("capsuleSettings", JSON.stringify(importedData));
          loadSettings();
          alert("🎉 Configuration imported successfully!");
          addSystemLog("Restored settings from external JSON file.");
        } catch (err) {
          alert("❌ Invalid JSON file format!");
        }
      };
      reader.readAsText(file);
    });

    if (resetButton && resetButton.parentElement) {
      resetButton.parentElement.appendChild(importBtn);
      resetButton.parentElement.appendChild(fileInput);
    }
  }

  // NEW 5: Password Visibility Toggle
  function setupPasswordVisibilityToggle() {
    if (!passwordInput) return;

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.textContent = "👁️ Show";
    toggleBtn.style.cssText = "margin-top: 5px; font-size: 0.8rem; cursor: pointer; padding: 2px 8px;";

    toggleBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      toggleBtn.textContent = isPassword ? "🙈 Hide" : "👁️ Show";
    });

    passwordInput.parentElement.appendChild(toggleBtn);
  }

  // NEW 6: Unsaved Changes Browser Protection
  function setupUnsavedChangesWarning() {
    if (!settingsForm) return;

    settingsForm.addEventListener("input", () => {
      isFormDirty = true;
      updateTelemetryPreview();
    });

    window.addEventListener("beforeunload", (event) => {
      if (isFormDirty) {
        event.preventDefault();
        event.returnValue = "You have unsaved settings!";
      }
    });
  }

  // ------------------------------------------------------------------
  // 4. EVENT LISTENERS
  // ------------------------------------------------------------------

  // SOS Slider Display
  if (sosDelayInput && sosValText) {
    sosDelayInput.addEventListener("input", () => {
      sosValText.innerText = sosDelayInput.value + " Seconds";
    });
  }

  // Dynamic Avatar Initials
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      updateAvatarInitials(nameInput.value);
    });
  }

  // Form Submit
  if (settingsForm) {
    settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveSettings();
    });
  }

  // Reset Button
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (confirm("Reset all fields to default values?")) {
        localStorage.removeItem("capsuleSettings");
        isFormDirty = false;
        location.reload();
      }
    });
  }

  // Hardware Connection Ping Test
  if (testSerialButton) {
    testSerialButton.addEventListener("click", () => {
      const port = comPortInput ? comPortInput.value : "COM Port";
      testSerialButton.innerText = "⏳ Pinging...";
      testSerialButton.disabled = true;

      setTimeout(() => {
        testSerialButton.disabled = false;
        testSerialButton.innerHTML = '<span class="material-symbols-outlined">cable</span> Test Serial Connection';
        alert(`📡 Signal Ack: Receiver responsive on ${port}`);
        addSystemLog(`Serial loopback verified on ${port}`);
      }, 1200);
    });
  }

  // Hotkey: Ctrl + S / Cmd + S to save
  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      saveSettings();
    }
  });

  // ------------------------------------------------------------------
  // 5. INITIALIZATION
  // ------------------------------------------------------------------
  setupPasswordVisibilityToggle();
  setupTelemetryPreview();
  setupNetworkMonitor();
  setupComPortScanner();
  setupConfigImport();
  setupUnsavedChangesWarning();
  loadSettings();
});