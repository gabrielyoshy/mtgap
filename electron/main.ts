import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';

let win: BrowserWindow | null = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
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
  } else {
    // En producción: Carga el index.html generado en la carpeta dist
    // Asegúrate que esta ruta coincida con tu output en angular.json
    win.loadURL(`file://${__dirname}/../dist/MTGAP/browser/index.html`);
  }
}

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  // ignore = true  -> Clics traspasan (van al juego)
  // ignore = false -> Clics se quedan en tu app (menú)
  win?.setIgnoreMouseEvents(ignore, options);
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
