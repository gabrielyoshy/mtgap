const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // call from renderer to tell main to ignore or accept mouse events
  setIgnoreMouseEvents: (ignore) => ipcRenderer.invoke('set-ignore-mouse-events', ignore),
  // move overlay to display index (0 = primary)
  moveToDisplay: (index) => ipcRenderer.invoke('move-to-display', index),
});
