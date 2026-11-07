const test = require("node:test");
const assert = require("node:assert/strict");
const { decompose } = require("../engine.js");

const CASES = [
  ["一年内成为能独立交付的产品设计师，并获得一份匹配的全职工作", "六个月", "career", "产品设计师"],
  ["三个月减脂并每周力量训练三次", "每周三次", "fitness", "减脂"],
  ["六个月学会用英语做工作演示", "六个月", "learning", "英语"],
  ["做出一个有十个付费用户的小工具", "九十天", "startup", "付费用户"],
  ["写完一本短篇小说并发表", "今年冬天前", "creative", "短篇小说"],
  ["一年内存下六个月生活费", "一年", "finance", "生活费"],
  ["把家里的阳台变成一个可以发呆的地方", "这个夏天", "general", "阳台"],
];

test("needs both goal and time", function () {
  assert.equal(decompose("学会烘焙", ""), null);
  assert.equal(decompose("", "一年"), null);
});

test("model json keeps the user's time and drops invented dates", function () {
  const { hydrate, completionsUrl } = require("../engine.js");
  const plan = hydrate({
    essence: "模型给出的本质：没有提示也能讲完一次工作演示。",
    longTerm: [
      { horizon: "7天", title: "模型标准", why: "能独立讲完。", moves: ["写提纲"] },
      { horizon: "材料", title: "一套讲稿", why: "反复用同一份。", moves: ["定稿"] },
      { title: "真实场合", why: "讲给一个人听。", moves: ["约一次"] },
    ],
    shortTerm: [
      { horizon: "开口", title: "先讲一分钟", why: "不求完整。", moves: ["录音"] },
      { horizon: "修改", title: "只改卡壳的一句", why: "听自己的录音。", moves: ["标出"] },
      { horizon: "交出", title: "给一个人听", why: "记下原话。", moves: ["约人"] },
    ],
    daily: [
      { title: "模型：合上稿讲一次", minutes: 200, detail: "不看稿。" },
      { title: "模型：记下卡壳", minutes: 5, detail: "只记一处。" },
      { title: "模型：再讲一遍", detail: "用改过的句子。" },
    ],
  }, "学会用英语做一次工作演示", "每周两个晚上，持续三个月");
  assert.equal(plan.time, "每周两个晚上，持续三个月");
  assert.equal(plan.boardNote, "你的时间：每周两个晚上，持续三个月");
  assert.equal(plan.longTerm[0].horizon, "标准");
  assert.equal(plan.longTerm[1].horizon, "材料");
  assert.equal(plan.daily[0].minutes, 90);
  assert.equal(plan.daily[1].minutes, 15);
  assert.equal(plan.daily.length, 5);
  assert.equal(plan.source, "model");
  assert.equal(/7 天|7天|30 天|90 天|3–6 月/.test(JSON.stringify(plan)), false);
  assert.equal(completionsUrl("https://api.x.ai/v1"), "https://api.x.ai/v1/chat/completions");
  assert.equal(completionsUrl("https://api.openai.com/v1/"), "https://api.openai.com/v1/chat/completions");
  assert.equal(completionsUrl("https://api.openai.com/v1/chat/completions").includes("?"), false);
  assert.throws(function () { completionsUrl("https://api.openai.com/v1?key=secret"); });
});

test("uses the user's time and builds a board", function () {
  const first = new Map();
  CASES.forEach(function (row) {
    const plan = decompose(row[0], row[1]);
    assert.equal(plan.v, 3);
    assert.equal(plan.time, row[1]);
    assert.equal(plan.domain, row[2]);
    assert.ok(plan.focus.includes(row[3]), plan.focus);
    assert.ok(plan.boardNote.includes(row[1]));
    assert.equal(plan.longTerm.length, 3);
    assert.equal(plan.shortTerm.length, 3);
    assert.equal(plan.daily.length, 5);
    plan.daily.forEach(function (item) {
      assert.ok(item.minutes >= 15 && item.minutes <= 90);
    });
    assert.deepEqual(plan.tree.children.map(function (node) { return node.id; }), ["essence", "long", "short", "daily"]);
    const blob = JSON.stringify(plan);
    assert.equal(/3–6 月|18–36 月|7 天|30 天|90 天/.test(blob), false);
    first.set(plan.domain, plan.longTerm[0].title);
  });
  assert.equal(new Set(first.values()).size, first.size);
});
