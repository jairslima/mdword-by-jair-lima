# CHANGELOG

## 2026-04-24

1. Removida a toolbar interna duplicada do Toast UI Editor, mantendo apenas a ribbon do MDWord.
2. Corrigido o layout do editor para nao forcar um painel branco fixo ocupando toda a altura restante da janela.
3. Registrada validacao visual: o painel branco inutil sumiu e nao ha toolbar duplicada abaixo da faixa principal.
4. Regenerado o instalador `release/MDWord-0.1.0-Setup.exe`.

## 2026-04-22

1. Corrigida a abertura de arquivos `.md` recebidos pela associacao do Windows ou por linha de comando.
2. Adicionado controle de instancia unica para encaminhar arquivos abertos com o app ja em execucao.
3. Adicionado buffer de documento inicial para evitar perda do conteudo quando o renderer ainda nao carregou o editor.
4. Forcada a barra de menu nativa como visivel na janela principal.
5. Corrigido o `base` do Vite para carregar JS e CSS por caminho relativo no app empacotado.
6. Desativado o sandbox do Chromium no renderer para evitar falha `platform_channel` com `Acesso negado` no Windows.
7. Alterado o controle de instancia unica para nao fechar o app quando o lock falhar com `Acesso negado`.
8. Tornado o salvamento de recentes nao fatal quando `settings.json` estiver bloqueado ou sem permissao.
9. Validado `npm run build`, `node --check` em `main.cjs` e `preload.cjs`.

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
