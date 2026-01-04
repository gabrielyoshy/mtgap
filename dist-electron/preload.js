"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Definimos la API que Angular podrá ver
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Angular escucha actualizaciones del draft
    onDraftUpdate: (callback) => electron_1.ipcRenderer.on('draft-update', (_event, value) => callback(value)),
    onDraftPick: (callback) => electron_1.ipcRenderer.on('draft-pick', (_event, value) => callback(value)),
    // Angular pide iniciar la lectura de logs
    startLogWatcher: () => electron_1.ipcRenderer.send('start-watching-logs'),
    simulateDraft: () => electron_1.ipcRenderer.send('dev-simulate-draft'),
    simulate2Booster: () => electron_1.ipcRenderer.send('dev-simulate-2-booster'),
    onDraftDeckLoaded: (callback) => electron_1.ipcRenderer.on('draft-deck-loaded', (_event, value) => callback(value)),
});
//# sourceMappingURL=preload.js.map