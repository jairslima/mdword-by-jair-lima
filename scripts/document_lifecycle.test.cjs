const assert = require('node:assert/strict');

(async () => {
  const {
    buildWindowTitle,
    hasRecoverableDraft,
    normalizeMenuAction,
    shouldSaveDraft
  } = await import('../src/shared/documentLifecycle.js');
  const {
    canUndoPaste,
    insertMarkdownAtSelection,
    insertPlainTextAtSelection,
    looksLikeMarkdown,
    normalizePastedText,
    prepareMarkdownPaste
  } = await import('../src/shared/markdownPaste.js');

assert.equal(buildWindowTitle({ dirty: false, filePath: '' }), 'Sem titulo.md - MDWord by Jair Lima');
assert.equal(buildWindowTitle({ dirty: true, filePath: '' }), '* Sem titulo.md - MDWord by Jair Lima');
assert.equal(buildWindowTitle({ dirty: true, filePath: 'C:\\Temp\\livro.md' }), '* livro.md - MDWord by Jair Lima');

assert.equal(hasRecoverableDraft(''), false);
assert.equal(hasRecoverableDraft('   \n'), false);
assert.equal(hasRecoverableDraft('texto colado'), true);

assert.equal(shouldSaveDraft({ dirty: false, filePath: '' }), false);
assert.equal(shouldSaveDraft({ dirty: true, filePath: '' }), true);
assert.equal(shouldSaveDraft({ dirty: true, filePath: 'C:\\Temp\\livro.md' }), false);

assert.deepEqual(normalizeMenuAction('save'), { type: 'save' });
assert.deepEqual(
  normalizeMenuAction({ type: 'openRecent', filePath: 'C:\\Temp\\livro.md' }),
  { type: 'openRecent', filePath: 'C:\\Temp\\livro.md' }
);

assert.equal(looksLikeMarkdown('Texto comum sem marcadores.'), false);
assert.equal(looksLikeMarkdown('## Titulo\n\nTexto com **negrito**.'), true);
assert.equal(looksLikeMarkdown('| Nome | URL |\n|---|---|\n| Site | https://example.com |'), true);
assert.equal(normalizePastedText('linha 1\r\nlinha 2'), 'linha 1\nlinha 2');
assert.equal(prepareMarkdownPaste('**negrito**'), '**negrito**');
assert.equal(prepareMarkdownPaste('## Titulo'), '\n\n## Titulo\n\n');

const calls = [];
const editor = {
  isWysiwygMode: () => true,
  changeMode: (mode) => calls.push(['changeMode', mode]),
  replaceSelection: (text) => calls.push(['replaceSelection', text]),
  focus: () => calls.push(['focus'])
};

assert.equal(insertMarkdownAtSelection(editor, '## Titulo'), true);
assert.deepEqual(calls, [
  ['changeMode', 'markdown'],
  ['replaceSelection', '\n\n## Titulo\n\n'],
  ['changeMode', 'wysiwyg'],
  ['focus']
]);

function createSelectionEditor(content, start, end = start) {
  return {
    content,
    start,
    end,
    isWysiwygMode: () => true,
    changeMode: () => {},
    replaceSelection(text) {
      this.content = this.content.slice(0, this.start) + text + this.content.slice(this.end);
      this.end = this.start + text.length;
    },
    insertText(text) {
      this.replaceSelection(text);
    },
    focus: () => {}
  };
}

const middleEditor = createSelectionEditor('Antes depois', 6);
assert.equal(insertMarkdownAtSelection(middleEditor, '**centro** '), true);
assert.equal(middleEditor.content, 'Antes **centro** depois');

const selectionEditor = createSelectionEditor('Antes remover depois', 6, 13);
assert.equal(insertMarkdownAtSelection(selectionEditor, '## Titulo'), true);
assert.equal(selectionEditor.content, 'Antes \n\n## Titulo\n\n depois');

const plainEditor = createSelectionEditor('Inicio fim', 7);
assert.equal(insertPlainTextAtSelection(plainEditor, '**literal**'), true);
assert.equal(plainEditor.content, 'Inicio **literal**fim');

const snapshot = { before: 'Antes', after: 'Depois' };
assert.equal(canUndoPaste('Depois', snapshot), true);
assert.equal(canUndoPaste('Editado depois da colagem', snapshot), false);
assert.equal(canUndoPaste('Depois', null), false);

console.log('document lifecycle and Markdown paste checks passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
