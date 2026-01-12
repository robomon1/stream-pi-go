// Robo-Stream Client - Touchscreen Optimized

let currentConfiguration = null;
let obsStatus = {
  streaming: false,
  recording: false,
  currentScene: '',
  virtualCamActive: false,
  replayBufferActive: false,
  studioModeActive: false
};
let sourceVisibility = {};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Robo-Stream Client starting...');
    
    // Setup event listeners FIRST (before backend emits events)
    setupEventListeners();
    
    // Then initialize app
    initializeApp();
    
    lucide.createIcons();
});

// Initialize application
async function initializeApp() {
    try {
        // Load server URL into settings
        const serverURL = await window.go.main.App.GetServerURL();
        document.getElementById('input-server-url').value = serverURL;

        // Get current configuration from backend
        // The backend's startup() already called connectAndLoad()
        // which should have emitted configuration_loaded event
        // But we'll also explicitly load it here in case we missed the event
        const config = await window.go.main.App.GetCurrentConfiguration();
        if (config) {
            handleConfigurationLoaded(config);
        }

        // Start status polling
        startStatusPolling();
    } catch (err) {
        console.error('Initialization error:', err);
        showConnectionBanner('Failed to initialize: ' + err, 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Settings button
    document.getElementById('btn-settings').addEventListener('click', openSettings);
    document.getElementById('btn-close-settings-modal').addEventListener('click', closeSettings);
    document.getElementById('btn-update-server').addEventListener('click', updateServerURL);

    // Config selector
    document.getElementById('btn-select-config').addEventListener('click', openConfigSelector);
    document.getElementById('btn-close-config-modal').addEventListener('click', closeConfigSelector);

    // Fullscreen (top bar)
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
        window.go.main.App.ToggleFullscreen();
    });

    // Listen for backend events
    window.runtime.EventsOn('connected', handleConnected);
    window.runtime.EventsOn('connection_error', handleConnectionError);
    window.runtime.EventsOn('configuration_loaded', handleConfigurationLoaded);
    window.runtime.EventsOn('config_error', handleConfigError);
}

// Handle connected event
function handleConnected(info) {
    console.log('Connected:', info);
    showConnectionBanner('Connected to server', 'connected');
    setTimeout(() => hideConnectionBanner(), 2000);
}

// Handle connection error
function handleConnectionError(error) {
    console.error('Connection error:', error);
    showConnectionBanner('Connection error: ' + error, 'error');
}

// Handle configuration loaded
function handleConfigurationLoaded(config) {
    console.log('Configuration loaded:', config.name, `(${config.grid.rows}x${config.grid.cols})`);
    console.log('Button count:', config.buttons.length);
    console.log('Buttons:', config.buttons.map(b => `${b.text} at (${b.row},${b.col})`));
    
    currentConfiguration = config;
    renderButtonGrid();
    document.getElementById('config-name').textContent = config.name;
    showConnectionBanner('Configuration loaded: ' + config.name, 'connected');
    setTimeout(() => hideConnectionBanner(), 2000);
}

// Handle config error
function handleConfigError(error) {
    console.error('Config error:', error);
    showConnectionBanner('Configuration error: ' + error, 'error');
}

// Render button grid
function renderButtonGrid() {
    if (!currentConfiguration) {
        console.log('No configuration to render');
        return;
    }

    const grid = document.getElementById('button-grid');
    
    // Thoroughly clear the grid
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }
    
    // Force a reflow to ensure DOM is cleared
    void grid.offsetHeight;

    const { rows, cols } = currentConfiguration.grid;
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    console.log(`Rendering ${rows}x${cols} grid with ${currentConfiguration.buttons.length} buttons`);

    // Create all cells in grid order
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Find button at this position
            const button = currentConfiguration.buttons.find(b => b.row === row && b.col === col);
            
            if (button) {
                renderButton(button);
            } else {
                renderEmptyCell();
            }
        }
    }

    // Reinitialize icons after a brief delay to ensure DOM is ready
    setTimeout(() => lucide.createIcons(), 50);
}

