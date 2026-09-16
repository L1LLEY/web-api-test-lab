// API istek ve kod üretme yardımcısı

const ApiClient = {
  history: [],

  /**
   * HTTP İsteği Çalıştırma
   */
  async sendRequest({ method, url, queryParams = [], headers = {}, body = null, auth = null }) {
    if (!url || typeof url !== 'string' || !url.trim()) {
      throw new Error('Geçerli bir endpoint URL adresi belirtilmelidir.');
    }

    let targetUrl = url.trim();

    // Mock Easter Egg Endpoint Denetimi
    if (targetUrl.includes('slein-heartbeat') || targetUrl.includes('slein-protocol')) {
      return this.mockSleinHeartbeatResponse();
    }

    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    // Query Params Entegrasyonu
    const validParams = queryParams.filter(p => p.key && p.key.trim());
    if (validParams.length > 0) {
      try {
        const urlObj = new URL(targetUrl);
        validParams.forEach(p => {
          urlObj.searchParams.append(p.key.trim(), p.value ? p.value.trim() : '');
        });
        targetUrl = urlObj.toString();
      } catch (e) {
        // Hatalı URL ise dokunma
      }
    }

    // Headers & Auth Entegrasyonu
    const finalHeaders = { ...headers };
    if (auth) {
      if (auth.type === 'bearer' && auth.token) {
        finalHeaders['Authorization'] = `Bearer ${auth.token.trim()}`;
      } else if (auth.type === 'basic' && (auth.user || auth.pass)) {
        const credentials = btoa(`${auth.user || ''}:${auth.pass || ''}`);
        finalHeaders['Authorization'] = `Basic ${credentials}`;
      }
    }

    const requestOptions = {
      method: method.toUpperCase(),
      headers: finalHeaders
    };

    if (['POST', 'PUT', 'PATCH'].includes(requestOptions.method) && body) {
      requestOptions.body = body;
      if (!finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
        requestOptions.headers['Content-Type'] = 'application/json';
      }
    }

    const startTime = performance.now();
    let response;
    let endTime;

    try {
      response = await fetch(targetUrl, requestOptions);
      endTime = performance.now();
    } catch (networkError) {
      endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const errPayload = {
        ok: false,
        status: 0,
        statusText: 'Network / CORS Error',
        responseTime,
        sizeBytes: 0,
        headers: {},
        data: {
          error: 'Network Error / CORS Block',
          message: networkError.message || 'Sunucu CORS başlıkları döndürmedi veya bağlantı başarısız oldu.',
          diagnostics: {
            method,
            targetUrl,
            time: new Date().toISOString()
          }
        }
      };

      this.addToHistory(method, targetUrl, 0);
      return errPayload;
    }

    const responseTime = Math.round(endTime - startTime);
    const responseHeaders = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    let rawText = '';
    let parsedData = null;
    let sizeBytes = 0;

    try {
      rawText = await response.text();
      sizeBytes = new Blob([rawText]).size;
      parsedData = JSON.parse(rawText);
    } catch (e) {
      parsedData = rawText;
    }

    this.addToHistory(method, targetUrl, response.status);

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText || this.getStatusText(response.status),
      responseTime,
      sizeBytes,
      headers: responseHeaders,
      data: parsedData
    };
  },

  /**
   * Slein & Wesley Gizli Heartbeat Mock Yanıtı
   */
  async mockSleinHeartbeatResponse() {
    await new Promise(r => setTimeout(r, 120)); // Gerçekçi ağ gecikmesi
    if (window.EasterEgg) {
      window.EasterEgg.trigger('Mock Endpoint: /slein-heartbeat');
    }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      responseTime: 42,
      sizeBytes: 418,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-pair-programming': 'Slein (Logic) & Wesley (UI)',
        'x-love-protocol': 'Infinite Love v2.0',
        'x-connection-status': 'Synched'
      },
      data: {
        protocol: "Heartbeat API",
        status: "Connected",
        latency: "0ms",
        pair: {
          logic_lead: "Slein",
          interface_lead: "Wesley",
          mode: "Pair Programming (Tek Repo)"
        },
        diagnostics: {
          love_level: "Infinite",
          team_synergy: "100%",
          uptime: "Forever"
        },
        message: "Slein & Wesley ortaklığıyla mükemmel bir arayüz inşa edildi ❤️"
      }
    };
  },

  getStatusText(code) {
    const map = {
      200: 'OK', 201: 'Created', 204: 'No Content',
      400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
      500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable'
    };
    return map[code] || 'Response';
  },

  getStatusBadgeClass(status) {
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    return 'status-5xx';
  },

  addToHistory(method, url, status) {
    this.history = this.history.filter(h => h.url !== url);
    this.history.unshift({ method, url, status, time: new Date().toLocaleTimeString() });
    if (this.history.length > 25) this.history.pop();
    if (window.renderSidebar) window.renderSidebar();
  },

  // ---------------- Code Snippet Generators ---------------- //

  generateCurl({ method, url, headers = {}, body = null }) {
    let cmd = `curl -X ${method.toUpperCase()} "${url}"`;
    for (const [k, v] of Object.entries(headers)) {
      cmd += ` \\\n  -H "${k}: ${v}"`;
    }
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      const escapedBody = body.replace(/"/g, '\\"');
      cmd += ` \\\n  -d "${escapedBody}"`;
    }
    return cmd;
  },

  generateFetch({ method, url, headers = {}, body = null }) {
    const opts = {
      method: method.toUpperCase(),
      headers
    };
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      try {
        opts.body = JSON.parse(body);
      } catch (e) {
        opts.body = body;
      }
    }
    return `// JavaScript (Fetch API)\nfetch("${url}", {\n  method: "${method.toUpperCase()}",\n  headers: ${JSON.stringify(headers, null, 4)},\n${body ? `  body: JSON.stringify(${JSON.stringify(body)})\n` : ''}})\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));`;
  },

  generatePython({ method, url, headers = {}, body = null }) {
    return `# Python (requests)\nimport requests\n\nurl = "${url}"\nheaders = ${JSON.stringify(headers, null, 4)}\n${body ? `data = ${body}\n` : ''}\nresponse = requests.${method.toLowerCase()}(url, headers=headers${body ? ', json=data' : ''})\nprint(response.status_code)\nprint(response.json())`;
  }
};

window.ApiClient = ApiClient;
