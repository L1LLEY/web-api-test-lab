// ============================================================
// Slein Logic & Veri Yönetimi
// Geliştirici: Selin (Slein) — Logic & Data Layer
// ============================================================

const SleinLogic = {

  // Aktif AbortController — isteği iptal etmek için
  _abortController: null,

  // --------------------------------------------------------
  // 1. Paskalya Yumurtası Kontrolü
  // --------------------------------------------------------
  checkEasterEgg(url) {
    const banner = document.getElementById('easterEggBanner');
    if (!banner) return false;

    const lowerUrl = (url || '').toLowerCase();
    const isMatched =
      lowerUrl.includes('love') ||
      lowerUrl.includes('sonsuz-sevgi') ||
      lowerUrl.includes('slein');

    if (isMatched) {
      banner.classList.remove('hidden');
      banner.style.display = 'block';
      if (window.showToast) {
        window.showToast('💖 Sonsuz Sevgi Paskalya Yumurtası Bulundu!', 'success');
      }
      return true;
    }
    return false;
  },

  // --------------------------------------------------------
  // 2. HTTP Durum Kodu Rozeti Güncelleme
  //    200–299 → Yeşil | 300–399 → Mavi | 400–499 → Sarı | 500+ → Kırmızı
  // --------------------------------------------------------
  updateStatusBadge(statusCode, statusText = '') {
    const badge = document.getElementById('statusBadge');
    if (!badge) return;

    badge.className = 'status-badge';

    if (statusCode >= 200 && statusCode < 300) {
      badge.classList.add('status-2xx');
    } else if (statusCode >= 300 && statusCode < 400) {
      badge.classList.add('status-3xx');
    } else if (statusCode >= 400 && statusCode < 500) {
      badge.classList.add('status-4xx');
    } else {
      badge.classList.add('status-5xx');
    }

    badge.innerHTML = `<span class="status-dot"></span> ${statusCode} ${statusText}`;
  },

  // --------------------------------------------------------
  // 3. Gönder Butonu Yükleniyor / Hazır Durumu
  // --------------------------------------------------------
  setLoading(isLoading) {
    const btn = document.getElementById('btnSend');
    const statusEngine = document.getElementById('statusEngine');
    if (!btn) return;

    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Gönderiliyor';
      if (statusEngine) statusEngine.textContent = 'EXECUTING...';
    } else {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>Gönder</span>`;
      if (statusEngine) statusEngine.textContent = 'READY';
    }
  },

  // --------------------------------------------------------
  // 4. Ana API İstek Yöneticisi
  //    - AbortController ile iptal desteği
  //    - Ağ / CORS hata yakalama
  //    - query params, headers, body, auth tam desteği
  // --------------------------------------------------------
  async executeApiCall(method, url, body = null, headers = {}, queryParams = [], auth = null) {
    this.checkEasterEgg(url);

    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();

    this.setLoading(true);

    try {
      const result = await window.ApiClient.sendRequest({
        method,
        url,
        queryParams,
        headers,
        body,
        auth,
        signal: this._abortController.signal
      });

      // Süre ve boyut istatistiklerini güncelle
      const timeStat = document.getElementById('timeStat');
      const sizeStat = document.getElementById('sizeStat');

      if (timeStat && result.responseTime != null) {
        timeStat.textContent = `${result.responseTime} ms`;
      }
      if (sizeStat && result.sizeBytes != null) {
        sizeStat.textContent = result.sizeBytes > 1024
          ? `${(result.sizeBytes / 1024).toFixed(2)} KB`
          : `${result.sizeBytes} B`;
      }

      // Durum rozetini güncelle
      this.updateStatusBadge(result.status, result.statusText);

      return result;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[SleinLogic] İstek iptal edildi.');
        return null;
      }

      this.updateStatusBadge(0, 'Network / CORS Error');
      console.error('[SleinLogic] Hata:', error);

      if (window.showToast) {
        window.showToast(`Bağlantı hatası: ${error.message}`, 'error');
      }

      return {
        ok: false,
        status: 0,
        statusText: 'Network / CORS Error',
        responseTime: 0,
        sizeBytes: 0,
        headers: {},
        data: {
          error: 'Network Error / CORS Block',
          message: error.message || 'Bilinmeyen bir hata oluştu.'
        }
      };

    } finally {
      this.setLoading(false);
      this._abortController = null;
    }
  },

  // --------------------------------------------------------
  // 5. Başlangıç
  // --------------------------------------------------------
  init() {
    // Method değişince body alanını göster/gizle
    const methodSelect = document.getElementById('methodSelect');
    if (methodSelect) {
      methodSelect.addEventListener('change', () => {
        const bodyPane = document.getElementById('paneBody');
        if (!bodyPane) return;
        const bodyMethods = ['POST', 'PUT', 'PATCH'];
        bodyPane.style.display = bodyMethods.includes(methodSelect.value) ? 'block' : 'none';
      });
    }
  }
};

window.SleinLogic = SleinLogic;

document.addEventListener('DOMContentLoaded', () => {
  SleinLogic.init();
});
