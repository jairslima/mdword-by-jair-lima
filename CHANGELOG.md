# CHANGELOG

## 2026-04-16

1. Criada a base do aplicativo desktop MDWord em Electron, React e Vite.
2. Implementado editor visual de Markdown puro com visual inspirado no WordPad.
3. Implementadas abertura, salvamento, salvamento como e impressao de arquivos Markdown.
4. Implementadas importacoes de DOCX e PDF para Markdown.
5. Implementadas exportacoes para DOCX e PDF.
6. Adicionados auto save, rascunho local e lista de arquivos recentes.
7. Adicionado OCR de PDF escaneado com helper executavel e runtime local do Tesseract.
8. Gerado icone do aplicativo, associacao `.md` no instalador e build Windows.

## 2026-04-20

1. Adicionada ribbon superior inspirada no WordPad com comandos de arquivo, fonte, paragrafo, insercao e conversao.
2. Corrigido o menu nativo `Arquivo > Abrir Markdown`, que agora abre o Explorer pelo processo principal e envia o documento ao renderer por IPC.
3. Alterada a exportacao `Salvar como DOCX` para usar o runtime `md2docx.exe`, mais completo que a conversao anterior baseada em HTML.
4. Incluido `tools/md2docx-runtime` no empacotamento como `resources/md2docx-runtime`.
5. Removida a dependencia `html-to-docx`.
6. Atualizados `SPEC.md` e `HANDOFF.md`.
7. Gerado novo instalador `release/MDWord-0.1.0-Setup.exe`.
