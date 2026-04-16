# MDWord

MDWord e um editor desktop de Markdown puro com visual inspirado no WordPad.

## O que faz

1. Abre arquivos `.md` em modo visual, sem expor os marcadores no editor WYSIWYG.
2. Salva sempre em Markdown puro, mantendo o arquivo legivel fora do aplicativo.
3. Importa `.docx` e `.pdf` para Markdown puro.
4. Pode usar OCR em PDF escaneado, automaticamente quando necessario ou por comando explicito.
5. Exporta Markdown para `.docx` e `.pdf`.
6. Imprime com a formatacao renderizada.
7. Mantem rascunho local, auto save e lista de arquivos recentes.
8. Leva o runtime de OCR dentro do instalador, sem exigir Python no computador de destino.

## Perfil do editor

O projeto opera em `Perfil Markdown puro`.

Isso significa que a interface so exibe comandos que podem ser representados sem depender de extensoes como tabelas, checklist, rodape de pagina ou quebras de pagina proprietarias.

## Comandos

```powershell
npm install
npm run dev
npm run build
npm run build:ocr
npm run dist
npm run make:icon
```
