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
    gainNode.gain.value = 1;
  }
}

function connectElement(element) {
  if (connectedElements.has(element)) return;
  
  initAudioContext();
  if (!audioCtx) return;

  try {
    const source = audioCtx.createMediaElementSource(element);
    source.connect(gainNode);
    connectedElements.add(element);
  } catch (err) {
    console.warn(err);
  }
}

function scanAndConnect() {
  const mediaElements = document.querySelectorAll('video, audio');
  mediaElements.forEach(connectElement);
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
            connectElement(node);
          } else {
            const media = node.querySelectorAll ? node.querySelectorAll('video, audio') : [];
            media.forEach(connectElement);
          }
        }
      });
    }
  });
});

observer.observe(document.body || document.documentElement, {
  childList: true,
  subtree: true
});

scanAndConnect();
window.addEventListener('DOMContentLoaded', scanAndConnect);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === 'setVolume') {
    const volumePercent = request.value;
    const gainValue = volumePercent / 100;
    
    initAudioContext();
    if (gainNode) {
      gainNode.gain.value = gainValue;
      
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
  }
});

chrome.storage.local.get(['volume'], (result) => {
  if (result.volume) {
    const gainValue = result.volume / 100;
    initAudioContext();
    if (gainNode) {
      gainNode.gain.value = gainValue;
    }
  }
});
