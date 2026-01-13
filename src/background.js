// Background script for browser extension
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('PickColor installed');
  } else if (details.reason === 'update') {
    console.log('PickColor updated');
  }
});

