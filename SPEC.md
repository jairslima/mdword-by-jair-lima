# SPEC

## 1. Resumo do projeto

Nome do projeto: MDWord by Jair Lima

Objetivo principal: fornecer um editor visual desktop para arquivos Markdown puros, com fluxo semelhante ao WordPad.

Problema que resolve: editar Markdown como documento formatado, sem expor marcadores ao usuario no modo visual, mantendo o arquivo final em `.md`.

Estado atual: base funcional em Electron com editor WYSIWYG, abertura e salvamento de Markdown, impressao HTML, importacao de DOCX e PDF com OCR opcional, exportacao para DOCX e PDF, auto save, recentes, runtime OCR empacotado e empacotamento Windows validado.

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

1. Recursos que nao pertencem ao perfil Markdown puro, como tabelas, checklist, cabecalho de pagina, rodape de pagina, quebra manual de pagina e notas de rodape.
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
5. `src/renderer/App.jsx`, shell visual e fluxo do editor.
6. `src/renderer/styles.css`, identidade visual inspirada no WordPad.

Fluxo geral da aplicacao:

1. O renderer edita o conteudo em modo visual.
2. O app salva sempre `editor.getMarkdown()`.
3. O processo principal executa abrir, salvar, imprimir e converter.
4. Impressao e exportacoes usam o Markdown como fonte unica.

## 4. Dependencias e ambiente

Linguagens e frameworks: JavaScript, React, Electron.

Ferramentas de build: Vite, electron-builder.

Dependencias externas relevantes:

1. Toast UI Editor para WYSIWYG.
2. Mammoth para DOCX para HTML.
3. Turndown para HTML para Markdown.
4. markdown-it para renderizacao.
5. html-to-docx para exportacao DOCX.
6. pdf-parse para extracao textual de PDF.
7. Python com PyMuPDF, Pillow e pytesseract para gerar o helper OCR empacotado.
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

1. O produto trabalha apenas com perfil Markdown puro.
2. A interface nao oferece botoes para recursos sem representacao confiavel nesse perfil.
3. O Markdown e a fonte de verdade para salvar, imprimir e exportar.
4. OCR de PDF pode entrar automaticamente quando a extracao textual e insuficiente.
5. O app empacotado deve preferir o runtime OCR embarcado, sem depender de Python no destino.

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
3. Editor WYSIWYG com toolbar filtrada.
4. Abrir, salvar, salvar como, importar DOCX, importar PDF, importar PDF com OCR, exportar DOCX, exportar PDF e imprimir.
5. Auto save em arquivo salvo e rascunho local para recuperacao.
6. Lista de arquivos recentes.
7. Runtime OCR empacotado com helper executavel e Tesseract minimo.

O que esta em andamento:

1. Nenhuma frente tecnica obrigatoria aberta nesta sessao.

O que ainda falta:

1. Recuperacao avancada de estrutura em PDFs mais complexos.
2. Historico de versoes.
3. Menu nativo de recentes.

Principais riscos conhecidos:

1. Conversao PDF para Markdown depende da qualidade do texto extraido.
2. Alguns estilos muito ricos de DOCX serao simplificados.

## 8. Backlog e proximos passos

Proxima tarefa recomendada: testar roundtrip real com arquivos DOCX e PDF do usuario apos instalacao limpa do aplicativo.

Entregas pendentes:

1. Melhorar a heuristica de paragrafos e listas em PDF convertido por OCR.
2. Menu nativo de recentes.
3. Validacao da associacao de arquivo `.md` apos instalacao.

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
9. Restaurar rascunho local e executar auto save quando houver caminho salvo.

Como validar manualmente:

1. Abrir um Markdown existente.
2. Aplicar negrito, italico, lista e citacao.
3. Salvar e inspecionar o arquivo em editor de texto.
4. Exportar DOCX e abrir no Word.
5. Importar DOCX, PDF textual e PDF com OCR.
6. Imprimir ou abrir a janela de impressao.

Testes minimos esperados:

1. Build do renderer.
2. Roundtrip basico de abrir, editar e salvar.
3. Geracao do instalador Windows.

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
3. `npm run build`
4. `npm run dist`

O que um novo agente precisa ler primeiro:

1. Este `SPEC.md`
2. `README.md`
3. `HANDOFF.md`
4. `src/main/main.cjs`

Observacoes para retomada:

1. O app foi desenhado para nao prometer recursos fora do perfil Markdown puro.
2. Qualquer expansao de toolbar deve validar compatibilidade com o formato antes de ser exposta.
