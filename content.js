let audioCtx;
let gainNode;
const connectedElements = new WeakSet();

function initAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    audioCtx = new AudioContext();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 1; // Default to 100%
  }
}

function connectElement(element) {
  if (connectedElements.has(element)) return;
  
  // Initialize context if needed
  initAudioContext();
  if (!audioCtx) return;

  try {
    // If the element is already connected to an audio context by the page, 
    // this might fail or steal the audio.
    const source = audioCtx.createMediaElementSource(element);
    source.connect(gainNode);
    connectedElements.add(element);
    console.log('Volume Booster: Connected to media element', element);
  } catch (err) {
    // This often happens if the element is already connected to another AudioContext
    // or if there are CORS issues (MediaElementAudioSource outputs zeroes for CORS-restricted media).
    console.warn('Volume Booster: Could not connect to element', err);
  }
}

function scanAndConnect() {
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(connectElement);
}

// Observer for new media elements
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
            connectElement(node);
          } else {
            // Check children
            const media = node.querySelectorAll ? node.querySelectorAll('video, audio') : [];
            media.forEach(connectElement);
          }
        }
      });
    }
  });
});

// Start observing
observer.observe(document.body || document.documentElement, {
  childList: true,
  subtree: true
});

// Initial scan
// We might run before body is fully loaded, so we try now and also on DOMContentLoaded
scanAndConnect();
window.addEventListener('DOMContentLoaded', scanAndConnect);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'setVolume') {
    const volumePercent = request.value;
    const gainValue = volumePercent / 100;
    
    initAudioContext();
    if (gainNode) {
      gainNode.gain.value = gainValue;
      
      // Resume context if it was suspended (browser policy)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
  }
});

// Restore volume from storage on load (optional, if we want persistence per tab or global)
// For now, we rely on the popup sending the value when opened, or we can fetch it here.
chrome.storage.local.get(['volume'], (result) => {
  if (result.volume) {
    const gainValue = result.volume / 100;
    initAudioContext();
    if (gainNode) {
      gainNode.gain.value = gainValue;
    }
  }
});
