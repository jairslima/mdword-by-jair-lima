const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mdword', {
  getAppState: () => ipcRenderer.invoke('app:get-state'),
  openMarkdown: () => ipcRenderer.invoke('file:open-markdown'),
  saveMarkdown: (payload) => ipcRenderer.invoke('file:save-markdown', payload),
  saveMarkdownAs: (payload) => ipcRenderer.invoke('file:save-markdown-as', payload),
  importDocx: () => ipcRenderer.invoke('file:import-docx'),
  importPdf: () => ipcRenderer.invoke('file:import-pdf'),
  importPdfWithOcr: () => ipcRenderer.invoke('file:import-pdf-ocr'),
  exportDocx: (payload) => ipcRenderer.invoke('file:export-docx', payload),
  exportPdf: (payload) => ipcRenderer.invoke('file:export-pdf', payload),
  printDocument: (payload) => ipcRenderer.invoke('file:print', payload),
  openRecent: (filePath) => ipcRenderer.invoke('file:open-recent', filePath),
  onMenuAction: (listener) => {
    const wrapped = (_event, action) => listener(action);
    ipcRenderer.on('menu:action', wrapped);
    return () => ipcRenderer.removeListener('menu:action', wrapped);
  }
});
