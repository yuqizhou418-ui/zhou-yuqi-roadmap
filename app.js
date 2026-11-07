/* 原点 · 目标、时间、清单。接口只保存，不发请求。 */
(function () {
  "use strict";

  const engine = window.YuanDian;
  const PLAN_KEY = "yuandian-plans-v2";
  const CHECK_KEY = "yuandian-checks-v2";
  const LLM_KEY = "yuandian-llm-v1";

  const $ = function (id) { return document.getElementById(id); };
  let current = null;
  let done = {};
  let returnFocus = null;

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
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { /* 配额或隐私模式 */ }
  }

  function loadPlans() {
    const data = loadJson(PLAN_KEY, []);
    return Array.isArray(data) ? data.filter(function (item) {
      return item && item.plan && item.plan.v === 2 && item.plan.items;
    }) : [];
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

  function writeDone(plan) {
    const all = loadJson(CHECK_KEY, {});
    all[plan.id] = { sig: plan.signature, done: done };
    saveJson(CHECK_KEY, all);
  }

  function isHttp(value) {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (err) {
      return false;
    }
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
      const goal = document.createElement("strong");
      goal.textContent = entry.goal;
      const time = document.createElement("span");
      time.textContent = entry.time;
      open.append(goal, time);
      open.addEventListener("click", function () { show(entry.plan, false); });
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

  function updateProgress(plan) {
    const total = plan.items.length;
    const count = plan.items.filter(function (item) { return done[item.id]; }).length;
    $("progress").textContent = "已完成 " + count + " / " + total;
  }

  function renderList(plan) {
    const list = $("list");
    list.replaceChildren();
    plan.items.forEach(function (item) {
      const li = document.createElement("li");
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(done[item.id]);
      if (input.checked) li.classList.add("is-done");
      input.addEventListener("change", function () {
        if (input.checked) done[item.id] = true;
        else delete done[item.id];
        li.classList.toggle("is-done", input.checked);
        writeDone(plan);
        updateProgress(plan);
      });
      const text = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = item.title;
      const detail = document.createElement("em");
      detail.textContent = item.detail;
      text.append(title, detail);
      label.append(input, text);
      li.appendChild(label);
      list.appendChild(li);
    });
    updateProgress(plan);
  }

  function show(plan, scroll) {
    current = plan;
    done = readDone(plan);
    $("goal").value = plan.goal;
    $("time").value = plan.time;
    $("time-line").textContent = "时间：" + plan.time;
    $("note").textContent = plan.note;
    renderList(plan);
    $("result").hidden = false;
    remember(plan);
    $("submit").textContent = "更新清单";
    document.title = "原点 · " + plan.goal.slice(0, 18);
    if (scroll) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      $("result").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  function submit(event) {
    event.preventDefault();
    const goal = $("goal").value.trim();
    const time = $("time").value.trim();
    const error = $("form-error");
    if (!goal) {
      error.textContent = "请写下想达成的目标。";
      $("goal").focus();
      return;
    }
    if (!time) {
      error.textContent = "请写下你给这件事的时间。";
      $("time").focus();
      return;
    }
    error.textContent = "";
    const plan = engine.decompose(goal, time);
    if (!plan) return;
    show(plan, true);
  }

  function openDrawer(opener) {
    returnFocus = opener || null;
    $("settings-drawer").hidden = false;
    const cfg = loadJson(LLM_KEY, {});
    $("llm-base").value = cfg.base || "";
    $("llm-key").value = cfg.key || "";
    $("llm-model").value = cfg.model || "";
    $("settings-msg").textContent = "";
    $("settings-drawer").querySelector("[data-close]").focus();
  }

  function closeDrawer() {
    $("settings-drawer").hidden = true;
    if (returnFocus) returnFocus.focus();
    returnFocus = null;
  }

  function bind() {
    $("composer").addEventListener("submit", submit);
    $("brand").addEventListener("click", function (event) {
      event.preventDefault();
      $("goal").value = "";
      $("time").value = "";
      $("form-error").textContent = "";
      $("result").hidden = true;
      $("submit").textContent = "列出要做的事";
      document.title = "原点";
      current = null;
      $("goal").focus();
    });
    $("clear-checks").addEventListener("click", function () {
      if (!current) return;
      done = {};
      writeDone(current);
      renderList(current);
    });
    $("settings-open").addEventListener("click", function (event) { openDrawer(event.currentTarget); });
    document.querySelectorAll("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", closeDrawer);
    });
    $("settings-drawer").addEventListener("click", function (event) {
      if (event.target === $("settings-drawer")) closeDrawer();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !$("settings-drawer").hidden) closeDrawer();
    });
    $("settings-save").addEventListener("click", function () {
      const base = $("llm-base").value.trim();
      const key = $("llm-key").value;
      const model = $("llm-model").value.trim();
      if (base && !isHttp(base)) {
        $("settings-msg").textContent = "地址需要以 http:// 或 https:// 开头。";
        return;
      }
      saveJson(LLM_KEY, { base: base, key: key, model: model });
      $("settings-msg").textContent = "已留在这台浏览器。这一版不会用它发请求。";
    });
    $("settings-clear").addEventListener("click", function () {
      localStorage.removeItem(LLM_KEY);
      $("llm-base").value = "";
      $("llm-key").value = "";
      $("llm-model").value = "";
      $("settings-msg").textContent = "已清除。";
    });
  }

  if (!engine) return;
  bind();
  renderRecent();
})();
