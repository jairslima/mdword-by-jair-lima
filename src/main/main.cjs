const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { buildPrintHtml, normalizeMarkdown } = require('./markdown.cjs');
const {
  convertDocxToMarkdown,
  convertPdfToMarkdown,
  convertPdfToMarkdownWithOcr,
  exportMarkdownToDocx
} = require('./conversion.cjs');

const isDev = !app.isPackaged;
let recentDirectory = '';

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');

let mainWindow = null;
let settingsPath = '';
let pendingLaunchDocument = null;
let appSettings = {
  recentFiles: []
};
const supportedLaunchExtensions = new Set(['.md', '.markdown', '.txt', '.docx', '.pdf']);

async function loadSettings() {
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    const raw = await fs.readFile(settingsPath, 'utf8');
    appSettings = { ...appSettings, ...JSON.parse(raw) };
  } catch (_error) {
    appSettings = { recentFiles: [] };
  }
}

async function saveSettings() {
  if (!settingsPath) {
    settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(appSettings, null, 2), 'utf8');
}

function getAssetPath(fileName) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', fileName);
  }

  return path.join(app.getAppPath(), 'assets', fileName);
}

function getLaunchFilePath(argv) {
  for (const arg of argv || []) {
    if (!arg || arg.startsWith('-')) {
      continue;
    }

    const ext = path.extname(arg).toLowerCase();
    if (!supportedLaunchExtensions.has(ext)) {
      continue;
    }

    const filePath = path.resolve(arg);
    if (fsSync.existsSync(filePath)) {
      return filePath;
    }
  }

  return '';
}

function getRecentDirectory() {
  return recentDirectory || app.getPath('documents');
}

function setRecentDirectory(filePath) {
  if (!filePath) {
    return;
  }

  recentDirectory = path.dirname(filePath);
}

async function pushRecentFile(filePath) {
  if (!filePath) {
    return;
  }

  const next = [filePath, ...appSettings.recentFiles.filter((item) => item !== filePath)].slice(0, 8);
  appSettings.recentFiles = next;
  try {
    await saveSettings();
  } catch (error) {
    console.warn(`Nao foi possivel salvar recentes: ${error.message || String(error)}`);
  }
}

function buildMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Novo', accelerator: 'CmdOrCtrl+N', click: () => sendMenuAction('new') },
        { label: 'Fechar documento', accelerator: 'CmdOrCtrl+W', click: () => sendMenuAction('closeDocument') },
        { label: 'Abrir Markdown', accelerator: 'CmdOrCtrl+O', click: () => sendMenuAction('open') },
        { type: 'separator' },
        { label: 'Salvar', accelerator: 'CmdOrCtrl+S', click: () => sendMenuAction('save') },
        { label: 'Salvar como', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendMenuAction('saveAs') },
        { type: 'separator' },
        { label: 'Importar DOCX', click: () => sendMenuAction('importDocx') },
        { label: 'Importar PDF', click: () => sendMenuAction('importPdf') },
        { label: 'Importar PDF com OCR', click: () => sendMenuAction('importPdfOcr') },
        { label: 'Exportar DOCX', click: () => sendMenuAction('exportDocx') },
        { label: 'Exportar PDF', click: () => sendMenuAction('exportPdf') },
        { type: 'separator' },
        { label: 'Imprimir', accelerator: 'CmdOrCtrl+P', click: () => sendMenuAction('print') },
        { type: 'separator' },
        { role: 'quit', label: 'Sair' }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Desfazer' },
        { role: 'redo', label: 'Refazer' },
        { type: 'separator' },
        { role: 'cut', label: 'Recortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Colar' },
        { role: 'selectAll', label: 'Selecionar tudo' }
      ]
    },
    {
      label: 'Formatar',
      submenu: [
        { label: 'Negrito', accelerator: 'CmdOrCtrl+B', click: () => sendMenuAction('bold') },
        { label: 'Italico', accelerator: 'CmdOrCtrl+I', click: () => sendMenuAction('italic') },
        { label: 'Codigo', click: () => sendMenuAction('code') },
        { type: 'separator' },
        { label: 'Titulo 1', accelerator: 'CmdOrCtrl+Alt+1', click: () => sendMenuAction('heading1') },
        { label: 'Titulo 2', accelerator: 'CmdOrCtrl+Alt+2', click: () => sendMenuAction('heading2') },
        { label: 'Titulo 3', accelerator: 'CmdOrCtrl+Alt+3', click: () => sendMenuAction('heading3') },
        { type: 'separator' },
        { label: 'Lista com marcadores', accelerator: 'CmdOrCtrl+Shift+8', click: () => sendMenuAction('bulletList') },
        { label: 'Lista numerada', accelerator: 'CmdOrCtrl+Shift+7', click: () => sendMenuAction('orderedList') },
        { label: 'Citacao', accelerator: 'CmdOrCtrl+Shift+9', click: () => sendMenuAction('blockQuote') },
        { label: 'Linha horizontal', accelerator: 'CmdOrCtrl+Shift+H', click: () => sendMenuAction('hr') },
        { label: 'Bloco de codigo', accelerator: 'CmdOrCtrl+Alt+C', click: () => sendMenuAction('codeBlock') },
        { type: 'separator' },
        { label: 'Link', accelerator: 'CmdOrCtrl+K', click: () => sendMenuAction('link') },
        { label: 'Imagem', accelerator: 'CmdOrCtrl+Alt+I', click: () => sendMenuAction('image') }
      ]
    },
    {
      label: 'Exibir',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'toggledevtools', label: 'Ferramentas do desenvolvedor' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom padrao' },
        { role: 'zoomIn', label: 'Aumentar zoom' },
        { role: 'zoomOut', label: 'Diminuir zoom' }
      ]
    }
  ];

  return Menu.buildFromTemplate(template);
}

