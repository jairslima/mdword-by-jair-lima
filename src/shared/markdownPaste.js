const blockMarkdownPattern = /(?:^|\n)(?: {0,3}#{1,6}\s+| {0,3}(?:[*+-]|\d+[.)])\s+| {0,3}>\s*| {0,3}```| {0,3}~~~| {0,3}(?:[-*_]\s*){3,}$)/m;
const tableSeparatorPattern = /(?:^|\n)\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*(?:\n|$)/m;
const inlineMarkdownPattern = /(?:\*\*|__)[^\s*_](?:.|\n)*?(?:\*\*|__)|!?\[[^\]\n]+\]\([^\s)]+(?:\s+["'][^"']*["'])?\)|`[^`\n]+`/;

export function normalizePastedText(text) {
  return String(text || '').replace(/\r\n?/g, '\n');
}

export function looksLikeMarkdown(text) {
  const normalized = normalizePastedText(text);
  return blockMarkdownPattern.test(normalized)
    || tableSeparatorPattern.test(normalized)
    || inlineMarkdownPattern.test(normalized);
}

export function prepareMarkdownPaste(text) {
  const normalized = normalizePastedText(text);
  if (!blockMarkdownPattern.test(normalized) && !tableSeparatorPattern.test(normalized)) {
    return normalized;
  }

  return `\n\n${normalized.trim()}\n\n`;
}

export function insertMarkdownAtSelection(editor, text) {
  if (!editor || !looksLikeMarkdown(text)) {
    return false;
  }

  const returnToWysiwyg = typeof editor.isWysiwygMode !== 'function'
    || editor.isWysiwygMode();

  editor.changeMode('markdown');
  editor.replaceSelection(prepareMarkdownPaste(text));

  if (returnToWysiwyg) {
    editor.changeMode('wysiwyg');
  }

  editor.focus();
  return true;
}

export function insertPlainTextAtSelection(editor, text) {
  const normalized = normalizePastedText(text);
  if (!editor || !normalized) {
    return false;
  }

  editor.insertText(normalized);
  editor.focus();
  return true;
}

export function canUndoPaste(currentMarkdown, snapshot) {
  return Boolean(snapshot) && currentMarkdown === snapshot.after;
}
