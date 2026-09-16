// Easter egg animasyon yardımcısı

const EasterEgg = {
  canvas: null,
  ctx: null,
  particles: [],
  animating: false,

  init() {
    this.createCanvas();
    this.bindEvents();
  },

  createCanvas() {
    if (document.getElementById('heartCanvas')) return;
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'heartCanvas';
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        this.trigger('Shortcut Ctrl+Shift+L');
      }
    });
  },

  trigger(source = 'Protocol Trigger') {
    const modal = document.getElementById('easterModal');
    if (modal) {
      modal.classList.add('active');
    }

    const banner = document.getElementById('easterEggBanner');
    if (banner) {
      banner.classList.remove('hidden');
      banner.style.display = 'block';
    }

    this.spawnParticles(60);
    if (!this.animating) {
      this.animating = true;
      this.loop();
    }

    if (window.showToast) {
      window.showToast(`✨ Slein & Wesley Heartbeat Protocol Synced (${source})`, 'success');
    }
  },

  closeModal() {
    const modal = document.getElementById('easterModal');
    if (modal) {
      modal.classList.remove('active');
    }
  },

  spawnParticles(count = 50) {
    const colors = ['#f472b6', '#ec4899', '#818cf8', '#a855f7', '#38bdf8'];
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.02 + 0.015
      });
    }
  },

  loop() {
    if (!this.animating) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.alpha -= p.decay;

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.animating = false;
    }
  }
};

window.EasterEgg = EasterEgg;
