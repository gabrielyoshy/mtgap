import { app, BrowserWindow, screen, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { LogWatcher } from './log-watcher';

let win: BrowserWindow | null = null;
let watcher: LogWatcher | null = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: width,
    height: height,
    transparent: false, // Fondo sólido (ya no es transparente)
    frame: true, // Muestra bordes y barra de título (Cerrar, Minimizar)
    alwaysOnTop: false, // Ya no flota encima de todo obligatoriamente
    hasShadow: true, // Sombra nativa de ventana estándar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
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

  // INICIALIZAR EL WATCHER
  watcher = new LogWatcher();

  // Escuchar eventos del watcher
  watcher.on('draft-pack', (data) => {
    console.log('📦 Pack detectado! Enviando a Angular...');
    // Enviamos los datos a la ventana de Angular
    win?.webContents.send('draft-update', data);
  });

  // Arrancarlo
  watcher.start();
}

// ESCUCHA: Angular nos pide simular un draft
ipcMain.on('dev-simulate-draft', (event) => {
  console.log('🧪 Recibido comando de simulación desde Angular');

  const win = BrowserWindow.fromWebContents(event.sender);

  // Respondemos con datos falsos (IDs reales de MTG Arena - Set Foundations)
  win?.webContents.send('draft-update', {
    DraftPack: [
      '95938',
      '96143',
      '96035',
      '95863',
      '95934',
      '95952',
      '96077',
      '96130',
      '95875',
      '96092',
      '96046',
      '95971',
      '95910',
      '96179',
    ],
  });
});

ipcMain.on('dev-simulate-2-booster', (event) => {
  console.log('🧪 Recibido comando de 2 booster');

  const win = BrowserWindow.fromWebContents(event.sender);

  win?.webContents.send('draft-update', {
    DraftPack: [
      '95951',
      '96155',
      '96035',
      '95841',
      '95974',
      '95930',
      '96031',
      '96132',
      '95833',
      '96034',
      '96035',
    ],
  });
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  watcher?.stop();
});
