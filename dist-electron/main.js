"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const log_watcher_1 = require("./log-watcher");
let win = null;
let watcher = null;
function createWindow() {
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    win = new electron_1.BrowserWindow({
        width: width,
        height: height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        hasShadow: false, // Importante para transparencias limpias en Mac/Windows
        webPreferences: {
            nodeIntegration: false, // Seguridad: No permitir require() en el HTML
            contextIsolation: true, // Seguridad: Aislar contextos
            preload: path.join(__dirname, 'preload.js'), // El puente
        },
    });
    // LÓGICA DE CONEXIÓN:
    const isDev = process.argv.includes('--serve');
    if (isDev) {
        // En desarrollo: Carga el servidor de Angular (ng serve)
        win.loadURL('http://localhost:4200');
        // Abre las DevTools para depurar
        win.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        // En producción: Carga el index.html generado en la carpeta dist
        // Asegúrate que esta ruta coincida con tu output en angular.json
        win.loadURL(`file://${__dirname}/../dist/MTGAP/browser/index.html`);
    }
    // INICIALIZAR EL WATCHER
    watcher = new log_watcher_1.LogWatcher();
    // Escuchar eventos del watcher
    watcher.on('draft-pack', (data) => {
        console.log('📦 Pack detectado! Enviando a Angular...');
        // Enviamos los datos a la ventana de Angular
        win?.webContents.send('draft-update', data);
    });
    // Arrancarlo
    watcher.start();
}
electron_1.ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = electron_1.BrowserWindow.fromWebContents(event.sender);
    // ignore = true  -> Clics traspasan (van al juego)
    // ignore = false -> Clics se quedan en tu app (menú)
    win?.setIgnoreMouseEvents(ignore, options);
});
// ESCUCHA: Angular nos pide simular un draft
electron_1.ipcMain.on('dev-simulate-draft', (event) => {
    console.log('🧪 Recibido comando de simulación desde Angular');
    const win = electron_1.BrowserWindow.fromWebContents(event.sender);
    // Respondemos con datos falsos (IDs reales de MTG Arena - Set Foundations)
    // 87834 = Llanowar Elves
    // 87985 = Serra Angel
    // 88022 = Negate
    win?.webContents.send('draft-update', {
        SelfPack: ['87834', '87985', '88022'],
    });
});
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('will-quit', () => {
    watcher?.stop();
});
//# sourceMappingURL=main.js.map