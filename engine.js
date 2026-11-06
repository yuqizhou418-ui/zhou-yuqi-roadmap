/* 原点 · 本机第一性原理引擎。无网络、无密钥也可拆解。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.YuanDian = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DOMAIN_LABEL = {
    career: "职业",
    fitness: "身体",
    learning: "学习",
    startup: "事业",
    creative: "创作",
    finance: "财务",
    general: "通用",
  };

  const KIND_LABEL = {
    skill: "技能",
    asset: "资产",
    constraint: "约束",
    loop: "反馈环",
  };

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

  function plain(value, max) {
    return clip(String(value == null ? "" : value).replace(/<[^>]+>/g, ""), max);
  }

  function goalId(goal) {
    let h = 2166136261;
    for (let i = 0; i < goal.length; i += 1) {
      h ^= goal.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return "g" + (h >>> 0).toString(36);
  }

function detectSpan(text) {
  if (/三年|三至五年|一辈子|长期|\b(3 years|three years|long-term)\b/i.test(text)) return "long";
  if (/一年|12\s*个?月|十二个?月|\b(one year|1 year|a year|12 months)\b/i.test(text)) return "year";
  if (/半年|六个月|6\s*个?月|三个月|3\s*个?月|两个月|2\s*个?月|一季度|90\s*天|九十天|八周|8\s*周|\b(3 months|6 months|90 days|three months|six months|two months)\b/i.test(text)) {
    return "quarter";
  }
  if (/一个月|1\s*个?月|30\s*天|三十天|四周|4\s*周|两周|一周|\b(30 days|4 weeks|one month|a month)\b/i.test(text)) return "month";
  return "open";
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
  return clip(s || clean, 22);
}

  function constraintNote(goal) {
    const bits = [];
    if (/在职|上班|带娃|带孩子|在读|课表|全职工作的同时|while working/i.test(goal)) {
      bits.push("原文写明了已被占用的时间，后续动作都排在剩余时段里。");
    }
    const hours = goal.match(/每天(?:只有|至多|最多|约)?\s*(\d+)\s*(?:个)?小时/);
    if (hours) bits.push("每天大约 " + hours[1] + " 小时，是这盘棋的边界。");
    return bits.join("");
  }

  function extraAssumptions(goal) {
    const out = [];
    if (/完美|无可挑剔|无懈可击|perfect/i.test(goal)) out.push("要等完美了再开始");
    if (/所有人|每个人|everybody|everyone/i.test(goal)) out.push("所有人都是合适的对象");
    if (/快速|马上|立刻|轻松|quickly|overnight/i.test(goal)) out.push("把强度加大就会变快");
    if (/准备好了再|等准备/.test(goal)) out.push("准备完成之后才算开始");
    return out;
  }

  function mergeAssumptions(extra, base) {
    const seen = new Set();
    const out = [];
    extra.concat(base).forEach(function (item) {
      const text = plain(item, 48);
      if (!text || seen.has(text)) return;
      seen.add(text);
      out.push(text);
    });
    return out.slice(0, 4);
  }

  function longHorizons(span) {
    if (span === "month") return ["这个月", "这一季", "一年之后"];
    if (span === "quarter") return ["本季", "此后两季", "一年之后"];
    return ["3–6 月", "6–18 月", "18–36 月"];
  }

  function attackHorizons(span) {
    if (span === "month") return ["7 天", "14 天", "30 天"];
    return ["7 天", "30 天", "90 天"];
  }

  function boardNote(span) {
    if (span === "month") return "你写到了大约一个月。左侧只留这个月结束时仍然站得住的形状。";
    if (span === "quarter") return "你写到了大约一季。左侧负责棋形，右侧是这一季里要拿下的手。";
    if (span === "year") return "跨度按一年来排。身份换得过来，也要每个月都有证据。";
    if (span === "long") return "这是慢棋。左侧先占大场与厚薄，再谈局部的接触。";
    return "你没有写死期限。大局先按一年的棋形来排，攻杀仍落在九十天内。";
  }

  function attackNote(span) {
    if (span === "month") return "右侧收在三十天里。每一手都要小到这一周说得清。";
    if (span === "quarter") return "右侧是这一季里的攻杀，从七天收到九十天，结果要能指认。";
    return "再长的棋，也靠九十天内的接触喂养。右侧只放本周说得清的手。";
  }

  function analyze(raw) {
    const goal = String(raw || "").replace(/\s+/g, " ").trim();
    if (!goal) return { goal: "" };
    const clean = goal.replace(/^(我想|我要|我希望|希望|目标是|计划|打算)\s*/, "");
    return {
      goal: goal,
      clean: clean,
      focus: focusOf(clean) || "这件事",
      domain: detectDomain(clean),
      span: detectSpan(clean),
      constraintNote: constraintNote(goal),
    };
  }

  function career(ctx, H, A) {
    const f = ctx.focus;
    return {
      essence: "「" + f + "」成立的时候，会有具体的人因为你交出的证据，把位置或报酬交给你。",
      assumptions: [
        "海投的数量会自己变成录取",
        "准备到完美才可以开口",
        "头衔比一件可核验的作品更重要",
        "一份通用简历能打动所有职位",
      ],
      truths: [
        { label: "证据降低风险", text: "对方把机会交给你，是在降低看错人的风险。证据越可核验，决定越容易做。" },
        { label: "三类证据", text: "站得住的证据通常是作品、别人的背书，以及你当场解决问题的样子。" },
        { label: "反馈来自真人", text: "有效反馈来自具体的人与具体的职位。同一段自我描述反复修改，信息增加得很慢。" },
      ],
      atoms: [
        { kind: "skill", label: "岗位切片", detail: "把「" + f + "」里最常被检验的那项能力，练到能在五分钟内演示。" },
        { kind: "asset", label: "证据夹", detail: "一份对着真实职位改过的作品或案例，加一张不超过三十人的具体名单。" },
        { kind: "constraint", label: "带宽", detail: "在职、在读或生活占用是边界。每一轮只推进一条证据。" },
        { kind: "loop", label: "对话回路", detail: "投出或约谈，记下对方原话，用这些原话改下一件证据。回路里要出现真人。" },
      ],
      longTerm: [
        { horizon: H[0], title: "证据成形", why: "围绕「" + f + "」，做出两三件能在五分钟内讲清的作品。", moves: ["选一个真实职位，拆出它要求的三件证据", "把现有经历改写成其中一件"] },
        { horizon: H[1], title: "进入角色", why: "用一次真实交付替换意向。身份来自别人把工作交给你。", moves: ["争取一段实习、项目或内部转岗", "留下可写进下一轮对话的结果"] },
        { horizon: H[2], title: "默认身份", why: "介绍你的人与你交出的作品，使用同一句话。「" + f + "」按季度自己更新。", moves: ["把交付固定成每季一件可展示的成果", "维持一小圈能持续带来对话的人"] },
      ],
      shortTerm: [
        { horizon: A[0], title: "写清完成定义", why: "用一句话写清怎样算到达，并列出十五个具体的人或职位。", moves: ["写下完成时别人能看到的三件事", "把行业词换成十五个名字或职位链接"] },
        { horizon: A[1], title: "第一件证据", why: "完成一件最小作品，讲给五个真人听，记下他们的原话。", moves: ["做出五分钟能讲完的版本", "完成五次对话并保留原话"] },
        { horizon: A[2], title: "对话节奏", why: "每周至少三次有回应的接触。每次回应之后，改证据夹里的一处。", moves: ["固定每周的投递或约谈时段", "用回应修订作品、简历或叙述中的一处"] },
      ],
      daily: [
        { title: "推进那一件证据", minutes: 45, detail: "只做当前作品的下一块，材料、结构或演示都可以。" },
        { title: "写给一个具体的人", minutes: 20, detail: "一封短信或一次跟进，附上证据，写清希望对方看的那一处。" },
        { title: "练最常被考的动作", minutes: 25, detail: "题、稿、案例拆解或作品修订，今天只练一个动作。" },
        { title: "记下今天的一句反馈", minutes: 15, detail: "有新反馈就记原话。还没有反馈，就写下明天要改的一处，并标出问谁。" },
        { title: "读一条真实职位", minutes: 15, detail: "只读一条在招的说明，圈出你还交不出的证据。" },
      ],
    };
  }

  function fitness(ctx, H, A) {
    const f = ctx.focus;
    return {
      essence: "「" + f + "」是负荷、饮食与恢复重复足够多次之后，身体留下的形状。",
      assumptions: [
        "单次练到很累就会有效",
        "体重计单独说明身体的变化",
        "必须每天练很久才算开始",
        "饮食可以等到训练稳定后再管",
      ],
      truths: [
        { label: "进步来自渐进", text: "力量与体能来自一次次略重一点的负荷。关节留得住，进步才留得住。" },
        { label: "变化以周计", text: "体型、围度和配速的变化按周显现。一次出汗说明你练过，说明不了形状。" },
        { label: "饮食决定方向", text: "在多数身体目标里，每天吃进去的东西决定方向，训练决定你留下什么。" },
      ],
      atoms: [
        { kind: "skill", label: "基本动作", detail: "一组你能保持技术的动作：推、拉、蹲，或一项有氧的节奏。" },
        { kind: "asset", label: "训练日志", detail: "动作、次数、重量或配速，外加一份你真的会重复吃的蛋白质来源。" },
        { kind: "constraint", label: "恢复边界", detail: "睡眠、旧伤和你真实能固定的时段，决定本周能练几次。" },
        { kind: "loop", label: "数字回路", detail: "练完写下数字，下一周只加一点点。睡眠和步行托住恢复。" },
      ],
      longTerm: [
        { horizon: H[0], title: "节奏先站稳", why: "「" + f + "」先变成每周固定出现的训练，动作稳定，围度或成绩有记录。", moves: ["定下每周三次的具体时段", "选择三项会重复一个季度的动作"] },
        { horizon: H[1], title: "身体改口", why: "训练和饮食成为默认的一周，出门和忙周之后仍能回到同一条线。", moves: ["让饮食边界简单到出差也能执行", "用十二周的日志指出哪一项在进步"] },
        { horizon: H[2], title: "留在生活里", why: "力量或体能成为底盘。中断一周之后，你知道回到哪一页记录。", moves: ["写下恢复周的最低剂量", "保留一组长期对照：围度、配速或力量"] },
      ],
      shortTerm: [
        { horizon: A[0], title: "把三次摆上棋盘", why: "定好时段，完成三次训练，并记下这几天的蛋白质来源。", moves: ["把三次写进日历", "准备两餐会重复吃的食物"] },
        { horizon: A[1], title: "一组真数字", why: "同一组动作连续记录，能指出重量、次数或配速的变化。", moves: ["固定热身与主项的顺序", "每次训练后只补一行日志"] },
        { horizon: A[2], title: "前后对照", why: "用围度、力量或配速的前后照片与数字说话。", moves: ["第一天留下对照", "到期时用同一条件再测一次"] },
      ],
      daily: [
        { title: "完成今日训练块", minutes: 40, detail: "训练日按计划做完主项。休息日改为二十分钟轻松走，走到即算完成。" },
        { title: "写下蛋白质与一餐", minutes: 15, detail: "记下今天的蛋白质来源，以及一顿你实际吃了的饭。" },
        { title: "走一段", minutes: 20, detail: "除主训练外，步行凑满这段时间。通勤步行可以计入。" },
        { title: "活动关节", minutes: 15, detail: "针对髋、肩或踝做一组温和的活动度，为下一次主项留出位置。" },
        { title: "补上训练日志", minutes: 15, detail: "写下动作与数字。没有训练的日子，写下身体的一处感觉。" },
      ],
    };
  }

  function learning(ctx, H, A) {
    const f = ctx.focus;
    return {
      essence: "「" + f + "」的完成标准，是没有提示时，你仍能做出正确的输出。",
      assumptions: [
        "看完课程就等于学会",
        "收藏和笔记会自动变成能力",
        "必须从第一课按顺序学到最后一课",
        "要有大块时间才能开始",
      ],
      truths: [
        { label: "提取产生记忆", text: "记忆留在你努力想起的时候。重读很顺，常常只说明材料眼熟。" },
        { label: "输出定义技能", text: "技能是能迁移的输出：说出来、写出来、做出来、解出来。" },
        { label: "对照才有反馈", text: "反馈来自答案、测试、作品，或一个懂得比你多的人。" },
      ],
      atoms: [
        { kind: "skill", label: "最小输出", detail: "「" + f + "」里最小的可交付单位：一道题、一段话、一个功能或一次演示。" },
        { kind: "asset", label: "一套薄材料", detail: "固定的教材、题单或语料，薄到可以反复用，错处单独成册。" },
        { kind: "constraint", label: "真实时段", detail: "每天真正空出来的那一段，以及当前水平与目标输出之间的差距。" },
        { kind: "loop", label: "提取回路", detail: "先合上材料作答，再对照，只记录错处。下一次从错处开始。" },
      ],
      longTerm: [
        { horizon: H[0], title: "能独立输出", why: "在不看笔记的条件下，完成一组成套的「" + f + "」任务。", moves: ["把完成标准写成五条可观察的输出", "用同一套材料反复提取"] },
        { horizon: H[1], title: "用进真实场景", why: "把这项能力用进工作、考试或一件公开的小作品。", moves: ["选一个真实场景作为验收", "按月做一次限时输出"] },
        { horizon: H[2], title: "维持剂量", why: "能力留在生活里。降低到每周数次的复习，标准仍在。", moves: ["把错题册收成维持清单", "每季做一次完整验收"] },
      ],
      shortTerm: [
        { horizon: A[0], title: "划定会了", why: "写清五条可观察标准，并连续每天做一次最小输出。", moves: ["写下五条标准", "准备七天的提取题目"] },
        { horizon: A[1], title: "错处成册", why: "完成至少二十次提取。错误开始集中在少数模式上。", moves: ["每次只记录错处与原因", "每周把错处归成三类"] },
        { horizon: A[2], title: "一次真验收", why: "用模拟测试、小项目或公开演示验收，保留分数或观众的具体困惑。", moves: ["提前定好验收日期", "按验收的格式做三次模拟"] },
      ],
      daily: [
        { title: "合上材料作答", minutes: 25, detail: "先输出，再翻材料。今天的题目来自你的五条标准。" },
        { title: "对照并只记错处", minutes: 15, detail: "对答案或对示范，错的写下原因，对的划过。" },
        { title: "先复习昨天的错", minutes: 15, detail: "今天的第一轮从昨天的错处开始。" },
        { title: "学一小块并马上用", minutes: 20, detail: "新材料只进一小段，紧跟一次输出。" },
        { title: "讲给初学者听", minutes: 15, detail: "用自己的话讲清一个点，可以录音。卡壳的地方就是明天的题。" },
      ],
    };
  }

  function startup(ctx, H, A) {
    const f = ctx.focus;
    return {
      essence: "「" + f + "」要成为一件事业，需要某一小群人反复遇到同一问题，并愿意为解决付出时间或钱。",
      assumptions: [
        "产品做完整之后再给人看",
        "融资或注册早于一个愿意承诺的人",
        "所有人都是潜在用户",
        "功能数量等于价值",
      ],
      truths: [
        { label: "问题要被说中", text: "具体的人用自己的话复述出同一个痛，问题才算被说中。" },
        { label: "承诺接近真", text: "付钱、预付、反复使用，比点赞和礼貌的兴趣更接近真。" },
        { label: "对话是产能", text: "一周能完成多少次真实对话，常常是最早的产能上限。" },
      ],
      atoms: [
        { kind: "skill", label: "问清问题", detail: "访谈时追问场景、频率和现有替代方案，先理解问题再介绍方案。" },
        { kind: "asset", label: "有名字的名单", detail: "一份写得出名字的潜在用户清单，以及一个窄到能被使用的最小解。" },
        { kind: "constraint", label: "每周对话数", detail: "「" + f + "」的进度先受限于你每周能见到的人，其次才是功能。" },
        { kind: "loop", label: "原话回路", detail: "对话，记下原话，改最小解，再拿回去。每一圈都碰到人。" },
      ],
      longTerm: [
        { horizon: H[0], title: "问题被说中", why: "至少十次对话里，对方用自己的话复述出同一个痛。", moves: ["把问题写成一句对方的话", "连续约谈直到这句话重复出现"] },
        { horizon: H[1], title: "交换发生", why: "有人付钱、预付，或在没有你盯着的时候仍使用。", moves: ["给出一个明确的价格或承诺方式", "记录对方答应或拒绝的原话"] },
        { horizon: H[2], title: "离开你也能转", why: "获取与交付可以重复。「" + f + "」有一条不依赖单次热情的路径。", moves: ["把交付写成别人也能执行的步骤", "固定一个每周带来新对话的渠道"] },
      ],
      shortTerm: [
        { horizon: A[0], title: "二十个名字", why: "写下二十个具体的人，约到五次对话。对话里先听问题。", moves: ["列出二十个名字和联系方式", "发出五份具体时段的邀请"] },
        { horizon: A[1], title: "三个人用一次", why: "做出窄到一次能用完的最小解，让三个人各自用一次。", moves: ["砍到一个场景", "陪同或观察三次真实使用"] },
        { horizon: A[2], title: "一次真交换", why: "尝试收费或一个明确的承诺，保留对方为什么答应或拒绝。", moves: ["写出价格和包含的范围", "向正在使用的人提出交换"] },
      ],
      daily: [
        { title: "完成一次用户接触", minutes: 30, detail: "发信、对话或跟进。结束时留下一句原话。" },
        { title: "按昨天的原话改一处", minutes: 40, detail: "只改最小解里对得上那句原话的一块。" },
        { title: "整理名单状态", minutes: 15, detail: "每个人只标一个状态：未联系、已约、已谈、在用、已交换。" },
        { title: "写下被证伪的假设", minutes: 15, detail: "今天哪一句原先的判断被对话改写了。没有对话，就写下明天要问的问题。" },
        { title: "看清一个购买路径", minutes: 20, detail: "选一个真实替代品，走完别人发现它、买下它或放弃它的路径。" },
      ],
    };
  }

  function creative(ctx, H, A) {
    const f = ctx.focus;
    return {
      essence: "「" + f + "」完成在一稿离开你、并且能被别人从头读到或看到的时候。",
      assumptions: [
        "状态好了再开始",
        "第一稿就要长成最终形态",
        "发表渠道比完成稿更优先",
        "没有大块时间就无法创作",
      ],
      truths: [
        { label: "作品由时段堆成", text: "作品来自重复出现的时段。灵感是这些时段里偶尔的客人。" },
        { label: "可重读即完成", text: "完成的定义是一稿可以被别人读完或看完，并说得出自己的困惑。" },
        { label: "修改对着整稿", text: "有效的修改发生在完整草稿上。开头可以等整稿出现后再重写。" },
      ],
      atoms: [
        { kind: "skill", label: "起笔", detail: "一个固定的起笔仪式：打开同一份稿，从昨天停下的句子继续。" },
        { kind: "asset", label: "一份活稿", detail: "唯一的主稿，加上一个只收集句子和资料的素材夹。" },
        { kind: "constraint", label: "每日时段", detail: "「" + f + "」使用每天真正空着的那一段，长度固定，地点尽量固定。" },
        { kind: "loop", label: "隔夜重读", detail: "起草，隔夜重读，只改一处，再给一个具体的人看。" },
      ],
      longTerm: [
        { horizon: H[0], title: "一稿完整", why: "「" + f + "」有一稿能从头读到尾的草稿，结构清楚。", moves: ["先写结构或分镜", "按结构填满每一段，允许句子粗糙"] },
        { horizon: H[1], title: "修到可交", why: "对着整稿修订，让一个读者能指出具体的困惑。", moves: ["隔周重读整稿", "把读者的困惑收成修订清单"] },
        { horizon: H[2], title: "周节奏留下", why: "创作变成固定的周，下一件作品知道从哪一页开始。", moves: ["保留起笔时段", "每完成一稿就归档并写下下一题"] },
      ],
      shortTerm: [
        { horizon: A[0], title: "每天都有新句", why: "连续七天，主稿里都有新增的段落或镜头。", moves: ["定下每天的起笔时间", "七天内不新开第二份主稿"] },
        { horizon: A[1], title: "结构落地", why: "完整结构上的每一段都有草稿，可以一口气读完。", moves: ["把结构写成清单", "每段至少写到能读懂的长度"] },
        { horizon: A[2], title: "交给一个读者", why: "把一稿交给一个具体的人，收回至少三条具体的困惑。", moves: ["选好读者并约定日期", "按困惑修订三处"] },
      ],
      daily: [
        { title: "只写新的部分", minutes: 30, detail: "从昨天的最后一句继续，今天的任务是增加篇幅。" },
        { title: "隔夜重读并改一处", minutes: 15, detail: "重读昨天的新增，只改一处含糊的地方。" },
        { title: "收集一句素材", minutes: 15, detail: "把一句对话、一个画面或一条资料放进素材夹，并注明能用在哪一段。" },
        { title: "拆一件作品的结构", minutes: 20, detail: "选一件你尊敬的作品，只记录它如何分段、转折和收束。" },
        { title: "写下明天的第一句", minutes: 15, detail: "离开前写好明天打开就能接上的第一句或第一个镜头。" },
      ],
    };
  }

  function finance(ctx, H, A) {
    const f = ctx.focus;
    return {
      essence: "「" + f + "」是一组现金流在连续的月份里保持同一方向。",
      assumptions: [
        "找到最优策略之后才能开始",
        "收入上涨之前，方向无法改变",
        "复杂的产品比固定的结余更重要",
        "一次大决定可以代替每月的重复",
      ],
      truths: [
        { label: "结余是月的事实", text: "结余等于这个月流进来的减去流出去的，发生在具体的月份。" },
        { label: "自动转移更稳", text: "到账日自动转走的钱，比靠当月意志力留下的钱更可靠。" },
        { label: "安全垫按月支出计", text: "安全垫是若干个月的必要支出。它负责让你睡得着，再谈收益。" },
      ],
      atoms: [
        { kind: "skill", label: "读懂月表", detail: "分得清固定支出、可变支出和真正的结余。" },
        { kind: "asset", label: "结余账户", detail: "一个单独的结余账户，加一张只保留月数字的表。" },
        { kind: "constraint", label: "必要支出", detail: "「" + f + "」必须先让必要支出和不稳定收入被看见。" },
        { kind: "loop", label: "月表回路", detail: "记录，自动转账，下月对照差额，再调整一笔具体的流出。" },
      ],
      longTerm: [
        { horizon: H[0], title: "看清真实结余", why: "连续三个月的流入、流出和结余可以并排比较。", moves: ["建立月表", "把结余账户与日常账户分开"] },
        { horizon: H[1], title: "安全垫成形", why: "必要支出的倍数开始累积，「" + f + "」有了可以指认的进度。", moves: ["算出一个月的必要支出", "设定自动转账的日子和金额"] },
        { horizon: H[2], title: "规则自己运行", why: "忙的月份里，转账和月表仍按同一规则发生。", moves: ["把规则写下来贴在月表旁", "每季只复盘一次金额是否仍然合适"] },
      ],
      shortTerm: [
        { horizon: A[0], title: "一次结余转账", why: "列出固定支出，并完成一次转入结余账户。", moves: ["写出必要支出清单", "今天转出一笔具体的金额"] },
        { horizon: A[1], title: "记满一个月", why: "这一个月的支出都有着落，月末能算出结余。", moves: ["每天补记", "周末把漏掉的回单补进月表"] },
        { horizon: A[2], title: "三个月并排", why: "三个月的月表能放在一起，指出结余最大的那一项变化。", moves: ["固定月末结账的一小时", "标出一项要保留的流出和一项要降下来的流出"] },
      ],
      daily: [
        { title: "记下今天的支出", minutes: 15, detail: "把今天发生的支出写入月表，现金和电子支付都算。" },
        { title: "核对结余进度", minutes: 15, detail: "看本月已转入的金额、剩余天数和还可用的可变支出。" },
        { title: "执行或核对转账", minutes: 15, detail: "按规则转入一笔。若已自动转账，核对它是否到账。" },
        { title: "处理一笔具体的钱", minutes: 20, detail: "取消、降低或谈下一笔你并不看重的重复支出，或完成一笔小的应收。" },
        { title: "在月表上更新一行", minutes: 15, detail: "让月表的数字和账户一致，标出明天要处理的一笔。" },
      ],
    };
  }

  function general(ctx, H, A) {
    const f = ctx.focus;
    return {
      essence: "「" + f + "」要成立，外界得能指出一件已经发生的事，并且你有一条重复得起的反馈环。",
      assumptions: [
        "想清楚了再行动",
        "忙碌的感觉等于推进",
        "存在一条必须先找到的正确路径",
        "别人的时间表就是自己的时间表",
      ],
      truths: [
        { label: "先有完成定义", text: "目标里不可再拆的部分，是完成的定义、最小动作、约束和反馈。" },
        { label: "一手与看见", text: "你能直接安排的是今日的一手，以及你是否看见这一手的结果。" },
        { label: "注意力是硬约束", text: "最常见的硬约束是时间与注意力。信息往往比这两者更富余。" },
      ],
      atoms: [
        { kind: "skill", label: "最小手艺", detail: "「" + f + "」里今天就能练习的那个动作，小到一次坐得下。" },
        { kind: "asset", label: "证据与记录", detail: "一件可以给别人看的粗糙产出，加一行每天的记录。" },
        { kind: "constraint", label: "时段与边界", detail: "真正空着的时段、钱、身体或别人的依赖，构成这盘棋的边界。" },
        { kind: "loop", label: "产出回路", detail: "做出一点，对照标准或一个人，只改一处，明天从这一点继续。" },
      ],
      longTerm: [
        { horizon: H[0], title: "三件可指认的证据", why: "把「" + f + "」定义成三件别人也能指认的证据。", moves: ["写下完成时可见的三件事", "做出其中第一件的粗糙版本"] },
        { horizon: H[1], title: "每月都有更新", why: "这三件证据按月更新，形成默认节奏。", moves: ["选定每月固定的复盘日", "每次只加深一条证据"] },
        { horizon: H[2], title: "忙月也不消失", why: "剂量可以降低，「" + f + "」在忙碌的月份里仍有一手。", moves: ["写下最低维持剂量", "把记录放在你每天已经会打开的地方"] },
      ],
      shortTerm: [
        { horizon: A[0], title: "一句完成定义", why: "用一句话写清怎样算做到，并交出第一件粗糙证据。", moves: ["写出完成定义", "今天做出一个可以展示的片段"] },
        { horizon: A[1], title: "连续四周的证据", why: "每周都有一件新的证据，四件可以并排看。", moves: ["固定每周的产出时段", "周末只做归档，不新开方向"] },
        { horizon: A[2], title: "一次外部反馈", why: "用一个人或一个公开标准决定下一段保留哪一条线。", moves: ["把证据给一个具体的人", "按反馈保留一条线"] },
      ],
      daily: [
        { title: "做一个可观察的片段", minutes: 30, detail: "为「" + f + "」增加一块别人能看到的产出。" },
        { title: "对照标准或一个人", minutes: 20, detail: "拿今天的片段对照你的完成定义，或发给一个能回应的人。" },
        { title: "写下一条被证实的事实", minutes: 15, detail: "今天哪一件事被做出来了，用一句事实记下。" },
        { title: "清掉明天的一个障碍", minutes: 15, detail: "材料、环境、预约或打开方式，清掉其中一件。" },
        { title: "复习昨天并改一处", minutes: 20, detail: "打开昨天的产出，只改一处，然后写下明天的第一手。" },
      ],
    };
  }

  const PACKS = {
    career: career,
    fitness: fitness,
    learning: learning,
    startup: startup,
    creative: creative,
    finance: finance,
    general: general,
  };

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
    const essenceKids = plan.truths.map(function (item, i) {
      return leaf("t" + (i + 1), item.label, item.label, item.text, "essence");
    });
    const atomKids = plan.atoms.map(function (item, i) {
      const kind = KIND_LABEL[item.kind] || "原子";
      return leaf("a" + (i + 1), item.label, kind + " · " + item.label, item.detail, "atom");
    });
    const longKids = plan.longTerm.map(function (item) {
      return leaf(item.id, item.title, item.horizon + " · " + item.title, [item.why].concat(item.moves).join("\n"), "long");
    });
    const shortKids = plan.shortTerm.map(function (item) {
      return leaf(item.id, item.title, item.horizon + " · " + item.title, [item.why].concat(item.moves).join("\n"), "short");
    });
    const dailyKids = plan.daily.map(function (item) {
      return leaf(item.id, item.title, item.title, item.minutes + " 分钟。 " + item.detail, "daily");
    });

    return {
      id: "root",
      label: clip(plan.focus || plan.goal, 18),
      title: plan.goal,
      note: plan.essence,
      tone: "root",
      children: [
        { id: "essence", label: "本质", title: "本质", note: plan.essence, tone: "essence", children: essenceKids },
        { id: "atoms", label: "原子", title: "不可再拆的积木", note: "技能、资产、约束、反馈环。", tone: "atom", children: atomKids },
        { id: "long", label: "大局", title: "长期 · 大局观", note: plan.boardNote, tone: "long", children: longKids },
        { id: "short", label: "攻杀", title: "短期 · 攻杀", note: plan.attackNote, tone: "short", children: shortKids },
        { id: "daily", label: "每日", title: "每日具体行动", note: "每手 15–90 分钟，今天可以勾选。", tone: "daily", children: dailyKids },
      ],
    };
  }

  function withIds(items, prefix, map) {
    return items.map(function (item, index) {
      const next = map(item, index);
      next.id = prefix + (index + 1);
      return next;
    });
  }

  function finalize(pack, ctx, source) {
    const atoms = pack.atoms.map(function (item) {
      return {
        kind: item.kind,
        label: plain(item.label, 12),
        detail: plain(item.detail, 140),
      };
    });
    if (ctx.constraintNote) {
      const found = atoms.find(function (item) { return item.kind === "constraint"; });
      if (found) {
        const glue = found.detail.endsWith("。") ? "" : "。";
        found.detail = clip(found.detail + glue + ctx.constraintNote, 180);
      }
    }

    const plan = {
      v: 1,
      id: goalId(ctx.goal),
      goal: ctx.goal,
      focus: ctx.focus,
      domain: ctx.domain,
      domainLabel: DOMAIN_LABEL[ctx.domain] || "通用",
      span: ctx.span,
      source: source,
      essence: plain(pack.essence, 180),
      assumptions: mergeAssumptions(extraAssumptions(ctx.goal), pack.assumptions),
      truths: pack.truths.map(function (item) {
        return { label: plain(item.label, 12), text: plain(item.text, 140) };
      }),
      atoms: atoms,
      longTerm: withIds(pack.longTerm, "l", function (item) {
        return {
          horizon: plain(item.horizon, 12),
          title: plain(item.title, 16),
          why: plain(item.why, 140),
          moves: (item.moves || []).map(function (move) { return plain(move, 80); }).filter(Boolean).slice(0, 3),
        };
      }),
      shortTerm: withIds(pack.shortTerm, "s", function (item) {
        return {
          horizon: plain(item.horizon, 12),
          title: plain(item.title, 16),
          why: plain(item.why, 140),
          moves: (item.moves || []).map(function (move) { return plain(move, 80); }).filter(Boolean).slice(0, 3),
        };
      }),
      daily: withIds(pack.daily, "d", function (item) {
        const minutes = Math.max(15, Math.min(90, Math.round(Number(item.minutes) || 25)));
        return {
          title: plain(item.title, 24),
          minutes: minutes,
          detail: plain(item.detail, 120),
        };
      }),
      boardNote: boardNote(ctx.span),
      attackNote: attackNote(ctx.span),
      notice: "",
    };
    plan.tree = buildTree(plan);
    plan.signature = plan.daily.map(function (item) { return item.title; }).join("|");
    return plan;
  }

  function decompose(raw) {
    const ctx = analyze(raw);
    if (!ctx.goal) return null;
    const pack = PACKS[ctx.domain](ctx, longHorizons(ctx.span), attackHorizons(ctx.span));
    return finalize(pack, ctx, "local");
  }

  function asMoves(value) {
    if (Array.isArray(value)) {
      return value.map(function (item) { return plain(item, 80); }).filter(Boolean).slice(0, 3);
    }
    if (typeof value === "string" && value.trim()) return [plain(value, 80)];
    return [];
  }

  function normalizeKind(value) {
    const text = String(value || "").toLowerCase();
    if (text === "skill" || value === "技能") return "skill";
    if (text === "asset" || value === "资产") return "asset";
    if (text === "constraint" || value === "约束") return "constraint";
    if (text === "loop" || text === "feedback" || value === "反馈环" || value === "反馈") return "loop";
    return "";
  }

  function fromRemote(raw, goal) {
    const ctx = analyze(goal);
    if (!ctx.goal) return null;
    if (!raw || typeof raw !== "object") throw new Error("shape");
    const H = longHorizons(ctx.span);
    const A = attackHorizons(ctx.span);
    const local = PACKS[ctx.domain](ctx, H, A);
    const essence = plain(raw.essence, 180);
    if (essence.length < 8) throw new Error("essence");

    const longIn = Array.isArray(raw.longTerm) ? raw.longTerm : [];
    const shortIn = Array.isArray(raw.shortTerm) ? raw.shortTerm : [];
    const dailyIn = Array.isArray(raw.daily) ? raw.daily : [];
    const longTerm = longIn.slice(0, 3).map(function (item, i) {
      return {
        horizon: plain(item && item.horizon, 12) || H[i] || H[H.length - 1],
        title: plain(item && item.title, 16),
        why: plain(item && (item.why || item.detail), 140),
        moves: asMoves(item && item.moves),
      };
    }).filter(function (item) { return item.title && item.why; });
    const shortTerm = shortIn.slice(0, 3).map(function (item, i) {
      return {
        horizon: plain(item && item.horizon, 12) || A[i] || A[A.length - 1],
        title: plain(item && item.title, 16),
        why: plain(item && (item.why || item.detail), 140),
        moves: asMoves(item && item.moves),
      };
    }).filter(function (item) { return item.title && item.why; });
    const daily = dailyIn.slice(0, 6).map(function (item) {
      return {
        title: plain(item && item.title, 24),
        minutes: item && item.minutes,
        detail: plain(item && (item.detail || item.why), 120),
      };
    }).filter(function (item) { return item.title && item.detail; });
    if (longTerm.length < 2 || shortTerm.length < 2 || daily.length < 3) throw new Error("lists");

    let truths = Array.isArray(raw.truths) ? raw.truths.slice(0, 4).map(function (item) {
      if (typeof item === "string") return { label: clip(item, 12), text: plain(item, 140) };
      return { label: plain(item && item.label, 12), text: plain(item && (item.text || item.detail), 140) };
    }).filter(function (item) { return item.label && item.text; }) : [];
    if (truths.length < 2) truths = local.truths;

    let atoms = Array.isArray(raw.atoms) ? raw.atoms.slice(0, 4).map(function (item) {
      const kind = normalizeKind(item && item.kind);
      return {
        kind: kind,
        label: plain(item && item.label, 12),
        detail: plain(item && (item.detail || item.text), 140),
      };
    }).filter(function (item) { return item.kind && item.label && item.detail; }) : [];
    if (atoms.length < 3) atoms = local.atoms;

    const assumptions = Array.isArray(raw.assumptions) ? raw.assumptions : local.assumptions;
    return finalize({
      essence: essence,
      assumptions: assumptions,
      truths: truths,
      atoms: atoms,
      longTerm: longTerm,
      shortTerm: shortTerm,
      daily: daily,
    }, ctx, "remote");
  }

  return {
    analyze: analyze,
    decompose: decompose,
    fromRemote: fromRemote,
    DOMAIN_LABEL: DOMAIN_LABEL,
  };
});