// Render a button
function renderButton(button) {
  const grid = document.getElementById('button-grid');
  const buttonEl = document.createElement('button');
  buttonEl.className = 'deck-button';
  buttonEl.style.backgroundColor = button.color;
  buttonEl.dataset.position = `btn-${button.row}-${button.col}`;
  buttonEl.dataset.buttonId = button.id;
  buttonEl.dataset.actionType = button.action.type; // Store action type
  
  // For scene buttons, store the scene name (it's in action.params.scene_name)
  if (button.action.type === 'switch_scene' && button.action.params?.scene_name) {
      buttonEl.dataset.sceneName = button.action.params.scene_name;
      console.log('Scene button created:', button.text, 'scene:', button.action.params.scene_name);
  }

  // For source visibility buttons, store params
  if ((button.action.type === 'toggle_source_visibility' ||
      button.action.type === 'show_source' ||
      button.action.type === 'hide_source') &&
      button.action.params) {
      buttonEl.dataset.sceneName = button.action.params.scene_name || '';
    buttonEl.dataset.sourceName = button.action.params.source_name || '';
    console.log('Source button created:', button.text, 
      'scene:', button.action.params.scene_name,
      'source:', button.action.params.source_name);
  }

  buttonEl.innerHTML = `
      <i data-lucide="${button.icon || 'square'}"></i>
      <span class="button-text">${button.text}</span>
  `;

  // Check if this button should show indicator based on current state
  updateButtonIndicator(buttonEl);

  // Press by position
  buttonEl.addEventListener('click', () => pressButton(`btn-${button.row}-${button.col}`, button.action.type));

  grid.appendChild(buttonEl);
}

// Check if a button should show the indicator based on current OBS state
function shouldShowIndicator(buttonEl) {
  const actionType = buttonEl.dataset.actionType;
  const sceneName = buttonEl.dataset.sceneName;
  
  // Check toggle actions
  if (isToggleAction(actionType)) {
      return isToggleActive(actionType);
  }
  
  // Check scene buttons
  if (actionType === 'switch_scene' && sceneName) {
      const matches = sceneName === obsStatus.currentScene;
      console.log('Scene check:', sceneName, 'vs current:', obsStatus.currentScene, '= match:', matches);
      return matches;
  }
  
  // Check source visibility buttons
  if (actionType === 'toggle_source_visibility' || 
    actionType === 'show_source' || 
    actionType === 'hide_source') {
    const buttonId = buttonEl.dataset.buttonId;
    const visible = sourceVisibility[buttonId] === true;
    console.log(`  Source button ${buttonId}: ${visible ? 'visible' : 'hidden'}`);
    return visible;
  }

  // ← ADD: Virtual Camera indicators
  if (actionType === 'start_virtual_cam') {
    return obsStatus.virtualCamActive;
  }
  if (actionType === 'stop_virtual_cam') {
    return !obsStatus.virtualCamActive;
  }
  if (actionType === 'toggle_virtual_cam') {
    return obsStatus.virtualCamActive;
  }

  // ← ADD: Studio Mode indicators
  if (actionType === 'toggle_studio_mode' || 
      actionType === 'enable_studio_mode' || 
      actionType === 'disable_studio_mode') {
    return obsStatus.studioModeActive;
  }
  if (actionType === 'trigger_transition') {
    return obsStatus.studioModeActive;
  }

  return false;
}

// Check if action type is a toggle
function isToggleAction(actionType) {
  const toggleActions = [
      'toggle_stream',
      'start_stream',
      'stop_stream',
      'toggle_record',
      'start_record',
      'stop_record',
      'toggle_replay_buffer',
      'start_replay_buffer',
      'stop_replay_buffer',
      'toggle_virtual_cam',     // ← ADD
      'start_virtual_cam',      // ← ADD
      'stop_virtual_cam'        // ← ADD
  ];
  return toggleActions.includes(actionType);
}

// Check if toggle is active
function isToggleActive(actionType) {
  // Start actions: show indicator when state IS active
  if (actionType === 'start_stream') return obsStatus.streaming;
  if (actionType === 'start_record') return obsStatus.recording;
  if (actionType === 'start_replay_buffer') return obsStatus.replayBufferActive;  // ← FIX
  if (actionType === 'start_virtual_cam') return obsStatus.virtualCamActive;      // ← ADD
  
  // Stop actions: show indicator when state is NOT active (stopped)
  if (actionType === 'stop_stream') return !obsStatus.streaming;
  if (actionType === 'stop_record') return !obsStatus.recording;
  if (actionType === 'stop_replay_buffer') return !obsStatus.replayBufferActive;  // ← FIX
  if (actionType === 'stop_virtual_cam') return !obsStatus.virtualCamActive;      // ← ADD
  
  // Toggle actions: show indicator when state IS active
  if (actionType === 'toggle_stream') return obsStatus.streaming;
  if (actionType === 'toggle_record') return obsStatus.recording;
  if (actionType === 'toggle_replay_buffer') return obsStatus.replayBufferActive; // ← FIX
  if (actionType === 'toggle_virtual_cam') return obsStatus.virtualCamActive;     // ← ADD
  
  return false;
}

// Update indicator for a specific button
function updateButtonIndicator(buttonEl) {
    if (shouldShowIndicator(buttonEl)) {
        buttonEl.classList.add('recording');
    } else {
        buttonEl.classList.remove('recording');
    }
}

