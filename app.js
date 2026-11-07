/* 入口只收目标与时间。进入后是导图和大局。接口只保存。声默认关。 */
(function () {
  "use strict";

  const engine = window.YuanDian;
  const PLAN_KEY = "yuandian-plans-v3";
  const CHECK_KEY = "yuandian-checks-v3";
  const LLM_KEY = "yuandian-llm-v1";
  const ROW = 64;
  const COL = 210;
  const PAD = 36;

  const $ = function (id) { return document.getElementById(id); };
  const state = {
    plan: null,
    done: {},
    open: new Set(["root"]),
    selected: "root",
    panX: 24,
    panY: 24,
    zoom: 1,
    framed: false,
    userMoved: false,
    rootY: 0,
    col: COL,
    drawerReturn: null,
  };
  let world = null;
  let pad = null;

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
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* 本机无法写入 */ }
  }
  function isHttp(value) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (err) {
      return false;
    }
  }

  function loadPlans() {
    const data = loadJson(PLAN_KEY, []);
    return Array.isArray(data) ? data.filter(function (item) { return item && item.plan && item.plan.v === 3 && item.plan.tree; }) : [];
  }
  function remember(plan) {
    const next = loadPlans().filter(function (item) { return item.id !== plan.id; });
    next.unshift({ id: plan.id, goal: plan.goal, time: plan.time, plan: plan });
    saveJson(PLAN_KEY, next.slice(0, 8));
    renderRecent();
  }
  function readDone(plan) {
    const all = loadJson(CHECK_KEY, {});
    const row = all[plan.id];
    if (!row || row.sig !== plan.signature) return {};
    return row.done || {};
  }
  function writeDone() {
    const all = loadJson(CHECK_KEY, {});
    all[state.plan.id] = { sig: state.plan.signature, done: state.done };
    saveJson(CHECK_KEY, all);
  }

  function renderRecent() {
    const panel = $("recent-panel");
    const list = $("recent-list");
    const items = loadPlans();
    list.replaceChildren();
    panel.hidden = items.length === 0;
    items.forEach(function (entry) {
      const li = document.createElement("li");
      const open = document.createElement("button");
      open.type = "button";
      open.className = "open";
      const strong = document.createElement("strong");
      strong.textContent = entry.goal;
      const span = document.createElement("span");
      span.textContent = entry.time;
      open.append(strong, span);
      open.addEventListener("click", function () { openBoard(entry.goal, entry.time); });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.textContent = "移除";
      remove.addEventListener("click", function () {
        saveJson(PLAN_KEY, loadPlans().filter(function (item) { return item.id !== entry.id; }));
        renderRecent();
      });
      li.append(open, remove);
      list.appendChild(li);
    });
  }

  function autosize(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  function setMode(mode) {
    document.body.dataset.mode = mode;
    document.querySelector('meta[name="theme-color"]').setAttribute("content", mode === "board" ? "#12110e" : "#f6f4f1");
    if (mode === "entry") document.title = "原点";
  }

  function enter(plan) {
    state.plan = plan;
    state.done = readDone(plan);
    state.open = new Set(["root"]);
    state.selected = "root";
    state.framed = false;
    state.userMoved = false;
    state.zoom = 1;
    $("edit-goal").value = plan.goal;
    $("edit-time").value = plan.time;
    $("essence").textContent = plan.essence;
    if (plan.sourceNote) $("source").textContent = plan.sourceNote;
    $("board-note").textContent = plan.boardNote;
    $("attack-note").textContent = plan.attackNote;
    renderMilestones($("long-list"), plan.longTerm);
    renderMilestones($("short-list"), plan.shortTerm);
    renderDaily();
    setMode("board");
    document.title = "原点 · " + plan.goal.slice(0, 18);
    remember(plan);
    window.requestAnimationFrame(function () {
      autosize($("edit-goal"));
      renderMap();
      $("board-label").focus();
    });
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

  function renderDaily() {
    const plan = state.plan;
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
        writeDone();
        updateCount();
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
    updateCount();
  }
  function updateCount() {
    const plan = state.plan;
    const n = plan.daily.filter(function (item) { return state.done[item.id]; }).length;
    $("daily-count").textContent = n + " / " + plan.daily.length;
    $("daily-msg").textContent = n === plan.daily.length ? "今日的手已落完。" : "勾选只留在这台浏览器。";
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
    node.x = PAD + depth * state.col;
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
    let minX = Infinity, maxX = 0, minY = Infinity, maxY = 0;
    nodes.forEach(function (node) {
      const labelW = Math.min(210, Array.from(node.label || "").length * 16 + 56);
      minX = Math.min(minX, node.x - 8);
      maxX = Math.max(maxX, node.x + labelW);
      minY = Math.min(minY, node.y - 24);
      maxY = Math.max(maxY, node.y + 24);
    });
    const contentW = Math.max(80, maxX - minX);
    const contentH = Math.max(80, maxY - minY);
    const availW = Math.max(80, rect.width - 40);
    const availH = Math.max(80, rect.height - 120);
    const minZoom = rect.width < 720 ? 0.58 : 0.8;
    state.zoom = Math.min(1, Math.max(minZoom, Math.min(availW / contentW, availH / contentH)));
    state.panX = (rect.width - contentW * state.zoom) / 2 - minX * state.zoom;
    state.panY = 72 + (availH - contentH * state.zoom) / 2 - minY * state.zoom;
    state.framed = true;
    state.rootY = tree.y;
    applyTransform();
  }
  function zoomAt(clientX, clientY, factor) {
    const rect = $("map-viewport").getBoundingClientRect();
    const next = Math.min(1.7, Math.max(0.6, state.zoom * factor));
    const k = next / state.zoom;
    const ox = clientX - rect.left;
    const oy = clientY - rect.top;
    state.panX = ox - (ox - state.panX) * k;
    state.panY = oy - (oy - state.panY) * k;
    state.zoom = next;
    applyTransform();
  }
  function showNote(node) {
    const box = $("map-note");
    box.replaceChildren();
    const title = document.createElement("strong");
    const body = document.createElement("span");
    if (!node || node.id === "root") {
      title.textContent = "点开一枚";
      body.textContent = "本质、大局、攻杀、每日。";
    } else {
      title.textContent = node.title || node.label;
      body.textContent = node.note || "";
    }
    box.append(title, body);
  }
  function renderMap() {
    const tree = state.plan.tree;
    const prevY = state.rootY;
    const widthNow = $("map-viewport").getBoundingClientRect().width;
    state.col = widthNow && widthNow < 720 ? 150 : COL;
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
    const restore = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("node");
    world = document.createElement("div");
    world.className = "map-world";
    world.setAttribute("role", "tree");
    world.style.width = (maxX + 260) + "px";
    world.style.height = (maxY + 48) + "px";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "links");
    svg.setAttribute("width", world.style.width);
    svg.setAttribute("height", world.style.height);
    edges.forEach(function (pair) {
      const x1 = pair[0].x + 10;
      const y1 = pair[0].y;
      const x2 = pair[1].x + 8;
      const y2 = pair[1].y;
      const mid = (x1 + x2) / 2;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M " + x1 + " " + y1 + " C " + mid + " " + y1 + ", " + mid + " " + y2 + ", " + x2 + " " + y2);
      svg.appendChild(path);
    });
    world.appendChild(svg);
    let selected = tree;
    nodes.forEach(function (node) {
      if (node.id === state.selected) selected = node;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "node" + (node.id === state.selected ? " is-on" : "");
      btn.dataset.tone = node.tone || "atom";
      btn.dataset.id = node.id;
      btn.style.left = node.x + "px";
      btn.style.top = node.y + "px";
      btn.setAttribute("role", "treeitem");
      if (node.children && node.children.length) {
        btn.setAttribute("aria-expanded", state.open.has(node.id) ? "true" : "false");
      }
      const dot = document.createElement("i");
      dot.className = "stone-dot";
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
    $("map-viewport").replaceChildren(world);
    applyTransform();
    if (!state.userMoved) frameRoot();
    showNote(selected);
    if (restore) {
      const next = world.querySelector('[data-id="' + state.selected + '"]');
      if (next) next.focus();
    }
  }

  function goEntry() {
    genSeq += 1;
    setMode("entry");
    $("goal").value = "";
    $("time").value = "";
    $("form-error").textContent = "";
    $("goal").focus();
  }

  const PRESETS = {
    openai: { label: "ChatGPT", base: "https://api.openai.com/v1", model: "gpt-4o-mini" },
    xai: { label: "Grok", base: "https://api.x.ai/v1", model: "grok-3" },
    deepseek: { label: "DeepSeek", base: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  };
  let genSeq = 0;

  function keyMark(key) {
    let h = 2166136261;
    for (let i = 0; i < key.length; i += 1) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function readCfg() {
    const data = loadJson(LLM_KEY, {});
    const provider = PRESETS[data.provider] ? data.provider : "openai";
    return {
      provider: provider,
      base: String(data.base || ""),
      key: String(data.key || ""),
      model: String(data.model || ""),
      tested: data.tested && typeof data.tested === "object" ? data.tested : null,
    };
  }

  function formCfg() {
    const provider = PRESETS[$("llm-provider").value] ? $("llm-provider").value : "openai";
    return {
      provider: provider,
      base: $("llm-base").value.trim(),
      key: $("llm-key").value,
      model: $("llm-model").value.trim(),
    };
  }

  function applyPreset(provider) {
    const preset = PRESETS[provider] || PRESETS.openai;
    $("llm-provider").value = PRESETS[provider] ? provider : "openai";
    $("llm-base").value = preset.base;
    $("llm-model").value = preset.model;
  }

  function isTested(cfg) {
    const tested = cfg.tested;
    return Boolean(cfg.key && tested && tested.ok &&
      tested.provider === cfg.provider &&
      tested.base === cfg.base &&
      tested.model === cfg.model &&
      tested.keyMark === keyMark(cfg.key));
  }

  function writeCfg(cfg, tested) {
    const stored = {
      provider: cfg.provider,
      base: cfg.base,
      key: cfg.key,
      model: cfg.model,
    };
    if (tested && tested.ok) stored.tested = tested;
    saveJson(LLM_KEY, stored);
  }

  function explainNet(err) {
    if (err && err.name === "AbortError") return "连接超时。";
    const status = err && err.status;
    if (status === 401 || status === 403) return "密钥未被接受。";
    if (status === 404) return "找不到对话接口。请检查 Base URL。";
    if (status === 429) return "调用次数受限，请稍后再试。";
    if (!status) return "浏览器没有把请求送出去，多半是跨域被拦。请改用允许网页访问的网关，或在浏览器侧放行。密钥只放在请求头里，不会写进网址。";
    return "未连通（HTTP " + status + "）。";
  }

  function chat(cfg, messages, maxTokens, signal) {
    const url = engine.completionsUrl(cfg.base);
    return fetch(url, {
      method: "POST",
      signal: signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + cfg.key,
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0.3,
        max_tokens: maxTokens,
        messages: messages,
      }),
    }).then(function (res) {
      return res.text().then(function (text) {
        if (!res.ok) {
          const error = new Error("http");
          error.status = res.status;
          if (cfg.key && text.indexOf(cfg.key) !== -1) error.detail = "";
          return Promise.reject(error);
        }
        let data;
        try { data = JSON.parse(text); } catch (err) { throw new Error("json"); }
        const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!content) throw new Error("empty");
        return content;
      });
    });
  }

  function withTimeout(work, ms) {
    const ctrl = new AbortController();
    const timer = window.setTimeout(function () { ctrl.abort(); }, ms);
    return work(ctrl.signal).then(function (value) {
      window.clearTimeout(timer);
      return value;
    }, function (err) {
      window.clearTimeout(timer);
      throw err;
    });
  }

  function extractJson(text) {
    const start = String(text).indexOf("{");
    const end = String(text).lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("json");
    return JSON.parse(text.slice(start, end + 1));
  }

  function probe(cfg) {
    return withTimeout(function (signal) {
      return chat(cfg, [{ role: "user", content: "只回复一个字：好" }], 16, signal);
    }, 20000);
  }

  function askPlan(cfg, goal, time) {
    const system = [
      "你是「原点」。用中文把用户的目标拆成思维导图所需的三段：长期大局、短期攻杀、每日行动。",
      "只输出一个 JSON 对象，不要 Markdown。",
      "用户写下的时间是唯一期限，不要改成别的天数或月份。horizon 用两到四字的内容标签，不要写数字。",
      "longTerm 3 条，shortTerm 3 条，daily 5 条。minutes 为 15 到 90 的整数。",
      "形状：{\"essence\":\"一句话\",\"longTerm\":[{\"horizon\":\"标签\",\"title\":\"标题\",\"why\":\"一句\",\"moves\":[\"动作\"]}],\"shortTerm\":[{\"horizon\":\"标签\",\"title\":\"标题\",\"why\":\"一句\",\"moves\":[\"动作\"]}],\"daily\":[{\"title\":\"动作\",\"minutes\":25,\"detail\":\"怎样算做完\"}]}",
    ].join("");
    return withTimeout(function (signal) {
      return chat(cfg, [
        { role: "system", content: system },
        { role: "user", content: "目标：" + goal + "\n时间：" + time },
      ], 1600, signal);
    }, 30000).then(function (content) {
      return engine.hydrate(extractJson(content), goal, time);
    });
  }

  function setSource(text) {
    $("source").textContent = text || "";
  }

  function openBoard(goal, time) {
    const local = engine.decompose(goal, time);
    if (!local) return;
    const seq = ++genSeq;
    const cfg = readCfg();
    local.sourceNote = cfg.key ? "" : "";
    enter(local);
    if (!cfg.key) {
      setSource("");
      return;
    }
    if (!isTested(cfg)) {
      setSource("密钥已保存。点「测试连接」通过后，再进入就会用模型生成。");
      return;
    }
    const name = PRESETS[cfg.provider].label;
    setSource("正在用 " + name + " 生成…");
    askPlan(cfg, goal, time).then(function (plan) {
      if (seq !== genSeq) return;
      plan.sourceNote = "由 " + name + " 生成";
      enter(plan);
      setSource(plan.sourceNote);
    }).catch(function () {
      if (seq !== genSeq) return;
      setSource("模型没有返回可用结果，已改用本机。");
    });
  }

  function submitEntry(event) {
    event.preventDefault();
    const goal = $("goal").value.trim();
    const time = $("time").value.trim();
    if (!goal) { $("form-error").textContent = "请写下想达成的目标。"; $("goal").focus(); return; }
    if (!time) { $("form-error").textContent = "请写下你给这件事的时间。"; $("time").focus(); return; }
    $("form-error").textContent = "";
    openBoard(goal, time);
  }
  function submitEdit(event) {
    event.preventDefault();
    const goal = $("edit-goal").value.trim();
    const time = $("edit-time").value.trim();
    if (!goal || !time) return;
    openBoard(goal, time);
  }

  function openDrawer(opener) {
    state.drawerReturn = opener;
    const cfg = readCfg();
    $("llm-provider").value = cfg.provider;
    if (cfg.base) $("llm-base").value = cfg.base;
    else applyPreset(cfg.provider);
    if (cfg.model) $("llm-model").value = cfg.model;
    $("llm-key").value = cfg.key || "";
    $("settings-msg").textContent = isTested(cfg) ? "上次测试已连通。进入盘面会用 " + PRESETS[cfg.provider].label + "。" : "";
    $("settings-drawer").hidden = false;
    $("settings-drawer").querySelector("[data-close]").focus();
  }
  function closeDrawer() {
    $("settings-drawer").hidden = true;
    if (state.drawerReturn) state.drawerReturn.focus();
    state.drawerReturn = null;
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
        if (audioState !== "starting") { ctx.close(); return; }
        pad = createPad(ctx);
        audioState = "on";
        btn.setAttribute("aria-pressed", "true");
        btn.setAttribute("aria-label", "关闭环境声");
      }).catch(function () {
        audioState = "off";
        btn.setAttribute("aria-pressed", "false");
      });
    });
  }
  function createPad(ctx) {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 1.4);
    master.connect(ctx.destination);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 440;
    filter.connect(master);
    const oscs = [98, 146.83].map(function (freq, index) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = index === 0 ? 0.4 : 0.18;
      osc.connect(gain);
      gain.connect(filter);
      osc.start();
      return osc;
    });
    return {
      stop: function () {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
        master.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        window.setTimeout(function () {
          oscs.forEach(function (osc) { try { osc.stop(); } catch (err) { /* 已停 */ } });
          ctx.close();
        }, 400);
      },
    };
  }

  function bind() {
    $("composer").addEventListener("submit", submitEntry);
    $("edit-form").addEventListener("submit", submitEdit);
    $("brand").addEventListener("click", function (event) { event.preventDefault(); goEntry(); });
    $("clear-checks").addEventListener("click", function () {
      if (!state.plan) return;
      state.done = {};
      writeDone();
      renderDaily();
    });
    $("settings-open").addEventListener("click", function (event) { openDrawer(event.currentTarget); });
    document.querySelectorAll("[data-close]").forEach(function (btn) { btn.addEventListener("click", closeDrawer); });
    $("settings-drawer").addEventListener("click", function (event) { if (event.target === $("settings-drawer")) closeDrawer(); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !$("settings-drawer").hidden) closeDrawer();
    });
    $("llm-provider").addEventListener("change", function () {
      applyPreset($("llm-provider").value);
      $("settings-msg").textContent = "已换到预设地址和模型名，仍可手动修改。换过之后需要重新测试连接。";
    });
    function collectCfg() {
      const cfg = formCfg();
      if (!cfg.base || !isHttp(cfg.base)) {
        $("settings-msg").textContent = "地址需要以 http:// 或 https:// 开头。";
        return null;
      }
      try { engine.completionsUrl(cfg.base); } catch (err) {
        $("settings-msg").textContent = "地址不要带参数。密钥不会写进网址。";
        return null;
      }
      const prev = readCfg();
      const next = Object.assign({}, cfg, { tested: prev.tested });
      writeCfg(next, isTested(next) ? next.tested : null);
      return readCfg();
    }
    $("settings-save").addEventListener("click", function () {
      const cfg = collectCfg();
      if (!cfg) return;
      $("settings-msg").textContent = cfg.key
        ? (isTested(cfg) ? "已保存，并且上次测试仍然有效。" : "已保存在这台浏览器。请再点「测试连接」。")
        : "已保存。未填密钥时，盘面仍只用本机。";
    });
    $("settings-test").addEventListener("click", function () {
      const cfg = collectCfg();
      if (!cfg) return;
      if (!cfg.key.trim()) { $("settings-msg").textContent = "请先填写密钥。"; return; }
      if (!cfg.model) { $("settings-msg").textContent = "请填写模型名。"; return; }
      const btn = $("settings-test");
      btn.disabled = true;
      $("settings-msg").textContent = "正在测试连接…";
      probe(cfg).then(function () {
        const mark = { ok: true, provider: cfg.provider, base: cfg.base, model: cfg.model, keyMark: keyMark(cfg.key) };
        writeCfg(cfg, mark);
        $("settings-msg").textContent = "已连通。之后进入盘面会用 " + PRESETS[cfg.provider].label + " 生成导图。";
      }).catch(function (err) {
        writeCfg(cfg, null);
        $("settings-msg").textContent = "测试失败。" + explainNet(err);
      }).then(function () { btn.disabled = false; });
    });
    $("settings-clear").addEventListener("click", function () {
      localStorage.removeItem(LLM_KEY);
      applyPreset("openai");
      $("llm-key").value = "";
      $("settings-msg").textContent = "已清除。盘面继续只用本机。";
    });
    const viewport = $("map-viewport");
    let drag = null;
    viewport.addEventListener("pointerdown", function (event) {
      if (event.button !== 0 || event.target.closest(".node")) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, px: state.panX, py: state.panY };
      viewport.setPointerCapture(event.pointerId);
    });
    viewport.addEventListener("pointermove", function (event) {
      if (!drag || drag.id !== event.pointerId) return;
      if (Math.abs(event.clientX - drag.x) + Math.abs(event.clientY - drag.y) > 4) state.userMoved = true;
      state.panX = drag.px + (event.clientX - drag.x);
      state.panY = drag.py + (event.clientY - drag.y);
      applyTransform();
    });
    function endDrag(event) { if (drag && drag.id === event.pointerId) drag = null; }
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("wheel", function (event) {
      if (document.body.dataset.mode !== "board") return;
      event.preventDefault();
      state.userMoved = true;
      zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.07 : 0.93);
    }, { passive: false });
    $("zoom-in").addEventListener("click", function () {
      const r = viewport.getBoundingClientRect();
      state.userMoved = true;
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.12);
    });
    $("zoom-out").addEventListener("click", function () {
      const r = viewport.getBoundingClientRect();
      state.userMoved = true;
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, 0.88);
    });
    $("zoom-reset").addEventListener("click", function () { state.userMoved = false; frameRoot(); });
    window.addEventListener("resize", function () {
      if (document.body.dataset.mode === "board" && !state.userMoved) frameRoot();
    });
    bindAudio();
  }

  if (!engine) return;
  bind();
  renderRecent();
})();
