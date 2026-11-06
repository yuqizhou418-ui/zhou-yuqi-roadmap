const test = require("node:test");
const assert = require("node:assert/strict");
const { decompose, fromRemote } = require("../engine.js");

const CASES = [
  ["一年内成为能独立交付的产品设计师，并获得一份匹配的全职工作", "career", "year", "产品设计师"],
  ["三个月减脂并每周力量训练三次", "fitness", "quarter", "减脂"],
  ["六个月学会用英语做工作演示", "learning", "quarter", "英语"],
  ["做出一个有十个付费用户的小工具", "startup", "open", "付费用户"],
  ["写完一本短篇小说并发表", "creative", "open", "短篇小说"],
  ["一年内存下六个月生活费", "finance", "year", "生活费"],
  ["把家里的阳台变成一个可以发呆的地方", "general", "open", "阳台"],
  ["我想一年内转行做产品经理", "career", "year", "产品经理"],
  ["learn Spanish in six months", "learning", "quarter", "Spanish"],
];

function assertPlan(plan, domain, span, focusPart) {
  assert.ok(plan);
  assert.equal(plan.v, 1);
  assert.equal(plan.domain, domain);
  assert.equal(plan.span, span);
  assert.ok(plan.focus.includes(focusPart), plan.focus);
  assert.ok(plan.essence.includes(focusPart) || plan.essence.includes(plan.focus));
  assert.ok(plan.assumptions.length >= 3);
  assert.equal(plan.truths.length, 3);
  assert.equal(plan.atoms.length, 4);
  assert.equal(plan.longTerm.length, 3);
  assert.equal(plan.shortTerm.length, 3);
  assert.equal(plan.daily.length, 5);
  plan.daily.forEach(function (item) {
    assert.ok(item.minutes >= 15 && item.minutes <= 90);
    assert.ok(item.title);
    assert.ok(item.detail);
  });
  assert.equal(plan.tree.id, "root");
  assert.equal(plan.tree.children.length, 5);
  assert.deepEqual(
    plan.tree.children.map(function (node) { return node.id; }),
    ["essence", "atoms", "long", "short", "daily"]
  );
  const kinds = plan.atoms.map(function (item) { return item.kind; });
  assert.ok(kinds.includes("skill") && kinds.includes("loop"));
  if (span === "month") {
    assert.equal(plan.shortTerm[2].horizon, "30 天");
    assert.equal(plan.longTerm[0].horizon, "这个月");
  } else {
    assert.equal(plan.shortTerm[2].horizon, "90 天");
  }
  if (span === "open" || span === "year" || span === "long") {
    assert.equal(plan.longTerm[0].horizon, "3–6 月");
    assert.equal(plan.longTerm[2].horizon, "18–36 月");
  }
}

test("blank goal", function () {
  assert.equal(decompose("   "), null);
  assert.equal(decompose(""), null);
});

test("varied goals", function () {
  const titles = new Map();
  CASES.forEach(function (row) {
    const plan = decompose(row[0]);
    assertPlan(plan, row[1], row[2], row[3]);
    titles.set(plan.domain, plan.daily[0].title);
    assert.equal(plan.source, "local");
    assert.ok(plan.boardNote);
    assert.ok(plan.attackNote);
  });
  assert.equal(new Set(titles.values()).size, titles.size);
});

test("month span compresses the board", function () {
  const plan = decompose("一个月养成每天阅读的习惯");
  assert.equal(plan.domain, "learning");
  assert.equal(plan.span, "month");
  assert.equal(plan.longTerm[0].horizon, "这个月");
  assert.equal(plan.shortTerm[0].horizon, "7 天");
  assert.equal(plan.shortTerm[2].horizon, "30 天");
});

test("constraint in the original goal is kept", function () {
  const plan = decompose("在职的同时，一年内转行做数据分析师");
  assert.equal(plan.domain, "career");
  const constraint = plan.atoms.find(function (item) { return item.kind === "constraint"; });
  assert.match(constraint.detail, /已被占用的时间/);
});

test("stated assumption is surfaced", function () {
  const plan = decompose("我想快速学会钢琴，而且要等完美了再表演");
  assert.equal(plan.domain, "learning");
  assert.ok(plan.assumptions.some(function (item) { return item.includes("完美"); }));
});

test("remote json normalizes and falls back fields", function () {
  const goal = "一年内成为能独立交付的产品设计师";
  const plan = fromRemote({
    essence: "云端看到的本质是证据会被具体的人接收。",
    assumptions: ["只改简历", "等待伯乐"],
    longTerm: [
      { horizon: "半年", title: "作品集", why: "三件案例", moves: ["选项目"] },
      { title: "入职", why: "开始交付" },
    ],
    shortTerm: [
      { horizon: "14 天", title: "名单", why: "二十个职位" },
      { title: "访谈", why: "五次对话" },
    ],
    daily: [
      { title: "改案例", minutes: 200, detail: "只改一页" },
      { title: "发信", minutes: 5, detail: "写给一个人" },
      { title: "复盘", detail: "记下回复" },
    ],
  }, goal);
  assert.equal(plan.source, "remote");
  assert.equal(plan.domain, "career");
  assert.equal(plan.daily[0].minutes, 90);
  assert.equal(plan.daily[1].minutes, 15);
  assert.equal(plan.truths.length, 3);
  assert.equal(plan.atoms.length, 4);
  assert.equal(plan.tree.children[2].children[0].title.includes("作品集"), true);
});

test("remote junk throws", function () {
  assert.throws(function () {
    fromRemote({ essence: "太短" }, "学会烘焙");
  });
  assert.throws(function () {
    fromRemote(null, "学会烘焙");
  });
});
