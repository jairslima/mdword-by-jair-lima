# HANDOFF

## Estado para retomada

O projeto esta funcional e empacotado.

Entregas concluidas:

1. Editor visual de Markdown puro.
2. Importacao de DOCX.
3. Importacao de PDF textual.
4. Importacao de PDF com OCR.
5. Exportacao para DOCX.
6. Exportacao para PDF.
7. Impressao.
8. Auto save e recentes.
9. Instalador Windows.
10. Atalho local criado na area de trabalho desta maquina.

## Artefatos principais

1. Instalador: `release/MDWord-0.1.0-Setup.exe`
2. Executavel solto: `release/win-unpacked/MDWord.exe`
3. Runtime OCR gerado sob demanda por `npm run build:ocr`

## O que validar na proxima sessao

1. Instalar o app em ambiente limpo.
2. Confirmar associacao de `.md`.
3. Testar roundtrip real com arquivos DOCX e PDF do usuario.
4. Medir se o OCR embarcado atende PDFs escaneados reais em portugues.

## Melhor proxima entrega

1. Melhorar heuristica de OCR para paragrafos, listas e colunas.
2. Criar menu nativo de recentes.
3. Reduzir tamanho do bundle do renderer.
