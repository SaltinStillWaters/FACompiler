(async () => {
  const src = chrome.runtime.getURL("quiz_loader.js");
  const contentScript = await import(src);
})();
