import { useEffect, useRef, useState } from 'react';
import { Editor } from '@toast-ui/react-editor';

const toolbarItems = [
  ['heading', 'bold', 'italic'],
  ['hr', 'quote'],
  ['ul', 'ol'],
  ['link', 'image'],
  ['code', 'codeblock']
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
  const [filePath, setFilePath] = useState('');
  const [status, setStatus] = useState('Pronto');
  const [dirty, setDirty] = useState(false);
  const [recentFiles, setRecentFiles] = useState([]);
  const [lastSavedAt, setLastSavedAt] = useState('');

  const refreshAppState = async () => {
    const state = await window.mdword.getAppState();
    setRecentFiles(state?.recentFiles || []);
  };

  const getEditor = () => editorRef.current?.getInstance();

  const getMarkdown = () => getEditor()?.getMarkdown() ?? '';

  const setMarkdown = (markdown) => {
    const editor = getEditor();
    if (!editor) {
      return;
    }

    editor.setMarkdown(markdown ?? '', false);
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
    const bootstrap = async () => {
      const state = await window.mdword.getAppState();
      setRecentFiles(state?.recentFiles || []);
      const draft = window.localStorage.getItem('mdword-draft');
      const lastPath = window.localStorage.getItem('mdword-last-path') || '';
      setMarkdown(draft || initialText);
      setFilePath(lastPath);
      setStatus(draft ? 'Rascunho restaurado' : 'Pronto');
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

    return unsubscribe;
  }, [filePath, dirty]);

  return (
    <div className="shell">
      <header className="window-header">
        <div className="brand">
          <div className="brand-badge">MD</div>
          <div>
            <strong>MDWord</strong>
            <span>Editor visual para Markdown puro</span>
          </div>
        </div>
        <div className="document-meta">
          <span>{filePath ? getTitleFromPath(filePath) : 'Sem titulo.md'}</span>
          <span className={dirty ? 'dirty-badge visible' : 'dirty-badge'}>Nao salvo</span>
        </div>
      </header>

      <nav className="ribbon">
        <div className="ribbon-group">
          <button onClick={handleNew}>Novo</button>
          <button onClick={handleOpen}>Abrir MD</button>
          <button onClick={handleSave}>Salvar</button>
          <button onClick={handleSaveAs}>Salvar como</button>
        </div>

        <div className="ribbon-group">
          <button onClick={handleImportDocx}>Importar DOCX</button>
          <button onClick={handleImportPdf}>Importar PDF</button>
          <button onClick={handleImportPdfOcr}>Importar PDF com OCR</button>
          <button onClick={handleExportDocx}>Salvar como DOCX</button>
          <button onClick={handleExportPdf}>Exportar PDF</button>
          <button onClick={handlePrint}>Imprimir</button>
        </div>

        <div className="ribbon-group status-group">
          <span className="mode-chip">Visual com alternancia para Markdown</span>
          <span className="profile-chip">Perfil Markdown puro</span>
        </div>
      </nav>

      <main className="workspace">
        <aside className="side-panel">
          <h1>Documento</h1>
          <dl>
            <div>
              <dt>Arquivo</dt>
              <dd>{filePath || 'Ainda nao salvo'}</dd>
            </div>
            <div>
              <dt>Perfil</dt>
              <dd>Markdown puro</dd>
            </div>
            <div>
              <dt>Disponivel</dt>
              <dd>titulos, listas, links, imagens, citacoes, codigo, negrito, italico e impressao</dd>
            </div>
            <div>
              <dt>Oculto por perfil</dt>
              <dd>tabelas, checklist, cabecalho de pagina, rodape e quebra manual</dd>
            </div>
            <div>
              <dt>Auto save</dt>
              <dd>{lastSavedAt ? `ultimo save em ${lastSavedAt}` : 'rascunho local ativo, save automatico a cada 10 segundos'}</dd>
            </div>
          </dl>

          <h2>Recentes</h2>
          <div className="recent-list">
            {recentFiles.length === 0 ? (
              <p>Nenhum arquivo recente ainda.</p>
            ) : (
              recentFiles.map((recentPath) => (
                <button key={recentPath} className="recent-item" onClick={() => handleOpenRecent(recentPath)}>
                  <strong>{getTitleFromPath(recentPath)}</strong>
                  <span>{recentPath}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="editor-stage">
          <div className="editor-paper">
            <Editor
              ref={editorRef}
              initialValue={initialText}
              previewStyle="vertical"
              initialEditType="wysiwyg"
              useCommandShortcut
              hideModeSwitch={false}
              toolbarItems={toolbarItems}
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
