# HANDOFF

## Estado para retomada

O projeto esta funcional e empacotado.

Entregas concluidas:

1. Editor visual de Markdown puro.
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

## Artefatos principais

1. Instalador: `release/MDWord-0.1.0-Setup.exe`
2. Executavel solto: `release/win-unpacked/MDWord.exe`
3. Runtime OCR gerado sob demanda por `npm run build:ocr`
4. Runtime md2docx local em `tools/md2docx-runtime/md2docx.exe`, ignorado pelo Git e copiado para `resources/md2docx-runtime` no empacotamento

## O que validar na proxima sessao

1. Instalar o app em ambiente limpo.
2. Confirmar associacao de `.md`.
3. Testar roundtrip real com arquivos DOCX e PDF do usuario.
4. Medir se o OCR embarcado atende PDFs escaneados reais em portugues.
5. Testar `Salvar como DOCX` no aplicativo instalado, verificando capa, sumario, rodape, titulos, listas e links gerados pelo md2docx.

## Melhor proxima entrega

1. Melhorar heuristica de OCR para paragrafos, listas e colunas.
2. Criar menu nativo de recentes.
3. Reduzir tamanho do bundle do renderer.
4. Remover fallback absoluto para `C:\Users\jairs\Claude\ConversorMD2DocX\dist\md2docx.exe` quando o runtime empacotado ja estiver validado em ambiente limpo.
