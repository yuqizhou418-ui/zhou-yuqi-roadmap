/* 原点 · 页面、推演、声音与可选云端。 */
(function () {
  "use strict";

  const engine = window.YuanDian;
  const RECENT_KEY = "yuandian-recent-v1";
  const CHECK_KEY = "yuandian-checks-v1";
  const LLM_KEY = "yuandian-llm-v1";
  const SAMPLE = "一年内成为能独立交付的产品设计师，并获得一份匹配的全职工作";
  const ROW = 58;
  const COL = 236;
  const PAD = 36;
  const KIND = { skill: "技能", asset: "资产", constraint: "约束", loop: "反馈" };

  const SYSTEM = [
    "你是「原点」。用第一性原理与围棋的大局／攻杀，把用户的目标拆成可执行的计划。用中文。只输出一个 JSON 对象，不要 Markdown。",
    "原则：先写可观察的完成状态。剥去习惯、身份和别人的时间表。原子只留 skill 技能、asset 资产、constraint 约束、loop 反馈环。长期是 3–36 个月的棋形。短期是 7–90 天内分得出胜负的结果。每日是 15–90 分钟、今天就能勾选的动作。用用户自己的词。尊重用户写下的期限。",
    "JSON 形状：",
    '{"essence":"一句话","assumptions":["假设"],"truths":[{"label":"四到十二字","text":"一句"}],"atoms":[{"kind":"skill","label":"四到十二字","detail":"一句"}],"longTerm":[{"horizon":"3–6 月","title":"四到十二字","why":"一句","moves":["动作","动作"]}],"shortTerm":[{"horizon":"7 天","title":"四到十二字","why":"一句","moves":["动作"]}],"daily":[{"title":"动作","minutes":30,"detail":"怎样算做完"}]}',
    "数量：assumptions 3 到 4，truths 3，atoms 4，longTerm 3，shortTerm 3，daily 5。minutes 为 15 到 90 的整数。",
  ].join("\n");

  const $ = function (id) { return document.getElementById(id); };

  const state = {
    seq: 0,
    ctl: null,
    plan: null,
    done: {},
    open: new Set(["root"]),
    selected: "root",
    panX: 40,
    panY: 40,
    zoom: 1,
    framed: false,
    userMoved: false,
    rootY: 0,
    drawerReturn: null,
  };

  let ritualCancel = null;
  let pad = null;
  let world = null;

  function motionOK() {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const data = JSON.parse(raw);
      return data == null ? fallback : data;
    } catch (err) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* quota or private mode */ }
  }

  function shortText(value, max) {
    const chars = Array.from(String(value || ""));
    return chars.length > max ? chars.slice(0, max - 1).join("") + "…" : chars.join("");
  }

  function loadRecent() {
    const data = loadJson(RECENT_KEY, []);
    if (!Array.isArray(data)) return [];
    return data.filter(function (entry) {
      return entry && entry.plan && entry.plan.v === 1 && entry.plan.tree && entry.goal;
    });
  }

  function remember(plan) {
    const clean = JSON.parse(JSON.stringify(plan));
    clean.notice = "";
    const next = loadRecent().filter(function (item) { return item.id !== clean.id; });
    next.unshift({ id: clean.id, goal: clean.goal, at: Date.now(), plan: clean });
    saveJson(RECENT_KEY, next.slice(0, 8));
  }

  function readDone(id, signature) {
    const all = loadJson(CHECK_KEY, {});
    const row = all && all[id];
    if (!row || row.sig !== signature) return {};
    return row.done || {};
  }

  function writeDone(id, signature, done) {
    const all = loadJson(CHECK_KEY, {});
    all[id] = { sig: signature, done: done };
    saveJson(CHECK_KEY, all);
  }

  function loadLlm() {
    const data = loadJson(LLM_KEY, {});
    return {
      base: String((data && data.base) || ""),
      key: String((data && data.key) || ""),
      model: String((data && data.model) || ""),
    };
  }

  function hasLlm() {
    const cfg = loadLlm();
    return Boolean(cfg.key.trim() && cfg.base.trim());
  }

  function isHttp(value) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (err) {
      return false;
    }
  }

  function completionsUrl(base) {
    const trimmed = base.trim().replace(/\/$/, "");
    if (/\/chat\/completions$/i.test(trimmed)) return trimmed;
    return trimmed + "/chat/completions";
  }

  function extractJson(text) {
    const start = String(text || "").indexOf("{");
    const end = String(text || "").lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("json");
    return JSON.parse(text.slice(start, end + 1));
  }

  function remotePlan(goal, signal) {
    const cfg = loadLlm();
    return fetch(completionsUrl(cfg.base), {
      method: "POST",
      signal: signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + cfg.key,
      },
      body: JSON.stringify({
        model: cfg.model.trim() || "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: goal },
        ],
      }),
    }).then(function (res) {
      if (!res.ok) throw new Error("http");
      return res.json();
    }).then(function (data) {
      const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      return engine.fromRemote(extractJson(text || ""), goal);
    });
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      const timer = window.setTimeout(function () { reject(new Error("timeout")); }, ms);
      promise.then(function (value) {
        window.clearTimeout(timer);
        resolve(value);
      }, function (err) {
        window.clearTimeout(timer);
        reject(err);
      });
    });
  }

  function setMode(mode) {
    document.body.dataset.mode = mode;
    $("home").inert = mode !== "home";
    $("ritual").inert = mode !== "ritual";
    $("board").inert = mode !== "board";
    if (mode === "home") document.title = "原点";
    if (mode === "board") {
      window.requestAnimationFrame(function () {
        if (!state.framed) frameRoot();
      });
    }
  }

  function statusText(plan) {
    const tail = " · " + (plan.domainLabel || "");
    if (plan.notice) return plan.notice + tail;
    if (plan.source === "remote") return "云端推演" + tail;
    return "本机原点" + tail;
  }

  function submitForm(form) {
    if (typeof form.requestSubmit === "function") form.requestSubmit();
    else form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  }

  function autosize(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  function renderRecent() {
    const panel = $("recent-panel");
    const list = $("recent-list");
    const items = loadRecent();
    list.replaceChildren();
    panel.hidden = items.length === 0;
    items.forEach(function (entry) {
      const li = document.createElement("li");
      const open = document.createElement("button");
      open.type = "button";
      open.className = "recent-go";
      open.textContent = shortText(entry.goal, 36);
      open.addEventListener("click", function () { openStored(entry); });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "recent-x";
      remove.setAttribute("aria-label", "从近期移除");
      remove.textContent = "×";
      remove.addEventListener("click", function () {
        saveJson(RECENT_KEY, loadRecent().filter(function (item) { return item.id !== entry.id; }));
        renderRecent();
      });
      li.append(open, remove);
      list.appendChild(li);
    });
  }

  function fillRitual(plan) {
    $("ritual-phrase").textContent = plan.focus || plan.goal;
    $("ritual-sub").textContent = plan.essence;
    const assumptions = $("ritual-assumptions");
    assumptions.replaceChildren();
    plan.assumptions.slice(0, 3).forEach(function (text) {
      const li = document.createElement("li");
      li.textContent = text;
      assumptions.appendChild(li);
    });
    const bloom = $("bloom");
    bloom.replaceChildren();
    plan.atoms.forEach(function (atom) {
      const li = document.createElement("li");
      const dot = document.createElement("i");
      dot.className = "stone-dot";
      const span = document.createElement("span");
      span.textContent = KIND[atom.kind] || atom.label;
      li.append(dot, span);
      bloom.appendChild(li);
    });
  }

  function playRitual(plan, short) {
    if (typeof ritualCancel === "function") ritualCancel();
    return new Promise(function (resolve) {
      if (!motionOK()) {
        ritualCancel = null;
        resolve();
        return;
      }
      setMode("ritual");
      fillRitual(plan);
      const steps = short
        ? [["essence", "澄清本质", 0], ["atoms", "找到原子", 520]]
        : [
            ["essence", "澄清本质", 0],
            ["strip", "剥去假设", 720],
            ["atoms", "找到原子", 1500],
            ["split", "分出大局与攻杀", 2300],
            ["daily", "排入每日", 3100],
          ];
      const doneAt = short ? 1100 : 3900;
      const timers = [];
      let settled = false;
      const finish = function () {
        if (settled) return;
        settled = true;
        timers.forEach(function (timer) { window.clearTimeout(timer); });
        $("skip").removeEventListener("click", finish);
        if (ritualCancel === finish) ritualCancel = null;
        resolve();
      };
      ritualCancel = finish;
      $("skip").addEventListener("click", finish);
      $("ritual").dataset.stage = "essence";
      $("ritual-stage").textContent = "澄清本质";
      steps.forEach(function (step) {
        timers.push(window.setTimeout(function () {
          $("ritual").dataset.stage = step[0];
          $("ritual-stage").textContent = step[1];
        }, step[2]));
      });
      timers.push(window.setTimeout(finish, doneAt));
      $("skip").focus();
    });
  }

  function goHome() {
    state.seq += 1;
    if (state.ctl) state.ctl.abort();
    if (typeof ritualCancel === "function") ritualCancel();
    setMode("home");
    renderRecent();
  }

  function present(goal) {
    const seq = ++state.seq;
    if (state.ctl) state.ctl.abort();
    const ctl = new AbortController();
    state.ctl = ctl;
    const local = engine.decompose(goal);
    if (!local) return;
    let remoteResult = null;
    let remoteFailed = false;
    const started = performance.now();
    const remotePromise = hasLlm()
      ? remotePlan(goal, ctl.signal).then(function (plan) {
          remoteResult = plan;
        }).catch(function (err) {
          if (err && err.name === "AbortError") return;
          remoteFailed = true;
        })
      : null;

    playRitual(local, false).then(function () {
      if (seq !== state.seq) return;
      if (remoteResult) {
        showPlan(remoteResult, "", true);
        return;
      }
      const waiting = Boolean(remotePromise) && !remoteFailed;
      showPlan(local, remoteFailed ? "接口未通，已改用本机原点" : (waiting ? "本机先落子，云端仍在推演" : ""), true);
      if (!waiting) return;
      const remain = Math.max(1200, 14000 - (performance.now() - started));
      withTimeout(remotePromise, remain).then(function () {
        if (seq !== state.seq) return;
        if (remoteResult) showPlan(remoteResult, "", false);
        else $("status").textContent = "接口未通，已改用本机原点 · " + local.domainLabel;
      }).catch(function () {
        ctl.abort();
        if (seq !== state.seq) return;
        $("status").textContent = "接口未通，已改用本机原点 · " + local.domainLabel;
      });
    });
  }

  function openStored(entry) {
    const plan = entry.plan && entry.plan.v === 1 ? entry.plan : engine.decompose(entry.goal);
    const seq = ++state.seq;
    if (state.ctl) state.ctl.abort();
    playRitual(plan, true).then(function () {
      if (seq !== state.seq) return;
      showPlan(plan, "", true);
    });
  }

function showPlan(plan, notice, moveFocus) {
  plan.notice = notice || "";
  remember(plan);
  state.plan = plan;
  state.open = new Set(["root"]);
  state.selected = "root";
state.framed = false;
    state.userMoved = false;
    state.zoom = 1;
  renderBoard(plan);
  setMode("board");
  document.title = "原点 · " + shortText(plan.goal, 18);
  if (moveFocus) $("board-label").focus();
}

  function renderMilestones(list, items) {
    list.replaceChildren();
    items.forEach(function (item) {
      const li = document.createElement("li");
      const horizon = document.createElement("p");
      horizon.className = "horizon";
      horizon.textContent = item.horizon;
      const title = document.createElement("h3");
      title.textContent = item.title;
      const why = document.createElement("p");
      why.textContent = item.why;
      const moves = document.createElement("ul");
      moves.className = "moves";
      (item.moves || []).forEach(function (move) {
        const line = document.createElement("li");
        line.textContent = move;
        moves.appendChild(line);
      });
      li.append(horizon, title, why, moves);
      list.appendChild(li);
    });
  }

  function updateCount(plan) {
    const total = plan.daily.length;
    const done = plan.daily.filter(function (item) { return state.done[item.id]; }).length;
    $("daily-count").textContent = done + " / " + total;
    $("daily-msg").textContent = done === total && total
      ? "今日的手已落完。"
      : "每手 15–90 分钟。勾选只留在这台浏览器。";
  }

  function renderDaily(plan) {
    state.done = readDone(plan.id, plan.signature);
    const list = $("daily-list");
    list.replaceChildren();
    plan.daily.forEach(function (item) {
      const li = document.createElement("li");
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(state.done[item.id]);
      if (input.checked) li.classList.add("is-done");
      input.addEventListener("change", function () {
        if (input.checked) state.done[item.id] = true;
        else delete state.done[item.id];
        li.classList.toggle("is-done", input.checked);
        writeDone(plan.id, plan.signature, state.done);
        updateCount(plan);
      });
      const text = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = item.title;
      const em = document.createElement("em");
      em.textContent = item.minutes + " 分钟 · " + item.detail;
      text.append(strong, em);
      label.append(input, text);
      li.appendChild(label);
      list.appendChild(li);
    });
    updateCount(plan);
  }

  function renderAssumptions(items) {
    const list = $("assumptions");
    list.replaceChildren();
    items.forEach(function (text) {
      const li = document.createElement("li");
      li.textContent = text;
      list.appendChild(li);
    });
  }

  function measure(node) {
    if (!state.open.has(node.id) || !node.children || !node.children.length) {
      node.units = 1;
      return 1;
    }
    let sum = 0;
    node.children.forEach(function (child) { sum += measure(child); });
    node.units = Math.max(sum, 1);
    return node.units;
  }

  function place(node, depth, top) {
    const height = node.units * ROW;
    node.x = PAD + depth * COL;
    node.y = top + height / 2;
    node.depth = depth + 1;
    if (state.open.has(node.id) && node.children && node.children.length) {
      let y = top;
      node.children.forEach(function (child) {
        place(child, depth + 1, y);
        y += child.units * ROW;
      });
    }
  }

  function flatten(node, nodes, edges) {
    nodes.push(node);
    if (!state.open.has(node.id) || !node.children) return;
    node.children.forEach(function (child) {
      edges.push([node, child]);
      flatten(child, nodes, edges);
    });
  }

  function showNote(node) {
    const box = $("map-note");
    box.replaceChildren();
    if (!node) return;
    const title = document.createElement("strong");
    title.textContent = node.title || node.label;
    const body = document.createElement("span");
    body.textContent = node.note || "";
    box.append(title, body);
  }

  function applyTransform() {
    if (!world) return;
    world.style.transform = "translate(" + state.panX + "px," + state.panY + "px) scale(" + state.zoom + ")";
  }

function frameRoot() {
  const viewport = $("map-viewport");
  const rect = viewport.getBoundingClientRect();
  const tree = state.plan && state.plan.tree;
  if (!tree || rect.width < 40 || rect.height < 40) return;
  const nodes = [];
  flatten(tree, nodes, []);
  let minX = Infinity;
  let maxX = 0;
  let minY = Infinity;
  let maxY = 0;
  nodes.forEach(function (node) {
    const chars = Array.from(node.label || "").length;
    const labelW = Math.min(210, chars * 16 + 46);
    minX = Math.min(minX, node.x - 8);
    maxX = Math.max(maxX, node.x + labelW);
    minY = Math.min(minY, node.y - 28);
    maxY = Math.max(maxY, node.y + 28);
  });
  const contentW = Math.max(80, maxX - minX);
  const contentH = Math.max(80, maxY - minY);
  const availW = Math.max(80, rect.width - 36);
  const availH = Math.max(80, rect.height - 120);
  const zoom = Math.min(1, Math.max(0.78, Math.min(availW / contentW, availH / contentH)));
  state.zoom = zoom;
  state.panX = (rect.width - contentW * zoom) / 2 - minX * zoom;
  state.panY = (rect.height - 72 - contentH * zoom) / 2 - minY * zoom;
  state.framed = true;
  state.rootY = tree.y;
  applyTransform();
}

  function zoomAt(clientX, clientY, factor) {
    const rect = $("map-viewport").getBoundingClientRect();
    const next = Math.min(1.7, Math.max(0.62, state.zoom * factor));
    const k = next / state.zoom;
    const ox = clientX - rect.left;
    const oy = clientY - rect.top;
    state.panX = ox - (ox - state.panX) * k;
    state.panY = oy - (oy - state.panY) * k;
    state.zoom = next;
    applyTransform();
  }

  function renderMap() {
    const plan = state.plan;
    if (!plan) return;
    const tree = plan.tree;
    const prevY = state.rootY;
    measure(tree);
    place(tree, 0, PAD);
    if (state.framed && prevY) state.panY -= (tree.y - prevY) * state.zoom;
    state.rootY = tree.y;

    const nodes = [];
    const edges = [];
    flatten(tree, nodes, edges);
    let maxX = 0;
    let maxY = 0;
    nodes.forEach(function (node) {
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    });
    const width = maxX + 280;
    const height = maxY + PAD + 20;

    const restore = document.activeElement && document.activeElement.classList.contains("node");
    const viewport = $("map-viewport");
    world = document.createElement("div");
    world.className = "map-world";
    world.setAttribute("role", "tree");
    world.style.width = width + "px";
    world.style.height = height + "px";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "links");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    edges.forEach(function (pair) {
      const parent = pair[0];
      const child = pair[1];
      const x1 = parent.x + 11;
      const y1 = parent.y;
      const x2 = child.x + 8;
      const y2 = child.y;
      const mid = (x1 + x2) / 2;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M " + x1 + " " + y1 + " C " + mid + " " + y1 + ", " + mid + " " + y2 + ", " + x2 + " " + y2);
      svg.appendChild(path);
    });
    world.appendChild(svg);

    let selectedNode = tree;
    nodes.forEach(function (node) {
      if (node.id === state.selected) selectedNode = node;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "node" + (node.id === state.selected ? " is-on" : "");
      btn.dataset.tone = node.tone || "atom";
      btn.dataset.id = node.id;
      btn.style.left = node.x + "px";
      btn.style.top = node.y + "px";
      btn.setAttribute("role", "treeitem");
      btn.setAttribute("aria-level", String(node.depth || 1));
      if (node.children && node.children.length) {
        btn.setAttribute("aria-expanded", state.open.has(node.id) ? "true" : "false");
      }
      const dot = document.createElement("i");
      dot.className = "stone-dot";
      dot.setAttribute("aria-hidden", "true");
      const label = document.createElement("span");
      label.className = "node-label";
      label.textContent = node.label;
      btn.append(dot, label);
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        state.selected = node.id;
        if (node.children && node.children.length && node.id !== "root") {
          if (state.open.has(node.id)) state.open.delete(node.id);
          else state.open.add(node.id);
        }
        renderMap();
      });
      world.appendChild(btn);
    });

    viewport.replaceChildren(world);
    applyTransform();
    if (!state.userMoved) frameRoot();
    showNote(selectedNode);
    if (restore) {
      const next = world.querySelector('[data-id="' + state.selected + '"]');
      if (next) next.focus();
    }
  }

  function renderBoard(plan) {
    $("edit-goal").value = plan.goal;
    $("essence").textContent = plan.essence;
    $("status").textContent = statusText(plan);
    $("board-note").textContent = plan.boardNote || "";
    $("attack-note").textContent = plan.attackNote || "";
    renderAssumptions(plan.assumptions || []);
    renderMilestones($("long-list"), plan.longTerm || []);
    renderMilestones($("short-list"), plan.shortTerm || []);
    renderDaily(plan);
    renderMap();
  }

  function openDrawer(id, opener) {
    closeDrawers(true);
    state.drawerReturn = opener || null;
    const drawer = $(id);
    drawer.hidden = false;
    document.body.classList.add("drawer-open");
    const focusable = drawer.querySelector("[data-close]") || drawer.querySelector("input, button");
    if (focusable) focusable.focus();
  }

  function closeDrawers(silent) {
    document.querySelectorAll(".drawer").forEach(function (drawer) { drawer.hidden = true; });
    document.body.classList.remove("drawer-open");
    if (!silent && state.drawerReturn) state.drawerReturn.focus();
    if (!silent) state.drawerReturn = null;
  }

