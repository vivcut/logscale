/**
 * Minimal, dependency-free Markdown → HTML renderer.
 *
 * Intentionally small: it covers the subset our changelog content uses
 * (headings, bold/italic/inline-code, links, fenced + inline code, unordered
 * and ordered lists, blockquotes, horizontal rules, paragraphs) and escapes
 * all HTML first to stay XSS-safe. Output is meant to be wrapped in a
 * `prose prose-invert` container.
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(text: string): string {
  let out = escapeHtml(text);

  // Inline code (process before other inline rules).
  out = out.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);

  // Images ![alt](url) — must run before links since the syntax overlaps.
  out = out.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, alt, url) =>
      `<img src="${url}" alt="${alt}" loading="lazy" />`
  );

  // Links [label](url)
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, label, url) =>
      `<a href="${url}" target="_blank" rel="noreferrer">${label}</a>`
  );

  // Bold then italic.
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/_([^_]+)_/g, "<em>$1</em>");

  return out;
}

export function renderMarkdown(markdown: string): string {
  const lines = (markdown ?? "").replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];

  let i = 0;
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line.trim())) {
      closeLists();
      const lang = line.trim().slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        buf.push(escapeHtml(lines[i]));
        i++;
      }
      i++; // skip closing fence
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      html.push(`<pre><code${cls}>${buf.join("\n")}</code></pre>`);
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      closeLists();
      i++;
      continue;
    }

    // Headings
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      closeLists();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      closeLists();
      html.push("<hr />");
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      closeLists();
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(inline(lines[i].replace(/^>\s?/, "")));
        i++;
      }
      html.push(`<blockquote><p>${buf.join("<br />")}</p></blockquote>`);
      continue;
    }

    // Unordered list item
    if (/^\s*[-*+]\s+/.test(line)) {
      if (!inUl) {
        closeLists();
        html.push("<ul>");
        inUl = true;
      }
      html.push(`<li>${inline(line.replace(/^\s*[-*+]\s+/, ""))}</li>`);
      i++;
      continue;
    }

    // Ordered list item
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOl) {
        closeLists();
        html.push("<ol>");
        inOl = true;
      }
      html.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`);
      i++;
      continue;
    }

    // Paragraph (greedily consume consecutive plain lines)
    closeLists();
    const buf: string[] = [inline(line)];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^```/.test(lines[i].trim()) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(\*{3,}|-{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      buf.push(inline(lines[i]));
      i++;
    }
    html.push(`<p>${buf.join("<br />")}</p>`);
  }

  closeLists();
  return html.join("\n");
}
