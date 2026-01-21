// Electron preload script - runs before web content loads
// This is the secure way to expose limited Node.js functionality to the renderer

const { contextBridge } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron,
});

console.log('Preload script loaded');
