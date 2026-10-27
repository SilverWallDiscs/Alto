const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('alto', {
  // File dialogs
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),

  // File system
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, data) => ipcRenderer.invoke('fs:writeFile', filePath, data),
  getFileInfo: (filePath) => ipcRenderer.invoke('fs:getFileInfo', filePath),

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),

  // Event listeners
  on: (channel, callback) => {
    const validChannels = [
      'menu-new-project', 'menu-open-project', 'menu-save-project',
      'menu-import-media', 'menu-export', 'menu-undo', 'menu-redo',
      'menu-cut', 'menu-copy', 'menu-paste', 'menu-delete',
      'menu-select-all', 'menu-split', 'menu-zoom-in', 'menu-zoom-out',
      'menu-fit-timeline', 'menu-about',
      'updater:checking', 'updater:available', 'updater:not-available',
      'updater:error', 'updater:progress', 'updater:downloaded',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args));
    }
  },
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
});
