/* 原点 · 本机清单。只根据用户写下的目标与时间列出要做的事，不另排日期。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.YuanDian = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SIGNALS = [
    ["fitness", /健身|减脂|减肥|跑步|马拉松|力量|体脂|肌肉|瑜伽|体重|锻炼|体能|workout|fitness|marathon|gym/gi],
    ["learning", /学习|学会|掌握|考试|英语|日语|语言|编程|代码|阅读|课程|证书|雅思|托福|单词|口语|钢琴|吉他|learn|study|exam/gi],
    ["startup", /创业|创办|融资|付费|用户|客户|订单|上线|生意|公司|商业|startup|founder|revenue|saas/gi],
    ["career", /职业|工作|实习|求职|转行|升职|晋升|转岗|offer|简历|面试|岗位|跳槽|入职|全职|经理|设计师|产品线|career|resume|interview|intern/gi],
    ["creative", /写作|写完|小说|绘画|摄影|音乐|作品|出版|博客|视频|短篇|作曲|novel|painting|album/gi],
    ["finance", /理财|存钱|储蓄|存款|投资|还债|预算|收入|结余|生活费|budget|invest|saving/gi],
  ];

  function clip(value, max) {
    const chars = Array.from(String(value == null ? "" : value).replace(/\s+/g, " ").trim());
    if (chars.length <= max) return chars.join("");
    return chars.slice(0, Math.max(0, max - 1)).join("") + "…";
  }

  function goalId(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return "g" + (h >>> 0).toString(36);
  }

  function detectDomain(text) {
    let best = "general";
    let bestScore = 0;
    let bestPos = Infinity;
    SIGNALS.forEach(function (pair) {
      const name = pair[0];
      const re = pair[1];
      const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
      const gre = new RegExp(re.source, flags);
      const matches = Array.from(text.matchAll(gre));
      if (!matches.length) return;
      const score = matches.length;
      const pos = matches[0].index;
      if (score > bestScore || (score === bestScore && pos < bestPos)) {
        best = name;
        bestScore = score;
        bestPos = pos;
      }
    });
    const careerHint = /实习|求职|转行|升职|晋升|转岗|offer|简历|面试|岗位|跳槽|全职|入职|经理|设计师|产品线|resume|interview/i.test(text);
    const startupHint = /创业|创办|融资|付费|客户|订单|上线|生意|startup|founder|revenue/i.test(text);
    if (careerHint && !startupHint) return "career";
    if (startupHint && !careerHint && best !== "fitness" && best !== "learning") return "startup";
    return best;
  }

  function focusOf(clean) {
    let s = clean.replace(/^(?:在)?(?:\d+|[一二两三四五六七八九十半]+)\s*(?:年|个月|月|周|天)(?:以内|之内|内)?/, "");
    s = s.replace(/\b(?:in|within)\s+(?:\d+|one|two|three|four|six|twelve|a)\s+(?:years?|months?|weeks?|days?)\b/ig, "");
    s = s.replace(/^(我想|我要|我希望|希望|目标是|计划|打算|become|be)\s*/i, "");
    s = s.replace(/^(成为|做一名|做|当上|当|学会|掌握|完成|实现|开始)\s*/, "");
    s = s.split(/[，,。；;]/)[0].trim();
    return clip(s || clean, 28);
  }

  function itemsFor(domain, focus) {
    const f = focus;
    const lists = {
      career: [
        ["写清完成的样子", "用一句话写下「" + f + "」做成时，别人能核对的结果。"],
        ["换成具体的人", "把方向写成具体的人或职位，列成一张短名单。"],
        ["做出一件证据", "做一件能当面讲清的作品、案例或说明。"],
        ["给一个人看", "把这件证据给一个真人看，记下对方的原话。"],
        ["留出重复的时段", "在你写下的时间里，固定一个重复做这件事的时段。"],
      ],
      fitness: [
        ["写清身体上的完成", "写下「" + f + "」做到时，身体上能指认的变化。"],
        ["选定重复的动作", "只留两三个你会重复的动作。"],
        ["记下第一次数字", "完成一次训练或活动，记下重量、次数或时长。"],
        ["记下吃的一顿", "记下一天里的蛋白质来源，和实际吃的一顿。"],
        ["用同一项再记一次", "在你写下的时间里，用同一项数字再记录，看出变化。"],
      ],
      learning: [
        ["写下会了的标准", "列出「" + f + "」学会后，能独立做出的几件输出。"],
        ["选定一套材料", "只留一套会反复用的材料。"],
        ["先做一次输出", "合上材料，按标准做一次。"],
        ["只记错处", "对照之后，把错的地方记下来。"],
        ["从错处再来", "在你写下的时间里，下一次从这些错处开始。"],
      ],
      startup: [
        ["写清要解决的问题", "用一句话写下「" + f + "」对应的具体问题。"],
        ["列出具体的人", "写下有名字的人，避免停留在「所有用户」。"],
        ["谈一次并留原话", "和其中一个人谈，记下原话。"],
        ["做一个能用一次的版本", "把范围收到一个人能真正用一次。"],
        ["再拿回去", "在你写下的时间里，把这个版本再给同一个人看。"],
      ],
      creative: [
        ["写清一稿完成", "写下「" + f + "」怎样算可以给人看的一稿。"],
        ["只留一份主稿", "新的内容都写进同一份稿。"],
        ["写下新的一段", "在主稿里增加一段能读完的内容。"],
        ["隔天只改一处", "重读后只改一处含糊的地方。"],
        ["交给一个具体的人", "在你写下的时间里，把稿子给一个你指定的人。"],
      ],
      finance: [
        ["写下你的数字", "用你自己的口径，写下「" + f + "」对应的数字。"],
        ["分开两类支出", "列出必要支出，和可以调整的支出。"],
        ["做一张简单的表", "只记流入、流出和结余。"],
        ["分开存放一笔结余", "按你写下的节奏，把一笔结余放到单独的地方。"],
        ["对照前后数字", "在你写下的时间里，把前后的数字放在一起看。"],
      ],
      general: [
        ["写清能被看见的结果", "用一句话写下「" + f + "」做到时，别人能指出的事。"],
        ["找到最小的一步", "把这件事收成今天能做完的一步。"],
        ["把这一步做出来", "完成这一步，留下可以看的结果。"],
        ["记下发生的事实", "用一句事实写下实际做成了什么。"],
        ["在你的时间里再做一次", "按你写下的时间重复这一步，并留下一次别人的反馈。"],
      ],
    };
    return (lists[domain] || lists.general).map(function (pair, index) {
      return {
        id: "d" + (index + 1),
        title: pair[0],
        detail: pair[1],
      };
    });
  }

  function decompose(goal, time) {
    const cleanGoal = String(goal || "").replace(/\s+/g, " ").trim();
    const cleanTime = String(time || "").replace(/\s+/g, " ").trim();
    if (!cleanGoal || !cleanTime) return null;
    const stripped = cleanGoal.replace(/^(我想|我要|我希望|希望|目标是|计划|打算)\s*/, "");
    const focus = focusOf(stripped) || cleanGoal;
    const domain = detectDomain(stripped);
    const items = itemsFor(domain, focus);
    return {
      v: 2,
      id: goalId(cleanGoal + "\n" + cleanTime),
      goal: cleanGoal,
      time: cleanTime,
      focus: focus,
      domain: domain,
      note: "按你写下的时间推进。",
      items: items,
      signature: items.map(function (item) { return item.title; }).join("|"),
    };
  }

  return {
    decompose: decompose,
    detectDomain: detectDomain,
  };
});
