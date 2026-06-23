# HANDOFF

## Estado para retomada

O projeto esta funcional e empacotado. Atualizado em 2026-06-22.

Entregas concluidas:

1. Editor visual de Markdown puro.
0. Corrigido: colar markdown, abrir arquivo e abrir recentes agora formatam corretamente em WYSIWYG (2026-06-08).
2. Ribbon superior estilo WordPad com comandos compativeis com Markdown puro.
3. Menu nativo `Arquivo > Abrir Markdown` abrindo o Explorer diretamente pelo processo principal.
4. Importacao de DOCX.
5. Importacao de PDF textual.
6. Importacao de PDF com OCR.
7. Exportacao para DOCX usando o runtime `md2docx.exe`.
8. Exportacao para PDF.
9. Impressao.
10. Auto save e recentes.
11. Instalador Windows.
12. Atalho local criado na area de trabalho desta maquina.
13. Abertura de `.md` recebido pela associacao do Windows ou por linha de comando.
14. Controle de instancia unica encaminhando arquivos abertos para a janela ja ativa.
15. Barra de menu nativa forçada como visivel na janela principal.
16. Toolbar interna duplicada do Toast UI removida da tela principal.
17. Layout do editor ajustado para evitar painel branco fixo quando o documento nao ocupa a altura da janela.
18. Validacao visual registrada em 24/04/2026: o painel branco inutil sumiu e a tela principal ficou sem toolbar duplicada.
19. App ajustado em 24/04/2026 para iniciar em documento vazio, sem restaurar ultimo arquivo, e com comando `Fechar documento` na ribbon e no menu nativo.
20. Atalhos revisados em 24/04/2026 com aceleradores no menu nativo e fallback `keydown` no renderer para arquivo e formatacao.
21. App ajustado em 07/05/2026 para focar o editor ao abrir, permitindo colar imediatamente com `Ctrl+V`.
22. Fechamento da janela e troca de documento agora protegem alteracoes pendentes com as opcoes `Salvar`, `Descartar` e `Cancelar`.
23. Menu nativo `Arquivo > Recentes` adicionado, com abertura de item e limpeza da lista.
24. Titulo da janela passa a exibir `*` quando ha alteracoes pendentes.
25. Documento novo ainda nao salvo passa a manter rascunho temporario local e oferecer recuperacao ao reabrir.
26. Adicionado `npm test` para validar regras de ciclo de documento.
27. Adicionado `Colar como texto` na ribbon, no menu nativo e no atalho `Ctrl+Shift+V`.
28. Colagens Markdown agora exibem confirmacao visual e podem ser desfeitas integralmente com `Ctrl+Z`.
29. Adicionados os perfis persistentes `Markdown puro` e `Markdown com tabelas`.
30. Versao atualizada para `0.1.1`.
31. Helper OCR reduzido de 72,59 MB para 27,46 MB e validado com Tesseract embarcado.
32. Instalador reduzido de 242,99 MiB para 198,23 MiB, economia de 44,76 MiB ou 18,4%.

## Artefatos principais

1. Instalador: `release/MDWord-0.1.1-Setup.exe`
2. Executavel solto: `release/win-unpacked/MDWord.exe`
3. Runtime OCR gerado sob demanda por `npm run build:ocr`
4. Runtime md2docx local em `tools/md2docx-runtime/md2docx.exe`, ignorado pelo Git e copiado para `resources/md2docx-runtime` no empacotamento

## O que validar na proxima sessao

1. Instalar o app em ambiente limpo.
2. Confirmar associacao de `.md`.
3. Testar roundtrip real com arquivos DOCX e PDF do usuario.
4. Medir se o OCR embarcado atende PDFs escaneados reais em portugues.
5. Testar `Salvar como DOCX` no aplicativo instalado, verificando capa, sumario, rodape, titulos, listas e links gerados pelo md2docx.
6. Confirmar que duplo clique ou `Abrir com` em `.md` carrega o arquivo selecionado.
7. Confirmar que a barra de menu nativa aparece como `Arquivo`, `Editar` e `Exibir`.
8. Em nova instalacao, reconfirmar visualmente que nao ha toolbar duplicada nem painel branco fixo abaixo do conteudo.
9. Confirmar que abrir o app diretamente mostra documento vazio, enquanto abrir um `.md` pelo Explorer carrega somente o arquivo selecionado.
10. Confirmar `Ctrl+N`, `Ctrl+S`, `Ctrl+B`, `Ctrl+I`, `Ctrl+K`, titulos e listas com foco dentro do editor.
11. Abrir o app diretamente e testar `Ctrl+V` sem clicar no editor.
12. Colar conteudo em documento novo e fechar a janela, confirmando que o app pergunta se deve salvar.
13. Com alteracoes pendentes, testar Novo, Abrir, Recentes, Importar e arquivo recebido por associacao do Windows, confirmando que nenhuma troca de documento ocorre sem confirmacao.
14. Testar `Arquivo > Recentes`, abertura de item recente e limpeza da lista.
15. Confirmar `*` no titulo da janela enquanto houver alteracoes pendentes.
16. Simular rascunho local de documento novo e confirmar oferta de recuperacao na abertura.
17. Testar colagem Markdown no meio do documento, sobre uma selecao e desfazer com `Ctrl+Z`.
18. Testar `Ctrl+Shift+V` com texto que contenha marcadores Markdown.
19. Alternar para `Markdown com tabelas`, criar uma tabela e confirmar persistencia do perfil ao reabrir.

## Melhor proxima entrega

1. Melhorar heuristica de OCR para paragrafos, listas e colunas.
2. Reduzir tamanho do bundle do renderer.
3. Remover fallback absoluto para `C:\Users\jairs\Claude\ConversorMD2DocX\dist\md2docx.exe` quando o runtime empacotado ja estiver validado em ambiente limpo.

## Encerramento da secao 2026-06-23

Estado salvo e documentado para retomada.

1. Testes finais executados: `npm test`, `node --check` em `src/main/main.cjs` e `src/main/preload.cjs`, `python -m py_compile` em `scripts/pdf_ocr.py` e `scripts/build_ocr_runtime.py`, alem de `git diff --check`.
2. Artefato final confirmado em `release/MDWord-0.1.1-Setup.exe`.
3. `release/` e runtimes locais permanecem ignorados pelo Git conforme `.gitignore`.
4. Conexao medida em 2026-06-23: download 298,61 Mbit/s e upload 220,22 Mbit/s.
5. Proxima retomada deve comecar por teste manual do instalador `0.1.1`, especialmente `Ctrl+Shift+V`, perfil com tabelas e OCR em PDF escaneado real.
