/* 周煜淇 · 发展路线图 — daily check-in + weekday templates */
(function () {
  "use strict";

  const TZ = "Asia/Macau";
  const STORAGE_KEY = "zhou-yuqi-roadmap-checkins-v1";
  const CIRC = 2 * Math.PI * 52; // ring r=52

  const DOW_CN = ["日", "一", "二", "三", "四", "五", "六"];
  const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  /** Week templates keyed by getDay() 0=Sun … 6=Sat */
  const WEEK = {
    1: {
      label: "周一",
      classes: "Marketing · Português III",
      context: "上午外贸深工，下午上课；晚间健身→看书／语言→日记。",
      deep: "9:00–12:30 外贸深工（公司研究／简历／投递）",
      deepLong: false,
      internshipHint: "上午专攻最大外贸公司研究／求职信／投递，课表不挤。",
    },
    2: {
      label: "周二",
      classes: "HCC · Economia China",
      context: "课前短块推进投递／跟进；晚间习惯档。",
      deep: "课前～10:30 实习短深工（投递／跟进）",
      deepLong: false,
      internshipHint: "课前短块把投递或 LinkedIn／官网跟进推进一截。",
    },
    3: {
      label: "周三",
      classes: "Psicologia · História Cult. PLP",
      context: "午后两小时专攻 JD／求职信／投递。",
      deep: "14:00–16:00 实习短深工（JD／求职信／投递）",
      deepLong: false,
      internshipHint: "午后两小时专攻目标公司，别让课间隙空掉。",
    },
    4: {
      label: "周四",
      classes: "Marketing · Português · História",
      context: "课间缝插短跟进；护住语言与日记。",
      deep: "课间／傍晚前 实习短跟进（30–60 分）",
      deepLong: false,
      internshipHint: "课满的一天：短跟进即可，积小胜。",
    },
    5: {
      label: "周五",
      classes: "今日无课",
      context: "全天空档——上午外贸长块是护栏，创业傍晚轻量。",
      deep: "10:00–13:00 外贸实习长块（护栏）",
      deepLong: true,
      internshipHint: "周五上午长块：公司对比／模拟面试／作品整理，创业不挤占。",
    },
    6: {
      label: "周六",
      classes: "周末 · 无课",
      context: "上午外贸长块；PRAIA 等可选活动绕开深工。",
      deep: "10:00–13:00 外贸实习长块（护栏）",
      deepLong: true,
      internshipHint: "周末把公司对比、模拟面试或作品推进一步。",
    },
    0: {
      label: "周日",
      classes: "周末 · 无课",
      context: "上午外贸长块收尾一周；日记复盘。",
      deep: "10:00–13:00 外贸实习长块（护栏）",
      deepLong: true,
      internshipHint: "周末冲刺：对比清单、面试模拟或作品整理。",
    },
  };

  const I18N = {
    zh: {
      "hero.lead":
        "近端锁死：冲进大型外贸公司实习（葡语／欧美市场）。中段用交付证明放大组织力。远端创办并带领一家科技公司登陆美股。每天打卡，把志向落成可勾选的行动。",
    },
    en: {
      "hero.lead":
        "Near-term lock: land an internship at a major foreign-trade firm (Portuguese / EU–US markets). Mid: turn delivery proof into org leverage. Far: found and lead a tech company listed in the US. Daily check-ins turn ambition into checkable moves.",
    },
  };

  function macauNow() {
    return new Date(
      new Date().toLocaleString("en-US", { timeZone: TZ })
    );
  }

  function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function buildTasks(dayMeta) {
    return [
      {
        id: "lang",
        title: "葡语 ＋ 英语",
        desc: "晨间语言块（约 8:00–8:45）· 听说读写任选推进",
        protected: false,
      },
      {
        id: "fitness",
        title: "健身",
        desc: "晚间或上午空档 · 不占外贸深工护栏",
        protected: false,
      },
      {
        id: "internship",
        title: dayMeta.deepLong ? "外贸实习 · 长深工" : "外贸实习 · 深工",
        desc: dayMeta.deep + " — " + dayMeta.internshipHint,
        protected: true,
      },
      {
        id: "reading",
        title: "阅读",
        desc: "下午或晚间阅读块 · 贸易／商业／跨文化任选",
        protected: false,
      },
      {
        id: "journal",
        title: "日记复盘",
        desc: "约 21:00 · 写清今天推进了哪一毫米",
        protected: false,
      },
      {
        id: "startup",
        title: "创业轻量（有余力）",
        desc: "傍晚：Numa／湾科汇／RFERP 线索或材料 · 不挤深工 · 餐饮暂停",
        protected: false,
      },
    ];
  }

  function weekCards() {
    // Mon→Sun display order
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((d) => {
      const meta = WEEK[d];
      let blockClass = "block";
      let blockText = meta.deep.replace(/^.*? /, "").slice(0, 18);
      if (meta.deepLong) {
        blockClass = "block long";
        blockText = "外贸长块护栏";
      } else if (d === 4) {
        blockClass = "block light";
        blockText = "短跟进";
      } else {
        blockText = "外贸深工";
      }
      return { dow: d, meta, blockClass, blockText };
    });
  }

  // ——— UI refs ———
  const els = {
    clock: document.getElementById("clock-pill"),
    heroRing: document.getElementById("hero-ring"),
    heroPct: document.getElementById("hero-pct"),
    streakCount: document.getElementById("streak-count"),
    weekDone: document.getElementById("week-done"),
    heroTip: document.getElementById("hero-tip"),
    todayLabel: document.getElementById("today-label"),
    todayContext: document.getElementById("today-context"),
    deepGuard: document.getElementById("deep-guard"),
    taskList: document.getElementById("task-list"),
    checkMsg: document.getElementById("check-msg"),
    celebrateBtn: document.getElementById("celebrate-btn"),
    resetToday: document.getElementById("reset-today"),
    streakDots: document.getElementById("streak-dots"),
    weekGrid: document.getElementById("week-grid"),
    langToggle: document.getElementById("lang-toggle"),
    confetti: document.getElementById("confetti"),
  };

  let store = loadStore();
  let today = macauNow();
  let todayKey = dateKey(today);
  let dayMeta = WEEK[today.getDay()];
  let tasks = buildTasks(dayMeta);
  let lang = "zh";

  function ensureToday() {
    if (!store[todayKey]) store[todayKey] = {};
  }

  function doneCount() {
    ensureToday();
    return tasks.filter((t) => store[todayKey][t.id]).length;
  }

  function pct() {
    return Math.round((doneCount() / tasks.length) * 100);
  }

  function updateRing() {
    const p = pct();
    const offset = CIRC * (1 - p / 100);
    els.heroRing.style.strokeDasharray = String(CIRC);
    els.heroRing.style.strokeDashoffset = String(offset);
    els.heroRing.classList.toggle("is-hot", p === 100);
    els.heroPct.textContent = p + "%";
  }

  function calcStreak() {
    let streak = 0;
    const cursor = macauNow();
    // If today has no checks yet, streak counts consecutive past full/partial days ending yesterday
    for (let i = 0; i < 60; i++) {
      const key = dateKey(cursor);
      const day = store[key] || {};
      const n = Object.keys(day).filter((k) => day[k]).length;
      if (n > 0) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else if (i === 0) {
        // today empty — peek yesterday
        cursor.setDate(cursor.getDate() - 1);
        continue;
      } else {
        break;
      }
    }
    return streak;
  }

  function calcWeekActive() {
    const cursor = macauNow();
    const dow = cursor.getDay(); // 0 Sun
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    const monday = new Date(cursor);
    monday.setDate(cursor.getDate() - mondayOffset);
    let active = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const key = dateKey(d);
      const day = store[key] || {};
      if (Object.keys(day).some((k) => day[k])) active += 1;
    }
    return active;
  }

  function renderStreakDots() {
    els.streakDots.innerHTML = "";
    const cursor = macauNow();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() - i);
      days.push(d);
    }
    days.forEach((d) => {
      const key = dateKey(d);
      const day = store[key] || {};
      const n = Object.keys(day).filter((k) => day[k]).length;
      const el = document.createElement("div");
      el.className = "streak-dot";
      if (n >= 6) el.classList.add("is-full");
      else if (n > 0) el.classList.add("is-partial");
      if (key === todayKey) el.classList.add("is-today");
      el.textContent = DOW_CN[d.getDay()];
      el.title = `${key} · ${n}/6`;
      els.streakDots.appendChild(el);
    });
  }

  function renderTasks() {
    ensureToday();
    els.taskList.innerHTML = "";
    tasks.forEach((t) => {
      const li = document.createElement("li");
      li.className = "task-item";
      if (t.protected) li.classList.add("is-protected");
      const checked = !!store[todayKey][t.id];
      if (checked) li.classList.add("is-done");
      li.setAttribute("role", "checkbox");
      li.setAttribute("aria-checked", checked ? "true" : "false");
      li.tabIndex = 0;
      li.dataset.id = t.id;
      li.innerHTML = `
        <span class="task-check" aria-hidden="true">✓</span>
        <div class="task-meta">
          <p class="task-title">${t.title}</p>
          <p class="task-desc">${t.desc}</p>
          ${t.protected ? '<span class="task-tag">深工护栏</span>' : ""}
        </div>
      `;
      const toggle = () => toggleTask(t.id, li);
      li.addEventListener("click", toggle);
      li.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      });
      els.taskList.appendChild(li);
    });
    refreshStatus();
  }

  function refreshStatus() {
    const n = doneCount();
    const p = pct();
    updateRing();
    els.streakCount.textContent = String(calcStreak());
    els.weekDone.textContent = `${calcWeekActive()}/7`;
    renderStreakDots();

    if (p === 100) {
      els.checkMsg.textContent = "今日全清！这一毫米已经落袋。";
      els.checkMsg.classList.add("is-win");
      els.celebrateBtn.hidden = false;
      els.heroTip.textContent = "漂亮——连续打卡在加分。";
    } else if (n === 0) {
      els.checkMsg.textContent = "点一下，就算打卡。";
      els.checkMsg.classList.remove("is-win");
      els.celebrateBtn.hidden = true;
      els.heroTip.textContent = "勾完今日清单，环会亮起来。";
    } else {
      els.checkMsg.textContent = `已完成 ${n}/${tasks.length} · 继续推。`;
      els.checkMsg.classList.remove("is-win");
      els.celebrateBtn.hidden = true;
      els.heroTip.textContent = `还差 ${tasks.length - n} 项，环在升温。`;
    }
  }

  function toggleTask(id, li) {
    ensureToday();
    const next = !store[todayKey][id];
    store[todayKey][id] = next;
    if (!next) delete store[todayKey][id];
    // clean empty day objects
    if (Object.keys(store[todayKey]).length === 0) delete store[todayKey];
    saveStore(store);
    ensureToday();

    const checked = !!store[todayKey][id];
    li.classList.toggle("is-done", checked);
    li.setAttribute("aria-checked", checked ? "true" : "false");
    li.classList.remove("just-checked");
    void li.offsetWidth;
    if (checked) li.classList.add("just-checked");

    const wasComplete = pct() === 100 && checked;
    refreshStatus();
    if (wasComplete) burstConfetti();
  }

  function renderWeek() {
    const todayDow = today.getDay();
    els.weekGrid.innerHTML = "";
    weekCards().forEach(({ dow, meta, blockClass, blockText }) => {
      const card = document.createElement("article");
      card.className = "day-card" + (dow === todayDow ? " is-today" : "");
      card.innerHTML = `
        <div class="dow">周${DOW_CN[dow]}</div>
        <div class="classes">${meta.classes}</div>
        <div class="${blockClass}">${blockText}</div>
      `;
      els.weekGrid.appendChild(card);
    });
  }

  function updateClock() {
    const now = macauNow();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    els.clock.textContent = `澳门 · ${hh}:${mm}`;
  }

  function updateTodayHeader() {
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    els.todayLabel.textContent = `${m}-${d} 周${DOW_CN[today.getDay()]}`;
    els.todayContext.textContent = dayMeta.context;
    els.deepGuard.textContent = dayMeta.deepLong
      ? "今日为外贸长块护栏日：上午深工不给创业／健身挤占；创业仅傍晚轻量。"
      : `今日深工窗口：${dayMeta.deep}。周五与周末上午为长块护栏。`;
  }

  // Confetti-lite
  function burstConfetti() {
    const canvas = els.confetti;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ["#ff6b6b", "#ffb347", "#2dd4bf", "#a78bfa", "#f0e6d2"];
    const parts = Array.from({ length: 48 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 80,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 3.5,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
      color: colors[(Math.random() * colors.length) | 0],
      life: 70 + ((Math.random() * 30) | 0),
    }));

    let frame = 0;
    function tick() {
      frame += 1;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let alive = 0;
      parts.forEach((p) => {
        p.life -= 1;
        if (p.life <= 0) return;
        alive += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 20);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive > 0 && frame < 120) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    requestAnimationFrame(tick);
  }

  // Language toggle (hero lead only — keep UI mostly ZH)
  function applyLang() {
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.getAttribute("data-i18n");
      const pack = I18N[lang] || I18N.zh;
      if (pack[key]) node.textContent = pack[key];
    });
    els.langToggle.textContent = lang === "zh" ? "EN" : "中";
    els.langToggle.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
  }

  els.langToggle.addEventListener("click", () => {
    lang = lang === "zh" ? "en" : "zh";
    applyLang();
  });

  els.resetToday.addEventListener("click", () => {
    if (!confirm("清空今天的打卡记录？")) return;
    delete store[todayKey];
    saveStore(store);
    renderTasks();
  });

  els.celebrateBtn.addEventListener("click", () => burstConfetti());

  // Midnight rollover check every minute
  function maybeRollDay() {
    const now = macauNow();
    const key = dateKey(now);
    if (key !== todayKey) {
      today = now;
      todayKey = key;
      dayMeta = WEEK[today.getDay()];
      tasks = buildTasks(dayMeta);
      updateTodayHeader();
      renderTasks();
      renderWeek();
    }
    updateClock();
  }

  // Init
  updateClock();
  updateTodayHeader();
  renderTasks();
  renderWeek();
  applyLang();
  setInterval(maybeRollDay, 30_000);

  // Expose for debug
  window.__roadmap = { store, dateKey, macauNow, tasks };
})();

