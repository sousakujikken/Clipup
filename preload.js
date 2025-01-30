const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  handleFiles: (callback) => {
    ipcRenderer.on('files-received', (event, files) => callback(files));
  },
  handleFileHistory: (callback) => {
    ipcRenderer.on('load-file-history', (event, history) => callback(history));
  },
  saveFileHistory: (history) => {
    ipcRenderer.send('save-file-history', history);
  },
  loadFileHistory: async () => {
    return await ipcRenderer.invoke('load-file-history');
  },
  generateVideo: async (params) => {
    console.log('Sending params to main process:', params);
    return await ipcRenderer.invoke('generate-video', params);
  },
  getMediaInfo: async (path) => {
    return await ipcRenderer.invoke('get-media-info', path);
  },
  checkFileExists: async (path) => {
    return await ipcRenderer.invoke('check-file-exists', path);
  },
  onProgressUpdate: (progressId, callback) => {
    const eventName = `progress-update-${progressId}`;
    ipcRenderer.on(eventName, callback);
    return () => {
      ipcRenderer.removeListener(eventName, callback);
    };
  }
});
