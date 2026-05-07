const assert = require('node:assert/strict');

(async () => {
  const {
    buildWindowTitle,
    hasRecoverableDraft,
    normalizeMenuAction,
    shouldSaveDraft
  } = await import('../src/shared/documentLifecycle.js');

assert.equal(buildWindowTitle({ dirty: false, filePath: '' }), 'Sem titulo.md - MDWord');
assert.equal(buildWindowTitle({ dirty: true, filePath: '' }), '* Sem titulo.md - MDWord');
assert.equal(buildWindowTitle({ dirty: true, filePath: 'C:\\Temp\\livro.md' }), '* livro.md - MDWord');

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

console.log('document lifecycle checks passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
