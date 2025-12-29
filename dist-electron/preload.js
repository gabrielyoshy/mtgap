"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Definimos la API que Angular podrá ver
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Angular escucha actualizaciones del draft
    onDraftUpdate: (callback) => electron_1.ipcRenderer.on('draft-update', (_event, value) => callback(value)),
    // Angular pide iniciar la lectura de logs
    startLogWatcher: () => electron_1.ipcRenderer.send('start-watching-logs'),
    setIgnoreMouseEvents: (ignore) => {
        if (ignore) {
            // forward: true es CRÍTICO: permite que el mouse "pase" pero que JavaScript
            // aún detecte el movimiento (para saber cuándo volvemos a entrar al menú)
            electron_1.ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
        }
        else {
            electron_1.ipcRenderer.send('set-ignore-mouse-events', false);
        }
    },
    simulateDraft: () => electron_1.ipcRenderer.send('dev-simulate-draft'),
});
//# sourceMappingURL=preload.js.map