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
