"use client";
import React from "react";

/**
 * MarkdownRenderer
 * Lightweight markdown → React elements for Thai astrology AI chat.
 * Supports: headings, bold, italic, bold-italic, lists, blockquotes,
 * horizontal rules, inline code, code blocks.
 * Wraps in .ai-prose for global CSS styling.
 */

// ─── Inline parser ────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Pattern order matters: bold-italic > bold > italic > inline-code
  const re = /(\*\*\*|___)(.*?)\1|(\*\*|__)(.*?)\3|(\*|_)(.*?)\5|`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    // bold-italic
    if (match[1]) nodes.push(<strong key={key++}><em>{match[2]}</em></strong>);
    // bold
    else if (match[3]) nodes.push(<strong key={key++}>{match[4]}</strong>);
    // italic
    else if (match[5]) nodes.push(<em key={key++}>{match[6]}</em>);
    // inline code
    else if (match[7]) nodes.push(<code key={key++}>{match[7]}</code>);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ─── Block parser ─────────────────────────────────────────────
function parseBlocks(raw: string): React.ReactNode[] {
  const lines = raw.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Code block ──
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key++}>
          <code className={lang ? `language-${lang}` : ""}>
            {codeLines.join("\n")}
          </code>
        </pre>
      );
      i++;
      continue;
    }

    // ── HR ──
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      elements.push(<hr key={key++} />);
      i++;
      continue;
    }

    // ── Headings ──
    const h3 = line.match(/^###\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h1 = line.match(/^#\s+(.+)/);
    if (h3) { elements.push(<h3 key={key++}>{parseInline(h3[1])}</h3>); i++; continue; }
    if (h2) { elements.push(<h2 key={key++}>{parseInline(h2[1])}</h2>); i++; continue; }
    if (h1) { elements.push(<h1 key={key++}>{parseInline(h1[1])}</h1>); i++; continue; }

    // ── Blockquote ──
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={key++}>
          {parseInline(quoteLines.join(" "))}
        </blockquote>
      );
      continue;
    }

    // ── Unordered list ──
    if (/^[-*+]\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-*+]\s+/, "");
        items.push(<li key={i}>{parseInline(itemText)}</li>);
        i++;
      }
      elements.push(<ul key={key++}>{items}</ul>);
      continue;
    }

    // ── Ordered list ──
    if (/^\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s+/, "");
        items.push(<li key={i}>{parseInline(itemText)}</li>);
        i++;
      }
      elements.push(<ol key={key++}>{items}</ol>);
      continue;
    }

    // ── Empty line → paragraph break ──
    if (line.trim() === "") { i++; continue; }

    // ── Paragraph (accumulate consecutive non-blank non-special lines) ──
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}|```|[-*+]\s|>\s|\d+\.\s|(-{3,}|\*{3,}|_{3,})\s*$)/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      elements.push(
        <p key={key++}>{parseInline(paraLines.join(" "))}</p>
      );
    }
  }

  return elements;
}

// ─── Component ────────────────────────────────────────────────
interface Props {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: Props) {
  const blocks = parseBlocks(content);
  return (
    <div className={`ai-prose ${className}`}>
      {blocks}
    </div>
  );
}