function bindAudio() {
  let audioState = "off";
  $("sound").addEventListener("click", function () {
    const btn = $("sound");
    if (audioState === "starting") return;
    if (audioState === "on") {
      audioState = "off";
      if (pad) pad.stop();
      pad = null;
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "打开环境声");
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioState = "starting";
    const ctx = new Ctx();
    ctx.resume().then(function () {
      if (audioState !== "starting") {
        ctx.close();
        return;
      }
      pad = createPad(ctx);
      audioState = "on";
      btn.setAttribute("aria-pressed", "true");
      btn.setAttribute("aria-label", "关闭环境声");
    }).catch(function () {
      audioState = "off";
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", "打开环境声");
    });
  });
}

  function createPad(ctx) {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 1.6);
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(460, ctx.currentTime);
    filter.Q.value = 0.45;
    filter.connect(master);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 64;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const drones = [98, 146.83].map(function (freq, index) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = index === 0 ? 0.42 : 0.2;
      osc.connect(gain);
      gain.connect(filter);
      osc.start();
      return osc;
    });

    let timer = 0;
    let stopped = false;
    const notes = [196, 220, 261.63, 329.63];
    function bell() {
      if (stopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = notes[Math.floor(Math.random() * notes.length)];
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.04, t + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 4.6);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(t);
      osc.stop(t + 4.8);
      timer = window.setTimeout(bell, 5400 + Math.random() * 3600);
    }
    timer = window.setTimeout(bell, 1800);

    return {
      stop: function () {
        stopped = true;
        window.clearTimeout(timer);
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        const current = Math.max(master.gain.value || 0.0001, 0.0001);
        master.gain.setValueAtTime(current, t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
        window.setTimeout(function () {
          drones.forEach(function (osc) { try { osc.stop(); } catch (err) { /* ended */ } });
          try { lfo.stop(); } catch (err) { /* ended */ }
          ctx.close();
        }, 480);
      },
    };
  }

  function bind() {
    const goal = $("goal");
    const composer = $("composer");
    goal.addEventListener("input", function () {
      autosize(goal);
      if (goal.value.trim()) {
        goal.removeAttribute("aria-invalid");
        $("form-error").textContent = "";
      }
    });
    goal.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submitForm(composer);
      }
    });
    composer.addEventListener("submit", function (event) {
      event.preventDefault();
      const value = goal.value.trim();
      if (!value) {
        goal.setAttribute("aria-invalid", "true");
        $("form-error").textContent = "先写下一件要抵达的事。";
        goal.focus();
        return;
      }
      $("form-error").textContent = "";
      present(value);
    });
    $("sample").addEventListener("click", function () {
      goal.value = SAMPLE;
      autosize(goal);
      submitForm(composer);
    });
    $("brand").addEventListener("click", function (event) {
      event.preventDefault();
      goHome();
    });
    $("edit-form").addEventListener("submit", function (event) {
      event.preventDefault();
      const value = $("edit-goal").value.trim();
      if (!value) {
        $("edit-goal").focus();
        return;
      }
      present(value);
    });
    $("clear-checks").addEventListener("click", function () {
      if (!state.plan) return;
      state.done = {};
      writeDone(state.plan.id, state.plan.signature, {});
      renderDaily(state.plan);
    });
    $("about-open").addEventListener("click", function (event) { openDrawer("about-drawer", event.currentTarget); });
    $("settings-open").addEventListener("click", function (event) {
      const cfg = loadLlm();
      $("llm-base").value = cfg.base;
      $("llm-key").value = cfg.key;
      $("llm-model").value = cfg.model;
      $("settings-msg").textContent = "";
      openDrawer("settings-drawer", event.currentTarget);
    });
    document.querySelectorAll("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", function () { closeDrawers(false); });
    });
    document.querySelectorAll(".drawer").forEach(function (drawer) {
      drawer.addEventListener("click", function (event) {
        if (event.target === drawer) closeDrawers(false);
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && document.querySelector(".drawer:not([hidden])")) {
        event.preventDefault();
        closeDrawers(false);
      }
    });
    $("settings-save").addEventListener("click", function () {
      const base = $("llm-base").value.trim();
      const key = $("llm-key").value;
      const model = $("llm-model").value.trim();
      const msg = $("settings-msg");
      if ((key.trim() || base) && base && !isHttp(base)) {
        msg.textContent = "地址需要以 http:// 或 https:// 开头。";
        return;
      }
      if (key.trim() && !base) {
        msg.textContent = "填写密钥时，需要一个 http 或 https 地址。";
        return;
      }
      saveJson(LLM_KEY, { base: base, key: key, model: model });
      msg.textContent = key.trim() ? "已留在这台浏览器。下次拆开时会先试云端。" : "已保存。未填密钥时使用本机引擎。";
    });
    $("settings-clear").addEventListener("click", function () {
      localStorage.removeItem(LLM_KEY);
      $("llm-base").value = "";
      $("llm-key").value = "";
      $("llm-model").value = "";
      $("settings-msg").textContent = "已清除。之后只使用本机引擎。";
    });

    const viewport = $("map-viewport");
    let drag = null;
    viewport.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) return;
      if (event.target.closest(".node, .map-note")) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, px: state.panX, py: state.panY, moved: false };
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointermove", function (event) {
      if (!drag || drag.id !== event.pointerId) return;
      if (Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) > 4) drag.moved = true;
      state.panX = drag.px + (event.clientX - drag.x);
      state.panY = drag.py + (event.clientY - drag.y);
      if (drag.moved) state.userMoved = true;
      applyTransform();
    });
    function endDrag(event) {
      if (drag && drag.id === event.pointerId) drag = null;
    }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("wheel", function (event) {
      if (document.body.dataset.mode !== "board") return;
      event.preventDefault();
      state.userMoved = true;
      zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.07 : 0.93);
    }, { passive: false });
    viewport.addEventListener("keydown", function (event) {
      if (event.target.closest(".node")) return;
      const step = event.shiftKey ? 80 : 36;
      const rect = viewport.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (event.key === "ArrowLeft") state.panX += step;
      else if (event.key === "ArrowRight") state.panX -= step;
      else if (event.key === "ArrowUp") state.panY += step;
      else if (event.key === "ArrowDown") state.panY -= step;
      else if (event.key === "+" || event.key === "=") zoomAt(cx, cy, 1.08);
      else if (event.key === "-" || event.key === "_") zoomAt(cx, cy, 0.92);
      else return;
      event.preventDefault();
      applyTransform();
    });
    $("zoom-in").addEventListener("click", function () {
      const rect = viewport.getBoundingClientRect();
      state.userMoved = true;
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.12);
    });
    $("zoom-out").addEventListener("click", function () {
      const rect = viewport.getBoundingClientRect();
      state.userMoved = true;
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.88);
    });
    $("zoom-reset").addEventListener("click", function () {
      state.userMoved = false;
      frameRoot();
    });
    window.addEventListener("resize", function () {
      if (document.body.dataset.mode === "board" && !state.framed) frameRoot();
    });
    bindAudio();
  }

  if (!engine) return;
  bind();
  renderRecent();
  setMode("home");
  autosize($("goal"));
})();
