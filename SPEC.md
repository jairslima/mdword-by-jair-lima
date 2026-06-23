# SPEC

## 1. Resumo do projeto

Nome do projeto: MDWord by Jair Lima

Objetivo principal: fornecer um editor visual desktop para arquivos Markdown puros, com fluxo semelhante ao WordPad.

Problema que resolve: editar Markdown como documento formatado, sem expor marcadores ao usuario no modo visual, mantendo o arquivo final em `.md`.

Estado atual: versao `0.1.1` funcional em Electron com editor WYSIWYG, perfis Markdown puro e com tabelas, colagem formatada ou como texto, desfazer confiavel de colagens, barra de menu nativa, conversoes, auto save, recentes, runtime OCR otimizado e empacotamento Windows validado.

## 2. Escopo

O que este projeto faz:

1. Abrir, editar e salvar `.md`.
2. Exibir modo visual e modo codigo.
3. Importar `.docx` para Markdown puro.
4. Importar `.pdf` textual para Markdown puro.
5. Importar `.pdf` escaneado para Markdown com OCR.
6. Exportar `.md` para `.docx`.
7. Exportar `.md` para `.pdf`.
8. Imprimir o documento renderizado.

O que esta fora de escopo:

1. Comandos de autoria que nao pertencem ao perfil Markdown puro, como criar tabelas, checklist, cabecalho de pagina, rodape de pagina, quebra manual de pagina e notas de rodape. Tabelas Markdown ja existentes podem ser abertas ou coladas e permanecem preservadas.
2. Edicao colaborativa em rede.
3. OCR com reconstruicao perfeita de layout para PDFs complexos.

Principais casos de uso:

1. Ler um `.md` como documento formatado.
2. Editar texto formatado sem lidar com marcadores.
3. Converter documentos Word para fluxo Markdown.
4. Preparar impressao de um arquivo Markdown com visual limpo.

## 3. Estrutura e arquitetura

Stack principal: Electron, React, Vite, Toast UI Editor.

Componentes principais:

1. `src/main/main.cjs`, processo principal do Electron e comandos de arquivo.
2. `src/main/conversion.cjs`, importacao e exportacao.
3. `src/main/markdown.cjs`, serializacao e renderizacao segura.
4. `src/main/preload.cjs`, ponte IPC segura.
5. `src/renderer/App.jsx`, shell visual, ribbon e fluxo do editor.
6. `src/renderer/styles.css`, identidade visual e faixa de ferramentas inspiradas no WordPad.

Decisao de runtime Windows: o renderer roda com `contextIsolation: true`, `nodeIntegration: false` e `sandbox: false`, alem de `no-sandbox` no Chromium, para evitar falha `platform_channel` com `Acesso negado` observada no app empacotado.

Controle de instancia: quando `requestSingleInstanceLock()` funciona, uma segunda abertura encaminha o arquivo para a janela ativa. Se o lock falhar com erro de permissao do Windows, o app continua abrindo uma janela nova para nao bloquear o usuario.

Fluxo geral da aplicacao:

1. O renderer edita o conteudo em modo visual.
2. O app salva sempre `editor.getMarkdown()`.
3. O processo principal executa abrir, salvar, imprimir e converter.
4. Impressao e exportacoes usam o Markdown como fonte unica.
5. O menu nativo pode abrir Markdown diretamente e enviar o documento carregado ao renderer por IPC.
6. Arquivos recebidos pela associacao do Windows ou por linha de comando sao lidos no processo principal e entregues ao renderer quando o editor estiver pronto.

## 4. Dependencias e ambiente

Linguagens e frameworks: JavaScript, React, Electron.

Ferramentas de build: Vite, electron-builder.

Observacao de empacotamento: `vite.config.mjs` deve manter `base: './'` para que o `index.html` carregue JS e CSS por caminhos relativos dentro de `app.asar`.

Dependencias externas relevantes:

1. Toast UI Editor para WYSIWYG.
2. Mammoth para DOCX para HTML.
3. Turndown para HTML para Markdown.
4. markdown-it para renderizacao.
5. md2docx para exportacao DOCX.
6. pdf-parse para extracao textual de PDF.
7. Python com PyMuPDF para gerar o helper OCR empacotado, que chama diretamente o Tesseract por subprocesso.
8. Runtime local do Tesseract embarcado em `tools/ocr-runtime` e distribuido no instalador.

Variaveis de ambiente: nenhuma obrigatoria.

Requisitos do sistema: Windows com Node.js instalado.

## 5. Execucao local

Como instalar dependencias:

```powershell
npm install
```

Como rodar em desenvolvimento:

```powershell
npm run dev
```

Como gerar build:

```powershell
npm run build
```

Como gerar runtime OCR local:

```powershell
npm run build:ocr
```

Como gerar instalador Windows:

```powershell
npm run dist
```

Como gerar icone do aplicativo:

```powershell
npm run make:icon
```

## 6. Contratos e decisoes

Decisoes arquiteturais importantes:

1. O produto inicia no perfil Markdown puro e oferece opcionalmente o perfil Markdown com tabelas.
2. A interface so oferece criacao de tabela quando o perfil com tabelas esta ativo.
3. O Markdown e a fonte de verdade para salvar, imprimir e exportar.
4. OCR de PDF pode entrar automaticamente quando a extracao textual e insuficiente.
5. O app empacotado deve preferir o runtime OCR embarcado, sem depender de Python no destino.
6. A exportacao DOCX deve preferir o runtime `md2docx.exe` empacotado, pois ele preserva mais recursos de Markdown do que a conversao HTML intermediaria.
7. A ribbon deve priorizar comandos que cabem no perfil ativo: arquivo, colar como texto, negrito, italico, codigo, titulos, listas, citacao, linha, bloco de codigo, link, imagem por URL, tabela opcional e conversoes.
8. A toolbar interna do Toast UI deve permanecer oculta para nao duplicar comandos da ribbon nem criar faixa vazia no editor.
9. Atalhos de arquivo e formatacao devem funcionar pelo menu nativo e por fallback no renderer quando o foco estiver dentro do editor.
10. Ao abrir o aplicativo, o foco deve ir para o editor, permitindo colar texto imediatamente com `Ctrl+V`.
11. Qualquer acao que troque ou feche o documento deve proteger alteracoes pendentes com as opcoes salvar, descartar ou cancelar.
12. Arquivos recentes devem estar acessiveis na faixa do app e no menu nativo `Arquivo > Recentes`.
13. O titulo da janela deve exibir `*` quando houver alteracoes pendentes.
14. Documento novo ainda nao salvo deve manter rascunho temporario local e oferecer recuperacao quando o app reabrir apos queda ou fechamento inesperado.
15. Ao colar Markdown no modo visual, o app deve interpretar a formatacao na selecao atual, sem inserir os marcadores como texto literal nem mover o conteudo para o fim do documento.
16. Tabelas Markdown recebidas por abertura ou colagem devem ser renderizadas e preservadas; sua criacao pela ribbon depende do perfil com tabelas.
17. `Colar como texto` deve inserir o conteudo da area de transferencia literalmente na selecao atual.
18. Colagens interceptadas devem registrar snapshot suficiente para que `Ctrl+Z` reverta toda a operacao.
19. Apos colar Markdown ou texto puro, o app deve exibir confirmacao temporaria e acessivel.

Convencoes relevantes:

1. Markdown normalizado com quebras de linha LF.
2. HTML do preview com `html` desabilitado no parser.

Restricoes tecnicas:

1. Importacao de PDF preserva texto, mas nao garante reconstrucao perfeita de hierarquia visual.
2. Conversao DOCX para Markdown simplifica estilos complexos para o conjunto puro suportado.

Compatibilidades esperadas:

1. Arquivos Markdown puros legiveis em qualquer editor de texto.
2. Impressao coerente com a visualizacao renderizada do app.

## 7. Estado atual

O que ja esta pronto:

1. Estrutura do aplicativo.
2. Shell visual estilo WordPad.
3. Editor WYSIWYG com ribbon superior estilo WordPad e toolbar interna do Toast UI oculta.
4. Abrir, salvar, salvar como, importar DOCX, importar PDF, importar PDF com OCR, exportar DOCX, exportar PDF e imprimir.
5. Auto save em arquivo salvo, lista de recentes, inicializacao em documento vazio, atalhos revisados e fechamento do documento atual sem encerrar o app.
6. Lista de arquivos recentes.
7. Runtime OCR empacotado com helper executavel e Tesseract minimo.
8. Runtime md2docx empacotado para exportacao DOCX.
9. Painel branco inutil abaixo do conteudo removido e validado visualmente em 24/04/2026.
10. Colagem como texto, notificacoes, desfazer de colagens e perfis Markdown implementados em 22/06/2026.
11. Helper OCR otimizado de 72,59 MB para 27,46 MB, com reducao de 62,2%.
12. Instalador `0.1.1` com 198,23 MiB, reducao de 18,4% em relacao ao pacote anterior.

O que esta em andamento:

1. Nenhuma frente tecnica obrigatoria aberta nesta sessao.

O que ainda falta:

1. Recuperacao avancada de estrutura em PDFs mais complexos.
2. Historico de versoes.

Principais riscos conhecidos:

1. Conversao PDF para Markdown depende da qualidade do texto extraido.
2. Alguns estilos muito ricos de DOCX serao simplificados.

## 8. Backlog e proximos passos

Proxima tarefa recomendada: testar roundtrip real com arquivos DOCX e PDF do usuario apos instalacao limpa do aplicativo.

Entregas pendentes:

1. Melhorar a heuristica de paragrafos e listas em PDF convertido por OCR.
2. Validacao da associacao de arquivo `.md` apos instalacao em maquina limpa.

Melhorias futuras:

1. OCR com deteccao de colunas.
2. Historico de documentos.
3. Temas visuais adicionais.

