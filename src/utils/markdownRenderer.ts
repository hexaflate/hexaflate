/**
 * Complete Markdown to HTML renderer
 * Supports: tables, images, code blocks, headers, lists, blockquotes, 
 * bold, italic, strikethrough, links, task lists, horizontal rules, inline code
 */

export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) {
    return '<p class="text-gray-500 italic">No content available.</p>';
  }

  let html = markdown;

  // Process tables first (before other transformations)
  html = html.replace(
    /^(\|.+\|)\r?\n(\|[-:| ]+\|)\r?\n((?:\|.+\|\r?\n?)+)/gm,
    (_match, headerRow, separatorRow, bodyRows) => {
      const headers = headerRow
        .split("|")
        .filter((cell: string) => cell.trim() !== "")
        .map((cell: string) => cell.trim());
      const alignments = separatorRow
        .split("|")
        .filter((cell: string) => cell.trim() !== "")
        .map((cell: string) => {
          const trimmed = cell.trim();
          if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
          if (trimmed.endsWith(":")) return "right";
          return "left";
        });
      const rows = bodyRows
        .trim()
        .split("\n")
        .map((row: string) =>
          row
            .split("|")
            .filter((cell: string) => cell.trim() !== "")
            .map((cell: string) => cell.trim())
        );

      let tableHtml =
        '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300"><thead><tr>';
      headers.forEach((header: string, i: number) => {
        const align = alignments[i] || "left";
        tableHtml += `<th class="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold" style="text-align: ${align}">${header}</th>`;
      });
      tableHtml += "</tr></thead><tbody>";
      rows.forEach((row: string[]) => {
        tableHtml += "<tr>";
        row.forEach((cell: string, i: number) => {
          const align = alignments[i] || "left";
          tableHtml += `<td class="border border-gray-300 px-4 py-2" style="text-align: ${align}">${cell}</td>`;
        });
        tableHtml += "</tr>";
      });
      tableHtml += "</tbody></table></div>";
      return tableHtml;
    }
  );

  // Code blocks with syntax highlighting class (must be processed first)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_match, lang, code) => {
      const langClass = lang ? ` language-${lang}` : '';
      return `<pre class="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto my-4${langClass}"><code class="text-sm font-mono">${escapeHtml(code.trim())}</code></pre>`;
    }
  );

  // Images with alt text and responsive styling
  html = html.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    '<img src="$2" alt="$1" title="$3" class="max-w-full h-auto rounded-lg my-4 shadow-sm" loading="lazy" />'
  );

  // Horizontal rules
  html = html.replace(
    /^(-{3,}|_{3,}|\*{3,})$/gim,
    '<hr class="border-t-2 border-gray-300 my-8" />'
  );

  // Headers (must be processed in order from h6 to h1)
  html = html.replace(
    /^###### (.*$)/gim,
    '<h6 class="text-sm font-semibold mt-4 mb-2 text-gray-600">$1</h6>'
  );
  html = html.replace(
    /^##### (.*$)/gim,
    '<h5 class="text-base font-semibold mt-4 mb-2 text-gray-700">$1</h5>'
  );
  html = html.replace(
    /^#### (.*$)/gim,
    '<h4 class="text-lg font-semibold mt-5 mb-2 text-gray-800">$1</h4>'
  );
  html = html.replace(
    /^### (.*$)/gim,
    '<h3 class="text-xl font-semibold mt-6 mb-3 text-gray-900">$1</h3>'
  );
  html = html.replace(
    /^## (.*$)/gim,
    '<h2 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h2>'
  );
  html = html.replace(
    /^# (.*$)/gim,
    '<h1 class="text-3xl font-bold mt-8 mb-4 text-gray-900">$1</h1>'
  );

  // Strikethrough
  html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-gray-500">$1</del>');

  // Bold and italic combinations (process in correct order)
  html = html.replace(
    /\*\*\*(.*?)\*\*\*/g,
    '<strong class="font-bold"><em class="italic">$1</em></strong>'
  );
  html = html.replace(
    /___(.+?)___/g,
    '<strong class="font-bold"><em class="italic">$1</em></strong>'
  );
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong class="font-bold">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em class="italic">$1</em>');

  // Inline code (after bold/italic to avoid conflicts)
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-blue-600 hover:text-blue-800 underline hover:no-underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Auto-link URLs
  html = html.replace(
    /(?<!href="|src=")(https?:\/\/[^\s<]+)/g,
    '<a href="$1" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Blockquotes (multi-line support)
  html = html.replace(
    /^> (.*$)/gim,
    '<blockquote class="border-l-4 border-blue-400 bg-blue-50 pl-4 py-2 my-4 italic text-gray-700">$1</blockquote>'
  );

  // Task lists (must be before regular lists)
  html = html.replace(
    /^- \[x\] (.*$)/gim,
    '<li class="list-none flex items-start gap-2 my-1"><input type="checkbox" checked disabled class="mt-1 accent-blue-600" /><span>$1</span></li>'
  );
  html = html.replace(
    /^- \[ \] (.*$)/gim,
    '<li class="list-none flex items-start gap-2 my-1"><input type="checkbox" disabled class="mt-1" /><span>$1</span></li>'
  );

  // Unordered lists
  html = html.replace(
    /^[\*\-] (.*$)/gim,
    '<li class="ml-6 list-disc my-1">$1</li>'
  );

  // Ordered lists
  html = html.replace(
    /^\d+\. (.*$)/gim,
    '<li class="ml-6 list-decimal my-1">$1</li>'
  );

  // Wrap consecutive list items in ul/ol tags
  html = html.replace(
    /(<li class="ml-6 list-disc[^>]*>.*?<\/li>\n?)+/g,
    '<ul class="my-4">$&</ul>'
  );
  html = html.replace(
    /(<li class="ml-6 list-decimal[^>]*>.*?<\/li>\n?)+/g,
    '<ol class="my-4">$&</ol>'
  );
  html = html.replace(
    /(<li class="list-none[^>]*>.*?<\/li>\n?)+/g,
    '<ul class="my-4 list-none">$&</ul>'
  );

  // Paragraphs - convert double newlines to paragraph breaks
  html = html.replace(/\n\n+/g, '</p><p class="my-4">');
  
  // Single newlines to line breaks (but not inside pre/code blocks)
  html = html.replace(/(?<!<\/pre>|<\/code>)\n(?!<)/g, '<br />');

  // Wrap in paragraph
  html = '<p class="my-4">' + html + '</p>';

  // Clean up empty paragraphs and fix nesting issues
  html = html
    .replace(/<p class="my-4"><\/p>/g, '')
    .replace(/<p class="my-4">(\s*<(?:ul|ol|table|pre|blockquote|h[1-6]|hr|div))/g, '$1')
    .replace(/(<\/(?:ul|ol|table|pre|blockquote|h[1-6]|div)>)\s*<\/p>/g, '$1')
    .replace(/<p class="my-4">(\s*<hr)/g, '$1')
    .replace(/(\/>\s*)<\/p>/g, '$1')
    .replace(/<br \/>\s*<br \/>/g, '<br />')
    .replace(/<p class="my-4">\s*<br \/>/g, '<p class="my-4">')
    .replace(/<br \/>\s*<\/p>/g, '</p>');

  return html;
}

// Helper function to escape HTML in code blocks
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}