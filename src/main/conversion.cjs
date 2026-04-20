const fs = require('node:fs/promises');
const fssync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const mammoth = require('mammoth');
const TurndownService = require('turndown');
const pdfParse = require('pdf-parse');

const { normalizeMarkdown } = require('./markdown.cjs');
const execFileAsync = promisify(execFile);

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**'
});

turndown.remove(['style', 'script']);

function deriveTitle(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function getProjectRoot() {
  if (process.resourcesPath && !process.defaultApp) {
    return process.resourcesPath;
  }
  return path.resolve(__dirname, '..', '..');
}

function getOcrExecutablePath() {
  const root = getProjectRoot();
  const bundledExe = path.join(root, 'ocr-runtime', 'mdword-ocr.exe');
  if (fssync.existsSync(bundledExe)) {
    return bundledExe;
  }
  return null;
}

function getMd2DocxExecutablePath() {
  const root = getProjectRoot();
  const candidates = [
    path.join(root, 'md2docx-runtime', 'md2docx.exe'),
    path.join(root, 'tools', 'md2docx-runtime', 'md2docx.exe'),
    path.join('C:', 'Users', 'jairs', 'Claude', 'ConversorMD2DocX', 'dist', 'md2docx.exe')
  ];

  return candidates.find((candidate) => fssync.existsSync(candidate)) || null;
}

function hasOcrRuntime() {
  return Boolean(getOcrExecutablePath());
}

async function runOcr(filePath) {
  const executable = getOcrExecutablePath();
  if (!executable) {
    throw new Error('Runtime OCR nao encontrado.');
  }

  const { stdout } = await execFileAsync(
    executable,
    [filePath, 'por+eng'],
    {
      cwd: path.dirname(executable),
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 20
    }
  );
  return JSON.parse(stdout);
}

function plainTextToMarkdown(text) {
  const normalized = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '    ')
    .split('\f')
    .map((page) => page.trim())
    .filter(Boolean)
    .map((page) =>
      page
        .split('\n')
        .map((line) => line.trimEnd())
        .join('\n')
    )
    .join('\n\n');

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split('\n').map((line) => line.trim());
      if (lines.length === 1 && /^([A-Z0-9][A-Z0-9\s]{3,})$/.test(lines[0])) {
        return `# ${lines[0]}`;
      }

      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        return lines.join('\n');
      }

      return lines.join(' ');
    });

  return normalizeMarkdown(paragraphs.join('\n\n'));
}

async function convertDocxToMarkdown(filePath) {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.convertToHtml({ buffer });
  return {
    markdown: normalizeMarkdown(turndown.turndown(result.value)),
    title: deriveTitle(filePath),
    sourcePath: filePath,
    messages: result.messages ?? []
  };
}

async function convertPdfToMarkdown(filePath) {
  const buffer = await fs.readFile(filePath);
  const result = await pdfParse(buffer);
  let extractedText = result.text || '';
  let ocrUsed = false;

  if (normalizeMarkdown(extractedText).length < 80 && hasOcrRuntime()) {
    try {
      const parsed = await runOcr(filePath);
      if (parsed.text && normalizeMarkdown(parsed.text).length >= normalizeMarkdown(extractedText).length) {
        extractedText = parsed.text;
        ocrUsed = true;
      }
    } catch (_error) {
      ocrUsed = false;
    }
  }

  return {
    markdown: plainTextToMarkdown(extractedText),
    title: deriveTitle(filePath),
    sourcePath: filePath,
    ocrUsed
  };
}

async function convertPdfToMarkdownWithOcr(filePath) {
  const parsed = await runOcr(filePath);
  return {
    markdown: plainTextToMarkdown(parsed.text || ''),
    title: deriveTitle(filePath),
    sourcePath: filePath,
    ocrUsed: true
  };
}

async function exportMarkdownToDocx(filePath, markdown, documentTitle) {
  const executable = getMd2DocxExecutablePath();
  if (!executable) {
    throw new Error('Runtime md2docx nao encontrado.');
  }

  const outputDir = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath)) || documentTitle || 'documento';
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mdword-md2docx-'));
  const tempMarkdownPath = path.join(tempDir, `${baseName}.md`);

  try {
    await fs.writeFile(tempMarkdownPath, normalizeMarkdown(markdown), 'utf8');
    await execFileAsync(
      executable,
      [tempMarkdownPath, '--force', '--output', outputDir],
      {
        cwd: tempDir,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 20
      }
    );

    const generatedPath = path.join(outputDir, `${baseName}.docx`);
    if (!fssync.existsSync(generatedPath)) {
      throw new Error('md2docx terminou sem gerar o arquivo DOCX esperado.');
    }

    if (generatedPath !== filePath) {
      await fs.copyFile(generatedPath, filePath);
      await fs.rm(generatedPath, { force: true });
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  return filePath;
}

module.exports = {
  convertDocxToMarkdown,
  convertPdfToMarkdown,
  convertPdfToMarkdownWithOcr,
  exportMarkdownToDocx
};
