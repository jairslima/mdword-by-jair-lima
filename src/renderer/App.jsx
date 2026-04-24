import { useEffect, useRef, useState } from 'react';
import { Editor } from '@toast-ui/react-editor';

const headingOptions = [
  { label: 'Estilo', value: '' },
  { label: 'Titulo 1', value: 'heading1' },
  { label: 'Titulo 2', value: 'heading2' },
  { label: 'Titulo 3', value: 'heading3' }
];

const initialText = `# MDWord

Abra um arquivo Markdown ou comece a escrever aqui.

Este editor trabalha em perfil Markdown puro.`;

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
  const [filePath, setFilePath] = useState('');
  const [status, setStatus] = useState('Pronto');
  const [dirty, setDirty] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [lastSavedAt, setLastSavedAt] = useState('');
  const recentPreview = recentFiles.slice(0, 3);

  const refreshAppState = async () => {
    const state = await window.mdword.getAppState();
    setRecentFiles(state?.recentFiles || []);
  };

  const getEditor = () => editorRef.current?.getInstance();

  const getMarkdown = () => getEditor()?.getMarkdown() ?? '';

  const runEditorCommand = (command, payload) => {
    const editor = getEditor();
    if (!editor) {
      return;
    }

    editor.exec(command, payload);
    editor.focus();
  };

  const handleHeading = (event) => {
    const value = event.target.value;
    if (!value) {
      return;
    }

    runEditorCommand('heading', { level: Number(value.replace('heading', '')) });
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

    editor.setMarkdown(markdown ?? '', false);
    pendingMarkdownRef.current = null;
  };

  const flushPendingMarkdown = () => {
    if (pendingMarkdownRef.current === null) {
      return;
    }

    setMarkdown(pendingMarkdownRef.current);
  };

  const confirmDiscard = () => {
    if (!dirty) {
      return true;
    }

    return window.confirm('Existem alteracoes nao salvas. Deseja continuar e descartar essas alteracoes?');
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
    window.localStorage.setItem('mdword-draft', payload.markdown ?? '');
    window.localStorage.setItem('mdword-last-path', payload.filePath || payload.sourcePath || '');
    refreshAppState();
  };

  const handleNew = () => {
    if (!confirmDiscard()) {
      return;
    }

    setMarkdown(initialText);
    setFilePath('');
    setDirty(false);
    setLastSavedAt('');
    setStatus('Novo documento criado');
    window.localStorage.setItem('mdword-draft', initialText);
    window.localStorage.removeItem('mdword-last-path');
  };

  const handleOpen = async () => {
    if (!confirmDiscard()) {
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

    applyDocument(payload, payload?.filePath ? `Arquivo salvo: ${getTitleFromPath(payload.filePath)}` : status);
  };

  const handleSaveAs = async () => {
    const payload = await window.mdword.saveMarkdownAs({
      markdown: getMarkdown(),
      suggestedPath: filePath || ''
    });

    applyDocument(payload, payload?.filePath ? `Arquivo salvo como: ${getTitleFromPath(payload.filePath)}` : status);
  };

  const handleImportDocx = async () => {
    if (!confirmDiscard()) {
      return;
    }

    const payload = await window.mdword.importDocx();
    applyDocument(payload, payload?.sourcePath ? `DOCX importado: ${getTitleFromPath(payload.sourcePath)}` : status);
  };

  const handleImportPdf = async () => {
    if (!confirmDiscard()) {
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
    if (!confirmDiscard()) {
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
    if (!confirmDiscard()) {
      return;
    }

    const payload = await window.mdword.openRecent(recentPath);
    applyDocument(payload, payload?.sourcePath || payload?.filePath ? `Arquivo aberto: ${getTitleFromPath(payload.sourcePath || payload.filePath)}` : status);
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
      const draft = window.localStorage.getItem('mdword-draft');
      const lastPath = window.localStorage.getItem('mdword-last-path') || '';
      setMarkdown(draft || initialText);
      setFilePath(lastPath);
      setStatus(draft ? 'Rascunho restaurado' : 'Pronto');

      const launchPayload = await window.mdword.consumePendingDocument();
      if (launchPayload && !launchPayload.canceled) {
        applyDocument(launchPayload, launchPayload.status || 'Arquivo aberto');
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (autosaveTimerRef.current) {
      window.clearInterval(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setInterval(async () => {
      const markdown = getMarkdown();
      window.localStorage.setItem('mdword-draft', markdown);
      window.localStorage.setItem('mdword-last-path', filePath || '');

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
    const unsubscribePayload = window.mdword.onDocumentPayload((payload) => {
      applyDocument(payload, payload?.status || 'Arquivo aberto');
    });

    const unsubscribe = window.mdword.onMenuAction((action) => {
      const actions = {
        new: handleNew,
        open: handleOpen,
        save: handleSave,
        saveAs: handleSaveAs,
        importDocx: handleImportDocx,
        importPdf: handleImportPdf,
        importPdfOcr: handleImportPdfOcr,
        exportDocx: handleExportDocx,
        exportPdf: handleExportPdf,
        print: handlePrint
      };

      actions[action]?.();
    });

    return () => {
      unsubscribePayload();
      unsubscribe();
    };
  }, [filePath, dirty]);

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
          <button className="ribbon-command" onClick={handleNew} title="Novo documento">
            <span className="command-icon">N</span>
            <span>Novo</span>
          </button>
          <button className="ribbon-command" onClick={handleOpen} title="Abrir Markdown">
            <span className="command-icon">A</span>
            <span>Abrir</span>
          </button>
          <button className="ribbon-command" onClick={handleSave} title="Salvar">
            <span className="command-icon">S</span>
            <span>Salvar</span>
          </button>
          <button className="ribbon-command" onClick={handlePrint} title="Imprimir">
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
            <button className="icon-command strong" onClick={() => runEditorCommand('bold')} title="Negrito">B</button>
            <button className="icon-command italic" onClick={() => runEditorCommand('italic')} title="Italico">I</button>
            <button className="icon-command code-mark" onClick={() => runEditorCommand('code')} title="Codigo">{"<>"}</button>
          </div>
          <span className="ribbon-label">Fonte</span>
        </div>

        <div className="ribbon-group paragraph-group" aria-label="Paragrafo">
          <div className="command-row">
            <button className="icon-command" onClick={() => runEditorCommand('bulletList')} title="Lista com marcadores">Lista</button>
            <button className="icon-command" onClick={() => runEditorCommand('orderedList')} title="Lista numerada">1.</button>
            <button className="icon-command" onClick={() => runEditorCommand('blockQuote')} title="Citacao">"</button>
          </div>
          <div className="command-row">
            <button className="icon-command" onClick={() => runEditorCommand('hr')} title="Linha horizontal">Linha</button>
            <button className="icon-command" onClick={() => runEditorCommand('codeBlock')} title="Bloco de codigo">Bloco</button>
          </div>
          <span className="ribbon-label">Paragrafo</span>
        </div>

        <div className="ribbon-group insert-group" aria-label="Inserir">
          <button className="ribbon-command" onClick={handleLink} title="Inserir link">
            <span className="command-icon">L</span>
            <span>Link</span>
          </button>
          <button className="ribbon-command" onClick={handleImage} title="Inserir imagem por URL">
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
          <strong>{lastSavedAt ? `ultimo save em ${lastSavedAt}` : 'ativo a cada 10 segundos'}</strong>
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
              ref={editorRef}
              initialValue={initialText}
              previewStyle="vertical"
              initialEditType="wysiwyg"
              height="auto"
              useCommandShortcut
              hideModeSwitch
              toolbarItems={[]}
              autofocus={false}
              usageStatistics={false}
              onChange={() => {
                setDirty(true);
                setStatus('Editando...');
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
