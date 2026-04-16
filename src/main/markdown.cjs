const MarkdownIt = require('markdown-it');

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  breaks: false
});

function normalizeMarkdown(input = '') {
  return String(input)
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

function renderMarkdown(markdownSource = '') {
  const content = markdown.render(normalizeMarkdown(markdownSource));
  return `
    <article class="mdword-print-body">
      ${content}
    </article>
  `;
}

function buildPrintHtml(title, markdownSource) {
  const safeTitle = String(title || 'Documento');
  return `<!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <title>${safeTitle}</title>
      <style>
        @page {
          size: A4;
          margin: 18mm 16mm 18mm 16mm;
        }

        :root {
          color-scheme: light;
        }

        body {
          margin: 0;
          background: #f3efe7;
          color: #2a2621;
          font-family: "Segoe UI", Tahoma, sans-serif;
        }

        .mdword-print-body {
          max-width: 760px;
          margin: 0 auto;
          background: #fffdfa;
          min-height: 100vh;
          padding: 48px 56px;
          box-sizing: border-box;
        }

        h1, h2, h3, h4, h5, h6 {
          color: #2b2118;
          margin-top: 1.4em;
          margin-bottom: 0.45em;
          line-height: 1.2;
        }

        p, li, blockquote {
          font-size: 12pt;
          line-height: 1.6;
        }

        p, ul, ol, blockquote, pre {
          margin-top: 0;
          margin-bottom: 1em;
        }

        code {
          font-family: "Cascadia Code", Consolas, monospace;
          background: #f0eadc;
          padding: 0.12rem 0.35rem;
          border-radius: 4px;
        }

        pre {
          background: #f6f0e4;
          border: 1px solid #ddd0b6;
          border-radius: 10px;
          padding: 16px;
          overflow: hidden;
        }

        pre code {
          background: transparent;
          padding: 0;
        }

        blockquote {
          border-left: 4px solid #b89a73;
          padding-left: 16px;
          color: #5d4c3b;
        }

        a {
          color: #055ea8;
        }

        hr {
          border: none;
          border-top: 1px solid #cdbda5;
          margin: 1.5em 0;
        }

        img {
          max-width: 100%;
        }
      </style>
    </head>
    <body>
      ${renderMarkdown(markdownSource)}
    </body>
  </html>`;
}

module.exports = {
  buildPrintHtml,
  normalizeMarkdown,
  renderMarkdown
};