function sendMenuAction(action) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('menu:action', action);
  }
}

function sendDocumentPayload(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('document:payload', payload);
  }
}

function queueLaunchDocument(payload) {
  pendingLaunchDocument = payload;
  sendDocumentPayload(payload);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#e3d7c1',
    title: 'MDWord',
    icon: getAssetPath('app-icon.png'),
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const appMenu = buildMenu();
  Menu.setApplicationMenu(appMenu);
  mainWindow.setMenu(appMenu);
  mainWindow.setAutoHideMenuBar(false);
  mainWindow.setMenuBarVisibility(true);

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
  } else {
    const indexUrl = pathToFileURL(path.join(app.getAppPath(), 'dist', 'index.html'));
    mainWindow.loadURL(indexUrl.href);
  }
}

async function readFileUtf8(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  setRecentDirectory(filePath);
  await pushRecentFile(filePath);
  return {
    filePath,
    fileName: path.basename(filePath),
    markdown: normalizeMarkdown(content)
  };
}

async function openAnySupportedFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.docx') {
    const imported = await convertDocxToMarkdown(filePath);
    setRecentDirectory(filePath);
    await pushRecentFile(filePath);
    return imported;
  }

  if (ext === '.pdf') {
    const imported = await convertPdfToMarkdown(filePath);
    setRecentDirectory(filePath);
    await pushRecentFile(filePath);
    return imported;
  }

  return readFileUtf8(filePath);
}

async function promptOpenFile(filters) {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selecionar arquivo',
    defaultPath: getRecentDirectory(),
    properties: ['openFile'],
    filters
  });

  if (result.canceled || !result.filePaths[0]) {
    return null;
  }

  return result.filePaths[0];
}

async function openMarkdownFromMenu() {
  try {
    const filePath = await promptOpenFile([
      { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }
    ]);

    if (!filePath) {
      return;
    }

    const payload = await readFileUtf8(filePath);
    sendDocumentPayload({
      ...payload,
      status: `Arquivo aberto: ${path.basename(filePath)}`
    });
  } catch (error) {
    dialog.showErrorBox('Falha ao abrir arquivo', error.message || String(error));
  }
}

async function openLaunchFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    const payload = await openAnySupportedFile(filePath);
    const title = path.basename(payload.filePath || payload.sourcePath || filePath);
    queueLaunchDocument({
      ...payload,
      status: `Arquivo aberto: ${title}`
    });
  } catch (error) {
    dialog.showErrorBox('Falha ao abrir arquivo', error.message || String(error));
  }
}

async function printHtml(html, outputPdfPath) {
  const tempWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: true
    }
  });

  try {
    await tempWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    if (outputPdfPath) {
      const buffer = await tempWindow.webContents.printToPDF({
        printBackground: true,
        preferCSSPageSize: true
      });
      await fs.writeFile(outputPdfPath, buffer);
      return { savedTo: outputPdfPath };
    }

    await new Promise((resolve, reject) => {
      tempWindow.webContents.print(
        {
          printBackground: true
        },
        (success, errorType) => {
          if (!success) {
            reject(new Error(errorType || 'Falha ao imprimir.'));
            return;
          }
          resolve();
        }
      );
    });

    return { printed: true };
  } finally {
    tempWindow.destroy();
  }
}

