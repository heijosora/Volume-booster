document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('volumeSlider');
  const valueDisplay = document.getElementById('volumeValue');
  const resetBtn = document.getElementById('resetBtn');
  const boostBtn = document.getElementById('boostBtn');

  chrome.storage.local.get(['volume'], (result) => {
    const volume = result.volume || 100;
    if (volume > 200) {
      slider.max = 300;
    }
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
    slider.max = 200;
    updateUI(volume);
    sendVolumeToActiveTab(volume);
    saveVolume(volume);
  });

  boostBtn.addEventListener('click', () => {
    const volume = 300;
    slider.max = 300;
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
          console.log(err);
        });
      }
    });
  }
});
