// ============================================================
// Ana Arayüz & Event Yönetimi
// Geliştirici: Wesley — UI Layer
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  window.EasterEgg.init();

  // --------------------------------------------------------
  // localStorage'dan sekmeleri yükle ya da varsayılanı başlat
  // --------------------------------------------------------
  let tabs = loadTabsFromStorage() || [
    {
      id: 'tab-1',
      title: 'GET /posts/1',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      params: [{ key: '', value: '' }],
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}',
      auth: { type: 'none', token: '', user: '', pass: '' },
      response: null
    }
  ];
  let activeTabId = localStorage.getItem('activeTabId') || 'tab-1';

  // Kaydedilen activeTabId geçerli mi kontrol et
  if (!tabs.find(t => t.id === activeTabId)) {
    activeTabId = tabs[0].id;
  }

  // --------------------------------------------------------
  // Preset Koleksiyonlar
  // --------------------------------------------------------
  const collections = [
    {
      name: 'JSONPlaceholder API',
      requests: [
        { name: 'Get Post by ID',     method: 'GET',  url: 'https://jsonplaceholder.typicode.com/posts/1' },
        { name: 'List All Comments',  method: 'GET',  url: 'https://jsonplaceholder.typicode.com/posts/1/comments' },
        { name: 'Create New Post',    method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts',
          body: '{\n  "title": "Yeni Gönderi",\n  "body": "Slein & Wesley Pair Lab Test",\n  "userId": 1\n}' }
      ]
    },
    {
      name: 'Error Diagnostics',
      requests: [
        { name: '404 Not Found Test',    method: 'GET', url: 'https://jsonplaceholder.typicode.com/invalid-resource-404' },
        { name: '500 Server Error Test', method: 'GET', url: 'https://httpstat.us/500' }
      ]
    },
    {
      name: 'Slein & Wesley System',
      requests: [
        { name: 'Heartbeat Protocol API', method: 'GET', url: 'https://api.internal/slein-heartbeat' }
      ]
    }
  ];

  // --------------------------------------------------------
  // DOM Referansları
  // --------------------------------------------------------
  const workspaceTabsContainer = document.getElementById('workspaceTabsContainer');
  const btnNewTab              = document.getElementById('btnNewTab');
  const methodSelect           = document.getElementById('methodSelect');
  const urlInput               = document.getElementById('urlInput');
  const btnSend                = document.getElementById('btnSend');
  const btnCodeGen             = document.getElementById('btnCodeGen');
  const pairBadge              = document.getElementById('pairBadge');

  const reqTabBtns    = document.querySelectorAll('#reqPaneTabs .pane-tab-btn');
  const reqTabBodies  = document.querySelectorAll('#reqPaneBodies .pane-body');
  const jsonBodyInput = document.getElementById('jsonBodyInput');
  const btnFormatJson = document.getElementById('btnFormatJson');
  const authTypeSelect   = document.getElementById('authTypeSelect');
  const authBearerGroup  = document.getElementById('authBearerGroup');
  const authBasicGroup   = document.getElementById('authBasicGroup');
  const bearerTokenInput = document.getElementById('bearerTokenInput');
  const basicUserInput   = document.getElementById('basicUserInput');
  const basicPassInput   = document.getElementById('basicPassInput');

  const statusBadge         = document.getElementById('statusBadge');
  const timeStat            = document.getElementById('timeStat');
  const sizeStat            = document.getElementById('sizeStat');
  const lineNumbers         = document.getElementById('lineNumbers');
  const codeContent         = document.getElementById('codeContent');
  const responseSearch      = document.getElementById('responseSearch');
  const responseHeadersTable = document.getElementById('responseHeadersTable');
  const btnCopyResponse     = document.getElementById('btnCopyResponse');
  const btnDownloadResponse = document.getElementById('btnDownloadResponse');

  const codeSnippetModal    = document.getElementById('codeSnippetModal');
  const snippetTypeSelect   = document.getElementById('snippetTypeSelect');
  const snippetPreview      = document.getElementById('snippetPreview');
  const btnCopySnippet      = document.getElementById('btnCopySnippet');
  const btnCloseSnippetModal = document.getElementById('btnCloseSnippetModal');

  const statusEngine = document.getElementById('statusEngine');

  // --------------------------------------------------------
  // Toast Bildirimi
  // --------------------------------------------------------
  window.showToast = function(msg, type = 'info') {
    const shelf = document.getElementById('toastShelf');
    if (!shelf) return;
    const t = document.createElement('div');
    t.className = `toast-item ${type}`;
    t.textContent = msg;
    shelf.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.2s ease';
      setTimeout(() => t.remove(), 200);
    }, 3200);
  };

  // --------------------------------------------------------
  // Yardımcı: XSS önleme (attribute içi)
  // --------------------------------------------------------
  function escapeAttr(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // --------------------------------------------------------
  // localStorage — Kaydet / Yükle
  // --------------------------------------------------------
  function saveTabsToStorage() {
    try {
      // Response içinde DOM elementi olmadığı için response'u da kaydediyoruz
      localStorage.setItem('watl_tabs', JSON.stringify(tabs));
      localStorage.setItem('watl_activeTabId', activeTabId);
    } catch (e) {
      console.warn('[WATL] localStorage kayıt hatası:', e);
    }
  }

  function loadTabsFromStorage() {
    try {
      const raw = localStorage.getItem('watl_tabs');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // --------------------------------------------------------
  // Multi-Tab Yönetimi
  // --------------------------------------------------------
  function getActiveTab() {
    return tabs.find(t => t.id === activeTabId) || tabs[0];
  }

  function renderTabsBar() {
    workspaceTabsContainer.innerHTML = '';
    tabs.forEach(tab => {
      const pill = document.createElement('div');
      pill.className = `tab-pill ${tab.id === activeTabId ? 'active' : ''}`;
      pill.innerHTML = `
        <span class="method-tag ${tab.method}">${tab.method}</span>
        <span class="tab-title">${tab.title}</span>
        ${tabs.length > 1 ? `<span class="tab-close" style="margin-left:4px; opacity:0.6;">&times;</span>` : ''}
      `;
      pill.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) {
          closeTab(tab.id);
        } else {
          switchTab(tab.id);
        }
      });
      workspaceTabsContainer.appendChild(pill);
    });
  }

  function switchTab(id) {
    saveCurrentTabState();
    activeTabId = id;
    renderTabsBar();
    loadTabState(getActiveTab());
    saveTabsToStorage();
  }

  function createNewTab(preset = null) {
    saveCurrentTabState();
    const newId = 'tab-' + Date.now();
    const newTab = preset ? {
      id:      newId,
      title:   `${preset.method} ${preset.name || preset.url}`,
      method:  preset.method || 'GET',
      url:     preset.url    || 'https://jsonplaceholder.typicode.com/posts/1',
      params:  [{ key: '', value: '' }],
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body:    preset.body   || '',
      auth:    { type: 'none', token: '', user: '', pass: '' },
      response: null
    } : {
      id:      newId,
      title:   'New Request',
      method:  'GET',
      url:     'https://jsonplaceholder.typicode.com/posts/1',
      params:  [{ key: '', value: '' }],
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body:    '',
      auth:    { type: 'none', token: '', user: '', pass: '' },
      response: null
    };

    tabs.push(newTab);
    activeTabId = newId;
    renderTabsBar();
    loadTabState(newTab);
    saveTabsToStorage();
  }

  function closeTab(id) {
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    tabs = tabs.filter(t => t.id !== id);
    if (activeTabId === id) {
      activeTabId = tabs[Math.max(0, idx - 1)].id;
    }
    renderTabsBar();
    loadTabState(getActiveTab());
    saveTabsToStorage();
  }

  // --------------------------------------------------------
  // Tab State — Kaydet (tüm alanlar dahil)
  // --------------------------------------------------------
  function saveCurrentTabState() {
    const tab = getActiveTab();
    if (!tab) return;

    tab.method = methodSelect.value;
    tab.url    = urlInput.value;
    tab.body   = jsonBodyInput.value;
    tab.title  = `${tab.method} ${tab.url.replace(/^https?:\/\//, '').split('?')[0]}`;

    // Params tablosunu kaydet
    tab.params = [];
    document.querySelectorAll('#paramsTable tbody tr').forEach(row => {
      const key = row.querySelector('.col-key')?.value || '';
      const val = row.querySelector('.col-val')?.value || '';
      tab.params.push({ key, value: val });
    });

    // Headers tablosunu kaydet
    tab.headers = [];
    document.querySelectorAll('#headersTable tbody tr').forEach(row => {
      const key = row.querySelector('.col-key')?.value || '';
      const val = row.querySelector('.col-val')?.value || '';
      tab.headers.push({ key, value: val });
    });

    // Auth bilgilerini kaydet
    tab.auth = {
      type:  authTypeSelect.value,
      token: bearerTokenInput.value,
      user:  basicUserInput.value,
      pass:  basicPassInput.value
    };
  }

  // --------------------------------------------------------
  // Tab State — Yükle (tüm alanlar dahil)
  // --------------------------------------------------------
  function loadTabState(tab) {
    methodSelect.value = tab.method;
    methodSelect.setAttribute('data-method', tab.method);
    urlInput.value      = tab.url;
    jsonBodyInput.value = tab.body || '';

    // Params tablosunu geri yükle
    const paramsTbody = document.querySelector('#paramsTable tbody');
    if (paramsTbody) {
      paramsTbody.innerHTML = '';
      const rows = (tab.params && tab.params.length > 0)
        ? tab.params
        : [{ key: '', value: '' }];
      rows.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="text" class="table-input col-key" placeholder="key" value="${escapeAttr(p.key)}"></td>
          <td><input type="text" class="table-input col-val" placeholder="value" value="${escapeAttr(p.value)}"></td>
          <td style="text-align:center;"><button class="btn-icon" onclick="this.closest('tr').remove()">&times;</button></td>
        `;
        paramsTbody.appendChild(tr);
      });
    }

    // Headers tablosunu geri yükle
    const headersTbody = document.querySelector('#headersTable tbody');
    if (headersTbody) {
      headersTbody.innerHTML = '';
      const rows = (tab.headers && tab.headers.length > 0)
        ? tab.headers
        : [{ key: 'Content-Type', value: 'application/json' }];
      rows.forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><input type="text" class="table-input col-key" placeholder="Header" value="${escapeAttr(h.key)}"></td>
          <td><input type="text" class="table-input col-val" placeholder="Value" value="${escapeAttr(h.value)}"></td>
          <td style="text-align:center;"><button class="btn-icon" onclick="this.closest('tr').remove()">&times;</button></td>
        `;
        headersTbody.appendChild(tr);
      });
    }

    // Auth ayarlarını geri yükle
    if (tab.auth) {
      authTypeSelect.value   = tab.auth.type  || 'none';
      updateAuthUi();
      bearerTokenInput.value = tab.auth.token || '';
      basicUserInput.value   = tab.auth.user  || '';
      basicPassInput.value   = tab.auth.pass  || '';
    }

    // Yanıtı geri yükle
    if (tab.response) {
      renderResponse(tab.response);
    } else {
      resetResponsePane();
    }
  }

  btnNewTab.addEventListener('click', () => createNewTab());

  // --------------------------------------------------------
  // Sidebar: Collections & History
  // --------------------------------------------------------
  const sidebarTabBtns  = document.querySelectorAll('.sidebar-tab-btn');
  const collectionsPane = document.getElementById('sidebarCollections');
  const historyPane     = document.getElementById('sidebarHistory');

  sidebarTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sidebarTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-target');
      if (target === 'collections') {
        collectionsPane.style.display = 'block';
        historyPane.style.display = 'none';
      } else {
        collectionsPane.style.display = 'none';
        historyPane.style.display = 'block';
        renderSidebar();
      }
    });
  });

  function renderCollections() {
    collectionsPane.innerHTML = '';
    collections.forEach(col => {
      const group = document.createElement('div');
      group.className = 'collection-group';
      group.innerHTML = `
        <div class="collection-header">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>${col.name}</span>
        </div>
      `;
      col.requests.forEach(req => {
        const item = document.createElement('div');
        item.className = 'request-item';
        item.innerHTML = `
          <span class="method-tag ${req.method}">${req.method}</span>
          <span class="item-label" title="${req.url}">${req.name}</span>
        `;
        item.addEventListener('click', () => {
          createNewTab(req);
          showToast(`Koleksiyon yüklendi: ${req.name}`, 'info');
        });
        group.appendChild(item);
      });
      collectionsPane.appendChild(group);
    });
  }

  window.renderSidebar = function() {
    if (!historyPane) return;
    historyPane.innerHTML = '';

    // History temizle butonu
    if (window.ApiClient.history.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn-add-item';
      clearBtn.style.cssText = 'margin: 8px 12px; width: calc(100% - 24px);';
      clearBtn.textContent = '🗑️ Geçmişi Temizle';
      clearBtn.addEventListener('click', () => {
        window.ApiClient.history = [];
        saveTabsToStorage();
        window.renderSidebar();
        showToast('Geçmiş temizlendi.', 'info');
      });
      historyPane.appendChild(clearBtn);
    } else {
      historyPane.innerHTML = `<div style="padding:16px; color:var(--text-muted); font-size:11px;">Henüz geçmiş isteği yok.</div>`;
      return;
    }

    window.ApiClient.history.forEach(item => {
      const el = document.createElement('div');
      el.className = 'request-item';
      const statusColor = item.status >= 200 && item.status < 300
        ? '#4ade80' : item.status >= 400 ? '#f87171' : '#94a3b8';
      el.innerHTML = `
        <span class="method-tag ${item.method}">${item.method}</span>
        <span class="item-label" title="${item.url}">${item.url.replace(/^https?:\/\//, '')}</span>
        <span style="margin-left:auto; font-size:10px; color:${statusColor};">${item.status || 'ERR'}</span>
      `;
      el.addEventListener('click', () => {
        createNewTab({ method: item.method, url: item.url, name: item.url });
      });
      historyPane.appendChild(el);
    });
  };

  renderCollections();

  // --------------------------------------------------------
  // Sub-Tab Geçişleri (Request Pane)
  // --------------------------------------------------------
  reqTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      reqTabBtns.forEach(b  => b.classList.remove('active'));
      reqTabBodies.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.getAttribute('data-target'));
      if (target) target.classList.add('active');
    });
  });

  // Sub-Tab Geçişleri (Response Pane)
  const resTabBtns   = document.querySelectorAll('#resPaneTabs .pane-tab-btn');
  const resTabBodies = document.querySelectorAll('#resPaneBodies .pane-body');
  resTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      resTabBtns.forEach(b   => b.classList.remove('active'));
      resTabBodies.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.getAttribute('data-target'));
      if (target) target.classList.add('active');
    });
  });

  // --------------------------------------------------------
  // Tablo Satırı Ekleme Yardımcısı
  // --------------------------------------------------------
  window.addTableRow = function(tableId, defaultKey = '', defaultVal = '') {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="table-input col-key" placeholder="Key" value="${defaultKey}"></td>
      <td><input type="text" class="table-input col-val" placeholder="Value" value="${defaultVal}"></td>
      <td style="text-align:center;"><button class="btn-icon" onclick="this.closest('tr').remove()">&times;</button></td>
    `;
    tbody.appendChild(tr);
  };

  // --------------------------------------------------------
  // Auth Görünürlüğü
  // --------------------------------------------------------
  authTypeSelect.addEventListener('change', () => {
    getActiveTab().auth.type = authTypeSelect.value;
    updateAuthUi();
  });

  function updateAuthUi() {
    const type = authTypeSelect.value;
    authBearerGroup.style.display = type === 'bearer' ? 'block' : 'none';
    authBasicGroup.style.display  = type === 'basic'  ? 'block' : 'none';
  }

  bearerTokenInput.addEventListener('input', () => { getActiveTab().auth.token = bearerTokenInput.value; });
  basicUserInput.addEventListener('input',   () => { getActiveTab().auth.user  = basicUserInput.value; });
  basicPassInput.addEventListener('input',   () => { getActiveTab().auth.pass  = basicPassInput.value; });

  // --------------------------------------------------------
  // JSON Format Butonu
  // --------------------------------------------------------
  btnFormatJson.addEventListener('click', () => {
    try {
      const raw = jsonBodyInput.value.trim();
      if (!raw) return;
      jsonBodyInput.value = JSON.stringify(JSON.parse(raw), null, 2);
      showToast('JSON biçimlendirildi.', 'success');
    } catch (e) {
      showToast('Geçersiz JSON biçimi!', 'error');
    }
  });

  // --------------------------------------------------------
  // Kod Çıktısı Modalı
  // --------------------------------------------------------
  btnCodeGen.addEventListener('click', () => {
    updateSnippetPreview();
    codeSnippetModal.classList.add('active');
  });

  btnCloseSnippetModal.addEventListener('click', () => {
    codeSnippetModal.classList.remove('active');
  });

  // Modal dışına tıklayınca kapat
  codeSnippetModal.addEventListener('click', (e) => {
    if (e.target === codeSnippetModal) codeSnippetModal.classList.remove('active');
  });

  snippetTypeSelect.addEventListener('change', () => updateSnippetPreview());

  function updateSnippetPreview() {
    const method = methodSelect.value;
    const url    = urlInput.value.trim();
    const headers = {};
    document.querySelectorAll('#headersTable tbody tr').forEach(row => {
      const k = row.querySelector('.col-key')?.value;
      const v = row.querySelector('.col-val')?.value;
      if (k && k.trim()) headers[k.trim()] = v || '';
    });
    const body = ['POST', 'PUT', 'PATCH'].includes(method) ? jsonBodyInput.value.trim() : null;

    const type = snippetTypeSelect.value;
    let code = '';
    if      (type === 'curl')   code = window.ApiClient.generateCurl({ method, url, headers, body });
    else if (type === 'fetch')  code = window.ApiClient.generateFetch({ method, url, headers, body });
    else if (type === 'python') code = window.ApiClient.generatePython({ method, url, headers, body });

    snippetPreview.textContent = code;
  }

  btnCopySnippet.addEventListener('click', () => {
    navigator.clipboard.writeText(snippetPreview.textContent).then(() => {
      showToast('Kod parçacığı kopyalandı! 📋', 'success');
    });
  });

  // --------------------------------------------------------
  // Easter Egg — Rozet Tıklama
  // --------------------------------------------------------
  let badgeClicks = 0;
  pairBadge.addEventListener('click', () => {
    badgeClicks++;
    if (badgeClicks === 3) {
      badgeClicks = 0;
      window.EasterEgg.trigger('Slein & Wesley Developer Badge (3x)');
    } else {
      showToast(`Heartbeat bağlantısına ${3 - badgeClicks} tık kaldı ✨`, 'info');
    }
  });

  // --------------------------------------------------------
  // Klavye Kısayolu: Ctrl+Enter → Gönder
  // --------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      btnSend.click();
    }
    // Ctrl+Shift+L → Easter Egg (easter-egg.js içinde de var ama burada da garantileyelim)
  });

  // Method değişince sekme başlığını güncelle
  methodSelect.addEventListener('change', () => {
    methodSelect.setAttribute('data-method', methodSelect.value);
    getActiveTab().method = methodSelect.value;
    renderTabsBar();
  });

  // --------------------------------------------------------
  // İSTEK GÖNDERME — Ana Motor
  // --------------------------------------------------------
  btnSend.addEventListener('click', async () => {
    const method = methodSelect.value;
    const url    = urlInput.value.trim();

    if (!url) {
      showToast('Lütfen geçerli bir URL belirtin!', 'error');
      return;
    }

    // Easter egg kontrolü
    if (window.SleinLogic) {
      window.SleinLogic.checkEasterEgg(url);
    }
    if (url.toLowerCase().includes('slein') && !url.includes('slein-heartbeat')) {
      window.EasterEgg.trigger(`Keyword: ${url}`);
    }

    // Query Params topla
    const queryParams = [];
    document.querySelectorAll('#paramsTable tbody tr').forEach(r => {
      const k = r.querySelector('.col-key')?.value;
      const v = r.querySelector('.col-val')?.value;
      if (k && k.trim()) queryParams.push({ key: k.trim(), value: v || '' });
    });

    // Headers topla
    const headers = {};
    document.querySelectorAll('#headersTable tbody tr').forEach(r => {
      const k = r.querySelector('.col-key')?.value;
      const v = r.querySelector('.col-val')?.value;
      if (k && k.trim()) headers[k.trim()] = v || '';
    });

    // Body doğrula
    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(method) && jsonBodyInput.value.trim()) {
      try {
        JSON.parse(jsonBodyInput.value.trim());
        body = jsonBodyInput.value.trim();
      } catch (err) {
        showToast('Hata: Body JSON sözdizimi geçersiz!', 'error');
        return;
      }
    }

    const tab = getActiveTab();

    try {
      // SleinLogic üzerinden isteği gönder
      const result = await window.SleinLogic.executeApiCall(
        method, url, body, headers, queryParams, tab.auth
      );

      if (!result) return; // İptal edilen istek

      tab.response = result;
      tab.title    = `${method} ${url.replace(/^https?:\/\//, '').split('?')[0]}`;
      renderTabsBar();
      renderResponse(result);
      saveTabsToStorage(); // Her başarılı istekten sonra kaydet

    } catch (err) {
      showToast(`Hata: ${err.message}`, 'error');
    }
  });

  // --------------------------------------------------------
  // Yanıt Görüntüleme
  // --------------------------------------------------------
  function renderResponse(res) {
    const badgeClass = window.ApiClient.getStatusBadgeClass(res.status);
    statusBadge.className = `status-badge ${badgeClass}`;
    statusBadge.innerHTML = `<span class="status-dot"></span> ${res.status || '0'} ${res.statusText}`;

    timeStat.textContent = `${res.responseTime} ms`;
    sizeStat.textContent = res.sizeBytes > 1024
      ? `${(res.sizeBytes / 1024).toFixed(2)} KB`
      : `${res.sizeBytes} B`;

    updateResponseView();

    // Response Headers tablosu
    if (res.headers && Object.keys(res.headers).length > 0) {
      let rows = '';
      for (const [k, v] of Object.entries(res.headers)) {
        rows += `<tr><td><strong>${window.SyntaxHighlighter.escapeHtml(k)}</strong></td><td>${window.SyntaxHighlighter.escapeHtml(v)}</td></tr>`;
      }
      responseHeadersTable.innerHTML = `
        <table class="data-table">
          <thead><tr><th>Header</th><th>Value</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    } else {
      responseHeadersTable.innerHTML = `<div style="color:var(--text-muted); font-size:11px;">Yanıt başlığı yok.</div>`;
    }
  }

  function updateResponseView() {
    const tab = getActiveTab();
    if (!tab.response || tab.response.data === null || tab.response.data === undefined) {
      codeContent.innerHTML = '<span class="token-null">null</span>';
      lineNumbers.innerHTML = '<div>1</div>';
      return;
    }
    const processed = window.SyntaxHighlighter.process(tab.response.data, responseSearch.value);
    codeContent.innerHTML = processed.html;
    lineNumbers.innerHTML  = processed.lineNumbersHtml;
  }

  responseSearch.addEventListener('input', () => updateResponseView());

  function resetResponsePane() {
    statusBadge.className = 'status-badge';
    statusBadge.innerHTML = '<span class="status-dot" style="background:#5e687e;"></span> READY';
    timeStat.textContent  = '0 ms';
    sizeStat.textContent  = '0 B';
    codeContent.innerHTML = '<div style="color:var(--text-muted); font-size:12px;">Yanıt bekleniyor...</div>';
    lineNumbers.innerHTML = '<div>1</div>';
    responseHeadersTable.innerHTML = '';
  }

  // --------------------------------------------------------
  // Yanıtı Kopyala & İndir
  // --------------------------------------------------------
  btnCopyResponse.addEventListener('click', () => {
    const tab = getActiveTab();
    if (!tab.response) { showToast('Kopyalanacak yanıt yok.', 'error'); return; }
    const raw = typeof tab.response.data === 'object'
      ? JSON.stringify(tab.response.data, null, 2)
      : String(tab.response.data);
    navigator.clipboard.writeText(raw).then(() => showToast('Yanıt panoya kopyalandı! 📋', 'success'));
  });

  btnDownloadResponse.addEventListener('click', () => {
    const tab = getActiveTab();
    if (!tab.response) { showToast('İndirilecek yanıt yok.', 'error'); return; }
    const raw = typeof tab.response.data === 'object'
      ? JSON.stringify(tab.response.data, null, 2)
      : String(tab.response.data);
    const blob = new Blob([raw], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `response-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(u);
    showToast('JSON dosyası indirildi! 💾', 'success');
  });

  // --------------------------------------------------------
  // URL değişince tab durumunu otomatik kaydet
  // --------------------------------------------------------
  urlInput.addEventListener('input', () => {
    const tab = getActiveTab();
    tab.url = urlInput.value;
  });

  // --------------------------------------------------------
  // İlk Başlangıç
  // --------------------------------------------------------
  renderTabsBar();
  loadTabState(getActiveTab());
});