ipcMain.handle('app:get-state', async () => ({
  recentDirectory: getRecentDirectory(),
  pureMarkdownProfile: true,
  recentFiles: appSettings.recentFiles
}));

ipcMain.handle('app:consume-pending-document', async () => {
  const payload = pendingLaunchDocument;
  pendingLaunchDocument = null;
  return payload || { canceled: true };
});

ipcMain.handle('file:open-markdown', async () => {
  const filePath = await promptOpenFile([
    { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }
  ]);

  if (!filePath) {
    return { canceled: true };
  }

  return readFileUtf8(filePath);
});

ipcMain.handle('file:save-markdown', async (_event, payload) => {
  const { filePath, markdown } = payload || {};
  if (!filePath) {
    return { needsPath: true };
  }

  await fs.writeFile(filePath, normalizeMarkdown(markdown), 'utf8');
  setRecentDirectory(filePath);
  await pushRecentFile(filePath);
  return {
    filePath,
    fileName: path.basename(filePath),
    markdown: normalizeMarkdown(markdown)
  };
});

ipcMain.handle('file:save-markdown-as', async (_event, payload) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Salvar Markdown como',
    defaultPath: payload?.suggestedPath || path.join(getRecentDirectory(), 'documento.md'),
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await fs.writeFile(result.filePath, normalizeMarkdown(payload?.markdown || ''), 'utf8');
  setRecentDirectory(result.filePath);
  await pushRecentFile(result.filePath);
  return {
    filePath: result.filePath,
    fileName: path.basename(result.filePath),
    markdown: normalizeMarkdown(payload?.markdown || '')
  };
});

ipcMain.handle('file:import-docx', async () => {
  const filePath = await promptOpenFile([{ name: 'Word', extensions: ['docx'] }]);
  if (!filePath) {
    return { canceled: true };
  }

  const imported = await convertDocxToMarkdown(filePath);
  setRecentDirectory(filePath);
  await pushRecentFile(filePath);
  return imported;
});

ipcMain.handle('file:import-pdf', async () => {
  const filePath = await promptOpenFile([{ name: 'PDF', extensions: ['pdf'] }]);
  if (!filePath) {
    return { canceled: true };
  }

  const imported = await convertPdfToMarkdown(filePath);
  setRecentDirectory(filePath);
  await pushRecentFile(filePath);
  return imported;
});

ipcMain.handle('file:import-pdf-ocr', async () => {
  const filePath = await promptOpenFile([{ name: 'PDF', extensions: ['pdf'] }]);
  if (!filePath) {
    return { canceled: true };
  }

  const imported = await convertPdfToMarkdownWithOcr(filePath);
  setRecentDirectory(filePath);
  await pushRecentFile(filePath);
  return imported;
});

ipcMain.handle('file:open-recent', async (_event, filePath) => {
  if (!filePath) {
    return { canceled: true };
  }
  return openAnySupportedFile(filePath);
});

ipcMain.handle('file:export-docx', async (_event, payload) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar para DOCX',
    defaultPath: path.join(
      getRecentDirectory(),
      `${payload?.title || 'documento'}.docx`
    ),
    filters: [{ name: 'Word', extensions: ['docx'] }]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await exportMarkdownToDocx(result.filePath, payload?.markdown || '', payload?.title || 'Documento');
  setRecentDirectory(result.filePath);
  await pushRecentFile(result.filePath);
  return {
    filePath: result.filePath,
    fileName: path.basename(result.filePath)
  };
});

ipcMain.handle('file:export-pdf', async (_event, payload) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar para PDF',
    defaultPath: path.join(
      getRecentDirectory(),
      `${payload?.title || 'documento'}.pdf`
    ),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  const html = buildPrintHtml(payload?.title || 'Documento', payload?.markdown || '');
  return printHtml(html, result.filePath);
});

ipcMain.handle('file:print', async (_event, payload) => {
  const html = buildPrintHtml(payload?.title || 'Documento', payload?.markdown || '');
  return printHtml(html, null);
});

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (gotSingleInstanceLock) {
  app.on('second-instance', async (_event, argv) => {
    const filePath = getLaunchFilePath(argv);
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
    await openLaunchFile(filePath);
  });
}

app.on('open-file', async (event, filePath) => {
  event.preventDefault();
  await openLaunchFile(filePath);
});

app.whenReady().then(async () => {
  await loadSettings();
  createMainWindow();
  await openLaunchFile(getLaunchFilePath(process.argv));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
