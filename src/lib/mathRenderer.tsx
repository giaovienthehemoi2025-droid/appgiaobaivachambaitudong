import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content?: string;
  className?: string;
  inline?: boolean;
}

/**
 * Renders text containing LaTeX math formulas delimited by:
 * - $$ ... $$ (display mode)
 * - $ ... $ (inline mode)
 * - \( ... \) (inline)
 * - \[ ... \] (display)
 * Also gracefully handles chemical equations or plain text.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ content = '', className = '', inline = false }) => {
  const parts = useMemo(() => {
    if (!content) return [];

    // Split text into regular text and LaTeX math blocks
    // Regular expression matches:
    // 1. $$...$$ or \[...\] -> block math
    // 2. $...$ or \(...\) -> inline math
    const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([\s\S]+?\\\))/g;

    const tokens: Array<{ type: 'text' | 'math-block' | 'math-inline'; value: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          value: content.substring(lastIndex, match.index)
        });
      }

      const raw = match[0];
      if (raw.startsWith('$$') && raw.endsWith('$$')) {
        tokens.push({ type: 'math-block', value: raw.slice(2, -2).trim() });
      } else if (raw.startsWith('\\[') && raw.endsWith('\\]')) {
        tokens.push({ type: 'math-block', value: raw.slice(2, -2).trim() });
      } else if (raw.startsWith('\\(') && raw.endsWith('\\)')) {
        tokens.push({ type: 'math-inline', value: raw.slice(2, -2).trim() });
      } else if (raw.startsWith('$') && raw.endsWith('$')) {
        tokens.push({ type: 'math-inline', value: raw.slice(1, -1).trim() });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      tokens.push({
        type: 'text',
        value: content.substring(lastIndex)
      });
    }

    return tokens;
  }, [content]);

  if (parts.length === 0) {
    return <span className={className}></span>;
  }

  return (
    <span className={`inline-block max-w-full ${className}`}>
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          // Render regular text preserving line breaks
          return (
            <span key={idx} className="whitespace-pre-wrap">
              {part.value}
            </span>
          );
        }

        const isDisplay = part.type === 'math-block' && !inline;
        try {
          const html = katex.renderToString(part.value, {
            displayMode: isDisplay,
            throwOnError: false,
            strict: false,
            trust: true
          });
          return (
            <span
              key={idx}
              className={isDisplay ? 'block my-2 overflow-x-auto py-1 text-center' : 'inline-block px-1'}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <code key={idx} className="px-1 py-0.5 text-xs bg-amber-50 text-amber-800 rounded font-mono">
              {part.value}
            </code>
          );
        }
      })}
    </span>
  );
};
