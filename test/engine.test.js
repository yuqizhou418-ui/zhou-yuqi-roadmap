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
  ["我想一年内转行做产品经理", "每周两个晚上", "career", "产品经理"],
  ["learn Spanish in six months", "six months", "learning", "Spanish"],
];

test("needs both goal and time", function () {
  assert.equal(decompose("", "六个月"), null);
  assert.equal(decompose("学会烘焙", "  "), null);
  assert.equal(decompose("  ", "一年"), null);
});

test("keeps the user's time and does not invent a calendar", function () {
  CASES.forEach(function (row) {
    const plan = decompose(row[0], row[1]);
    assert.equal(plan.v, 2);
    assert.equal(plan.time, row[1]);
    assert.equal(plan.domain, row[2]);
    assert.equal(plan.items.length, 5);
    assert.ok(plan.focus.includes(row[3]), plan.focus);
    const blob = JSON.stringify(plan);
    assert.ok(blob.includes(row[3]));
    assert.equal(/3–6 月|18–36 月|7 天|30 天|90 天/.test(blob), false);
    plan.items.forEach(function (item) {
      assert.ok(item.title);
      assert.ok(item.detail);
      assert.equal(Object.prototype.hasOwnProperty.call(item, "horizon"), false);
    });
  });
  const titles = new Map();
  CASES.forEach(function (row) {
    titles.set(decompose(row[0], row[1]).domain, decompose(row[0], row[1]).items[0].title);
  });
  assert.equal(new Set(titles.values()).size, titles.size);
});

test("same words keep the same id", function () {
  const a = decompose("学会烘焙", "三个月");
  const b = decompose("学会烘焙", "三个月");
  const c = decompose("学会烘焙", "一年");
  assert.equal(a.id, b.id);
  assert.notEqual(a.id, c.id);
});
