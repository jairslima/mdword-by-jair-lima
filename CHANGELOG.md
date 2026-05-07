# CHANGELOG

## 2026-05-07

1. Corrigido foco inicial do aplicativo, agora o editor recebe foco ao abrir e permite colar com `Ctrl+V` sem clique previo.
2. Substituida a confirmacao simples de descarte por um fluxo com `Salvar`, `Descartar` e `Cancelar`.
3. Protegidas alteracoes pendentes ao fechar a janela, criar novo documento, fechar documento, abrir arquivo, abrir recente, importar DOCX, importar PDF e receber arquivo por associacao do Windows.
4. Ajustado o texto de auto save para informar que documento novo precisa ser salvo antes de ativar auto save.
5. Adicionado menu nativo `Arquivo > Recentes`, com abertura de item e limpeza da lista.
6. Adicionado indicador `*` no titulo da janela quando ha alteracoes pendentes.
7. Adicionado rascunho temporario para documento novo ainda nao salvo, com recuperacao ao reabrir.
8. Adicionado `npm test` com verificacoes automatizadas de ciclo de documento.
9. Atualizados `README.md`, `SPEC.md` e `HANDOFF.md` com os comportamentos esperados.
10. Validado `npm test`, `npm run build` e regenerado o instalador `release/MDWord-0.1.0-Setup.exe`.

## 2026-04-24

1. Removida a toolbar interna duplicada do Toast UI Editor, mantendo apenas a ribbon do MDWord.
2. Corrigido o layout do editor para nao forcar um painel branco fixo ocupando toda a altura restante da janela.
3. Registrada validacao visual: o painel branco inutil sumiu e nao ha toolbar duplicada abaixo da faixa principal.
4. Corrigida a inicializacao para abrir em documento vazio, sem restaurar automaticamente o ultimo arquivo aberto.
5. Adicionado comando `Fechar documento` na ribbon e no menu nativo.
6. Revisados atalhos de arquivo e formatacao com aceleradores no menu nativo e fallback no renderer.
7. Regenerado o instalador `release/MDWord-0.1.0-Setup.exe`.

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