## 9. Aceite

Criterios de aceite atuais:

1. Abrir `.md` e editar em modo visual.
2. Salvar como `.md` puro.
3. Importar `.docx` para Markdown.
4. Importar `.pdf` textual para Markdown.
5. Importar `.pdf` escaneado com OCR.
6. Exportar para `.docx`.
7. Exportar para `.pdf`.
8. Imprimir com formatacao renderizada.
9. Iniciar em documento vazio, sem restaurar automaticamente o ultimo arquivo aberto.
10. Abrir um `.md` selecionado no Windows com o MDWord e carregar seu conteudo no editor.
11. Exibir a barra de menu nativa com `Arquivo`, `Editar` e `Exibir`.
12. Fechar o documento atual e voltar para um documento vazio sem encerrar o aplicativo.
13. Executar atalhos principais como `Ctrl+N`, `Ctrl+S`, `Ctrl+B`, `Ctrl+I`, `Ctrl+K`, listas e titulos com foco no editor.
14. Permitir colar conteudo imediatamente apos abrir o aplicativo, sem clicar antes no editor.
15. Ao fechar a janela com documento novo ou editado, perguntar se o usuario deseja salvar, descartar ou cancelar o fechamento.
16. Ao abrir, importar, abrir recente, criar novo, fechar documento ou receber arquivo por associacao do Windows, perguntar antes de substituir alteracoes pendentes.
17. Exibir recentes no menu nativo `Arquivo > Recentes`, incluindo opcao de limpar a lista.
18. Exibir `*` no titulo da janela enquanto houver alteracoes pendentes.
19. Restaurar rascunho local de documento novo quando houver conteudo nao salvo em `localStorage`.
20. Colar Markdown com titulos, negrito, listas, citacoes, separadores, links, codigo ou tabelas e exibir o resultado formatado no modo visual.
21. Colar como texto pela ribbon, pelo menu e por `Ctrl+Shift+V`.
22. Desfazer uma colagem grande em uma unica operacao com `Ctrl+Z`.
23. Exibir confirmacao visual breve depois de colar.
24. Alternar e persistir os perfis Markdown puro e Markdown com tabelas.
25. Criar tabela somente quando o perfil com tabelas estiver ativo.

Como validar manualmente:

1. Abrir um Markdown existente.
2. Aplicar negrito, italico, lista e citacao.
3. Salvar e inspecionar o arquivo em editor de texto.
4. Exportar DOCX e abrir no Word.
5. Importar DOCX, PDF textual e PDF com OCR.
6. Imprimir ou abrir a janela de impressao.
7. Abrir um `.md` pelo Explorer usando o MDWord.
8. Confirmar que a barra de menu nativa aparece na janela principal.
9. Abrir o aplicativo e testar `Ctrl+V` imediatamente em documento vazio.
10. Colar texto em documento novo e fechar a janela, confirmando que aparece a pergunta de salvamento.
11. Com alteracoes pendentes, testar Novo, Abrir, Importar, Recente e arquivo aberto por associacao, confirmando que nenhuma acao substitui o texto sem confirmacao.
12. Abrir `Arquivo > Recentes`, abrir um arquivo da lista e limpar recentes.
13. Editar texto e conferir `*` no titulo da janela.
14. Simular rascunho local, reabrir o app e confirmar que a recuperacao e oferecida.
15. Posicionar o cursor no meio de um documento, colar um bloco Markdown e confirmar que o bloco foi formatado no local da selecao.
16. Selecionar texto existente, colar Markdown e confirmar que somente a selecao foi substituida.
17. Usar `Ctrl+Z` depois de uma colagem grande e confirmar a restauracao integral do conteudo anterior.
18. Usar `Ctrl+Shift+V` com `**texto**` e confirmar que os asteriscos permanecem visiveis.
19. Alternar o perfil, criar uma tabela, reiniciar o app e confirmar que a escolha foi preservada.

Testes minimos esperados:

1. `npm test`
2. Build do renderer.
3. Roundtrip basico de abrir, editar e salvar.
4. Geracao do instalador Windows.

## 10. Operacao e handoff

Onde estao os arquivos mais importantes:

1. `package.json`
2. `src/main/main.cjs`
3. `src/main/conversion.cjs`
4. `src/renderer/App.jsx`
5. `src/renderer/styles.css`
6. `scripts/pdf_ocr.py`
7. `scripts/build_ocr_runtime.py`
8. `tools/ocr-runtime`

Quais comandos sao usados com frequencia:

1. `npm install`
2. `npm run dev`
3. `npm test`
4. `npm run build`
5. `npm run dist`

O que um novo agente precisa ler primeiro:

1. Este `SPEC.md`
2. `README.md`
3. `HANDOFF.md`
4. `src/main/main.cjs`

Observacoes para retomada:

1. O app foi desenhado para nao prometer recursos fora do perfil Markdown puro.
2. Qualquer expansao de toolbar deve validar compatibilidade com o formato antes de ser exposta.
