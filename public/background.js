// Itt lehet a háttérlogika (event handling, message routing, stb.)
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});
