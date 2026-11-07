/* 原点 · 本机拆解。时间只用用户写下的原文，不另排日期。 */
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
      const re = pair[1];
      const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
      const matches = Array.from(text.matchAll(new RegExp(re.source, flags)));
      if (!matches.length) return;
      const score = matches.length;
      const pos = matches[0].index;
      if (score > bestScore || (score === bestScore && pos < bestPos)) {
        best = pair[0];
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
    return clip(s || clean, 24);
  }

  function pack(domain, focus) {
    const f = focus;
    const table = {
      career: {
        essence: "「" + f + "」成立时，会有具体的人因为你交出的证据，把位置或报酬交给你。",
        long: [
          ["方向", "写清完成", "用一句话写下别人能核对的结果。", ["写出完成时可见的三件事", "去掉空泛的行业词"]],
          ["证据", "做出可讲的作品", "准备一件能当面讲清的作品或案例。", ["选一个真实职位来对齐", "把现有经历改成其中一件"]],
          ["位置", "让人把机会交给你", "身份来自别人因为证据把工作交给你。", ["争取一段真实交付", "留下可以再讲的结果"]],
        ],
        short: [
          ["名单", "换成具体的人", "把方向写成具体的人或职位。", ["列出一小张名单", "每人只标下一步"]],
          ["初稿", "做出最小证据", "完成一件能讲完的版本。", ["定下五分钟能讲的范围", "先做粗糙的一版"]],
          ["对话", "给一个人看", "把证据给真人看，记下原话。", ["约一次具体的对话", "用原话改证据里的一处"]],
        ],
        daily: [
          ["推进那一件证据", 45, "只做当前作品的下一块。"],
          ["写给一个具体的人", 20, "附上证据，写清希望对方看的那一处。"],
          ["练最常被看的动作", 25, "今天只练一个动作：稿、案例或演示。"],
          ["记下今天的一句反馈", 15, "有原话就记下。还没有，就写下明天要问谁。"],
          ["读一条真实说明", 15, "只读一条在招的说明，圈出你还交不出的证据。"],
        ],
      },
      fitness: {
        essence: "「" + f + "」是负荷、饮食与恢复重复之后，身体留下的形状。",
        long: [
          ["标准", "写清身体上的完成", "写下做到时能指认的变化。", ["选定一项对照：围度、力量或配速", "留下第一天的数字"]],
          ["动作", "留下会重复的动作", "只保留两三个你会一直做的动作。", ["写下动作名称和顺序", "固定每次的记录方式"]],
          ["节奏", "让训练成为默认", "训练落进你自己的生活，而不是一次冲刺。", ["写出恢复时的最低一次", "忙的时候仍知道回到哪一页"]],
        ],
        short: [
          ["摆上", "把训练放进时间里", "按你写下的时间，完成最初几次并记下数字。", ["把时段写进你已有的安排", "准备两餐会重复吃的食物"]],
          ["数字", "记下真的一组", "同一组动作有连续记录。", ["固定热身和主项", "每次只补一行日志"]],
          ["对照", "用同一项再看一次", "前后用同一条件比较。", ["保留第一次的记录", "到期时用同样方式再测"]],
        ],
        daily: [
          ["完成今日训练块", 40, "训练日做主项。休息日改为二十分钟轻松走。"],
          ["写下蛋白质与一餐", 15, "记下蛋白质来源，以及一顿实际吃的饭。"],
          ["走一段", 20, "除主训练外，步行凑满这段时间。"],
          ["活动关节", 15, "为下一次主项留出髋、肩或踝。"],
          ["补上训练日志", 15, "写下动作与数字。没有训练就写下一处身体感觉。"],
        ],
      },
      learning: {
        essence: "「" + f + "」的完成，是没有提示时仍能做出正确的输出。",
        long: [
          ["标准", "写下会了的样子", "列出能独立做出的几件输出。", ["写成可以观察的条目", "每条都能当场做出来"]],
          ["材料", "只用一套材料", "薄到可以反复用，错处单独成册。", ["选定教材或题单", "错处不和新材料混在一起"]],
          ["使用", "用进一次真实场景", "把能力用进工作、考试或一件小作品。", ["选一个验收场景", "按那个场景做一次完整输出"]],
        ],
        short: [
          ["范围", "划定第一次输出", "先按标准做一次，不求整门课。", ["从五条标准里选一条", "准备这一次的题目"]],
          ["错处", "只记错的", "对照之后，错误集中成少数几类。", ["对的划过", "错的写下原因"]],
          ["再来", "从错处开始下一次", "下一次先做上次错的。", ["把错处放在材料最上面", "做完再碰到新的一块"]],
        ],
        daily: [
          ["合上材料作答", 25, "先输出，再翻材料。"],
          ["对照并只记错处", 15, "对答案或示范，只整理错的。"],
          ["先复习昨天的错", 15, "今天的第一轮从昨天的错处开始。"],
          ["学一小块并马上用", 20, "新材料只进一小段，紧跟一次输出。"],
          ["讲给别人听", 15, "用自己的话讲清一个点。卡壳的地方就是下一次的题。"],
        ],
      },
      startup: {
        essence: "「" + f + "」要成立，需要具体的人遇到这个问题，并愿意付出时间或钱。",
        long: [
          ["问题", "把问题说成一句原话", "用对方的话写下反复出现的痛。", ["先写你以为的问题", "用对话改这句原话"]],
          ["交换", "发生一次真交换", "付钱、预付或反复使用，比礼貌的兴趣更接近。", ["写出包含的范围", "向正在用的人提出交换"]],
          ["重复", "离开你也能再做一次", "获取和交付可以重复。", ["把交付写成步骤", "固定一个带来新对话的渠道"]],
        ],
        short: [
          ["名单", "写下具体的人", "有名字，而不是「所有用户」。", ["列出能联系到的人", "发出具体时段的邀请"]],
          ["一次使用", "让人用一次", "做一个窄到能被用完的版本。", ["只留一个场景", "陪同或观察一次真实使用"]],
          ["原话", "把原话带回去", "用听到的一句改版本，再给同一个人。", ["记下原话", "只改对得上那句的一块"]],
        ],
        daily: [
          ["完成一次接触", 30, "发信、对话或跟进，结束时留下一句原话。"],
          ["按原话改一处", 40, "只改最小版本里对得上那句原话的一块。"],
          ["整理名单状态", 15, "每个人只标一个状态。"],
          ["写下今天被改写的判断", 15, "没有对话，就写下明天要问的问题。"],
          ["走一遍现有的路径", 20, "看一个人如何发现并使用一个现成的替代。"],
        ],
      },
      creative: {
        essence: "「" + f + "」完成在一稿能被别人从头读到或看到的时候。",
        long: [
          ["完成", "写清一稿怎样算成", "完成是可以给人看，并能说出困惑。", ["写下完成的条件", "条件要能被别人核对"]],
          ["主稿", "只留一份稿", "新的内容都进入同一份。", ["定下主稿的位置", "素材另放，不新开第二份主稿"]],
          ["读者", "交给一个具体的人", "收回具体的困惑，再改。", ["选好读者", "把困惑收成修订清单"]],
        ],
        short: [
          ["起笔", "写下新的一段", "主稿里增加能读完的一段。", ["从上次停下的地方继续", "今天只增加篇幅"]],
          ["重读", "隔天只改一处", "重读新增的部分，只改一处含糊。", ["标出含糊的一句", "改完即停"]],
          ["交出", "把稿子给出去", "在你写下的时间里交给那个人。", ["约好交给的日子", "附上一句你想让对方看的地方"]],
        ],
        daily: [
          ["只写新的部分", 30, "从昨天的最后一句继续。"],
          ["重读并改一处", 15, "只改一处含糊的地方。"],
          ["收集一句素材", 15, "放进素材夹，并注明能用在哪一段。"],
          ["看一件作品如何分段", 20, "只记录结构，分段和收束。"],
          ["写下明天的第一句", 15, "离开前写好明天能接上的第一句。"],
        ],
      },
      finance: {
        essence: "「" + f + "」是你自己的数字，在你写下的时间里保持同一个方向。",
        long: [
          ["口径", "写下你的数字", "用你自己的口径，不换成别人的目标。", ["写下要看见的数字", "写清这个数字怎么算"]],
          ["账", "分开必要和可调", "必要支出和可以调整的支出分开放。", ["列出必要支出", "圈出可以降的一笔"]],
          ["结余", "让结余自己发生", "按你的节奏把结余分开存放。", ["选定存放的地方", "写下每次转出的规则"]],
        ],
        short: [
          ["表", "做一张简单的表", "只记流入、流出和结余。", ["建好三列", "填上已经发生的数字"]],
          ["一笔", "分开存放一笔", "按你写下的节奏转出一笔具体的金额。", ["写出金额", "今天转出或核对到账"]],
          ["对照", "把前后放在一起", "用同一张表看变化。", ["保留起始数字", "下次用同样的列再记"]],
        ],
        daily: [
          ["记下今天的支出", 15, "现金和电子支付都记进表。"],
          ["看一眼结余", 15, "看已经分开的金额，和还在日常里的钱。"],
          ["执行或核对转出", 15, "按你的规则转一笔，或核对它是否到账。"],
          ["处理一笔具体的钱", 20, "降低一笔重复支出，或收回一笔应收。"],
          ["让表和账户一致", 15, "更新一行，标出明天要处理的一笔。"],
        ],
      },
      general: {
        essence: "「" + f + "」要做到能被看见，并且在你写下的时间里可以重复。",
        long: [
          ["结果", "写清能被看见的完成", "别人能指出一件已经发生的事。", ["写成一句完成定义", "定义里要有可见的结果"]],
          ["证据", "留下可以并排的结果", "每次都有一件能拿出来的东西。", ["定下证据的形式", "放在你每天会打开的地方"]],
          ["节奏", "忙的时候也还有一手", "剂量可以小，事情还在。", ["写下最低的一次", "把这一次放进你已有的时间"]],
        ],
        short: [
          ["一步", "找到最小的一步", "小到今天能做完。", ["只留一步", "写清做完的样子"]],
          ["做出", "把这一步做出来", "留下可以看的结果。", ["现在就做", "收在一个固定的地方"]],
          ["反馈", "给一个人看", "留下一句别人的话。", ["选一个具体的人", "问他看见了什么"]],
        ],
        daily: [
          ["做一个可看见的片段", 30, "为这件事增加一块别人能看到的结果。"],
          ["对照你的完成定义", 20, "拿今天的片段对照那一句定义。"],
          ["写下一条事实", 15, "用一句事实记下做成了什么。"],
          ["清掉下一步的障碍", 15, "材料、环境或预约，清掉一件。"],
          ["改一处并写下明天的第一手", 20, "只改一处，然后写下明天一开始做什么。"],
        ],
      },
    };
    return table[domain] || table.general;
  }

  function leaf(id, label, title, note, tone) {
    return {
      id: id,
      label: clip(label, 12),
      title: title || label,
      note: note || "",
      tone: tone,
      children: [],
    };
  }

  function buildTree(plan) {
    return {
      id: "root",
      label: clip(plan.focus, 10),
      title: plan.goal,
      note: plan.essence,
      tone: "root",
      children: [
        leaf("essence", "本质", "本质", plan.essence, "essence"),
        {
          id: "long",
          label: "大局",
          title: "长期 · 大局观",
          note: plan.boardNote,
          tone: "long",
          children: plan.longTerm.map(function (item) {
            return leaf(item.id, item.title, item.horizon + " · " + item.title, [item.why].concat(item.moves).join("\n"), "long");
          }),
        },
        {
          id: "short",
          label: "攻杀",
          title: "短期 · 攻杀",
          note: plan.attackNote,
          tone: "short",
          children: plan.shortTerm.map(function (item) {
            return leaf(item.id, item.title, item.horizon + " · " + item.title, [item.why].concat(item.moves).join("\n"), "short");
          }),
        },
        {
          id: "daily",
          label: "每日",
          title: "每日具体行动",
          note: "每项是一段可勾选的时间，日期按你写的来。",
          tone: "daily",
          children: plan.daily.map(function (item) {
            return leaf(item.id, item.title, item.title, item.minutes + " 分钟。" + item.detail, "daily");
          }),
        },
      ],
    };
  }

  function decompose(goal, time) {
    const cleanGoal = String(goal || "").replace(/\s+/g, " ").trim();
    const cleanTime = String(time || "").replace(/\s+/g, " ").trim();
    if (!cleanGoal || !cleanTime) return null;
    const stripped = cleanGoal.replace(/^(我想|我要|我希望|希望|目标是|计划|打算)\s*/, "");
    const focus = focusOf(stripped) || cleanGoal;
    const domain = detectDomain(stripped);
    const src = pack(domain, focus);
    const longTerm = src.long.map(function (row, i) {
      return { id: "l" + (i + 1), horizon: row[0], title: row[1], why: row[2], moves: row[3] };
    });
    const shortTerm = src.short.map(function (row, i) {
      return { id: "s" + (i + 1), horizon: row[0], title: row[1], why: row[2], moves: row[3] };
    });
    const daily = src.daily.map(function (row, i) {
      const minutes = Math.max(15, Math.min(90, Math.round(Number(row[1]) || 25)));
      return { id: "d" + (i + 1), title: row[0], minutes: minutes, detail: row[2] };
    });
    const plan = {
      v: 3,
      id: goalId(cleanGoal + "\n" + cleanTime),
      goal: cleanGoal,
      time: cleanTime,
      focus: focus,
      domain: domain,
      essence: src.essence,
      boardNote: "你的时间：" + cleanTime,
      attackNote: "先做的事也在这段时间里，不另排日期。",
      longTerm: longTerm,
      shortTerm: shortTerm,
      daily: daily,
    };
    plan.tree = buildTree(plan);
    plan.signature = daily.map(function (item) { return item.title; }).join("|");
    return plan;
  }

  return { decompose: decompose };
});
