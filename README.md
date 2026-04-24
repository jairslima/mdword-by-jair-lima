# MDWord

MDWord e um editor desktop de Markdown puro com visual inspirado no WordPad.

## O que faz

1. Abre arquivos `.md` em modo visual, sem expor os marcadores no editor WYSIWYG.
2. Salva sempre em Markdown puro, mantendo o arquivo legivel fora do aplicativo.
3. Importa `.docx` e `.pdf` para Markdown puro.
4. Pode usar OCR em PDF escaneado, automaticamente quando necessario ou por comando explicito.
5. Exporta Markdown para `.docx` e `.pdf`.
6. Imprime com a formatacao renderizada.
7. Inicia em documento vazio, mantem auto save para arquivo salvo e lista de arquivos recentes.
8. Leva o runtime de OCR dentro do instalador, sem exigir Python no computador de destino.

## Perfil do editor

O projeto opera em `Perfil Markdown puro`.

Isso significa que a interface so exibe comandos que podem ser representados sem depender de extensoes como tabelas, checklist, rodape de pagina ou quebras de pagina proprietarias.

## Atalhos principais

1. `Ctrl+N`: novo documento.
2. `Ctrl+O`: abrir Markdown.
3. `Ctrl+W`: fechar documento.
4. `Ctrl+S`: salvar.
5. `Ctrl+Shift+S`: salvar como.
6. `Ctrl+P`: imprimir.
7. `Ctrl+B`: negrito.
8. `Ctrl+I`: italico.
9. `Ctrl+K`: inserir link.
10. `Ctrl+Alt+1`, `Ctrl+Alt+2`, `Ctrl+Alt+3`: titulos.
11. `Ctrl+Shift+7` e `Ctrl+Shift+8`: lista numerada e lista com marcadores.

## Comandos

```powershell
npm install
npm run dev
npm run build
npm run build:ocr
npm run dist
npm run make:icon
```
