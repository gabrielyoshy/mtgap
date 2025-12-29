import { contextBridge, ipcRenderer } from 'electron';

// Definimos la API que Angular podrá ver
contextBridge.exposeInMainWorld('electronAPI', {
  // Angular escucha actualizaciones del draft
  onDraftUpdate: (callback: (data: any) => void) =>
    ipcRenderer.on('draft-update', (_event, value) => callback(value)),

  // Angular pide iniciar la lectura de logs
  startLogWatcher: () => ipcRenderer.send('start-watching-logs'),

  setIgnoreMouseEvents: (ignore: boolean) => {
    if (ignore) {
      // forward: true es CRÍTICO: permite que el mouse "pase" pero que JavaScript
      // aún detecte el movimiento (para saber cuándo volvemos a entrar al menú)
      ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
    } else {
      ipcRenderer.send('set-ignore-mouse-events', false);
    }
  },

  simulateDraft: () => ipcRenderer.send('dev-simulate-draft'),
});
