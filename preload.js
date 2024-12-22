const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getVersion: () => ipcRenderer.sendSync('get-version'),
  onModeChange: (callback) => {
    ipcRenderer.on('mode-change', (event, isFramelessMode) => callback(isFramelessMode));
  },
  submitUrl: (url) => ipcRenderer.send('submit-url', url),
});