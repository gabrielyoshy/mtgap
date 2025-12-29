"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
let win = null;
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
}
electron_1.ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = electron_1.BrowserWindow.fromWebContents(event.sender);
    // ignore = true  -> Clics traspasan (van al juego)
    // ignore = false -> Clics se quedan en tu app (menú)
    win?.setIgnoreMouseEvents(ignore, options);
});
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
//# sourceMappingURL=main.js.map