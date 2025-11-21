document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('volumeSlider');
  const valueDisplay = document.getElementById('volumeValue');
  const resetBtn = document.getElementById('resetBtn');

  // Load saved volume
  chrome.storage.local.get(['volume'], (result) => {
    const volume = result.volume || 100;
    updateUI(volume);
    sendVolumeToActiveTab(volume);
  });

  slider.addEventListener('input', (e) => {
    const volume = e.target.value;
    updateUI(volume);
    sendVolumeToActiveTab(volume);
    saveVolume(volume);
  });

  resetBtn.addEventListener('click', () => {
    const volume = 100;
    updateUI(volume);
    sendVolumeToActiveTab(volume);
    saveVolume(volume);
  });

  function updateUI(volume) {
    slider.value = volume;
    valueDisplay.textContent = volume;
  }

  function saveVolume(volume) {
    chrome.storage.local.set({ volume: volume });
  }

  function sendVolumeToActiveTab(volume) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          command: 'setVolume',
          value: parseInt(volume)
        }).catch(err => {
          // Ignore errors if content script isn't ready or page doesn't support it
          console.log('Could not send volume to tab:', err);
        });
      }
    });
  }
});
