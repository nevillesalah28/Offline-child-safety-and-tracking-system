// Wait for the web page to load completely before running the code
document.addEventListener("DOMContentLoaded", () => {
  // 1. SELECT HTML ELEMENTS
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
  
  // Find buttons using their text content
  const resetButton = document.querySelector(".top-header .btn-secondary");
  const testSerialButton = document.querySelector(".db-action-row .btn");

  // ------------------------------------------------------------------
  // 2. HELPER FUNCTIONS
  // ------------------------------------------------------------------

  // Function to update the avatar initials (e.g., "Neville Short" -> "NS")
  function updateAvatarInitials(name) {
    if (!name.trim()) return;
    const nameParts = name.trim().split(" ");
    let initials = nameParts[0].charAt(0).toUpperCase();
    
    if (nameParts.length > 1) {
      initials += nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    }
    
    avatarPlaceholder.textContent = initials;
  }

  // Function to save all form values to the browser's storage (localStorage)
  function saveSettings() {
    const settingsData = {
      name: nameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
      loraFreq: loraFreqSelect.value,
      gpsPing: gpsPingSelect.value,
      sosDelay: sosDelayInput.value,
      comPort: comPortInput.value,
      baudRate: baudRateInput.value,
      dbName: dbNameInput.value,
    };

    // Save as a text string inside browser memory
    localStorage.setItem("capsuleSettings", JSON.stringify(settingsData));
    alert("Settings saved successfully!");
  }

  // Function to load saved settings when the page opens
  function loadSettings() {
    const savedData = localStorage.getItem("capsuleSettings");
    if (!savedData) return; // Stop if nothing was saved before

    const settings = JSON.parse(savedData);

    // Apply values back to input fields
    nameInput.value = settings.name || "Neville";
    emailInput.value = settings.email || "";
    passwordInput.value = settings.password || "";
    loraFreqSelect.value = settings.loraFreq || "915";
    gpsPingSelect.value = settings.gpsPing || "5";
    sosDelayInput.value = settings.sosDelay || "3";
    comPortInput.value = settings.comPort || "COM3 (LoRa Receiver)";
    baudRateInput.value = settings.baudRate || "115200";
    dbNameInput.value = settings.dbName || "capsule_telemetry.db";

    // Update text labels
    sosValText.innerText = sosDelayInput.value + " Seconds";
    updateAvatarInitials(nameInput.value);
  }

  // ------------------------------------------------------------------
  // 3. EVENT LISTENERS (Making buttons & inputs work)
  // ------------------------------------------------------------------

  // Update SOS display text when moving the range slider
  sosDelayInput.addEventListener("input", () => {
    sosValText.innerText = sosDelayInput.value + " Seconds";
  });

  // Update avatar initials while typing the name
  nameInput.addEventListener("input", () => {
    updateAvatarInitials(nameInput.value);
  });

  // Save settings when submitting the form
  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault(); // Prevents page reload
    saveSettings();
  });

  // Reset button logic
  resetButton.addEventListener("click", () => {
    if (confirm("Reset all fields to default values?")) {
      localStorage.removeItem("capsuleSettings");
      location.reload(); // Reloads page to show initial values
    }
  });

  // Simple test connection button feedback
  testSerialButton.addEventListener("click", () => {
    const port = comPortInput.value;
    testSerialButton.innerText = "Testing...";
    
    setTimeout(() => {
      alert("Successfully connected to " + port);
      testSerialButton.innerHTML = '<span class="material-symbols-outlined">cable</span> Test Serial Connection';
    }, 1000);
  });

  // ------------------------------------------------------------------
  // 4. INITIALIZE PAGE
  // ------------------------------------------------------------------
  loadSettings();
});