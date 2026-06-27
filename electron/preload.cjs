const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('guorenDesktop', {
  isElectron: true,
  getContext: () => ipcRenderer.invoke('desktop:get-context'),
  openUrl: (targetUrl) => ipcRenderer.invoke('desktop:open-external', targetUrl),
});
