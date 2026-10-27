const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const path = require('path');
const fs = require('fs');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0f0f13',
    titleBarStyle: 'hiddenInset',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../../assets/icon.ico'),
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../build/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow.webContents.send('menu-new-project'),
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [{ name: 'Alto Project', extensions: ['alto'] }],
              properties: ['openFile'],
            });
            if (!result.canceled) {
              mainWindow.webContents.send('menu-open-project', result.filePaths[0]);
            }
          },
        },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('menu-save-project'),
        },
        { type: 'separator' },
        {
          label: 'Import Media',
          accelerator: 'CmdOrCtrl+I',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              filters: [
                { name: 'Video', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv'] },
                { name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'] },
                { name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'] },
                { name: 'All Media', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff'] },
              ],
              properties: ['openFile', 'multiSelections'],
            });
            if (!result.canceled) {
              mainWindow.webContents.send('menu-import-media', result.filePaths);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Export',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow.webContents.send('menu-export'),
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => mainWindow.webContents.send('menu-undo') },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', click: () => mainWindow.webContents.send('menu-redo') },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', click: () => mainWindow.webContents.send('menu-cut') },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', click: () => mainWindow.webContents.send('menu-copy') },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', click: () => mainWindow.webContents.send('menu-paste') },
        { label: 'Delete', accelerator: 'Delete', click: () => mainWindow.webContents.send('menu-delete') },
        { type: 'separator' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', click: () => mainWindow.webContents.send('menu-select-all') },
        { label: 'Split Clip', accelerator: 'CmdOrCtrl+B', click: () => mainWindow.webContents.send('menu-split') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => mainWindow.webContents.send('menu-zoom-in') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.send('menu-zoom-out') },
        { label: 'Fit Timeline', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.send('menu-fit-timeline') },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => autoUpdater.checkForUpdatesAndNotify(),
        },
        { type: 'separator' },
        {
          label: 'About Alto',
          click: () => mainWindow.webContents.send('menu-about'),
        },
        {
          label: 'GitHub Repository',
          click: () => shell.openExternal('https://github.com/SilverWallDiscs/Alto'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('dialog:openFile', async (_, options) => {
  return await dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('dialog:saveFile', async (_, options) => {
  return await dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('fs:readFile', async (_, filePath) => {
  try {
    return { success: true, data: fs.readFileSync(filePath).toString('base64') };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('fs:writeFile', async (_, filePath, data) => {
  try {
    fs.writeFileSync(filePath, data);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('fs:getFileInfo', async (_, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return { success: true, size: stats.size, mtime: stats.mtime };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('window:minimize', () => mainWindow.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle('window:close', () => mainWindow.close());
ipcMain.handle('window:isMaximized', () => mainWindow.isMaximized());

ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('updater:check', () => autoUpdater.checkForUpdatesAndNotify());

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  mainWindow?.webContents.send('updater:checking');
});
autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('updater:available', info);
});
autoUpdater.on('update-not-available', (info) => {
  mainWindow?.webContents.send('updater:not-available', info);
});
autoUpdater.on('error', (err) => {
  mainWindow?.webContents.send('updater:error', err.message);
});
autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('updater:progress', progress);
});
autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('updater:downloaded', info);
});

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall();
});

app.whenReady().then(() => {
  createWindow();

  // Check for updates 5 seconds after launch (only in production)
  if (!isDev) {
    setTimeout(() => autoUpdater.checkForUpdatesAndNotify(), 5000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
