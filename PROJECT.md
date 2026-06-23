# MDWord by Jair Lima

Editor visual de Markdown puro com interface inspirada no WordPad. Permite abrir, editar, salvar, importar e exportar arquivos `.md` com WYSIWYG completo.

## Stack e dependências principais

- **Electron 37** + **React 17** + **Vite 7**
- **@toast-ui/react-editor 3.2.3** (WYSIWYG via ProseMirror)
- **electron-builder 26** (instalador NSIS)
- **PyInstaller** (runtime OCR e md2docx empacotados)
- **Tesseract 5** (OCR de PDF escaneado)
- **md2docx.exe** (exportação para DOCX com capa, sumário, rodapé)

## Estrutura principal

```
src/
  main/main.cjs          # processo principal Electron (IPC, menus, instância única)
  main/preload.cjs       # bridge contextBridge
  renderer/App.jsx       # toda a lógica do renderer (editor, ribbon, estado)
scripts/
  pdf_ocr.py             # helper OCR empacotado pelo PyInstaller
  build_ocr_runtime.py   # empacota pdf_ocr.py → tools/ocr-runtime/mdword-ocr.exe
  document_lifecycle.test.cjs  # testes automatizados de ciclo de documento e colagem
  markdownPaste.js       # deteccao, insercao e desfazer de colagens
tools/
  md2docx-runtime/md2docx.exe  # runtime de exportação DOCX (não versionado)
  ocr-runtime/           # runtime OCR gerado por npm run build:ocr
assets/
  app-icon.ico
release/
  MDWord-0.1.1-Setup.exe  # instalador Windows atual
  win-unpacked/MDWord.exe  # executável solto
```

## Comandos essenciais

```
npm run dev       # modo desenvolvimento (Vite + Electron)
npm test          # testes de ciclo de documento
npm run build:ocr # compila runtime OCR com PyInstaller
npm run dist      # build completo + instalador NSIS
```

## Decisões arquiteturais relevantes

### Renderização WYSIWYG de markdown
Toast UI Editor (ProseMirror) não re-parseia markdown automaticamente em contextos IPC assíncronos nem ao colar texto puro. A solução adotada é o ciclo `changeMode('markdown') → setMarkdown → changeMode('wysiwyg')`, que força um re-parse completo. Essa chamada fica centralizada em `setMarkdown()` em `App.jsx`.

### Remontagem do editor ao abrir documento
`applyDocument()` sempre remonta o editor com `initialValue=''` + incremento de `key`, depois aplica o conteúdo via `pendingMarkdownRef` + `flushPendingMarkdown` (sem deps, dispara em todo render). Um fallback de 120ms garante a aplicação quando `flushPendingMarkdown` perde a janela de editor pronto (ex.: abrir vários recentes em sequência rápida).

### Interceptacao de paste em capture phase
`addEventListener('paste', handler, true)` intercepta antes do ProseMirror. `looksLikeMarkdown()` detecta padroes (`# `, `**`, `- `, `` ` ``, tabelas etc.) e insere o conteudo na selecao atual pelo ciclo de modo Markdown, voltando ao WYSIWYG em seguida.

### Colar como texto e desfazer
`Colar como texto` esta disponivel na ribbon, no menu e em `Ctrl+Shift+V`. Colagens interceptadas registram snapshot antes e depois para que `Ctrl+Z` reverta uma colagem grande em uma unica operacao.

### Perfis Markdown
O app inicia em `Markdown puro` e pode alternar para `Markdown com tabelas`. O perfil fica em `localStorage` e controla a exibicao do comando de tabela.

### Instância única
`app.requestSingleInstanceLock()` redireciona arquivos abertos para a janela já ativa via IPC.

### Controle de alterações pendentes
Estado `dirty` + `pendingGuard()` protege todas as transições de documento (Novo, Abrir, Recentes, Importar, fechar janela, associação Windows). Oferece Salvar / Descartar / Cancelar.

### Rascunho temporário
Documento novo nao salvo grava rascunho em `localStorage` e oferece recuperacao na proxima abertura.

## Estado atual

- Versao: 0.1.1
- Instalador gerado: `release/MDWord-0.1.1-Setup.exe` (2026-06-22)
- Colagem Markdown formatada, colagem como texto, desfazer de colagens, perfis Markdown e OCR otimizado concluidos.
- Instalador reduzido para 198,23 MiB. Helper OCR reduzido para 27,46 MB.

## Próximos passos

1. Validar instalador em ambiente limpo (ver checklist em `HANDOFF.md`).
2. Melhorar heurística de OCR para parágrafos, listas e colunas.
3. Reduzir tamanho do bundle do renderer.
4. Remover fallback absoluto para `C:\Users\jairs\Claude\ConversorMD2DocX\dist\md2docx.exe` quando o runtime empacotado estiver validado.

## Problemas conhecidos / bugs abertos

- Aviso de `duplicate dependency references` no build (prosemirror/react duplicados) é inofensivo.
- PyInstaller 7.0 bloqueará execução como administrador (aviso presente desde 6.19.0).
