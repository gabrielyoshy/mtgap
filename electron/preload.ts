import { contextBridge, ipcRenderer } from 'electron';

// Definimos la API que Angular podrá ver
contextBridge.exposeInMainWorld('electronAPI', {
  // Angular escucha actualizaciones del draft
  onDraftUpdate: (callback: (data: any) => void) =>
    ipcRenderer.on('draft-update', (_event, value) => callback(value)),

  onDraftPick: (callback: (data: any) => void) =>
    ipcRenderer.on('draft-pick', (_event, value) => callback(value)),

  // Angular pide iniciar la lectura de logs
  startLogWatcher: () => ipcRenderer.send('start-watching-logs'),

  simulateDraft: () => ipcRenderer.send('dev-simulate-draft'),
  simulate2Booster: () => ipcRenderer.send('dev-simulate-2-booster'),

  onDraftDeckLoaded: (callback: (data: any) => void) =>
    ipcRenderer.on('draft-deck-loaded', (_event, value) => callback(value)),
});
