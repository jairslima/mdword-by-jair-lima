import { useEffect, useRef, useState } from 'react';
import { Editor } from '@toast-ui/react-editor';
import {
  buildWindowTitle,
  hasRecoverableDraft,
  normalizeMenuAction,
  shouldSaveDraft
} from '../shared/documentLifecycle.js';

const headingOptions = [
  { label: 'Estilo', value: '' },
  { label: 'Titulo 1', value: 'heading1' },
  { label: 'Titulo 2', value: 'heading2' },
  { label: 'Titulo 3', value: 'heading3' }
];

const initialText = '';
const draftKey = 'mdword-draft';
const draftUpdatedAtKey = 'mdword-draft-updated-at';
const lastPathKey = 'mdword-last-path';

function getTitleFromPath(filePath) {
  if (!filePath) {
    return 'Sem titulo';
  }

  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1];
}

export default function App() {
  const editorRef = useRef(null);
  const autosaveTimerRef = useRef(null);
  const pendingMarkdownRef = useRef(null);
  const editorReadyTimerRef = useRef(null);
  const programmaticChangeRef = useRef(false);
  const lastShortcutActionRef = useRef({ name: '', at: 0 });
  const closeRequestInFlightRef = useRef(false);
  const [filePath, setFilePath] = useState('');
  const [status, setStatus] = useState('Pronto');
  const [dirty, setDirty] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [lastSavedAt, setLastSavedAt] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const recentPreview = recentFiles.slice(0, 3);

  const clearDraft = () => {
    window.localStorage.removeItem(draftKey);
    window.localStorage.removeItem(draftUpdatedAtKey);
    window.localStorage.removeItem(lastPathKey);
  };

  const refreshAppState = async () => {
    const state = await window.mdword.getAppState();
    setRecentFiles(state?.recentFiles || []);
  };

  const getEditor = () => editorRef.current?.getInstance();

  const getMarkdown = () => getEditor()?.getMarkdown() ?? '';

  const focusEditorSoon = (delay = 0) => {
    window.setTimeout(() => {
      const editor = getEditor();
      if (editor) {
        editor.focus();
      }
    }, delay);
  };

  const runEditorCommand = (command, payload) => {
    const editor = getEditor();
    if (!editor) {
      return;
    }

    editor.exec(command, payload);
    editor.focus();
  };

  const runShortcutAction = (name, action) => {
    const now = Date.now();
    const lastAction = lastShortcutActionRef.current;
    if (lastAction.name === name && now - lastAction.at < 150) {
      return;
    }

    lastShortcutActionRef.current = { name, at: now };
    action();
  };

  const handleHeading = (event) => {
    const value = event.target.value;
    if (!value) {
      return;
    }

    applyHeading(Number(value.replace('heading', '')));
  };

  const applyHeading = (level) => {
    runEditorCommand('heading', { level });
  };

  const handleLink = () => {
    const linkUrl = window.prompt('URL do link');
    if (!linkUrl) {
      return;
    }

    const linkText = window.prompt('Texto do link', linkUrl) || linkUrl;
    runEditorCommand('addLink', { linkUrl, linkText });
  };

  const handleImage = () => {
    const imageUrl = window.prompt('URL da imagem');
    if (!imageUrl) {
      return;
    }

    const altText = window.prompt('Texto alternativo', 'Imagem') || 'Imagem';
    runEditorCommand('addImage', { imageUrl, altText });
  };

  const setMarkdown = (markdown) => {
    const editor = getEditor();
    if (!editor) {
      pendingMarkdownRef.current = markdown ?? '';
      return;
    }

    programmaticChangeRef.current = true;
    editor.setMarkdown(markdown ?? '', false);
    pendingMarkdownRef.current = null;
    window.setTimeout(() => {
      programmaticChangeRef.current = false;
      focusEditorSoon();
    }, 0);
  };

  const flushPendingMarkdown = () => {
    if (pendingMarkdownRef.current === null) {
      return;
    }

    setMarkdown(pendingMarkdownRef.current);
  };

  const confirmUnsavedChanges = async () => {
    if (!dirty) {
      return true;
    }

    const choice = await window.mdword.confirmUnsaved({
      title: getTitleFromPath(filePath),
      filePath
    });

    if (choice === 'discard') {
      return true;
    }

    if (choice === 'save') {
      return handleSave();
    }

    return false;
  };

  const resetDocument = (nextStatus, options = {}) => {
    const { clearStoredDraft = true } = options;
    pendingMarkdownRef.current = initialText;
    setMarkdown(initialText);
    setEditorKey((currentKey) => currentKey + 1);
    setFilePath('');
    setDirty(false);
    setLastSavedAt('');
    setStatus(nextStatus);
    if (clearStoredDraft) {
      clearDraft();
    }
    focusEditorSoon(120);
  };

  const applyDocument = (payload, nextStatus) => {
    if (!payload || payload.canceled) {
      return;
    }

    setMarkdown(payload.markdown ?? '');
    setFilePath(payload.filePath || payload.sourcePath || '');
    setDirty(false);
    setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
    setStatus(nextStatus);
    clearDraft();
    refreshAppState();
    focusEditorSoon(80);
  };

  const handleNew = async () => {
    if (!(await confirmUnsavedChanges())) {
      return;
    }

    resetDocument('Novo documento criado');
  };

  const handleCloseDocument = async () => {
    if (!(await confirmUnsavedChanges())) {
      return;
    }

    resetDocument('Documento fechado');
  };

  const handleOpen = async () => {
    if (!(await confirmUnsavedChanges())) {
      return;
    }

    const payload = await window.mdword.openMarkdown();
    applyDocument(payload, payload?.filePath ? `Arquivo aberto: ${getTitleFromPath(payload.filePath)}` : status);
  };

  const handleSave = async () => {
    const markdown = getMarkdown();
    const payload = await window.mdword.saveMarkdown({ filePath, markdown });

    if (payload?.needsPath) {
      return handleSaveAs();
    }

    if (payload?.canceled) {
      return false;
    }

    applyDocument(payload, payload?.filePath ? `Arquivo salvo: ${getTitleFromPath(payload.filePath)}` : status);
    return true;
  };

  const handleSaveAs = async () => {
    const payload = await window.mdword.saveMarkdownAs({
      markdown: getMarkdown(),
      suggestedPath: filePath || ''
    });

    if (payload?.canceled) {
      return false;
    }

    applyDocument(payload, payload?.filePath ? `Arquivo salvo como: ${getTitleFromPath(payload.filePath)}` : status);
    return true;
  };

  const handleImportDocx = async () => {
    if (!(await confirmUnsavedChanges())) {
      return;
    }

    const payload = await window.mdword.importDocx();
    applyDocument(payload, payload?.sourcePath ? `DOCX importado: ${getTitleFromPath(payload.sourcePath)}` : status);
  };

  const handleImportPdf = async () => {
    if (!(await confirmUnsavedChanges())) {
      return;
    }

    const payload = await window.mdword.importPdf();
    applyDocument(
      payload,
      payload?.sourcePath
        ? `PDF importado: ${getTitleFromPath(payload.sourcePath)}${payload?.ocrUsed ? ' com OCR' : ''}`
        : status
    );
  };

  const handleImportPdfOcr = async () => {
    if (!(await confirmUnsavedChanges())) {
      return;
    }

    const payload = await window.mdword.importPdfWithOcr();
    applyDocument(payload, payload?.sourcePath ? `PDF importado com OCR: ${getTitleFromPath(payload.sourcePath)}` : status);
  };

  const handleExportDocx = async () => {
    const payload = await window.mdword.exportDocx({
      markdown: getMarkdown(),
      title: getTitleFromPath(filePath).replace(/\.md$/i, '') || 'documento'
    });

    if (!payload?.canceled) {
      setStatus(`DOCX gerado: ${payload.fileName}`);
      refreshAppState();
    }
  };

  const handleExportPdf = async () => {
    const payload = await window.mdword.exportPdf({
      markdown: getMarkdown(),
      title: getTitleFromPath(filePath).replace(/\.md$/i, '') || 'documento'
    });

    if (!payload?.canceled && payload?.savedTo) {
      setStatus(`PDF gerado: ${getTitleFromPath(payload.savedTo)}`);
      refreshAppState();
    }
  };

  const handlePrint = async () => {
    await window.mdword.printDocument({
      markdown: getMarkdown(),
      title: getTitleFromPath(filePath).replace(/\.md$/i, '') || 'documento'
    });
    setStatus('Janela de impressao aberta');
  };

  const handleOpenRecent = async (recentPath) => {
    if (!(await confirmUnsavedChanges())) {
      return;
    }

    const payload = await window.mdword.openRecent(recentPath);
    applyDocument(payload, payload?.sourcePath || payload?.filePath ? `Arquivo aberto: ${getTitleFromPath(payload.sourcePath || payload.filePath)}` : status);
  };

  const handleQuit = async () => {
    if (await confirmUnsavedChanges()) {
      await window.mdword.confirmWindowClose();
    }
  };

  const handleShortcut = (event) => {
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }

    const key = event.key.toLowerCase();
    const code = event.code;
    const plainShortcut = !event.shiftKey && !event.altKey;
    const shiftShortcut = event.shiftKey && !event.altKey;
    const altShortcut = event.altKey && !event.shiftKey;

    const runShortcut = (name, action) => {
      event.preventDefault();
      event.stopPropagation();
      runShortcutAction(name, action);
    };

    if (plainShortcut) {
      const actions = {
        b: { name: 'bold', run: () => runEditorCommand('bold') },
        i: { name: 'italic', run: () => runEditorCommand('italic') },
        k: { name: 'link', run: handleLink },
        n: { name: 'new', run: handleNew },
        o: { name: 'open', run: handleOpen },
        p: { name: 'print', run: handlePrint },
        q: { name: 'quit', run: handleQuit },
        s: { name: 'save', run: handleSave },
        w: { name: 'closeDocument', run: handleCloseDocument },
        '`': { name: 'code', run: () => runEditorCommand('code') }
      };

      if (actions[key]) {
        runShortcut(actions[key].name, actions[key].run);
      }
      return;
    }

    if (shiftShortcut) {
      if (key === 's') {
        runShortcut('saveAs', handleSaveAs);
        return;
      }

      if (code === 'Digit7') {
        runShortcut('orderedList', () => runEditorCommand('orderedList'));
        return;
      }

      if (code === 'Digit8') {
        runShortcut('bulletList', () => runEditorCommand('bulletList'));
        return;
      }

      if (code === 'Digit9') {
        runShortcut('blockQuote', () => runEditorCommand('blockQuote'));
        return;
      }

      if (key === 'h') {
        runShortcut('hr', () => runEditorCommand('hr'));
      }
      return;
    }

    if (altShortcut) {
      const actions = {
        '1': { name: 'heading1', run: () => applyHeading(1) },
        '2': { name: 'heading2', run: () => applyHeading(2) },
        '3': { name: 'heading3', run: () => applyHeading(3) },
        c: { name: 'codeBlock', run: () => runEditorCommand('codeBlock') },
        i: { name: 'image', run: handleImage }
      };

      if (actions[key]) {
        runShortcut(actions[key].name, actions[key].run);
      }
    }
  };

  useEffect(() => {
    flushPendingMarkdown();
  });

  useEffect(() => {
    editorReadyTimerRef.current = window.setInterval(() => {
      if (!getEditor()) {
        return;
      }

      flushPendingMarkdown();
      focusEditorSoon();
      window.clearInterval(editorReadyTimerRef.current);
      editorReadyTimerRef.current = null;
    }, 100);

    return () => {
      if (editorReadyTimerRef.current) {
        window.clearInterval(editorReadyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const state = await window.mdword.getAppState();
      setRecentFiles(state?.recentFiles || []);

      const launchPayload = await window.mdword.consumePendingDocument();
      if (launchPayload && !launchPayload.canceled) {
        applyDocument(launchPayload, launchPayload.status || 'Arquivo aberto');
        return;
      }

      const draft = window.localStorage.getItem(draftKey);
      const draftUpdatedAt = window.localStorage.getItem(draftUpdatedAtKey);
      if (hasRecoverableDraft(draft)) {
        const recoveryChoice = await window.mdword.confirmDraftRecovery({
          updatedAt: draftUpdatedAt
        });

        if (recoveryChoice === 'restore') {
          pendingMarkdownRef.current = draft;
          setMarkdown(draft);
          setFilePath('');
          setDirty(true);
          setLastSavedAt('');
          setStatus('Rascunho restaurado');
          focusEditorSoon(120);
          return;
        }

        clearDraft();
      }

      resetDocument('Pronto', { clearStoredDraft: false });
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (shouldSaveDraft({ dirty, filePath })) {
      const markdown = getMarkdown() || pendingMarkdownRef.current || '';
      window.localStorage.setItem(draftKey, markdown);
      window.localStorage.setItem(draftUpdatedAtKey, new Date().toLocaleString('pt-BR'));
      return;
    }

    if (!dirty || filePath) {
      clearDraft();
    }
  }, [dirty, filePath]);

  useEffect(() => {
    const title = buildWindowTitle({ dirty, filePath });
    document.title = title;
    window.mdword.setWindowTitle(title);
  }, [dirty, filePath]);

  useEffect(() => {
    if (autosaveTimerRef.current) {
      window.clearInterval(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setInterval(async () => {
      const markdown = getMarkdown();

      if (dirty && filePath) {
        const payload = await window.mdword.saveMarkdown({ filePath, markdown });
        if (!payload?.needsPath && !payload?.canceled) {
          setDirty(false);
          setLastSavedAt(new Date().toLocaleTimeString('pt-BR'));
          setStatus(`Auto save: ${getTitleFromPath(filePath)}`);
        }
      }
    }, 10000);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearInterval(autosaveTimerRef.current);
      }
    };
  }, [dirty, filePath]);

  useEffect(() => {
    const unsubscribePayload = window.mdword.onDocumentPayload(async (payload) => {
      if (!(await confirmUnsavedChanges())) {
        return;
      }

      applyDocument(payload, payload?.status || 'Arquivo aberto');
    });

    const unsubscribeCloseRequest = window.mdword.onCloseRequest(async () => {
      if (closeRequestInFlightRef.current) {
        return;
      }

      closeRequestInFlightRef.current = true;
      try {
        const canClose = await confirmUnsavedChanges();
        if (canClose) {
          await window.mdword.confirmWindowClose();
          return;
        }
      } finally {
        closeRequestInFlightRef.current = false;
      }
    });

    const unsubscribe = window.mdword.onMenuAction((action) => {
      const menuAction = normalizeMenuAction(action);
      const actionName = menuAction.type;
      const actions = {
        new: handleNew,
        closeDocument: handleCloseDocument,
        open: handleOpen,
        save: handleSave,
        saveAs: handleSaveAs,
        bold: () => runEditorCommand('bold'),
        italic: () => runEditorCommand('italic'),
        code: () => runEditorCommand('code'),
        heading1: () => applyHeading(1),
        heading2: () => applyHeading(2),
        heading3: () => applyHeading(3),
        bulletList: () => runEditorCommand('bulletList'),
        orderedList: () => runEditorCommand('orderedList'),
        blockQuote: () => runEditorCommand('blockQuote'),
        hr: () => runEditorCommand('hr'),
        codeBlock: () => runEditorCommand('codeBlock'),
        link: handleLink,
        image: handleImage,
        importDocx: handleImportDocx,
        importPdf: handleImportPdf,
        importPdfOcr: handleImportPdfOcr,
        exportDocx: handleExportDocx,
        exportPdf: handleExportPdf,
        print: handlePrint
      };

      if (actionName === 'openRecent' && menuAction.filePath) {
        runShortcutAction(`${actionName}:${menuAction.filePath}`, () => handleOpenRecent(menuAction.filePath));
        return;
      }

      if (actions[actionName]) {
        runShortcutAction(actionName, actions[actionName]);
      }
    });

    const unsubscribeAppState = window.mdword.onAppStateUpdated((state) => {
      setRecentFiles(state?.recentFiles || []);
    });

    return () => {
      unsubscribePayload();
      unsubscribeCloseRequest();
      unsubscribe();
      unsubscribeAppState();
    };
  }, [filePath, dirty, status]);

  useEffect(() => {
    window.addEventListener('keydown', handleShortcut, true);
    return () => {
      window.removeEventListener('keydown', handleShortcut, true);
    };
  }, [filePath, dirty, status]);

  return (
    <div className="shell">
      <header className="window-header">
        <div className="window-title">
          <strong>MDWord</strong>
          <span>Editor visual para Markdown puro</span>
        </div>
        <div className="document-meta">
          <strong>{filePath ? getTitleFromPath(filePath) : 'Sem titulo.md'}</strong>
          <span>{filePath || 'Documento local ainda nao salvo'}</span>
          <span className={dirty ? 'dirty-badge visible' : 'dirty-badge'}>Nao salvo</span>
        </div>
      </header>

      <nav className="toolbar">
        <div className="ribbon-group file-group" aria-label="Arquivo">
          <button className="ribbon-command" onClick={handleNew} title="Novo documento (Ctrl+N)">
            <span className="command-icon">N</span>
            <span>Novo</span>
          </button>
          <button className="ribbon-command" onClick={handleOpen} title="Abrir Markdown (Ctrl+O)">
            <span className="command-icon">A</span>
            <span>Abrir</span>
          </button>
          <button className="ribbon-command" onClick={handleCloseDocument} title="Fechar documento (Ctrl+W)">
            <span className="command-icon">F</span>
            <span>Fechar</span>
          </button>
          <button className="ribbon-command" onClick={handleSave} title="Salvar (Ctrl+S)">
            <span className="command-icon">S</span>
            <span>Salvar</span>
          </button>
          <button className="ribbon-command" onClick={handlePrint} title="Imprimir (Ctrl+P)">
            <span className="command-icon">P</span>
            <span>Imprimir</span>
          </button>
          <span className="ribbon-label">Arquivo</span>
        </div>

        <div className="ribbon-group font-group" aria-label="Fonte">
          <select className="format-select" defaultValue="" onChange={handleHeading} title="Estilo do paragrafo">
            {headingOptions.map((option) => (
              <option key={option.value || 'placeholder'} value={option.value} disabled={!option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="command-row">
            <button className="icon-command strong" onClick={() => runEditorCommand('bold')} title="Negrito (Ctrl+B)">B</button>
            <button className="icon-command italic" onClick={() => runEditorCommand('italic')} title="Italico (Ctrl+I)">I</button>
            <button className="icon-command code-mark" onClick={() => runEditorCommand('code')} title="Codigo (Ctrl+`)">{"<>"}</button>
          </div>
          <span className="ribbon-label">Fonte</span>
        </div>

        <div className="ribbon-group paragraph-group" aria-label="Paragrafo">
          <div className="command-row">
            <button className="icon-command" onClick={() => runEditorCommand('bulletList')} title="Lista com marcadores (Ctrl+Shift+8)">Lista</button>
            <button className="icon-command" onClick={() => runEditorCommand('orderedList')} title="Lista numerada (Ctrl+Shift+7)">1.</button>
            <button className="icon-command" onClick={() => runEditorCommand('blockQuote')} title="Citacao (Ctrl+Shift+9)">"</button>
          </div>
          <div className="command-row">
            <button className="icon-command" onClick={() => runEditorCommand('hr')} title="Linha horizontal (Ctrl+Shift+H)">Linha</button>
            <button className="icon-command" onClick={() => runEditorCommand('codeBlock')} title="Bloco de codigo (Ctrl+Alt+C)">Bloco</button>
          </div>
          <span className="ribbon-label">Paragrafo</span>
        </div>

        <div className="ribbon-group insert-group" aria-label="Inserir">
          <button className="ribbon-command" onClick={handleLink} title="Inserir link (Ctrl+K)">
            <span className="command-icon">L</span>
            <span>Link</span>
          </button>
          <button className="ribbon-command" onClick={handleImage} title="Inserir imagem por URL (Ctrl+Alt+I)">
            <span className="command-icon">IMG</span>
            <span>Imagem</span>
          </button>
          <span className="ribbon-label">Inserir</span>
        </div>

        <div className="ribbon-group convert-group" aria-label="Conversao">
          <button className="ribbon-command" onClick={handleImportDocx} title="Importar DOCX">
            <span className="command-icon">DOCX</span>
            <span>Importar</span>
          </button>
          <button className="ribbon-command" onClick={handleImportPdf} title="Importar PDF">
            <span className="command-icon">PDF</span>
            <span>Importar</span>
          </button>
          <button className="ribbon-command" onClick={handleExportDocx} title="Salvar como DOCX">
            <span className="command-icon">DOCX</span>
            <span>Exportar</span>
          </button>
          <button className="ribbon-command" onClick={handleExportPdf} title="Exportar PDF">
            <span className="command-icon">PDF</span>
            <span>Exportar</span>
          </button>
          <span className="ribbon-label">Conversao</span>
        </div>
      </nav>

      <section className="document-strip">
        <div className="document-summary">
          <span className="summary-label">Perfil</span>
          <strong>Markdown puro</strong>
          <span className="summary-separator" />
          <span className="summary-label">Auto save</span>
          <strong>{filePath ? (lastSavedAt ? `ultimo save em ${lastSavedAt}` : 'ativo a cada 10 segundos') : 'salve o arquivo para ativar'}</strong>
        </div>

        <div className="recent-strip">
          <span className="summary-label">Recentes</span>
          {recentPreview.length === 0 ? (
            <span className="recent-empty">Nenhum arquivo recente</span>
          ) : (
            recentPreview.map((recentPath) => (
              <button key={recentPath} className="recent-chip" onClick={() => handleOpenRecent(recentPath)} title={recentPath}>
                {getTitleFromPath(recentPath)}
              </button>
            ))
          )}
        </div>
      </section>

      <main className="workspace">
        <section className="editor-stage">
          <div className="editor-paper">
            <Editor
              key={editorKey}
              ref={editorRef}
              initialValue={initialText}
              previewStyle="vertical"
              initialEditType="wysiwyg"
              height="auto"
              useCommandShortcut
              hideModeSwitch
              toolbarItems={[]}
              autofocus
              usageStatistics={false}
              onChange={() => {
                if (programmaticChangeRef.current) {
                  return;
                }

                setDirty(true);
                setStatus('Editando...');
                if (shouldSaveDraft({ dirty: true, filePath })) {
                  window.localStorage.setItem(draftKey, getMarkdown());
                  window.localStorage.setItem(draftUpdatedAtKey, new Date().toLocaleString('pt-BR'));
                }
              }}
            />
          </div>
        </section>
      </main>

      <footer className="statusbar">
        <span>{status}</span>
        <span>{dirty ? 'Alteracoes pendentes' : lastSavedAt ? `Salvo as ${lastSavedAt}` : 'Tudo salvo'}</span>
      </footer>
    </div>
  );
}
