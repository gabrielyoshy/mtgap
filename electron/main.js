const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');

let win;

function pickDisplay(index) {
  const displays = screen.getAllDisplays();
  const i = Number.isFinite(Number(index))
    ? Math.max(0, Math.min(displays.length - 1, Number(index)))
    : 0;
  return displays[i] || screen.getPrimaryDisplay();
}

function createWindow() {
  // Allow choosing display via environment variable OVERLAY_DISPLAY_INDEX
  const envIndex = process.env.OVERLAY_DISPLAY_INDEX;
  const display = pickDisplay(envIndex);
  const { x, y, width, height } = display.bounds;

  win = new BrowserWindow({
    x,
    y,
    width,
    height,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: false,
    focusable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreen: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // Try to stay above fullscreen applications; "screen-saver" is usually the highest
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);

  win.loadFile(path.join(__dirname, '../dist/mtgap/browser/index.html'));

  win.once('ready-to-show', () => {
    win.show();
    // Start ignoring mouse events so clicks pass to the game underneath
    win.setIgnoreMouseEvents(true, { forward: true });
  });

  win.on('closed', () => {
    win = null;
  });
}

// IPC handler used by the renderer to toggle click-through behaviour
ipcMain.handle('set-ignore-mouse-events', (event, ignore) => {
  if (!win) return;
  // forward mouse events to underlying windows while we ignore them
  const shouldIgnore = Boolean(ignore);
  try {
    if (shouldIgnore) {
      // ignore mouse events and forward them to underlying apps
      win.setIgnoreMouseEvents(true, { forward: true });
      // keep window unfocusable so it doesn't steal focus
      win.setFocusable(false);
    } else {
      // stop ignoring so the overlay can receive clicks
      win.setIgnoreMouseEvents(false);
      // make focusable so clicks are properly delivered
      win.setFocusable(true);
      // focus the window so it receives keyboard/mouse interactions
      try {
        win.focus();
      } catch (e) {}
    }
  } catch (e) {
    // best-effort: ignore errors
  }
});

// Move overlay to a different display by index (0 = primary, 1 = second, ...)
ipcMain.handle('move-to-display', (event, index) => {
  if (!win) return;
  const display = pickDisplay(index);
  const { x, y, width, height } = display.bounds;
  // Resize and reposition to cover the chosen display
  try {
    win.setBounds({ x, y, width, height });
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true);
  } catch (e) {
    // ignore errors
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