// Update all button indicators
function updateAllIndicators() {
    const buttons = document.querySelectorAll('.deck-button');
    let indicatorCount = 0;
    
    buttons.forEach(button => {
        const hadIndicator = button.classList.contains('recording');
        updateButtonIndicator(button);
        const hasIndicator = button.classList.contains('recording');
        
        if (hasIndicator) {
            indicatorCount++;
            if (!hadIndicator) {
                console.log('Adding indicator to:', button.dataset.actionType, button.dataset.sceneName);
            }
        } else if (hadIndicator) {
            console.log('Removing indicator from:', button.dataset.actionType, button.dataset.sceneName);
        }
    });
    
    console.log(`Updated indicators: ${indicatorCount} buttons active`);
}

// Render empty cell
function renderEmptyCell() {
    const grid = document.getElementById('button-grid');
    const emptyEl = document.createElement('div');
    emptyEl.className = 'empty-cell';
    grid.appendChild(emptyEl);
}

// Press button by position
async function pressButton(position, actionType) {
    // console.log('Button pressed:', position, 'action:', actionType);

    // Visual feedback
    const button = document.querySelector(`[data-position="${position}"]`);
    if (button) {
        button.classList.add('pressed');
        setTimeout(() => button.classList.remove('pressed'), 200);
    }

    try {
        await window.go.main.App.PressButton(position);
        
        // Update indicators immediately after pressing toggle or scene buttons
        if (isToggleAction(actionType) || actionType === 'switch_scene') {
            setTimeout(() => updateStatusFromBackend(), 100);
        }

        // Update source visibility immediately
        if (actionType === 'toggle_source_visibility' || 
          actionType === 'show_source' || 
          actionType === 'hide_source') {
          setTimeout(() => updateSourceVisibility(), 500);
        }

    } catch (err) {
        console.error('Failed to press button:', err);
        alert('Error: ' + err);
    }
}

// Start status polling
function startStatusPolling() {
  // Poll every 2 seconds
  setInterval(async () => {
      await updateStatusFromBackend();
      await updateSourceVisibility();  // ← ADD THIS
  }, 2000);
}

// Update status from backend
async function updateStatusFromBackend() {
  try {
      const status = await window.go.main.App.GetOBSStatus();
      
      // Track what changed
      const streamingChanged = obsStatus.streaming !== (status.streaming || false);
      const recordingChanged = obsStatus.recording !== (status.recording || false);
      const sceneChanged = obsStatus.currentScene !== (status.current_scene || '');
      const virtualCamChanged = obsStatus.virtualCamActive !== (status.virtual_cam_active || false);        // ← ADD
      const replayBufferChanged = obsStatus.replayBufferActive !== (status.replay_buffer_active || false); // ← ADD
      const studioModeChanged = obsStatus.studioModeActive !== (status.studio_mode_active || false);       // ← ADD
      
      // Update state
      obsStatus.streaming = status.streaming || false;
      obsStatus.recording = status.recording || false;
      obsStatus.currentScene = status.current_scene || '';
      obsStatus.virtualCamActive = status.virtual_cam_active || false;        // ← ADD
      obsStatus.replayBufferActive = status.replay_buffer_active || false;    // ← ADD
      obsStatus.studioModeActive = status.studio_mode_active || false;        // ← ADD
      
      // Debug log ALL status updates to see what we're getting
      console.log('Status update:', {
          streaming: obsStatus.streaming,
          recording: obsStatus.recording,
          currentScene: obsStatus.currentScene,
          virtualCamActive: obsStatus.virtualCamActive,        // ← ADD
          replayBufferActive: obsStatus.replayBufferActive,    // ← ADD
          studioModeActive: obsStatus.studioModeActive         // ← ADD
      });
      
      // Debug log significant changes
      if (streamingChanged) {
          console.log('Streaming state changed:', obsStatus.streaming);
      }
      if (recordingChanged) {
          console.log('Recording state changed:', obsStatus.recording);
      }
      if (sceneChanged) {
          console.log('Scene changed:', obsStatus.currentScene);
      }
      if (virtualCamChanged) {                                                // ← ADD
          console.log('Virtual Camera changed:', obsStatus.virtualCamActive);
      }
      if (replayBufferChanged) {                                              // ← ADD
          console.log('Replay Buffer changed:', obsStatus.replayBufferActive);
      }
      if (studioModeChanged) {                                                // ← ADD
          console.log('Studio Mode changed:', obsStatus.studioModeActive);
      }
      
      // Update all indicators if anything changed
      if (streamingChanged || recordingChanged || sceneChanged || 
          virtualCamChanged || replayBufferChanged || studioModeChanged) {    // ← ADD
          updateAllIndicators();
      }
  } catch (err) {
      console.error('Failed to get status:', err);
  }
}

