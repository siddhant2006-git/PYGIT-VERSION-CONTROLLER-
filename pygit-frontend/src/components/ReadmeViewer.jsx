import React from 'react';
import { BookOpen } from 'lucide-react';

/**
 * Inline markdown: `code`, **bold**, *italic*, [text](url).
 * Code is split out first so its contents are never re-parsed as emphasis.
 */
function renderInline(text, keyPrefix = 'i') {
  const nodes = [];

  text.split(/(`[^`]+`)/g).forEach((chunk, chunkIndex) => {
    const key = `${keyPrefix}-${chunkIndex}`;
    if (chunk.startsWith('`') && chunk.endsWith('`') && chunk.length > 1) {
      nodes.push(
        <code key={key} className="px-1.5 py-0.5 bg-elevated text-emerald-400 font-mono text-[0.85em] rounded border border-line">
          {chunk.slice(1, -1)}
        </code>
      );
      return;
    }

    // [label](href) — only http(s) and mailto are linked; anything else is
    // rendered as plain text rather than becoming a javascript: URL.
    chunk.split(/(\[[^\]]+\]\([^)\s]+\))/g).forEach((part, partIndex) => {
      const linkKey = `${key}-${partIndex}`;
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
      if (link && /^(https?:|mailto:)/i.test(link[2])) {
        nodes.push(
          <a
            key={linkKey}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            {link[1]}
          </a>
        );
        return;
      }

      const source = link ? link[1] : part;
      source.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).forEach((piece, pieceIndex) => {
        const emphasisKey = `${linkKey}-${pieceIndex}`;
        if (piece.startsWith('**') && piece.endsWith('**') && piece.length > 4) {
          nodes.push(<strong key={emphasisKey} className="font-semibold text-white">{piece.slice(2, -2)}</strong>);
        } else if (piece.startsWith('*') && piece.endsWith('*') && piece.length > 2) {
          nodes.push(<em key={emphasisKey}>{piece.slice(1, -1)}</em>);
        } else if (piece) {
          nodes.push(<React.Fragment key={emphasisKey}>{piece}</React.Fragment>);
        }
      });
    });
  });

  return nodes;
}

const HEADINGS = [
  { prefix: '#### ', render: (text, key) => <h4 key={key} className="text-base font-semibold text-slate-200 mt-4 mb-2">{renderInline(text, key)}</h4> },
  { prefix: '### ', render: (text, key) => <h3 key={key} className="text-lg font-semibold text-slate-100 mt-5 mb-2">{renderInline(text, key)}</h3> },
  { prefix: '## ', render: (text, key) => <h2 key={key} className="text-xl font-bold text-white mt-7 mb-3 pb-1.5 border-b border-line/60 tracking-tight">{renderInline(text, key)}</h2> },
  { prefix: '# ', render: (text, key) => <h1 key={key} className="text-2xl font-bold text-white mb-4 pb-2 border-b border-line tracking-tight">{renderInline(text, key)}</h1> },
];

/**
 * Small block-level markdown renderer. It deliberately handles only what a
 * PyGit README needs; the notable fix over the previous version is that list
 * items are now grouped into real <ul>/<ol> elements instead of being emitted
 * as loose <li>s with no parent, which browsers and screen readers both
 * mis-handle.
 */
function renderMarkdown(text) {
  const lines = text.split('\n');
  const blocks = [];

  let listItems = null;      // buffered <li> content
  let listOrdered = false;
  let codeBuffer = null;     // non-null while inside a fenced block
  let codeLanguage = '';

  const flushList = () => {
    if (!listItems || listItems.length === 0) { listItems = null; return; }
    const key = `list-${blocks.length}`;
    const items = listItems.map((item, index) => (
      <li key={`${key}-${index}`} className="text-slate-300 text-sm my-1 leading-relaxed">
        {renderInline(item, `${key}-${index}`)}
      </li>
    ));
    blocks.push(
      listOrdered
        ? <ol key={key} className="list-decimal ml-6 my-3 space-y-0.5">{items}</ol>
        : <ul key={key} className="list-disc ml-6 my-3 space-y-0.5">{items}</ul>
    );
    listItems = null;
  };

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      if (codeBuffer !== null) {
        blocks.push(
          <div key={`code-${index}`} className="my-4 rounded-xl overflow-hidden border border-line bg-canvas">
            {codeLanguage && (
              <div className="bg-surface px-4 py-1.5 border-b border-line text-[11px] font-mono text-slate-400">
                {codeLanguage}
              </div>
            )}
            <pre className="p-4 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto">
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          </div>
        );
        codeBuffer = null;
        codeLanguage = '';
      } else {
        flushList();
        codeBuffer = [];
        codeLanguage = line.slice(3).trim();
      }
      return;
    }

    if (codeBuffer !== null) {
      codeBuffer.push(line);
      return;
    }

    const heading = HEADINGS.find((h) => line.startsWith(h.prefix));
    if (heading) {
      flushList();
      blocks.push(heading.render(line.slice(heading.prefix.length), `h-${index}`));
      return;
    }

    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushList();
      blocks.push(<hr key={`hr-${index}`} className="my-6 border-line" />);
      return;
    }

    if (line.startsWith('> ')) {
      flushList();
      blocks.push(
        <blockquote key={`q-${index}`} className="border-l-4 border-blue-500 pl-4 py-1.5 my-3 text-slate-300 italic bg-blue-500/5 rounded-r-lg text-sm">
          {renderInline(line.slice(2), `q-${index}`)}
        </blockquote>
      );
      return;
    }

    const unordered = /^\s*[-*]\s+(.*)$/.exec(line);
    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (unordered || ordered) {
      const isOrdered = !!ordered;
      if (listItems && listOrdered !== isOrdered) flushList();
      if (!listItems) { listItems = []; listOrdered = isOrdered; }
      listItems.push((unordered || ordered)[1]);
      return;
    }

    if (!line.trim()) {
      flushList();
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${index}`} className="text-sm text-slate-300 leading-relaxed my-2.5">
        {renderInline(line, `p-${index}`)}
      </p>
    );
  });

  // An unterminated fence still deserves to render its contents.
  if (codeBuffer !== null && codeBuffer.length > 0) {
    blocks.push(
      <pre key="code-tail" className="my-4 p-4 rounded-xl border border-line bg-canvas text-xs font-mono text-emerald-300 overflow-x-auto">
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
  }
  flushList();

  return blocks;
}

export default function ReadmeViewer({ content = '', filename = 'README.md' }) {
  if (!content) return null;

  return (
    <section className="card overflow-hidden shadow-sm mt-6" aria-label="Repository README">
      <div className="bg-elevated px-4 py-2.5 border-b border-line flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-slate-400" aria-hidden="true" />
        <span className="text-xs font-semibold text-slate-200 font-mono">{filename}</span>
      </div>

      <div className="p-6 sm:p-8 max-w-3xl">{renderMarkdown(content)}</div>
    </section>
  );
}
