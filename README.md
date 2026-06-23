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
9. Coloca o foco no editor ao abrir, para permitir colar texto imediatamente.
10. Protege alteracoes nao salvas ao fechar, abrir outro arquivo, importar, criar novo ou trocar de documento.
11. Mostra arquivos recentes tambem no menu nativo `Arquivo > Recentes`.
12. Indica alteracoes pendentes no titulo da janela com `*`.
13. Mantem rascunho temporario para documento novo ainda nao salvo e oferece recuperacao ao reabrir.
14. Formata Markdown colado, confirma a operacao na tela e permite desfazer colagens grandes integralmente.
15. Oferece `Colar como texto` para manter marcadores e outros caracteres literalmente.
16. Permite alternar entre os perfis `Markdown puro` e `Markdown com tabelas`.

## Perfil do editor

O projeto inicia em `Perfil Markdown puro` e permite selecionar `Markdown com tabelas` na faixa de documento.

No perfil puro, a interface exibe apenas comandos do conjunto basico. No perfil com tabelas, a ribbon tambem oferece criacao de tabelas, mantendo o conteudo em Markdown legivel.

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
12. `Ctrl+Shift+V`: colar como texto, sem interpretar Markdown.
13. `Ctrl+Z`: desfazer, incluindo colagens grandes em uma unica operacao.

## Comandos

```powershell
npm install
npm run dev
npm test
npm run build
npm run build:ocr
npm run dist
npm run make:icon
```
