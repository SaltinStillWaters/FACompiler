chrome.runtime.onInstalled.addListener(() => {
    console.log("Background service worker is installed.");
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);
    // Perform any background processing here
    sendResponse({status: 'Received your message'});
  });
  