/* Planning mind map — reads copy from #mindmap-source, draws SVG. */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const LEFT = ["daily", "guard", "week", "fuel", "compound", "milestones"];
  const RIGHT = ["near", "mid", "far"];
  const STACK = ["near", "mid", "far", "daily", "guard", "week", "fuel", "compound", "milestones"];
  const TONES = {
    root: { color: "#ffb347", glow: "rgba(255,107,107,0.45)" },
    near: { color: "#ff6b6b", glow: "rgba(255,107,107,0.48)" },
    mid: { color: "#ffb347", glow: "rgba(255,179,71,0.45)" },
    far: { color: "#2dd4bf", glow: "rgba(45,212,191,0.45)" },
    daily: { color: "#a78bfa", glow: "rgba(167,139,250,0.48)" },
    guard: { color: "#ff8e8e", glow: "rgba(255,142,142,0.45)" },
    week: { color: "#ffb347", glow: "rgba(255,179,71,0.4)" },
    fuel: { color: "#2dd4bf", glow: "rgba(45,212,191,0.42)" },
    compound: { color: "#ffb347", glow: "rgba(255,179,71,0.4)" },
    milestone: { color: "#c4b5fd", glow: "rgba(196,181,253,0.5)" },
  };

  const viewport = document.getElementById("mindmap-viewport");
  const svg = document.getElementById("mindmap-svg");
  const source = document.getElementById("mindmap-source");
  const hint = document.getElementById("mindmap-hint");
  const detailEl = document.getElementById("mindmap-detail");
  const crumbEl = document.getElementById("mindmap-crumb");
  const titleEl = document.getElementById("mindmap-detail-title");
  const bodyEl = document.getElementById("mindmap-detail-body");
  if (!viewport || !svg || !source || !detailEl) return;

  const measureCtx = document.createElement("canvas").getContext("2d");
  const byId = Object.create(null);
  let root = null;
  let edges = [];
  let stacked = false;
  let scale = 1;
  let base = { w: 1, h: 1 };
  let selectedId = null;
  let lastW = 0;
  let lastMode = "";

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    if (attrs) {
      Object.keys(attrs).forEach((key) => {
        if (attrs[key] != null) node.setAttribute(key, String(attrs[key]));
      });
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function textOf(node) {
    return node ? node.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function readBranch(node) {
    return {
      id: node.dataset.id,
      tone: node.dataset.tone || "",
      kicker: textOf(node.querySelector(":scope > .mm-kicker")),
      label: textOf(node.querySelector(":scope > .mm-label")),
      detail: textOf(node.querySelector(":scope > .mm-detail")),
      children: [...node.querySelectorAll(":scope > .mm-leaves > li")].map((li) => ({
        id: li.dataset.id,
        tone: li.dataset.tone || "",
        kicker: "",
        label: textOf(li.querySelector(":scope > .mm-label")),
        detail: textOf(li.querySelector(":scope > .mm-detail")),
        children: [],
      })),
    };
  }

  function indexTree(node, parent, kind) {
    node.parent = parent;
    node.kind = kind;
    node.tone = node.tone || (parent && parent.tone) || "root";
    byId[node.id] = node;
    const childKind = kind === "root" ? "branch" : "leaf";
    node.children.forEach((child) => indexTree(child, node, childKind));
  }

  function toneOf(node) {
    return TONES[node.tone] || TONES.root;
  }

  function typeSpec(kind, isStack) {
    const spec = {
      root: {
        padX: 34, padY: 18, size: 26, weight: 700, lh: 32, bar: 3, barGap: 10,
        family: '"Space Grotesk", "Noto Sans SC", sans-serif',
      },
      branch: {
        padX: 16, padY: 11, size: 15, weight: 700, lh: 21,
        family: '"DM Sans", "Noto Sans SC", sans-serif',
        kickerSize: 11, kickerLh: 14, kickerGap: 4, kickerWeight: 700,
        kickerFamily: '"Space Grotesk", "DM Sans", "Noto Sans SC", sans-serif',
      },
      leaf: {
        padX: 12, padY: 8, size: 14, weight: 500, lh: 19, dot: 6, dotGap: 8,
        family: '"DM Sans", "Noto Sans SC", sans-serif',
      },
    }[kind];
    if (isStack && kind === "root") {
      spec.size = 20;
      spec.lh = 26;
      spec.padX = 22;
      spec.padY = 14;
    }
    if (isStack && kind === "branch") {
      spec.size = 17;
      spec.lh = 23;
      spec.padX = 6;
      spec.padY = 2;
    }
    if (isStack && kind === "leaf") {
      spec.size = 15;
      spec.lh = 21;
      spec.padY = 11;
      spec.padX = 10;
    }
    return spec;
  }

  function fontCss(weight, size, family) {
    return weight + " " + size + "px " + family;
  }

  function tokenize(text) {
    const out = [];
    let buf = "";
    const flush = () => {
      if (buf) out.push(buf);
      buf = "";
    };
    for (const ch of text) {
      if (/[A-Za-z0-9]/.test(ch)) buf += ch;
      else {
        flush();
        out.push(ch);
      }
    }
    flush();
    return out;
  }

  function wrapText(text, maxW, font) {
    measureCtx.font = font;
    const width = (value) => measureCtx.measureText(value).width;
    const sticky = /^[）)」』】，。、；：,.!！？?]$/;
    const punct = /[，。；、：／·]$/;
    const tokens = tokenize(text);
    const lines = [];
    let idx = 0;
    while (idx < tokens.length) {
      let end = idx;
      let line = "";
      while (end < tokens.length) {
        const token = tokens[end];
        if (token === " " && !line) {
          end += 1;
          idx = end;
          continue;
        }
        const next = line + token;
        const over = width(next) > maxW + (sticky.test(token) ? 14 : 0);
        if (line && over) break;
        if (!line && width(token) > maxW) {
          let part = "";
          for (const ch of token) {
            if (part && width(part + ch) > maxW) break;
            part += ch;
          }
          line = part || token.slice(0, 1);
          tokens.splice(end, 1, line, token.slice(line.length));
          end += 1;
          break;
        }
        line = next;
        end += 1;
      }
      if (end < tokens.length && line) {
        let cut = -1;
        let acc = "";
        for (let k = idx; k < end; k++) {
          acc += tokens[k];
          if (punct.test(tokens[k]) && width(acc) >= maxW * 0.46) cut = k;
        }
        if (cut >= idx && cut < end - 1) end = cut + 1;
        else if (end > idx + 1) {
          const lastTok = tokens[end - 1];
          const nextTok = tokens[end];
          const cjk = /^[\u3400-\u9FFF]$/;
          if (cjk.test(lastTok) && cjk.test(nextTok)) {
            const trimmed = tokens.slice(idx, end - 1).join("");
            if (width(trimmed) >= maxW * 0.55) end -= 1;
          }
        }
      }
      const built = tokens.slice(idx, end).join("");
      if (built) lines.push(built);
      if (end === idx) end += 1;
      idx = end;
    }
    if (!lines.length) lines.push("");
    const tail = lines.length >= 2 ? [...lines[lines.length - 1]].length : 99;
    const head = lines.length >= 2 ? [...lines[lines.length - 2]].length : 0;
    if (lines.length >= 2 && tail <= 2 && head >= tail * 3) {
      const parts = tokenize(lines[lines.length - 2] + lines[lines.length - 1]);
      let best = null;
      let acc = "";
      for (let i = 0; i < parts.length - 1; i++) {
        acc += parts[i];
        const rest = parts.slice(i + 1).join("");
        if ([...rest].length < 2 || [...acc].length < 2) continue;
        if (width(acc) > maxW + 8 || width(rest) > maxW + 8) continue;
        const score = Math.abs([...acc].length - [...rest].length);
        if (!best || score < best.score) best = { a: acc, rest, score };
      }
      if (best) {
        lines[lines.length - 2] = best.a;
        lines[lines.length - 1] = best.rest;
      }
    }
    return lines;
  }

  function sizeNode(node, opts) {
    const spec = typeSpec(opts.kind, opts.stacked);
    const lines = [];
    if (node.kicker && opts.kind === "branch") {
      const kFont = fontCss(spec.kickerWeight, spec.kickerSize, spec.kickerFamily);
      wrapText(node.kicker, opts.textMax, kFont).forEach((text) => {
        lines.push({
          text, font: kFont, lh: spec.kickerLh, size: spec.kickerSize,
          weight: spec.kickerWeight, family: spec.kickerFamily, role: "kicker",
        });
      });
    }
    const lFont = fontCss(spec.weight, spec.size, spec.family);
    wrapText(node.label, opts.textMax, lFont).forEach((text, index) => {
      lines.push({
        text, font: lFont, lh: spec.lh, size: spec.size, weight: spec.weight,
        family: spec.family, role: "label",
        gapBefore: node.kicker && opts.kind === "branch" && index === 0 ? spec.kickerGap : 0,
      });
    });
    node.lines = lines;
    node.spec = spec;
    node.kind = opts.kind;
    let textW = 0;
    lines.forEach((line) => {
      measureCtx.font = line.font;
      textW = Math.max(textW, Math.ceil(measureCtx.measureText(line.text).width));
    });
    const dotExtra = opts.kind === "leaf" ? spec.dot + spec.dotGap : 0;
    const natural = textW + spec.padX * 2 + dotExtra + 6;
    node.w = opts.forceW ? Math.max(opts.forceW, natural) : natural;
    let h = spec.padY * 2;
    lines.forEach((line) => { h += line.lh + (line.gapBefore || 0); });
    if (opts.kind === "root") h += spec.barGap + spec.bar;
    if (opts.kind === "leaf") h = Math.max(h, opts.stacked ? 46 : 38);
    node.h = h;
  }

  function blockMetrics(branch, cols, leafGapY) {
    const kids = branch.children;
    const useCols = kids.length > 1 ? cols : 1;
    const rows = Math.max(1, Math.ceil(kids.length / useCols));
    const rowHeights = [];
    for (let r = 0; r < rows; r++) {
      let rh = 0;
      for (let c = 0; c < useCols; c++) {
        const kid = kids[r * useCols + c];
        if (kid) rh = Math.max(rh, kid.h);
      }
      rowHeights.push(rh);
    }
    const clusterH = rowHeights.reduce((sum, h) => sum + h, 0) + leafGapY * Math.max(0, rows - 1);
    return { useCols, rows, rowHeights, clusterH, blockH: Math.max(clusterH, branch.h) };
  }

  function layoutMap(targetW) {
    const outer = 36;
    const branchGap = 36;
    const leafGapX = 12;
    const leafGapY = 12;
    const blockGap = 28;
    const rootGap = 60;
    edges = [];

    sizeNode(root, { kind: "root", textMax: 460, stacked: false });
    const leftBranches = LEFT.map((id) => byId[id]).filter(Boolean);
    const rightBranches = RIGHT.map((id) => byId[id]).filter(Boolean);
    [...leftBranches, ...rightBranches].forEach((branch) => {
      sizeNode(branch, { kind: "branch", textMax: 156, stacked: false });
    });
    const leftBranchW = Math.max(...leftBranches.map((b) => b.w));
    const rightBranchW = Math.max(...rightBranches.map((b) => b.w));
    leftBranches.forEach((b) => { b.w = leftBranchW; });
    rightBranches.forEach((b) => { b.w = rightBranchW; });

    const fixed = outer * 2 + leftBranchW + rightBranchW + root.w + branchGap * 2 + rootGap * 2;
    const rest = targetW - fixed;
    let rightColW = 230;
    let leftClusterW = 250;
    if (rest >= 480) {
      rightColW = Math.min(360, Math.round(rest * 0.54));
      leftClusterW = rest - rightColW;
    } else if (rest > 80) {
      rightColW = Math.round(rest * 0.58);
      leftClusterW = rest - rightColW;
    }
    const leftColW = Math.floor((leftClusterW - leafGapX) / 2);

    function colsFor(branch) {
      if (leftColW < 146 || branch.children.length < 4) return 1;
      const longLabel = branch.children.some((child) => [...child.label].length > 14);
      return longLabel ? 1 : 2;
    }

    function prepare(branch, colW, clusterW) {
      const cols = colsFor(branch);
      const multi = branch.children.length > 1 && cols > 1;
      branch.children.forEach((child) => {
        const cell = multi ? colW : clusterW;
        const spec = typeSpec("leaf", false);
        const textMax = Math.max(52, cell - spec.padX * 2 - spec.dot - spec.dotGap - 8);
        sizeNode(child, { kind: "leaf", textMax, forceW: cell, stacked: false });
      });
    }
    leftBranches.forEach((branch) => prepare(branch, leftColW, leftClusterW));
    rightBranches.forEach((branch) => {
      branch.children.forEach((child) => {
        const spec = typeSpec("leaf", false);
        const textMax = Math.max(52, rightColW - spec.padX * 2 - spec.dot - spec.dotGap - 8);
        sizeNode(child, { kind: "leaf", textMax, forceW: rightColW, stacked: false });
      });
    });

    function columnHeight(branches, colsOf) {
      return branches.reduce((sum, branch, index) => {
        const cols = typeof colsOf === "function" ? colsOf(branch) : colsOf;
        return sum + blockMetrics(branch, cols, leafGapY).blockH + (index ? blockGap : 0);
      }, 0);
    }
    const leftH = columnHeight(leftBranches, colsFor);
    const rightH = columnHeight(rightBranches, 1);
    const innerH = Math.max(leftH, rightH, root.h);
    const contentW = outer + leftClusterW + branchGap + leftBranchW + rootGap + root.w + rootGap + rightBranchW + branchGap + rightColW + outer;
    const extra = Math.max(0, targetW - contentW);
    const add = extra / 2;

    const xClusterL = outer;
    const xBranchL = xClusterL + leftClusterW + branchGap;
    root.x = xBranchL + leftBranchW + rootGap + add;
    root.y = outer + (innerH - root.h) / 2;
    const xBranchR = root.x + root.w + rootGap + add;
    const xClusterR = xBranchR + rightBranchW + branchGap;

    placeColumn(leftBranches, "left", outer + (innerH - leftH) / 2, xBranchL, xClusterL, colsFor, leftColW, leftClusterW, leafGapY, blockGap);
    placeColumn(rightBranches, "right", outer + (innerH - rightH) / 2, xBranchR, xClusterR, 1, rightColW, rightColW, leafGapY, blockGap);

    const rootLeft = { x: root.x, y: root.y + root.h / 2 };
    const rootRight = { x: root.x + root.w, y: root.y + root.h / 2 };
    leftBranches.forEach((branch) => connectBranch(branch, "left", rootLeft));
    rightBranches.forEach((branch) => connectBranch(branch, "right", rootRight));

    return { w: xClusterR + rightColW + outer, h: innerH + outer * 2, stacked: false };
  }

  function placeColumn(branches, side, top, xBranch, xCluster, cols, colW, clusterW, leafGapY, blockGap) {
    let y = top;
    branches.forEach((branch) => {
      const use = typeof cols === "function" ? cols(branch) : cols;
      const metrics = blockMetrics(branch, use, leafGapY);
      const clusterTop = y + (metrics.blockH - metrics.clusterH) / 2;
      branch.x = xBranch;
      branch.y = y + (metrics.blockH - branch.h) / 2;
      let rowY = clusterTop;
      for (let r = 0; r < metrics.rows; r++) {
        const rh = metrics.rowHeights[r];
        const count = Math.min(metrics.useCols, branch.children.length - r * metrics.useCols);
        const shift = side === "left" ? metrics.useCols - count : 0;
        for (let c = 0; c < count; c++) {
          const kid = branch.children[r * metrics.useCols + c];
          kid.h = rh;
          kid.w = metrics.useCols > 1 ? colW : clusterW;
          kid.x = xCluster + (metrics.useCols > 1 ? (c + shift) * (colW + 12) : 0);
          kid.y = rowY;
        }
        rowY += rh + leafGapY;
      }
      y += metrics.blockH + blockGap;
    });
  }

  function connectBranch(branch, side, rootPt) {
    const color = toneOf(branch).color;
    const trunkFrom = side === "left"
      ? { x: branch.x + branch.w, y: branch.y + branch.h / 2 }
      : { x: branch.x, y: branch.y + branch.h / 2 };
    edges.push({
      kind: "trunk", from: branch, to: root, color,
      x1: trunkFrom.x, y1: trunkFrom.y, x2: rootPt.x, y2: rootPt.y,
    });
    const rows = new Map();
    branch.children.forEach((child) => {
      const key = Math.round(child.y);
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(child);
    });
    const leafAnchor = side === "left"
      ? { x: branch.x, y: branch.y + branch.h / 2 }
      : { x: branch.x + branch.w, y: branch.y + branch.h / 2 };
    rows.forEach((row) => {
      row.sort((a, b) => a.x - b.x);
      const inner = side === "left" ? row[row.length - 1] : row[0];
      const leafPt = side === "left"
        ? { x: inner.x + inner.w, y: inner.y + inner.h / 2 }
        : { x: inner.x, y: inner.y + inner.h / 2 };
      edges.push({
        kind: "leaf", from: branch, to: inner, color,
        x1: leafAnchor.x, y1: leafAnchor.y, x2: leafPt.x, y2: leafPt.y,
      });
      if (row.length === 2) {
        const leftN = row[0];
        const rightN = row[1];
        edges.push({
          kind: "sibling", from: leftN, to: rightN, color,
          x1: leftN.x + leftN.w, y1: leftN.y + leftN.h / 2,
          x2: rightN.x, y2: rightN.y + rightN.h / 2,
        });
      }
    });
  }

  function layoutStack(width) {
    edges = [];
    const pad = 16;
    const inner = width - pad * 2;
    let y = 40;
    sizeNode(root, { kind: "root", textMax: Math.min(340, inner - 28), stacked: true });
    root.x = (width - root.w) / 2;
    root.y = y;
    y += root.h + 22;
    let prev = root;
    STACK.map((id) => byId[id]).filter(Boolean).forEach((branch) => {
      const cardTop = y;
      sizeNode(branch, { kind: "branch", textMax: inner - 64, stacked: true });
      branch.w = inner - 52;
      branch.x = pad + 30;
      branch.y = cardTop + 14;
      y = branch.y + branch.h + 8;
      branch.children.forEach((child) => {
        const spec = typeSpec("leaf", true);
        const cellW = inner - 36;
        const textMax = Math.max(64, cellW - spec.padX * 2 - spec.dot - spec.dotGap - 8);
        sizeNode(child, { kind: "leaf", textMax, forceW: cellW, stacked: true });
        child.x = pad + 18;
        child.y = y;
        child.w = cellW;
        y += child.h + 2;
      });
      y += 12;
      branch.card = { x: pad, y: cardTop, w: inner, h: y - cardTop };
      const y1 = prev === root ? root.y + root.h + 2 : prev.card.y + prev.card.h;
      edges.push({
        kind: "stem", from: prev, to: branch, color: toneOf(branch).color,
        x1: width / 2, y1, x2: width / 2, y2: cardTop,
      });
      prev = branch;
      y += 18;
    });
    return { w: width, h: y + 8, stacked: true };
  }

  function curve(x1, y1, x2, y2) {
    const dir = x2 >= x1 ? 1 : -1;
    const dx = Math.max(20, Math.abs(x2 - x1) * 0.46);
    return "M " + x1 + " " + y1 + " C " + (x1 + dir * dx) + " " + y1 + ", " + (x2 - dir * dx) + " " + y2 + ", " + x2 + " " + y2;
  }

  function drawText(group, node) {
    const spec = node.spec;
    let blockH = 0;
    node.lines.forEach((line) => { blockH += line.lh + (line.gapBefore || 0); });
    const extra = node.kind === "root" ? spec.barGap + spec.bar : 0;
    let y = node.y + (node.h - extra - blockH) / 2;
    const textG = el("g", { class: "mm-text" }, group);
    if (node.kind === "leaf") {
      el("circle", {
        cx: node.x + spec.padX + spec.dot / 2,
        cy: y + node.lines[0].lh / 2,
        r: spec.dot / 2,
        fill: toneOf(node).color,
        "pointer-events": "none",
      }, textG);
    }
    const anchor = node.kind === "leaf" ? "start" : "middle";
    const x = node.kind === "leaf"
      ? node.x + spec.padX + spec.dot + spec.dotGap
      : node.x + node.w / 2;
    node.lines.forEach((line) => {
      y += line.gapBefore || 0;
      const text = el("text", {
        x, y: y + line.lh / 2,
        "text-anchor": anchor,
        "dominant-baseline": "middle",
        "font-family": line.family,
        "font-size": line.size,
        "font-weight": line.weight,
        fill: line.role === "kicker" ? toneOf(node).color : (node.kind === "root" ? "#f8fafc" : "#e8eef8"),
      }, textG);
      text.textContent = line.text;
      y += line.lh;
    });
    if (node.kind === "root") {
      const barW = Math.min(64, node.w * 0.34);
      el("rect", {
        x: node.x + (node.w - barW) / 2,
        y: node.y + node.h - spec.padY - spec.bar,
        width: barW, height: spec.bar, rx: 1.5,
        fill: "url(#mm-stroke)",
        "pointer-events": "none",
      }, group);
    }
  }

  function drawNode(node, parent) {
    const color = toneOf(node).color;
    const group = el("g", {
      class: "mm-node",
      role: "button",
      tabindex: "0",
      "data-id": node.id,
      "data-kind": node.kind,
      "data-tone": node.tone,
      "aria-pressed": "false",
      "aria-label": [node.kicker, node.label].filter(Boolean).join("，"),
    }, parent);
    group.style.setProperty("--glow", toneOf(node).glow);
    group.style.setProperty("--node", color);
    const rx = node.kind === "root" ? 22 : node.kind === "branch" ? 15 : 12;
    const soft = stacked && node.kind !== "root";
    el("rect", {
      class: "mm-shape",
      x: node.x, y: node.y, width: node.w, height: node.h, rx,
      fill: soft ? "transparent" : (node.kind === "root" ? "#141c2e" : node.kind === "branch" ? "#172338" : "#141c2c"),
      stroke: soft ? "transparent" : (node.kind === "root" ? "url(#mm-stroke)" : color),
      "stroke-width": node.kind === "root" ? 2.7 : node.kind === "branch" ? 1.7 : 1.2,
      "stroke-opacity": node.kind === "leaf" && !soft ? 0.62 : 1,
    }, group);
    if (!soft && node.kind !== "root") {
      el("rect", {
        x: node.x + 1.4, y: node.y + 1.4,
        width: Math.max(0, node.w - 2.8),
        height: Math.max(0, node.h - 2.8),
        rx: Math.max(1, rx - 1),
        fill: color,
        opacity: node.kind === "branch" ? 0.15 : 0.08,
        "pointer-events": "none",
      }, group);
    }
    drawText(group, node);
    group.addEventListener("keydown", onNodeKey);
    return group;
  }

  function draw(model, animate) {
    svg.replaceChildren();
    svg.classList.toggle("is-stack", model.stacked);
    svg.classList.toggle("is-animated", !!animate);
    const defs = el("defs", {}, svg);
    const stroke = el("linearGradient", { id: "mm-stroke", x1: "0%", y1: "0%", x2: "100%", y2: "100%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#ff6b6b" }, stroke);
    el("stop", { offset: "46%", "stop-color": "#ffb347" }, stroke);
    el("stop", { offset: "100%", "stop-color": "#2dd4bf" }, stroke);
    const halo = el("radialGradient", { id: "mm-halo", cx: "50%", cy: "50%", r: "50%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#ff6b6b", "stop-opacity": "0.34" }, halo);
    el("stop", { offset: "40%", "stop-color": "#ffb347", "stop-opacity": "0.16" }, halo);
    el("stop", { offset: "100%", "stop-color": "#2dd4bf", "stop-opacity": "0" }, halo);

    const bg = el("g", { class: "mm-bg" }, svg);
    const haloR = Math.max(root.h * 1.35, 88);
    el("circle", {
      class: "mm-halo",
      cx: root.x + root.w / 2,
      cy: root.y + root.h / 2,
      r: haloR,
      fill: "url(#mm-halo)",
    }, bg);

    const edgeLayer = el("g", { class: "mm-edges" }, svg);
    edges.forEach((edge, index) => {
      if (edge.kind === "trunk") {
        const grad = el("linearGradient", {
          id: "mm-edge-" + edge.from.id,
          gradientUnits: "userSpaceOnUse",
          x1: edge.x2, y1: edge.y2, x2: edge.x1, y2: edge.y1,
        }, defs);
        el("stop", { offset: "0%", "stop-color": "#f4f7fb", "stop-opacity": "0.45" }, grad);
        el("stop", { offset: "100%", "stop-color": edge.color }, grad);
      }
      const d = edge.kind === "trunk" || edge.kind === "leaf"
        ? curve(edge.x1, edge.y1, edge.x2, edge.y2)
        : "M " + edge.x1 + " " + edge.y1 + " L " + edge.x2 + " " + edge.y2;
      const path = el("path", {
        class: "mm-edge mm-" + edge.kind,
        d,
        stroke: edge.kind === "trunk" ? "url(#mm-edge-" + edge.from.id + ")" : edge.color,
        "stroke-width": edge.kind === "trunk" ? 2.4 : edge.kind === "stem" ? 2 : edge.kind === "sibling" ? 1.35 : 1.65,
        "stroke-opacity": edge.kind === "sibling" ? 0.45 : edge.kind === "leaf" ? 0.78 : 1,
        pathLength: "1",
        "data-from": edge.from.id,
        "data-to": edge.to.id,
        "pointer-events": "none",
      }, edgeLayer);
      path.style.animationDelay = Math.min(0.4, index * 0.028) + "s";
    });

    const nodeLayer = el("g", { class: "mm-nodes" }, svg);
    if (model.stacked) {
      root.children.forEach((branch) => {
        if (!branch.card) return;
        const card = el("g", { class: "mm-card", "data-id": branch.id }, nodeLayer);
        el("rect", {
          x: branch.card.x, y: branch.card.y, width: branch.card.w, height: branch.card.h, rx: 18,
          fill: "#152036",
          stroke: toneOf(branch).color,
          "stroke-opacity": "0.4",
          "stroke-width": "1.3",
        }, card);
        el("rect", {
          x: branch.card.x + 10,
          y: branch.card.y + 18,
          width: 4,
          height: Math.max(16, branch.card.h - 36),
          rx: 2,
          fill: toneOf(branch).color,
          "pointer-events": "none",
        }, card);
        branch.children.forEach((child, index) => {
          if (!index) return;
          el("line", {
            x1: child.x + 6, x2: child.x + child.w - 6, y1: child.y, y2: child.y,
            stroke: "rgba(232,238,248,0.08)",
            "pointer-events": "none",
          }, card);
        });
      });
    }
    drawNode(root, nodeLayer);
    root.children.forEach((branch) => {
      drawNode(branch, nodeLayer);
      branch.children.forEach((child) => drawNode(child, nodeLayer));
    });

    if (!model.stacked) {
      const seen = new Set();
      edges.filter((edge) => edge.kind === "trunk").forEach((edge) => {
        el("circle", {
          cx: edge.x1, cy: edge.y1, r: 4.2,
          fill: edge.color, stroke: "#0c1424", "stroke-width": 2,
          "pointer-events": "none",
        }, nodeLayer);
        const key = Math.round(edge.x2) + ":" + Math.round(edge.y2);
        if (!seen.has(key)) {
          seen.add(key);
          el("circle", {
            cx: edge.x2, cy: edge.y2, r: 5,
            fill: "url(#mm-stroke)", stroke: "#0c1424", "stroke-width": 2,
            "pointer-events": "none",
          }, nodeLayer);
        }
      });
    }
  }

  function nodeList() {
    const list = [root];
    root.children.forEach((branch) => {
      list.push(branch);
      branch.children.forEach((child) => list.push(child));
    });
    return list;
  }

  function countOverlaps() {
    const list = nodeList();
    const pairs = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        const hit = a.x + 2 < b.x + b.w && a.x + a.w > b.x + 2 && a.y + 2 < b.y + b.h && a.y + a.h > b.y + 2;
        if (hit && pairs.length < 12) pairs.push(a.id + "|" + b.id);
      }
    }
    svg.dataset.overlapPairs = pairs.join(",");
    return pairs.length;
  }

  function relatedIds(id) {
    const set = new Set();
    let current = byId[id];
    while (current) {
      set.add(current.id);
      current = current.parent;
    }
    (function down(node) {
      set.add(node.id);
      node.children.forEach(down);
    })(byId[id]);
    return set;
  }

  function applySelection() {
    const set = selectedId ? relatedIds(selectedId) : null;
    svg.classList.toggle("is-filtering", !!set);
    svg.querySelectorAll(".mm-node").forEach((group) => {
      const id = group.dataset.id;
      const hot = !!(set && set.has(id));
      group.classList.toggle("is-on", id === selectedId);
      group.classList.toggle("is-dim", !!(set && !hot));
      group.setAttribute("aria-pressed", id === selectedId ? "true" : "false");
    });
    svg.querySelectorAll(".mm-card").forEach((card) => {
      const hot = !!(set && set.has(card.dataset.id));
      card.classList.toggle("is-dim", !!(set && !hot));
    });
    svg.querySelectorAll(".mm-edge").forEach((path) => {
      const hot = !!(set && set.has(path.dataset.from) && set.has(path.dataset.to));
      path.classList.toggle("is-hot", hot);
      path.classList.toggle("is-dim", !!(set && !hot));
    });
    if (!selectedId || !byId[selectedId]) {
      crumbEl.textContent = "近 → 中 → 远";
      titleEl.textContent = "点开节点，看这一支";
      bodyEl.textContent = "高亮从中心连到叶子，文字与页面正文一致。";
      detailEl.dataset.tone = "root";
      return;
    }
    const node = byId[selectedId];
    const parts = [];
    let cursor = node;
    while (cursor) {
      parts.push(cursor.kicker ? cursor.kicker + " · " + cursor.label : cursor.label);
      cursor = cursor.parent;
    }
    crumbEl.textContent = parts.reverse().join("  /  ");
    titleEl.textContent = node.kicker ? node.kicker + " · " + node.label : node.label;
    bodyEl.textContent = node.detail || "";
    detailEl.dataset.tone = node.tone || "root";
  }

  function select(id, toggle) {
    if (toggle && selectedId === id) selectedId = null;
    else selectedId = id;
    applySelection();
  }

  function clearSelection() {
    selectedId = null;
    applySelection();
  }

  function nearest(from, dir) {
    const cx = from.x + from.w / 2;
    const cy = from.y + from.h / 2;
    let best = null;
    let bestScore = Infinity;
    nodeList().forEach((node) => {
      if (node.id === from.id) return;
      const nx = node.x + node.w / 2;
      const ny = node.y + node.h / 2;
      const dx = nx - cx;
      const dy = ny - cy;
      if (dir === "left" && dx >= -4) return;
      if (dir === "right" && dx <= 4) return;
      if (dir === "up" && dy >= -4) return;
      if (dir === "down" && dy <= 4) return;
      const primary = dir === "left" || dir === "right" ? Math.abs(dx) : Math.abs(dy);
      const secondary = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx);
      const score = primary + secondary * 1.8;
      if (score < bestScore) {
        bestScore = score;
        best = node;
      }
    });
    return best;
  }

  function reveal(node) {
    if (stacked) return;
    const left = node.x * scale;
    const top = node.y * scale;
    const right = (node.x + node.w) * scale;
    const bottom = (node.y + node.h) * scale;
    const pad = 20;
    if (left < viewport.scrollLeft) viewport.scrollLeft = Math.max(0, left - pad);
    if (top < viewport.scrollTop) viewport.scrollTop = Math.max(0, top - pad);
    if (right > viewport.scrollLeft + viewport.clientWidth) {
      viewport.scrollLeft = right - viewport.clientWidth + pad;
    }
    if (bottom > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTop = bottom - viewport.clientHeight + pad;
    }
  }

  function onNodeKey(event) {
    const id = event.currentTarget.dataset.id;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(id, true);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      clearSelection();
      viewport.focus();
      return;
    }
    const dir = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" }[event.key];
    if (!dir) return;
    event.preventDefault();
    const next = nearest(byId[id], dir);
    if (!next) return;
    const group = svg.querySelector('.mm-node[data-id="' + CSS.escape(next.id) + '"]');
    if (group) group.focus({ preventScroll: true });
    select(next.id, false);
    reveal(next);
  }

  function centerOnRoot() {
    if (stacked || !root) return;
    const cx = (root.x + root.w / 2) * scale;
    const cy = (root.y + root.h / 2) * scale;
    viewport.scrollLeft = Math.max(0, cx - viewport.clientWidth / 2);
    viewport.scrollTop = Math.max(0, cy - viewport.clientHeight / 2);
  }

  function applyScale(next, anchorX, anchorY) {
    const prev = scale || 1;
    const clamped = Math.max(0.72, Math.min(1.6, next));
    if (Math.abs(clamped - prev) < 0.001) return;
    const px = anchorX == null ? viewport.clientWidth / 2 : anchorX;
    const py = anchorY == null ? viewport.clientHeight / 2 : anchorY;
    const wx = (viewport.scrollLeft + px) / prev;
    const wy = (viewport.scrollTop + py) / prev;
    scale = clamped;
    svg.setAttribute("width", String(base.w * scale));
    svg.setAttribute("height", String(base.h * scale));
    viewport.classList.toggle("is-zoomed", !stacked && scale > 1.02);
    viewport.scrollLeft = wx * scale - px;
    viewport.scrollTop = wy * scale - py;
  }

  function render(options) {
    const opts = options || {};
    const target = Math.round(viewport.clientWidth);
    if (target < 40) return;
    if (!opts.force && target === lastW && svg.dataset.ready === "1") return;
    const mode = target < 860 ? "stack" : "map";
    const preserve = lastMode === mode && base.w > 1 ? {
      rx: (viewport.scrollLeft + viewport.clientWidth / 2) / (base.w * scale),
      ry: (viewport.scrollTop + viewport.clientHeight / 2) / (base.h * scale),
    } : null;
    lastW = target;
    const model = mode === "stack" ? layoutStack(target) : layoutMap(target);
    stacked = model.stacked;
    base = { w: model.w, h: model.h };
    scale = 1;
    draw(model, !!opts.animate && lastMode !== mode);
    if (!lastMode) svg.classList.add("is-animated");
    svg.setAttribute("viewBox", "0 0 " + base.w + " " + base.h);
    svg.setAttribute("width", String(base.w));
    svg.setAttribute("height", String(base.h));
    viewport.classList.toggle("is-stack", stacked);
    viewport.classList.toggle("is-map", !stacked);
    viewport.classList.remove("is-zoomed");
    if (hint) {
      hint.textContent = stacked
        ? "上下滑动阅读全图 · 点一行看原文"
        : "点节点看原文 · 放大后可拖拽平移";
    }
    svg.dataset.mode = mode;
    svg.dataset.width = String(Math.round(base.w));
    svg.dataset.height = String(Math.round(base.h));
    svg.dataset.overlaps = String(countOverlaps());
    svg.dataset.ready = "1";
    applySelection();
    if (preserve && !stacked) {
      viewport.scrollLeft = preserve.rx * base.w - viewport.clientWidth / 2;
      viewport.scrollTop = preserve.ry * base.h - viewport.clientHeight / 2;
    } else if (!stacked && lastMode !== mode) {
      centerOnRoot();
    } else if (!stacked && !lastMode) {
      centerOnRoot();
    }
    lastMode = mode;
  }

  let drag = null;
  viewport.addEventListener("pointerdown", (event) => {
    if (event.button != null && event.button !== 0) return;
    const hit = event.target && event.target.closest ? event.target.closest(".mm-node") : null;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      sx: viewport.scrollLeft,
      sy: viewport.scrollTop,
      moved: false,
      pointer: event.pointerType,
      nodeId: hit ? hit.dataset.id : "",
    };
    if (event.pointerType === "mouse") viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId || stacked) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 5) {
      drag.moved = true;
      viewport.classList.add("is-panning");
    }
    if (drag.moved && drag.pointer === "mouse") {
      viewport.scrollLeft = drag.sx - dx;
      viewport.scrollTop = drag.sy - dy;
    }
  });
  function endDrag(event) {
    if (!drag || (event && drag.id !== event.pointerId)) return;
    const moved = drag.moved;
    const nodeId = drag.nodeId;
    drag = null;
    viewport.classList.remove("is-panning");
    if (moved) return;
    if (nodeId) select(nodeId, true);
    else clearSelection();
  }
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", () => {
    drag = null;
    viewport.classList.remove("is-panning");
  });

  viewport.addEventListener("wheel", (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    applyScale(scale + delta, event.clientX - rect.left, event.clientY - rect.top);
  }, { passive: false });

  let pinch = null;
  viewport.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
      const a = event.touches[0];
      const b = event.touches[1];
      pinch = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale };
    }
  }, { passive: true });
  viewport.addEventListener("touchmove", (event) => {
    if (!pinch || event.touches.length < 2) return;
    event.preventDefault();
    const a = event.touches[0];
    const b = event.touches[1];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    applyScale(pinch.scale * (dist / pinch.dist));
  }, { passive: false });
  viewport.addEventListener("touchend", () => { pinch = null; });

  viewport.addEventListener("keydown", (event) => {
    if (event.target !== viewport) return;
    const step = 56;
    if (event.key === "ArrowDown") { viewport.scrollTop += step; event.preventDefault(); }
    else if (event.key === "ArrowUp") { viewport.scrollTop -= step; event.preventDefault(); }
    else if (event.key === "ArrowRight") { viewport.scrollLeft += step; event.preventDefault(); }
    else if (event.key === "ArrowLeft") { viewport.scrollLeft -= step; event.preventDefault(); }
    else if (event.key === "+" || event.key === "=") { applyScale(scale + 0.12); event.preventDefault(); }
    else if (event.key === "-" || event.key === "_") { applyScale(scale - 0.12); event.preventDefault(); }
    else if (event.key === "0") {
      applyScale(Math.min(1, (viewport.clientWidth - 4) / base.w));
      centerOnRoot();
      event.preventDefault();
    }
  });

  document.getElementById("mindmap-zoom-in").addEventListener("click", () => applyScale(scale + 0.12));
  document.getElementById("mindmap-zoom-out").addEventListener("click", () => applyScale(scale - 0.12));
  document.getElementById("mindmap-zoom-fit").addEventListener("click", () => {
    applyScale(Math.min(1, (viewport.clientWidth - 4) / base.w));
    requestAnimationFrame(centerOnRoot);
  });

  let resizeTimer = 0;
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      const w = Math.round(viewport.clientWidth);
      if (w === lastW) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => render({ force: true, animate: false }), 90);
    }).observe(viewport);
  } else {
    window.addEventListener("resize", () => render({ force: true, animate: false }));
  }

  function boot() {
    const sourceRoot = source.querySelector(":scope > .mm-branch");
    root = readBranch(sourceRoot);
    root.children = [...source.querySelectorAll(":scope > .mm-kids > .mm-branch")].map(readBranch);
    indexTree(root, null, "root");
    const start = () => {
      document.documentElement.classList.add("js");
      requestAnimationFrame(() => {
        render({ force: true, animate: true });
        requestAnimationFrame(centerOnRoot);
      });
    };
    if (document.fonts && document.fonts.ready) {
      const fonts = [
        '700 22px "Noto Sans SC"',
        '700 15px "Noto Sans SC"',
        '500 14px "Noto Sans SC"',
        '700 17px "Noto Sans SC"',
        '500 15px "Noto Sans SC"',
      ].map((spec) => document.fonts.load(spec).catch(() => {}));
      Promise.all([document.fonts.ready, ...fonts]).then(start).catch(start);
    } else start();
  }

  try {
    boot();
  } catch (err) {
    console.error(err);
    document.documentElement.classList.remove("js");
  }
})();
