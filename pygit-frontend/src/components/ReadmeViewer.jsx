import React from 'react';
import { BookOpen } from 'lucide-react';

export default function ReadmeViewer({ content = '', filename = 'README.md' }) {
  if (!content) return null;

  // Simple clean GitHub-like markdown parser/renderer
  const renderMarkdown = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer = [];

    lines.forEach((line, index) => {
      // Code block handling
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-${index}`} className="my-4 rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117]">
              {codeLanguage && (
                <div className="bg-[#161b22] px-4 py-1.5 border-b border-[#30363d] text-xs font-mono text-slate-400">
                  {codeLanguage}
                </div>
              )}
              <pre className="p-4 text-xs sm:text-sm font-mono text-emerald-400 overflow-x-auto">
                <code>{codeBuffer.join('\n')}</code>
              </pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.replace('```', '').trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-2xl font-bold text-white mb-4 pb-2 border-b border-[#30363d] tracking-tight">
            {line.replace('# ', '')}
          </h1>
        );
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-xl font-bold text-white mt-6 mb-3 pb-1 border-b border-[#30363d]/60 tracking-tight">
            {line.replace('## ', '')}
          </h2>
        );
        return;
      }
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-slate-200 mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
        return;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={index} className="border-l-4 border-blue-500 pl-4 py-1.5 my-3 text-slate-300 italic bg-blue-500/5 rounded-r-lg">
            {line.replace('> ', '')}
          </blockquote>
        );
        return;
      }

      // Unordered lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().replace(/^[-*]\s+/, '');
        elements.push(
          <li key={index} className="ml-6 list-disc text-slate-300 my-1 text-sm">
            {renderInlineCode(itemText)}
          </li>
        );
        return;
      }

      // Blank lines
      if (!line.trim()) {
        elements.push(<div key={index} className="h-2" />);
        return;
      }

      // Standard paragraph
      elements.push(
        <p key={index} className="text-sm text-slate-300 leading-relaxed my-2">
          {renderInlineCode(line)}
        </p>
      );
    });

    return elements;
  };

  const renderInlineCode = (text) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 bg-[#21262d] text-emerald-400 font-mono text-xs rounded border border-[#30363d]">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm mt-6">
      <div className="bg-[#21262d] px-4 py-3 border-b border-[#30363d] flex items-center space-x-2">
        <BookOpen className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-200 font-mono">{filename}</span>
      </div>

      <div className="p-6 sm:p-8">
        {renderMarkdown(content)}
      </div>
    </div>
  );
}
