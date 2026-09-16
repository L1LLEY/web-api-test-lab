// JSON syntax renklendirme yardımcısı

const SyntaxHighlighter = {
  /**
   * JSON veya düz metni tokenize eder, renklendirir ve satır numaralarını üretir.
   * @param {any} data 
   * @param {string} searchQuery Opsiyonel arama terimi
   * @returns {{ html: string, lineNumbersHtml: string, lineCount: number }}
   */
  process(data, searchQuery = '') {
    if (data === undefined || data === null) {
      return { 
        html: '<span class="token-null">null</span>', 
        lineNumbersHtml: '<div>1</div>', 
        lineCount: 1 
      };
    }

    let jsonString = '';
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        jsonString = JSON.stringify(parsed, null, 2);
      } else {
        jsonString = JSON.stringify(data, null, 2);
      }
    } catch (e) {
      jsonString = String(data);
    }

    const lines = jsonString.split('\n');
    const lineCount = lines.length;
    
    let lineNumbersHtml = '';
    for (let i = 1; i <= lineCount; i++) {
      lineNumbersHtml += `<div>${i}</div>`;
    }

    let colorized = this.tokenize(jsonString);

    // Canlı Arama Vurgusu
    if (searchQuery && searchQuery.trim()) {
      const q = this.escapeRegex(this.escapeHtml(searchQuery.trim()));
      const searchRegex = new RegExp(`(${q})`, 'gi');
      colorized = colorized.replace(searchRegex, '<mark class="token-highlight">$1</mark>');
    }

    return {
      html: colorized,
      lineNumbersHtml,
      lineCount
    };
  },

  tokenize(json) {
    const escaped = this.escapeHtml(json);
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;

    return escaped.replace(regex, (match) => {
      let cls = 'token-number';

      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'token-key';
          return `<span class="${cls}">${match.slice(0, -1)}</span>:`;
        } else {
          cls = 'token-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'token-boolean';
      } else if (/null/.test(match)) {
        cls = 'token-null';
      }

      return `<span class="${cls}">${match}</span>`;
    });
  },

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
};

window.SyntaxHighlighter = SyntaxHighlighter;
