export function getDisplayName(filePath) {
  if (!filePath) {
    return 'Sem titulo.md';
  }

  const parts = String(filePath).split(/[/\\]/);
  return parts[parts.length - 1] || 'Sem titulo.md';
}

export function buildWindowTitle({ dirty = false, filePath = '' } = {}) {
  return `${dirty ? '* ' : ''}${getDisplayName(filePath)} - MDWord`;
}

export function hasRecoverableDraft(markdown) {
  return Boolean(String(markdown || '').trim());
}

export function shouldSaveDraft({ dirty = false, filePath = '' } = {}) {
  return Boolean(dirty && !filePath);
}

export function normalizeMenuAction(action) {
  if (typeof action === 'string') {
    return { type: action };
  }

  if (!action || typeof action !== 'object') {
    return { type: '' };
  }

  return {
    type: action.type || '',
    filePath: action.filePath || ''
  };
}