// Open settings modal
function openSettings() {
    document.getElementById('settings-modal').classList.add('open');
    setTimeout(() => lucide.createIcons(), 100);
}

// Close settings modal
function closeSettings() {
    document.getElementById('settings-modal').classList.remove('open');
}

// Update server URL
async function updateServerURL() {
    const url = document.getElementById('input-server-url').value.trim();
    
    if (!url) {
        alert('Please enter a server URL');
        return;
    }

    try {
        await window.go.main.App.SetServerURL(url);
        closeSettings();
        showConnectionBanner('Connecting to ' + url + '...', 'connecting');
        
        // Reload configuration after URL change
        setTimeout(() => loadConfiguration(), 1000);
    } catch (err) {
        console.error('Failed to update server URL:', err);
        alert('Error: ' + err);
    }
}

// Open configuration selector
async function openConfigSelector() {
    try {
        const configurations = await window.go.main.App.GetConfigurations();
        renderConfigList(configurations);
        document.getElementById('config-modal').classList.add('open');
        setTimeout(() => lucide.createIcons(), 100);
    } catch (err) {
        console.error('Failed to load configurations:', err);
        alert('Error loading configurations: ' + err);
    }
}

// Close configuration selector
function closeConfigSelector() {
    document.getElementById('config-modal').classList.remove('open');
}

// Render configuration list
function renderConfigList(configurations) {
    const list = document.getElementById('config-list');
    list.innerHTML = '';

    if (configurations.length === 0) {
        list.innerHTML = '<p class="empty-message">No configurations available</p>';
        return;
    }

    configurations.forEach(config => {
        const item = document.createElement('div');
        item.className = 'config-item';
        if (currentConfiguration && config.id === currentConfiguration.id) {
            item.classList.add('active');
        }

        // Count buttons from the map
        const buttonCount = config.buttons ? Object.keys(config.buttons).length : 0;

        item.innerHTML = `
            <div class="config-item-header">
                <span class="config-item-name">${config.name}</span>
                ${config.is_default ? '<span class="config-badge">Default</span>' : ''}
            </div>
            <div class="config-item-description">${config.description || ''}</div>
            <div class="config-item-meta">
                <span>${config.grid.rows}×${config.grid.cols} grid</span>
                <span>•</span>
                <span>${buttonCount} buttons</span>
            </div>
        `;

        item.addEventListener('click', async () => {
            try {
                await window.go.main.App.LoadConfiguration(config.id);
                closeConfigSelector();
            } catch (err) {
                console.error('Failed to load configuration:', err);
                alert('Error loading configuration: ' + err);
            }
        });

        list.appendChild(item);
    });
}

// Show connection banner
function showConnectionBanner(message, type) {
    const banner = document.getElementById('connection-banner');
    const messageEl = document.getElementById('banner-message');
    
    messageEl.textContent = message;
    banner.className = 'banner show ' + type;
}

// Hide connection banner
function hideConnectionBanner() {
    const banner = document.getElementById('connection-banner');
    banner.classList.remove('show');
}

// Update source visibility for all source buttons
async function updateSourceVisibility() {
  // console.log('🔍 Checking source visibility...');
  
  const buttons = document.querySelectorAll('.deck-button');
  
  for (const buttonEl of buttons) {
      const actionType = buttonEl.dataset.actionType;
      
      if (actionType === 'toggle_source_visibility' || 
          actionType === 'show_source' || 
          actionType === 'hide_source') {
          
          const buttonId = buttonEl.dataset.buttonId;
          
          // Find the button data to get params
          if (currentConfiguration && currentConfiguration.buttons) {
              const button = currentConfiguration.buttons.find(b => b.id === buttonId);
              if (button && button.action && button.action.params) {
                  const sceneName = button.action.params.scene_name;
                  const sourceName = button.action.params.source_name;
                  
                  if (sceneName && sourceName) {
                      try {
                          const visible = await window.go.main.App.GetSourceVisibility(sceneName, sourceName);
                          sourceVisibility[buttonId] = visible;
                          buttonEl.dataset.sourceVisible = visible ? 'true' : 'false';
                          console.log(`  ${sourceName}: ${visible ? 'visible ✅' : 'hidden ❌'}`);
                      } catch (err) {
                          console.log(`  ${sourceName}: error (${err})`);
                          sourceVisibility[buttonId] = false;
                          buttonEl.dataset.sourceVisible = 'false';
                      }
                  }
              }
          }
      }
  }
  
  // console.log('📊 Source visibility version:', sourceVisibilityVersion);
  updateAllIndicators();
}
