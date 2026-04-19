(function () {
  const cfg = window.JAAN_ANNIVERSARY || {};
  const toastEl = document.getElementById("toast");
  const letterBody = document.getElementById("letterBody");
  const letterPanel = document.getElementById("letterPanel");
  const envelopeBtn = document.getElementById("envelopeBtn");
  const timelineRoot = document.getElementById("timelineRoot");
  const memoryGrid = document.getElementById("memoryGrid");
  const daysEl = document.querySelector("[data-days]");
  const btnConfetti = document.getElementById("btnConfetti");
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove("is-visible"), 3200);
  }

  function parseYmd(s) {
    const [y, m, d] = (s || "").split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function daysBetween(start, end) {
    const ms = end.getTime() - start.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }

  function formatNiceDate(d) {
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /** Days together */
  const start = parseYmd(cfg.relationshipStartDate);
  if (start && daysEl) {
    const n = daysBetween(start, new Date());
    daysEl.textContent = String(n);
  } else if (daysEl) {
    daysEl.textContent = "∞";
  }

  /** Letter */
  if (letterBody) {
    letterBody.innerHTML = cfg.letterHtml || "Happy anniversary, Jaan.";
  }

  /** Envelope */
  if (envelopeBtn && letterPanel) {
    envelopeBtn.addEventListener("click", () => {
      const open = envelopeBtn.classList.toggle("is-open");
      envelopeBtn.setAttribute("aria-expanded", open ? "true" : "false");
      letterPanel.hidden = !open;
      if (open) {
        showToast("For your eyes only, Jaan.");
        fireConfetti(90);
      }
    });
  }

  /** Timeline */
  const events = (cfg.timeline || []).slice().sort((a, b) => {
    const da = parseYmd(a.date)?.getTime() || 0;
    const db = parseYmd(b.date)?.getTime() || 0;
    return da - db;
  });

  if (timelineRoot) {
    events.forEach((ev) => {
      const d = parseYmd(ev.date);
      const dateStr = d ? formatNiceDate(d) : ev.date || "";
      const item = document.createElement("div");
      item.className = "tl-item";
      item.innerHTML = `
        <span class="tl-dot" aria-hidden="true"></span>
        <article class="tl-card">
          <div class="tl-date">${escapeHtml(dateStr)}</div>
          <h3>${escapeHtml(ev.title || "Moment")}</h3>
          <p>${escapeHtml(ev.text || "")}</p>
        </article>
      `;
      timelineRoot.appendChild(item);
    });
  }

  /** Memory flip cards */
  (cfg.memories || []).forEach((m) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "memory-card";
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = `
      <div class="memory-inner">
        <div class="memory-face memory-front">
          <span class="memory-emoji">${m.emoji || "💕"}</span>
          <span class="memory-title">${escapeHtml(m.title || "Memory")}</span>
        </div>
        <div class="memory-face memory-back">${escapeHtml(m.message || "")}</div>
      </div>
    `;
    btn.addEventListener("click", () => {
      const flipped = btn.classList.toggle("is-flipped");
      btn.setAttribute("aria-pressed", flipped ? "true" : "false");
      if (flipped) fireConfetti(25);
    });
    memoryGrid?.appendChild(btn);
  });

  /** Surprise: heart rain */
  document.querySelectorAll('[data-surprise="hearts"] .btn-surprise').forEach((b) => {
    b.addEventListener("click", () => {
      for (let i = 0; i < 42; i++) {
        setTimeout(() => spawnHeart(), i * 60);
      }
      showToast("Jaan — this heart shower has your name on it.");
    });
  });

  function spawnHeart() {
    const el = document.createElement("div");
    el.className = "floating-heart";
    el.textContent = ["💕", "💗", "💖", "✨", "🌸"][Math.floor(Math.random() * 5)];
    el.style.left = `${Math.random() * 100}vw`;
    el.style.top = "-40px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }

  /** Sparkle zone */
  const sparkleZone = document.getElementById("sparkleZone");
  if (sparkleZone) {
    sparkleZone.addEventListener("pointermove", (e) => {
      const r = sparkleZone.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (Math.random() > 0.55) return;
      const s = document.createElement("span");
      s.className = "spark";
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      sparkleZone.appendChild(s);
      setTimeout(() => s.remove(), 700);
    });
  }

  /** Gift triple tap */
  let giftTaps = 0;
  const giftBtn = document.getElementById("giftBtn");
  giftBtn?.addEventListener("click", () => {
    giftTaps = Math.min(3, giftTaps + 1);
    giftBtn.textContent = `Tap me (${giftTaps}/3)`;
    if (giftTaps >= 3) {
      giftTaps = 0;
      giftBtn.textContent = "Tap me (0/3)";
      showToast("Coupon: one unlimited hug. Redeem anytime. Valid forever.");
      fireConfetti(120);
    }
  });

  /** Secret phrase detector */
  const phrase = (cfg.secretPhrase || "jaan").toLowerCase().replace(/[^a-z]/g, "");
  let buffer = "";
  window.addEventListener("keydown", (e) => {
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      buffer = (buffer + e.key.toLowerCase()).slice(-32);
      if (buffer.includes(phrase)) {
        buffer = "";
        showToast("You found the secret, Jaan. I love you a little extra right now.");
        fireConfetti(160);
        spawnHeart();
      }
    }
  });

  /** Confetti */
  let pieces = [];
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function fireConfetti(count) {
    const colors = ["#ff6b9d", "#ffa8c8", "#ffd966", "#7fdbca", "#c9b1ff", "#ffffff"];
    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.3,
        w: 6 + Math.random() * 8,
        h: 8 + Math.random() * 10,
        vy: 2 + Math.random() * 4,
        vx: -2 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vr: -0.15 + Math.random() * 0.3,
        c: colors[(Math.random() * colors.length) | 0],
      });
    }
    if (!fireConfetti._raf) {
      fireConfetti._raf = requestAnimationFrame(loop);
    }
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.vy += 0.04;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    pieces = pieces.filter((p) => p.y < canvas.height + 80);
    if (pieces.length) {
      fireConfetti._raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(fireConfetti._raf);
      fireConfetti._raf = null;
    }
  }

  btnConfetti?.addEventListener("click", () => {
    fireConfetti(140);
    showToast("Because you make ordinary life feel like a festival.");
  });

  /** First visit micro-surprise */
  try {
    if (!sessionStorage.getItem("jaanSeen")) {
      sessionStorage.setItem("jaanSeen", "1");
      setTimeout(() => showToast(`Hey Jaan — ${cfg.fromName || "your favourite person"} left you something special here.`), 900);
    }
  } catch (_) {
    /* ignore */
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
