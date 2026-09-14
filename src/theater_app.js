/* ===== 音效（Web Audio，無外部檔） ===== */
const Sfx = (() => {
  let ctx = null;
  let muted = localStorage.getItem('theater-muted') === '1';
  let bgmOn = localStorage.getItem('theater-bgm') !== '0';
  let trackId = localStorage.getItem('theater-track') || 'fairy';
  let bgmTimer = null, bgmGain = null, bgmAlive = false;
  function get() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, d, v = 0.16, type = 'sine', delay = 0) {
    if (muted) return;
    const c = get(); if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g).connect(c.destination);
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.start(t); o.stop(t + d + 0.02);
  }
  /* 背景音樂：輕柔、音量壓低，不要蓋過讀故事 */
  const TRACKS = {
    fairy: { name: '🏰 童話圓舞曲', notes: [
      [523,.45],[659,.22],[784,.22],[880,.45],[784,.22],[659,.22],
      [698,.45],[880,.22],[1047,.22],[880,.45],[784,.22],[659,.22],
      [587,.45],[698,.22],[880,.22],[784,.45],[659,.22],[587,.22],
      [523,.9],[0,.5] ] },
    forest: { name: '🌿 森林散步', notes: [
      [440,.32],[523,.32],[587,.32],[523,.32],[440,.64],
      [392,.32],[440,.32],[523,.32],[587,.32],[659,.64],
      [587,.32],[523,.32],[440,.32],[392,.32],[349,.9],[0,.5] ] },
    starry: { name: '⭐ 星星搖籃曲', notes: [
      [523,.4],[523,.4],[587,.4],[523,.4],[698,.8],[659,.8],
      [523,.4],[523,.4],[587,.4],[523,.4],[784,.8],[698,.8],
      [523,.4],[523,.4],[1047,.4],[880,.4],[698,.4],[659,.4],[587,.9],
      [932,.4],[880,.4],[698,.4],[784,.4],[698,.9],[0,.5] ] },
  };
  function loop() {
    if (!bgmAlive || muted || !bgmOn) { bgmAlive = false; return; }
    const c = get(); if (!c) { bgmAlive = false; return; }
    if (!bgmGain) { bgmGain = c.createGain(); bgmGain.gain.value = 0.055; bgmGain.connect(c.destination); }
    const notes = (TRACKS[trackId] || TRACKS.fairy).notes;
    let t = c.currentTime + 0.05;
    notes.forEach(([f, d]) => {
      if (f > 0) {
        const o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(bgmGain);
        o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.6, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, t + d * 0.92);
        o.start(t); o.stop(t + d + 0.03);
      }
      t += d;
    });
    const total = notes.reduce((a, n) => a + n[1], 0);
    bgmTimer = setTimeout(loop, (total - 0.05) * 1000);
  }
  function startBgm() { if (muted || !bgmOn || bgmAlive) return; bgmAlive = true; loop(); }
  function stopBgm() { bgmAlive = false; if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = null; } }

  return {
    unlock() { get(); startBgm(); },
    isMuted() { return muted; },
    toggle() {
      muted = !muted;
      localStorage.setItem('theater-muted', muted ? '1' : '0');
      if (muted) stopBgm(); else startBgm();
      return muted;
    },
    isBgmOn() { return bgmOn; },
    toggleBgm() {
      bgmOn = !bgmOn;
      localStorage.setItem('theater-bgm', bgmOn ? '1' : '0');
      if (bgmOn) { get(); startBgm(); } else stopBgm();
      return bgmOn;
    },
    trackName() { return (TRACKS[trackId] || TRACKS.fairy).name; },
    nextTrack() {
      const ids = Object.keys(TRACKS);
      trackId = ids[(ids.indexOf(trackId) + 1) % ids.length];
      localStorage.setItem('theater-track', trackId);
      stopBgm(); get(); startBgm();
      return TRACKS[trackId].name;
    },
    tap() { tone(680, 0.07, 0.12, 'triangle'); },
    page() { tone(520, 0.09, 0.1, 'sine'); tone(700, 0.1, 0.09, 'sine', 0.07); },
    best() { [523, 659, 784, 1046, 1318].forEach((n, i) => tone(n, 0.16, 0.16, 'triangle', i * 0.09)); },
    good() { [523, 784, 1046].forEach((n, i) => tone(n, 0.14, 0.15, 'triangle', i * 0.09)); },
    escape() { [440, 660, 880].forEach((n, i) => tone(n, 0.13, 0.14, 'sine', i * 0.1)); },
    bad() { tone(300, 0.25, 0.15, 'sawtooth'); tone(200, 0.35, 0.13, 'sawtooth', 0.2); },
  };
})();

/* ===== 玩家與進度存檔（每個玩家各自一份） ===== */
const OLD_SAVE = 'theater-progress';           // 舊版單人存檔，會自動搬給第一個玩家
const PKEY = 'theater-players', CKEY = 'theater-who';
const RANK = { bad: 1, escape: 2, good: 3, best: 4 };

function defaultPlayers() {
  return [{ id: 'p1', name: '姊姊', emoji: '⭐' }, { id: 'p2', name: '妹妹', emoji: '🌸' }];
}
function players() {
  try {
    const p = JSON.parse(localStorage.getItem(PKEY));
    if (Array.isArray(p) && p.length) return p;
  } catch (e) {}
  const d = defaultPlayers();
  try { localStorage.setItem(PKEY, JSON.stringify(d)); } catch (e) {}
  return d;
}
function savePlayers(list) { try { localStorage.setItem(PKEY, JSON.stringify(list)); } catch (e) {} }
function whoId() {
  const id = localStorage.getItem(CKEY);
  const list = players();
  return list.some(p => p.id === id) ? id : list[0].id;
}
function who() { return players().find(p => p.id === whoId()) || players()[0]; }
function setWho(id) { try { localStorage.setItem(CKEY, id); } catch (e) {} }

const pKey = k => 'theater-' + k + ':' + whoId();
// 舊的單人存檔搬給第一個玩家，只做一次
(function migrate() {
  try {
    const old = localStorage.getItem(OLD_SAVE);
    const first = players()[0].id;
    if (old && !localStorage.getItem('theater-progress:' + first)) {
      localStorage.setItem('theater-progress:' + first, old);
      localStorage.removeItem(OLD_SAVE);
    }
  } catch (e) {}
})();
const GRADE_META = {
  // label＝窄的地方用的短標籤；badge＝結局頁上那顆大徽章
  // 👍 這一級不寫「不錯」也不寫「普通」：她常常已經做了最難的一步，
  // 只是還沒做完。直接告訴她差什麼，比給她一個分數有用。
  best:   { label: '完美',   badge: '完美結局', color: '#1e7d46', bg: '#b7f0c2' },
  good:   { label: '差一步', badge: '只差一步', color: '#1f6fa8', bg: '#c5e4ff' },
  escape: { label: '驚險',   badge: '驚險結局', color: '#b06a00', bg: '#ffe6a8' },
  bad:    { label: '再試',   badge: '再試結局', color: '#a33',    bg: '#ffd0d0' },
};
/* 圖鑑裡結局的排法：由好到壞。劇本裡的順序是當初寫下來的順序，
   排出來會忽好忽壞，看不出要拼的是什麼。沒有等級的（後果卡模式）排最後。 */
const GRADE_RANK = { best: 0, good: 1, escape: 2, bad: 3 };
const byGrade = (endings) => (a, b) =>
  (GRADE_RANK[endings[a].grade] ?? 9) - (GRADE_RANK[endings[b].grade] ?? 9);
/* 後果卡模式：這類劇本沒有「比較好」的結局，只有「這樣選會發生什麼」。
   所以不打等級、不比較、不跳「比上次更好了」，只記錄走過哪些結果。 */
const isCons = sc => !!(sc && sc.mode === 'consequence');

function loadEnds() {
  try { return JSON.parse(localStorage.getItem(pKey('ends'))) || {}; } catch (e) { return {}; }
}
function recordEnding(id, key) {
  const e = loadEnds();
  (e[id] = e[id] || {})[key] = 1;
  try { localStorage.setItem(pKey('ends'), JSON.stringify(e)); } catch (e2) {}
}
function endsSeen(id) { return Object.keys(loadEnds()[id] || {}).length; }
// 全部劇本加起來的結局總數，以及她已經走到幾個
const totalEnds = () => SCENARIOS.reduce((a, s) => a + Object.keys(s.endings).length, 0);
const seenTotal = () => SCENARIOS.reduce((a, s) => a + endsSeen(s.id), 0);

/* 揭曉之前先讓她押一個判斷。只在第一次走到某個結局時問，重玩不再打斷。
   後果卡模式（沒有對錯）不問。 */
function loadPredict() {
  try { return JSON.parse(localStorage.getItem(pKey('predict'))) || {}; } catch (e) { return {}; }
}
function recordPredict(id, key, p, grade) {
  const d = loadPredict();
  (d[id] = d[id] || {})[key] = { p: p, g: grade };
  try { localStorage.setItem(pKey('predict'), JSON.stringify(d)); } catch (e) {}
}
const isGoodGrade = g => g === 'best' || g === 'good';
/* 先猜再看 / 直接看答案 —— 每個玩家可以各自決定 */
function guessOn() { return localStorage.getItem(pKey('guess')) !== 'off'; }
function toggleGuess() {
  try { localStorage.setItem(pKey('guess'), guessOn() ? 'off' : 'on'); } catch (e) {}
}
/* 結局頁的「📖 回顧你的選擇」——已經看過很多次之後會變成雜訊，可以關掉。
   一樣是每個玩家各自的設定。 */
function replayOn() { return localStorage.getItem(pKey('replay')) !== 'off'; }
function toggleReplay() {
  try { localStorage.setItem(pKey('replay'), replayOn() ? 'off' : 'on'); } catch (e) {}
}
// 回傳 'hit'（猜對）/ 'over'（以為不錯，其實不是）/ 'under'（以為不好，其實不錯）
function predictOutcome(p, g) {
  if (p === 'idk') return 'idk';
  const good = isGoodGrade(g);
  if (p === 'good') return good ? 'hit' : 'over';
  return good ? 'under' : 'hit';
}

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(pKey('progress'))) || {}; } catch (e) { return {}; }
}
function recordResult(id, grade) {
  const p = loadProgress();
  if (!p[id] || RANK[grade] > RANK[p[id]]) {
    p[id] = grade;
    try { localStorage.setItem(pKey('progress'), JSON.stringify(p)); } catch (e) {}
    return true;   // 這次比以前好
  }
  return false;
}

/* 選過的選項分兩種：
   - 這一輪按的  → runSeen，放記憶體，重新開始這個故事就清空
   - 以前按過的  → localStorage，跨場次留著，方便她找還沒挖過的分支
   兩種都只在「她真的按下去」的時候才記，不會因為結局從別條路看過就變灰。 */
let runSeen = {};
function loadSeen() {
  try { return JSON.parse(localStorage.getItem(pKey('seen'))) || {}; } catch (e) { return {}; }
}
function markSeen(scenarioId, nodeId, idx) {
  runSeen[nodeId + '|' + idx] = 1;
  const v = loadSeen();
  v[scenarioId + '|' + nodeId + '|' + idx] = 1;
  try { localStorage.setItem(pKey('seen'), JSON.stringify(v)); } catch (e) {}
}
function seenNow(nodeId, idx) { return !!runSeen[nodeId + '|' + idx]; }
function seenBefore(scenarioId, nodeId, idx) {
  return !!loadSeen()[scenarioId + '|' + nodeId + '|' + idx];
}
/* 從這個選項往下走（含更深的分支），還有沒有她從來沒按過的選項？
   有 → 這條路還挖得到東西；沒有 → 整條都走完了。
   注意：判斷的依據一律是「她按過沒有」，不是「結局看過沒有」。 */
function hasUnexplored(sc, target, seen) {
  const stack = [target], visited = {};
  while (stack.length) {
    const k = stack.pop();
    if (visited[k] || !sc.nodes[k]) continue;   // 走到結局就不用再往下
    visited[k] = 1;
    const cs = sc.nodes[k].choices;
    for (let i = 0; i < cs.length; i++) {
      if (!seen[sc.id + '|' + k + '|' + i]) return true;
      stack.push(cs[i].to);
    }
  }
  return false;
}

/* ===== 狀態 ===== */
const app = document.getElementById('app');
// 版本號由 build.sh 在打包時填進 <meta name="build">
const BUILD = (document.querySelector('meta[name="build"]') || {}).content || '?';
let view = 'menu';
let cur = null;      // 目前劇本
let nodeId = null;   // 目前節點
let path = [];       // [{text, label}]
let ending = null;
let endingKey = null;
let predicting = false;   // 結局揭曉前，正在等她押判斷
let improved = false;
let lastId = null;   // 上一個玩過的，隨機時避開它

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// 旁白允許 <br> 與 <b>，其餘標籤跳脫
const narrate = s => esc(s).replace(/&lt;(\/?(?:br|b))&gt;/g, '<$1>');
const plain = s => String(s).replace(/<[^>]*>/g, '');

/* 現實時間 → 時段。底色與問候都看這個。 */
function todNow() {
  const h = new Date().getHours();
  if (h < 10) return 'morning';
  if (h < 16) return 'day';
  if (h < 19) return 'dusk';
  return 'night';
}
function setTod(t) { try { document.body.dataset.tod = t; } catch (e) {} }

/* 開始一天的時候，依現在幾點跟她打個招呼。
   不改流程——一天還是從早上走到晚上，只是承認「現在幾點」。 */
// 小鎮的問候：跟著現實時間走
const GREET_TOWN = {
  morning: ['早安 ☀️', '鎮上剛醒過來。'],
  day:     ['午安 🌤️', '今天過到一半了。'],
  dusk:    ['傍晚了 🌇', '太陽快下山，大家要回家了。'],
  night:   ['晚安 🌙', '鎮上的燈都亮了。'],
};

/* ===== 小鎮 =====
   動森那種節奏：今天來看一下就好。
   一天只有一件事，而且用日期決定——同一天重開，遇到的是同一件事，
   因為「今天就是今天」。明天才會換。

   小人站在哪裡跟著現實時間走，鎮上的人每天講的話也不一樣。 */
const PLACE_POOL = {
  school: ['bully', 'quake', 'money', 'candy', 'knife', 'wish'],
  home:   ['home', 'fire', 'fakecop', 'shop', 'imposter', 'exam', 'online', 'secret', 'scam'],
  shop:   ['lost', 'breakfast'],
  park:   ['road', 'gate'],
  dojo:   ['dojo'],
  pool:   ['pool'],
};

/* 鎮上的人。一個地點可以住好幾個人（家裡就住了三個），
   點一下換一句，講完這個人的才換下一個人。

   每個人有四組話：
     lines  平常
     after  這個時段的事剛處理完（會提到剛才發生的事）
     rain   下雨天才會出現
     close  點過很多次、跟她熟了之後才解鎖
   內容是日常，偶爾夾一句提醒，像鄰居會講的那種，不是教條。 */
const NPC = {
  home: [
    { who: '媽媽', emoji: '👩',
      lines: [
        '今天過得還好嗎？跟我說說。',
        '回來啦。先洗手，飯快好了。',
        '有什麼事都可以跟我說，不管是什麼事，我都不會生氣。',
        '如果有人叫你「不要告訴媽媽」——那件事一定要告訴我。',
        '媽媽有時候會晚一點回來，但一定會回來。' ],
      after: ['剛剛那件事，你處理得怎麼樣？跟我說說看。',
              '不管結果怎樣，你願意面對就很好了。'],
      rain: ['下雨了，傘帶了嗎？'],
      close: ['你最近很常回來陪媽媽耶，媽媽很開心。'] },
    { who: '爸爸', emoji: '👨',
      lines: [
        '欸，回來啦。今天有什麼好玩的事嗎？',
        '爸爸今天下班有買你愛吃的。',
        '遇到不會處理的事，先不要自己決定，回來問我們。',
        '爸爸小時候也很怕跟大人講話，後來發現講了比較輕鬆。',
        '有人對你很好卻叫你保密，那個「保密」要特別小心。' ],
      after: ['剛才的事我聽媽媽說了。你做得不錯。',
              '下次再遇到，你就知道第一步要幹嘛了。'],
      rain: ['雨這麼大，等一下爸爸去接你。'],
      close: ['我們家這個最靠得住了。'] },
    { who: '妹妹', emoji: '👧',
      lines: [
        '姊姊姊姊！你今天去哪裡？',
        '我今天在幼兒園畫了一張圖，要給你看！',
        '姊姊你什麼時候可以陪我玩？',
        '我剛剛自己刷牙喔，沒有人幫我。',
        '姊姊，那個叔叔給的糖果可以吃嗎？'],
      after: ['姊姊你剛剛去哪裡了？我等你好久。',
              '姊姊好厲害！我長大也要跟你一樣。'],
      rain: ['下雨了！我可以踩水嗎？'],
      close: ['姊姊最好了。'] },
  ],
  school: [{ who: '老師', emoji: '👨‍🏫',
    lines: [
      '今天上課很專心喔，我有看到。',
      '不會的事情不丟臉，不問才會一直不會。',
      '班上有人看起來怪怪的、不太說話，可以來跟我說。',
      '走廊上不要跑，上次有人跌倒了。',
      '有事情發生的時候，先找大人，不要自己扛。' ],
    after: ['剛才的事我聽說了。你有處理，這一點很好。',
            '遇到狀況會想一下再決定，比反應快更重要。'],
    rain: ['下雨天，操場不能用，我們在教室裡上。'],
    close: ['你這學期進步很多，我都有在看。'] }],
  shop: [{ who: '店員阿姨', emoji: '🧑‍🍳',
    lines: [
      '一個人來買東西啊？很厲害耶。',
      '早餐要吃喔，不吃會餓一整天。',
      '零錢收好，掉了會找不到。',
      '阿姨都在這裡，有需要幫忙就進來喊一聲。',
      '外面有人跟你搭話你覺得怪怪的，就進來店裡，沒關係。' ],
    after: ['剛才好像有點事？沒事就好。',
            '有狀況就往人多的地方走，這裡永遠有人。'],
    rain: ['下雨天生意冷清，你來剛好。'],
    close: ['又是你啊，今天要一樣的嗎？'] }],
  park: [{ who: '警衛伯伯', emoji: '👮',
    lines: [
      '天黑了就早點回家喔。',
      '等不到爸媽的話，回學校裡面等，那裡有燈有人。',
      '公園裡有什麼事，來警衛室找我，我都在。',
      '伯伯在這裡三十年了，這附近我最熟。',
      '不認識的人要載你，不管他說什麼，都不要上車。' ],
    after: ['剛才那邊有點狀況，我有注意到。你沒事吧？',
            '會覺得怕是正常的，怕了還記得怎麼做，那才厲害。'],
    rain: ['雨這麼大，要不要來警衛室躲一下？'],
    close: ['你每天都會來跟伯伯打招呼，伯伯很高興。'] }],
  dojo: [{ who: '教練', emoji: '🥋',
    lines: [
      '今天的踢腿很有力氣。',
      '下課要等家人來接，不要自己先走。',
      '樓梯間光線暗，扶著扶手慢慢走。',
      '學這個不是為了跟人打架，是為了保護自己。',
      '會怕是正常的，會怕還能想辦法，那才厲害。' ],
    after: ['剛才那件事，你有沒有嚇到？',
            '真的遇到事情的時候，跑掉不丟臉，那是對的。'],
    rain: ['下雨天樓梯更滑，慢慢走。'],
    close: ['你是我這裡最認真的一個。'] }],
  pool: [{ who: '救生員', emoji: '🏊',
    lines: [
      '下水前先暖身喔。',
      '看到有人在水裡怪怪的，馬上大聲喊我——不要自己跳下去。',
      '不要在池邊跑，地很滑。',
      '嗆到水不能忍，一定要講，後面可能還有狀況。',
      '不會游泳沒關係，待在淺水區就好。' ],
    after: ['剛才有點狀況齁？處理完就好。',
            '水邊的事不能拖，你有講出來就對了。'],
    rain: ['下雨天不開放喔，改天再來。'],
    close: ['你現在敢下水了耶，進步很多。'] }],
};

function todayStamp() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
/* 把字串轉成一個穩定的數字，拿來當「今天」的種子。
   最後那三行混合不能省：只做 FNV 的話，連續日期這種很像的字串
   散不開，實測會連續九天陰、二十天晴——天氣等於好幾週都不變。 */
function seedOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 2246822507);
  h ^= h >>> 13; h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}
// 哪一篇屬於哪個地點（由 PLACE_POOL 反推），六個池子加起來剛好 21 篇
const PLACE_OF = {};
Object.keys(PLACE_POOL).forEach(k => PLACE_POOL[k].forEach(id => { PLACE_OF[id] = k; }));
const DAY_IDS = Object.keys(PLACE_OF);

/* 這個時段發生什麼事。
   改成「每個時段一件」而不是「每天一件」：她做完早上那件，
   要等到下午才會有新的。這樣「過一段時間再來看看」對她是具體的，
   而且跟畫面的天色是同一套時間。

   一天四個時段，但不是每段都有事（約四分之三機率）——
   沒事的時段就是平常的鎮上，這才像真的日子。

   要先均勻抽「哪一篇」再反推地點，不能先抽地點：
   泳池只有 1 篇、家有 9 篇，先抽地點的話泳池那篇會一直重複出現。 */
function periodEvent(tod) {
  const key = todayStamp() + '/' + (tod || todNow()) + ':' + whoId();
  const sd = seedOf(key);
  if ((sd >>> 3) % 100 < 25) return { place: null, id: null, seed: sd };  // 這個時段沒事
  const id = DAY_IDS[sd % DAY_IDS.length];
  return { place: PLACE_OF[id], id: id, seed: sd };
}
/* 挑哪一句要看情境：
   - 這個時段的事剛處理完 → 講「剛才那件事」
   - 下雨天 → 多幾句跟雨有關的
   - 跟她熟了 → 解鎖比較親近的口氣
   第幾句由「今天的種子 + 已經點了幾下」決定：
   第一次點到的那句是固定的，再點會往下走一句。 */
function npcLine(place, sd, nth, ctx) {
  const people = NPC[place];
  if (!people || !people.length) return null;
  // 把這個地點所有人、所有合用的話攤平成一串，再照順序往下走。
  // 家裡住了三個人，所以點 🏠 會輪流遇到媽媽、爸爸、妹妹。
  const pool = [];
  people.forEach(pp => {
    let lines;
    if (ctx.justDone && pp.after && pp.after.length) {
      lines = pp.after;
    } else {
      lines = pp.lines.slice();
      if (ctx.weather === 'rain' && pp.rain) lines = lines.concat(pp.rain);
      if (ctx.close && pp.close) lines = lines.concat(pp.close);
    }
    lines.forEach(t => pool.push({ who: pp.who, emoji: pp.emoji, text: t }));
  });
  if (!pool.length) return null;
  const it = pool[((sd >>> 13) + nth) % pool.length];
  return { who: it.who, emoji: it.emoji, text: it.text, more: pool.length > 1 };
}
// 完成紀錄要記到「哪一天的哪個時段」，換時段才會有新的事
const townDoneKey = (tod) => pKey('town-' + todayStamp() + '-' + (tod || todNow()));
const isPeriodDone = (tod) => localStorage.getItem(townDoneKey(tod)) === '1';
function markPeriodDone() { try { localStorage.setItem(townDoneKey(), '1'); } catch (e) {} }

// 下一個時段叫什麼，用來告訴她「什麼時候再來」
const NEXT_PERIOD = { morning: '下午', day: '傍晚', dusk: '晚上', night: '明天早上' };

/* 天氣：一天一種，用日期決定，所以同一天都一樣。
   晴天最多，雨天最少——跟真的天氣一樣，也讓下雨那天比較特別。 */
const WEATHER = {
  sun:   { name: '晴天', icon: '☀️' },
  cloud: { name: '多雲', icon: '☁️' },
  rain:  { name: '下雨', icon: '🌧️' },
};
function weatherToday() {
  const r = (seedOf('w:' + todayStamp()) >>> 5) % 100;
  return r < 55 ? 'sun' : r < 82 ? 'cloud' : 'rain';
}

/* 小鎮會跟著她長大：走過的結局越多，鎮上的東西越多。
   這是為了讓「結局圖鑑 106」這個數字變成她每天看得見的東西。 */
function townStage() {
  const pct = totalEnds() ? seenTotal() / totalEnds() : 0;
  return pct >= 0.8 ? 4 : pct >= 0.5 ? 3 : pct >= 0.3 ? 2 : pct >= 0.1 ? 1 : 0;
}

/* 熟悉度：跟某個人講過幾次話。講夠多次會解鎖比較熟的口氣。 */
function loadFriend() {
  try { return JSON.parse(localStorage.getItem(pKey('friend'))) || {}; } catch (e) { return {}; }
}
function bumpFriend(place) {
  const f = loadFriend();
  f[place] = (f[place] || 0) + 1;
  try { localStorage.setItem(pKey('friend'), JSON.stringify(f)); } catch (e) {}
  return f[place];
}
const CLOSE_AT = 12;   // 講過這麼多次就算熟了

/* 這個地點還有幾種結局沒走過。
   拿來告訴她「這裡還有東西可以挖」，也用來決定自由玩要給哪一篇。 */
function placeUnseen(place) {
  const ends = loadEnds();
  let n = 0;
  (PLACE_POOL[place] || []).forEach(id => {
    const sc = SCENARIOS.find(x => x.id === id);
    if (!sc) return;
    const got = ends[id] || {};
    Object.keys(sc.endings).forEach(k => { if (!got[k]) n++; });
  });
  return n;
}
/* 自由玩：優先給「還有最多結局沒看過」的那一篇，
   讓她每次回到同一個地方都還有新東西。 */
function pickFreePlay(place) {
  const ends = loadEnds();
  const pool = (PLACE_POOL[place] || []).map(id => {
    const sc = SCENARIOS.find(x => x.id === id);
    const got = ends[id] || {};
    const left = sc ? Object.keys(sc.endings).filter(k => !got[k]).length : 0;
    return { id: id, left: left };
  });
  if (!pool.length) return null;
  const max = Math.max.apply(null, pool.map(x => x.left));
  const best = pool.filter(x => x.left === max);
  return best[Math.floor(Math.random() * best.length)].id;
}

/* 天神爸爸。
   刻意不放進情境裡當「求救選項」——這個遊戲從頭到尾的原則是
   保護她的是她自己的判斷，多一個「叫爸爸來」的選項，
   最省力的答案就永遠是那個，而現實裡沒有人會來。

   所以他只在她走到「🔁 再試」的時候出現：那是她最挫折的一刻，
   也是最需要爸爸的一刻——給的是打氣，不是代替她解決。 */
const DAD_LINES = [
  '沒關係。這一次沒走好，不代表下一次也是。',
  '爸爸也有很多事情第一次做不好。回去再走一次就好。',
  '你願意再試一次，這件事本身就很厲害了。',
  '記住剛才哪裡卡住就好，其他的別放心上。',
  '不管你走到哪一種結局，爸爸都在這裡。',
];
function dadLine() { return DAD_LINES[Math.floor(Math.random() * DAD_LINES.length)]; }

const PLACE_NAME = { home: '家裡', school: '學校', shop: '商店街', park: '公園', dojo: '道館', pool: '泳池' };

// 現實時間決定她人在哪裡
const WHERE_NOW = { morning: 'home', day: 'school', dusk: 'park', night: 'home' };

let fromTown = false;   // 這一篇是從小鎮點進來的
let townFree = false;   // 而且是「自由玩」的那種，不算今天的事
/* 走過去要花多久。走查會把它設成 0 讓動畫直接跳過——
   不然點一下變成非同步，整個走查都要改寫成非同步。 */
let walkMs = 780;
let townMsg = null;     // 點了鎮上的人之後要顯示的話
let townTaps = {};      // 每個地點點過幾下，決定講到第幾句

function renderTown() {
  const tod = todNow(), ev = periodEvent(tod), wx = weatherToday();
  const done = ev.id ? isPeriodDone(tod) : false;
  const stage = townStage(), friend = loadFriend();

  const marks = {};
  Object.keys(PLACE_POOL).forEach(k => { marks[k] = NPC[k] ? '💬' : ''; });
  if (ev.place) marks[ev.place] = done ? '✓' : '❗';

  const hint = ev.place && !done
    ? '有一個地方出事了 ❗　點它看看。'
    : `${ev.place ? `這個時段的事處理完了 ✓　<b>${NEXT_PERIOD[tod]}</b>還會有新的。<br>` : '這個時段鎮上很平靜。<br>'}`
      + '想繼續玩的話，<b>點任何一個地方都可以</b>。';

  app.innerHTML = `
    <div class="card anim">
      <div class="daytop">
        <div class="greet"><b>${GREET_TOWN[tod][0]}</b>${GREET_TOWN[tod][1]}</div>
        <div class="wx">${WEATHER[wx].icon} ${WEATHER[wx].name}　·　🖼️ ${seenTotal()} / ${totalEnds()}</div>
      </div>
      <div class="town">${townSVG(tod, marks, WHERE_NOW[tod], wx, stage)}</div>
      ${townMsg ? `<div class="says">
          <span class="face">${townMsg.emoji}</span>
          <span><b>${esc(townMsg.who)}</b><br>${narrate(townMsg.text)}
            ${townMsg.more ? '<span class="more">再點一下，還有話說 ▸</span>' : ''}</span>
        </div>
        <button id="tplay" class="playhere">
          🎭 在${esc(PLACE_NAME[townMsg.place] || '這裡')}玩一篇
          ${placeUnseen(townMsg.place) ? `<small>還有 ${placeUnseen(townMsg.place)} 種結局沒看過</small>`
                                       : '<small>這裡的結局都看過了，再走一次也可以</small>'}
        </button>`
        : `<div class="townhint">${hint}</div>`}
      <div class="row" style="margin-top:10px;">
        <button class="mini" id="tmenu">🎭 劇本選單</button>
        <button class="mini" id="tgal">🖼️ 結局圖鑑</button>
      </div>
    </div>`;

  /* 點了地點，小人先走過去，走到了才發生事情。
     只是把她平移過去，不是真的可以自由走動——但「走著走著遇到事情」
     的感覺出來了，而且幾乎沒有成本。 */
  function walkTo(place, after) {
    const from = PLACES.find(p => p.key === WHERE_NOW[tod]) || PLACES[PLACES.length - 1];
    const to = PLACES.find(p => p.key === place);
    const w = document.getElementById('walker');
    if (!walkMs || !w || !to || to.key === from.key) return after();
    w.setAttribute('transform',
      'translate(' + (to.stand[0] - from.stand[0]) + ',' + (to.stand[1] - from.stand[1]) + ')');
    setTimeout(after, walkMs);
  }

  app.querySelectorAll('.spot').forEach(g => {
    g.style.cursor = 'pointer';
    g.onclick = () => {
      const k = g.dataset.spot;
      if (ev.place && k === ev.place && !done) {      // 這個時段的事
        Sfx.page();
        walkTo(k, () => { townMsg = null; fromTown = true; townFree = false; startScenario(ev.id); });
        return;
      }
      // 鎮上的人講話，再點會講下一句
      Sfx.tap();
      townTaps[k] = (townTaps[k] || 0) + (townMsg && townMsg.place === k ? 1 : 0);
      const n = bumpFriend(k);
      townMsg = npcLine(k, ev.seed + seedOf(k), townTaps[k], {
        justDone: done && k === ev.place,
        weather: wx,
        close: n >= CLOSE_AT,
      });
      if (townMsg) townMsg.place = k;
      render();
    };
  });
  const play = document.getElementById('tplay');
  if (play) play.onclick = () => {
    const place = townMsg.place, id = pickFreePlay(place);
    if (!id) return;
    Sfx.page();
    walkTo(place, () => { townMsg = null; fromTown = true; townFree = true; startScenario(id); });
  };
  document.getElementById('tmenu').onclick = () => { Sfx.tap(); townMsg = null; view = 'menu'; render(); };
  document.getElementById('tgal').onclick  = () => { Sfx.tap(); townMsg = null; view = 'gallery'; render(); };
}


function render() {
  setTod(todNow());
  if (view === 'menu') renderMenu();
  else if (view === 'check') renderCheck();
  else if (view === 'gallery') renderGallery();
  else if (view === 'who') renderWho();
  else if (view === 'story') renderStory();
  else if (view === 'town') renderTown();
  else renderEnding();
  window.scrollTo(0, 0);
}

/* 換人玩：每個人的通關紀錄與「走過的選項」各自分開 */
function renderWho() {
  const list = players(), me = whoId();
  app.innerHTML = `
    <div class="card anim">
      <h1>👥 誰要玩？</h1>
      <div class="sub">每個人的紀錄是分開的，不會互相蓋掉</div>
      <div class="pick-grid">
        ${list.map(p => {
          let done = 0;
          try {
            const pr = JSON.parse(localStorage.getItem('theater-progress:' + p.id)) || {};
            done = SCENARIOS.filter(s => pr[s.id] === 'best').length;
          } catch (e) {}
          return `
            <button class="pick who-pick${p.id === me ? ' on' : ''}" data-id="${esc(p.id)}">
              <span class="ico">${p.emoji}</span>
              <span style="flex:1; min-width:0;">
                <span class="t">${esc(p.name)}</span>
                <span class="g">完美通關 ${done} / ${SCENARIOS.length}</span>
              </span>
              ${p.id === me ? '<span class="done">✅</span>' : '<span class="done" style="opacity:.25;">▶️</span>'}
            </button>`;
        }).join('')}
      </div>
      <button id="addwho" style="width:100%; margin-top:10px; background:#a8e6c0;">＋ 新增一個玩家</button>
      ${list.length > 1 ? `<button id="delwho" class="mini" style="margin-top:8px;">🗑️ 刪掉目前這個玩家</button>` : ''}
      <div class="row" style="margin-top:12px;">
        <button class="mini" id="whoback">← 回劇本選單</button>
      </div>
    </div>
  `;
  document.querySelectorAll('.who-pick').forEach(b => {
    b.onclick = () => { Sfx.tap(); setWho(b.dataset.id); view = 'menu'; render(); };
  });
  document.getElementById('addwho').onclick = () => {
    const name = (prompt('新玩家的名字？') || '').trim().slice(0, 8);
    if (!name) return;
    const emojis = ['🐨', '🐧', '🦊', '🐯', '🦄', '🐼', '🐰', '🐱'];
    const list2 = players();
    list2.push({ id: 'p' + Date.now(), name, emoji: emojis[list2.length % emojis.length] });
    savePlayers(list2);
    setWho(list2[list2.length - 1].id);
    view = 'menu'; render();
  };
  document.getElementById('delwho')?.addEventListener('click', () => {
    const m = who();
    if (!confirm('要刪掉「' + m.name + '」和他的所有紀錄嗎？')) return;
    localStorage.removeItem('theater-progress:' + m.id);
    localStorage.removeItem('theater-seen:' + m.id);
    const rest = players().filter(p => p.id !== m.id);
    savePlayers(rest);
    setWho(rest[0].id);
    render();
  });
  document.getElementById('whoback').onclick = () => { view = 'menu'; render(); };
}

function renderMenu() {
  const p = loadProgress();
  const graded = SCENARIOS.filter(s => !isCons(s));
  const done = graded.filter(s => p[s.id] === 'best').length;
  app.innerHTML = `
    <div class="card anim">
      <button id="whobtn" class="whorow">
        <span class="whoemo">${who().emoji}</span>
        <span class="whoname">${esc(who().name)} 的劇場</span>
        <span class="whoswap">換人 ⇄</span>
      </button>
      <h1>🎭 情境劇場</h1>
      <div class="sub">你的每一個選擇，都會改變故事的結局</div>
      <div class="safeframe">
        🌱 <b>大部分的人都是安全、願意幫忙的。</b><br>
        這些故事是在練習：少數真的遇到危險的時候，你可以怎麼保護自己。
      </div>
      <div class="modes">
        <button id="daybtn" style="background:#2f6f8f; color:#fff;">
          🏘️ 小鎮<small>今天發生了什麼</small>
        </button>
        <button id="rand" style="background:#6b4a9e; color:#fff;">
          🎲 隨機挑一個<small>抽一篇來玩</small>
        </button>
      </div>
      <button id="galbtn" class="statbar">
        <span>🌟 完美通關 ${done} / ${graded.length}</span>
        <span class="sep">·</span>
        <span>🖼️ 圖鑑 ${seenTotal()} / ${totalEnds()}</span>
      </button>
      <div class="pick-grid">
        ${SCENARIOS.map(s => {
          const cons = isCons(s);
          const seen = cons ? endsSeen(s.id) : 0;
          const g = cons ? null : p[s.id];
          const m = g ? GRADE_META[g] : null;
          return `
            <button class="pick" data-id="${esc(s.id)}">
              <span class="ico">${s.emoji}</span>
              <span style="flex:1; min-width:0;">
                <span class="t">${esc(s.title)}</span>
                <span class="g">${esc(s.tag)}</span>
              </span>
              ${(() => {
                const got = endsSeen(s.id), all = Object.keys(s.endings).length;
                if (!got) return '<span class="done" style="opacity:.25;">▶️</span>';
                const icon = cons ? '' :
                  (g === 'best' ? '🌟' : g === 'good' ? '👍' : g === 'escape' ? '😮‍💨' : g === 'bad' ? '🔁' : '');
                return `<span class="done" title="走過 ${got} / ${all} 種結局"
                  style="font-size:12.5px; font-weight:900; color:#6b4a9e; white-space:nowrap;">${icon} ${got}/${all}</span>`;
              })()}
            </button>`;
        }).join('')}
      </div>
      <div class="row" style="margin-top:14px;">
        <button class="mini" id="mute">${Sfx.isMuted() ? '🔇 靜音中' : '🔊 有聲'}</button>
        <button class="mini" id="music">${Sfx.isBgmOn() ? Sfx.trackName() : '🎵 音樂關'}</button>
        <button class="mini" id="reset">🗑️ 清除紀錄</button>
        <button class="mini" id="guessmode">${guessOn() ? '🤔 先猜再看' : '⚡ 直接看答案'}</button>
        <button class="mini" id="replaymode">${replayOn() ? '📖 回顧開' : '📖 回顧關'}</button>
        <button class="mini" id="check">📊 判斷紀錄</button>
        <button class="mini" id="map">🗺️ 分支圖</button>
        <button class="mini" id="back">🎲 回骰子遊戲</button>
      </div>
      <p style="text-align:center; font-size:12px; color:#6b5a7e; margin:14px 0 0; line-height:1.7;">
        沒有「輸」這件事 —— 走到不好的結局也會告訴你為什麼，<br>再走一次就好。
      </p>
      <p style="text-align:center; font-size:11.5px; color:#8a7fa8; margin:10px 0 0;">故事裡的選項會這樣標：</p>
      <div class="legend">
        <span class="lg lg-new">還沒選過</span>
        <span class="lg lg-past">選過・裡面還有</span>
        <span class="lg lg-done">這條走完了</span>
      </div>
      <p style="text-align:center; margin:14px 0 0;">
        <button id="ver" style="background:none; border:0; box-shadow:none; padding:4px;
          font-size:11px; color:#a99ac9; font-weight:600; text-decoration:underline;">
          版本 ${esc(BUILD)}　·　點一下檢查更新
        </button>
      </p>
    </div>
  `;
  document.querySelectorAll('.pick').forEach(b => {
    b.onclick = () => { Sfx.unlock(); Sfx.tap(); startScenario(b.dataset.id); };
  });
  document.getElementById('whobtn').onclick = () => { Sfx.tap(); view = 'who'; render(); };
  document.getElementById('rand').onclick = () => { Sfx.unlock(); Sfx.tap(); startRandom(); };
  document.getElementById('mute').onclick = () => { Sfx.toggle(); render(); };
  // 音樂鍵：關著就打開，開著就換下一首
  document.getElementById('music').onclick = () => {
    if (!Sfx.isBgmOn()) Sfx.toggleBgm(); else Sfx.nextTrack();
    render();
  };
  document.getElementById('music').oncontextmenu = e => { e.preventDefault(); Sfx.toggleBgm(); render(); };
  document.getElementById('daybtn').onclick = () => { Sfx.tap(); townMsg = null; view = 'town'; render(); };
  document.getElementById('galbtn').onclick = () => { Sfx.tap(); view = 'gallery'; render(); };
  document.getElementById('guessmode').onclick = () => { Sfx.tap(); toggleGuess(); render(); };
  document.getElementById('replaymode').onclick = () => { Sfx.tap(); toggleReplay(); render(); };
  document.getElementById('check').onclick = () => { Sfx.tap(); view = 'check'; render(); };
  document.getElementById('ver').onclick = async (ev) => {
    // 舊版只是換一個查詢字串重新載入，但按下去畫面一閃，
    // 根本不知道到底有沒有更新到。改成先去問伺服器最新的 build 是多少，
    // 有新的才重新載入，沒有就直接說「已經是最新版」。
    const btn = ev.currentTarget;
    btn.textContent = '檢查中…';
    try {
      const r = await fetch(location.pathname + '?t=' + Date.now(), { cache: 'no-store' });
      const m = (await r.text()).match(/name="build" content="([^"]+)"/);
      if (!m) throw new Error('讀不到版本');
      if (m[1] !== BUILD) { location.href = location.pathname + '?v=' + m[1]; return; }
      btn.textContent = '已經是最新版　' + BUILD;
    } catch (e) {
      // 用 file:// 打開、或連不上網的時候，就退回原本硬重載的作法
      location.href = location.pathname + '?v=' + Math.floor(Date.now() / 1000);
    }
  };
  document.getElementById('map').onclick = () => { location.href = './map.html'; };
  document.getElementById('back').onclick = () => { location.href = './index.html'; };
  document.getElementById('reset').onclick = () => {
    if (confirm('要清除「' + who().name + '」的所有紀錄嗎？')) {
      localStorage.removeItem(pKey('progress'));
      localStorage.removeItem(pKey('seen'));   // 舊版留下的，清掉
      localStorage.removeItem(pKey('ends'));
      localStorage.removeItem(pKey('predict'));
      render();
    }
  };
}

// 隨機挑一個，但避開剛剛玩過的那個（不然常常連抽到同一個）
function startRandom() {
  const pool = SCENARIOS.filter(s => s.id !== lastId);
  const list = pool.length ? pool : SCENARIOS;
  startScenario(list[Math.floor(Math.random() * list.length)].id);
}

function startScenario(id) {
  if (view === 'menu') { fromTown = false; townFree = false; }   // 從選單進來就不是小鎮模式
  cur = SCENARIOS.find(s => s.id === id);
  if (!cur) return;
  lastId = id;
  nodeId = null;      // null = 顯示開場白
  runSeen = {};       // 灰色只記這一輪
  path = [];
  ending = null;
  endingKey = null;
  predicting = false;
  view = 'story';
  render();
}

function renderStory() {
  // 開場白
  if (nodeId === null) {
    app.innerHTML = `
      <div class="card anim">
        <h1>${cur.emoji} ${esc(cur.title)}</h1>
        <div class="sub">${esc(cur.tag)}</div>
        ${introFor(cur.id) ? `<div class="scene pop">${introFor(cur.id)}</div>` : ''}
        <div class="stage">
          <div class="narr">${narrate(cur.intro)}</div>
        </div>
        <div class="choices">
          <button class="choice" id="go" style="text-align:center; background:#6b4a9e; color:#fff;">開始 ▶</button>
        </div>
        <div class="row">
          <button class="mini" id="music2">${Sfx.isBgmOn() ? '🎵 音樂開' : '🎵 音樂關'}</button>
          <button class="mini" id="quit">${fromTown ? '← 回小鎮' : '← 選別的故事'}</button>
        </div>
      </div>
    `;
    document.getElementById('go').onclick = () => { Sfx.page(); nodeId = cur.start; render(); };
    document.getElementById('music2').onclick = () => { Sfx.toggleBgm(); render(); };
    document.getElementById('quit').onclick = () => {
      view = fromTown ? 'town' : 'menu'; render();
    };
    return;
  }

  const n = cur.nodes[nodeId];
  const depth = path.length;
  app.innerHTML = `
    <div class="card anim">
      <div class="steps">
        ${Array.from({ length: Math.max(depth + 1, 3) }, (_, i) =>
          `<span class="dot ${i <= depth ? 'on' : ''}"></span>`).join('')}
      </div>
      <div style="text-align:center; font-size:13px; font-weight:800; color:#6b4a9e;">
        ${cur.emoji} ${esc(cur.title)}
      </div>
      <div class="storygrid">
        <div class="stage">
          <div class="narr">${narrate(n.text)}</div>
          ${n.hint ? `<div class="hint">🤔 ${narrate(n.hint)}</div>` : ''}
        </div>
        <div>
          <div style="font-size:14px; font-weight:800; color:#6b4a9e; margin-bottom:7px;">你要怎麼做？</div>
          <div class="choices">
            ${(() => { const allSeen = loadSeen(); return n.choices.map((c, i) => {
              // 只標她真的按下去的；按過的再看這條路裡面還有沒有沒按過的選項
              const taken = seenNow(nodeId, i) || seenBefore(cur.id, nodeId, i);
              const more = taken && hasUnexplored(cur, c.to, allSeen);
              const cls = !taken ? '' : (more ? ' past' : ' seen');
              const mark = !taken ? ''
                         : more ? '<span class="pastmark">選過・裡面還有</span>'
                         : '<span class="seenmark">這條走完了</span>';
              return `<button class="choice${cls}" data-i="${i}">${esc(c.label)}${mark}</button>`;
            }).join(''); })()}
          </div>
        </div>
      </div>
      <div class="row">
        <button class="mini" id="music2">${Sfx.isBgmOn() ? '🎵 音樂開' : '🎵 音樂關'}</button>
        <button class="mini" id="quit">${fromTown ? '← 回小鎮' : '← 離開這個故事'}</button>
      </div>
    </div>
  `;
  document.querySelectorAll('.choice').forEach(b => {
    b.onclick = () => choose(parseInt(b.dataset.i, 10));
  });
  document.getElementById('music2')?.addEventListener('click', () => { Sfx.toggleBgm(); render(); });
  document.getElementById('quit').onclick = () => {
      view = fromTown ? 'town' : 'menu'; render();
    };
}

function choose(i) {
  const n = cur.nodes[nodeId];
  const c = n.choices[i];
  markSeen(cur.id, nodeId, i);
  path.push({ text: plain(n.text), label: c.label });
  const nxt = c.to;
  if (cur.nodes[nxt]) {
    Sfx.page();
    nodeId = nxt;
    render();
  } else if (cur.endings[nxt]) {
    ending = cur.endings[nxt];
    endingKey = nxt;
    const firstTime = !(loadEnds()[cur.id] || {})[nxt];
    recordEnding(cur.id, nxt);
    predicting = firstTime && !isCons(cur) && guessOn();
    if (isCons(cur)) {
      improved = false;
      Sfx.good();                       // 中性的收尾音，不用高低分暗示好壞
    } else {
      improved = recordResult(cur.id, ending.grade);
      // 還在等她押判斷的時候，不能用音效先洩漏答案
      if (predicting) Sfx.page();
      else ({ best: Sfx.best, good: Sfx.good, escape: Sfx.escape, bad: Sfx.bad }[ending.grade] || Sfx.good)();
    }
    if (fromTown && !townFree) markPeriodDone();
    view = 'end';
    render();
  } else {
    console.error('找不到目標節點:', nxt);
  }
}

function renderGuess() {
  app.innerHTML = `
    <div class="card anim">
      <div class="stage" style="margin-top:0;">
        <div class="narr">${narrate(ending.text)}</div>
      </div>
      <div class="guess">
        <div class="guess-q">你覺得這個選擇，結果好嗎？</div>
        <div class="guess-s">先自己想一想，答完就會看到結果和圖片。<br>猜錯不會扣分——猜錯的那幾題，才是最值得跟爸媽聊的。</div>
        <div class="guess-btns">
          <button id="g-good">🙂 我覺得應該不錯</button>
          <button id="g-bad">😟 好像不太好</button>
          <button id="g-idk">🤔 我不確定</button>
        </div>
      </div>
    </div>
  `;
  const pick = p => {
    recordPredict(cur.id, endingKey, p, ending.grade);
    predicting = false;
    ({ best: Sfx.best, good: Sfx.good, escape: Sfx.escape, bad: Sfx.bad }[ending.grade] || Sfx.good)();
    render();
  };
  document.getElementById('g-good').onclick = () => pick('good');
  document.getElementById('g-bad').onclick = () => pick('bad');
  document.getElementById('g-idk').onclick = () => pick('idk');
}

/* 結局圖鑑：101 張插圖當成收藏品。沒拿到的只顯示問號，不劇透標題也不顯示圖 */
function renderGallery() {
  const got = seenTotal(), all = totalEnds();
  const pct = Math.round(got / all * 100);
  app.innerHTML = `
    <div class="card anim">
      <h1>🖼️ 結局圖鑑</h1>
      <div class="sub">每走到一種新結局，就會多一張圖</div>
      <div class="galtop">
        <div class="galnum">${got} <small>/ ${all}</small></div>
        <div class="gal-bar"><i style="width:${pct}%"></i></div>
      </div>
      ${SCENARIOS.map(sc => {
        const done = loadEnds()[sc.id] || {};
        const keys = Object.keys(sc.endings).sort(byGrade(sc.endings));
        const n = keys.filter(k => done[k]).length;
        return `
          <div class="gal">
            <h3>${sc.emoji} ${esc(sc.title)}<span class="n">${n} / ${keys.length}</span></h3>
            <div class="gal-grid">
              ${keys.map(k => {
                if (!done[k]) return '<div class="gal-lock">？</div>';
                const e = sc.endings[k];
                const m = isCons(sc)
                  ? { color: '#6b4a9e', bg: '#eee6f8' }
                  : GRADE_META[e.grade];
                return `
                  <div class="gal-cell" style="border-color:${m.color};">
                    ${sceneFor(sc.id, k, e.grade)}
                    <div class="gal-cap" style="background:${m.bg}; color:${m.color};">${esc(e.title)}</div>
                  </div>`;
              }).join('')}
            </div>
          </div>`;
      }).join('')}
      <div class="row" style="margin-top:4px;">
        <button id="gal-back" style="background:#6b4a9e; color:#fff;">← 回首頁</button>
      </div>
    </div>`;
  document.getElementById('gal-back').onclick = () => { Sfx.tap(); view = 'menu'; render(); };
}

/* 判斷紀錄：她以為對、結果不是的題目 —— 給爸媽看的 */
function renderCheck() {
  const d = loadPredict();
  const rows = [];
  SCENARIOS.forEach(sc => Object.keys(d[sc.id] || {}).forEach(k => {
    const r = d[sc.id][k], e = sc.endings[k];
    if (!e) return;
    rows.push({ sc: sc, e: e, key: k, p: r.p, out: predictOutcome(r.p, r.g) });
  }));
  const over = rows.filter(r => r.out === 'over');
  const under = rows.filter(r => r.out === 'under');
  const hit = rows.filter(r => r.out === 'hit');
  const idk = rows.filter(r => r.out === 'idk');
  const m = g => GRADE_META[g];
  const line = r => `
    <div class="chk-row">
      <span>${r.sc.emoji}</span>
      <span class="w"><b style="color:#6b4a9e;">${esc(r.sc.title)}</b><br>
        <span style="color:#6b5a7e; font-size:12px;">${esc(r.e.title)}</span></span>
      <span class="chk-tag" style="background:${m(r.e.grade).bg}; color:${m(r.e.grade).color};">${m(r.e.grade).label}</span>
    </div>`;
  app.innerHTML = `
    <div class="card anim">
      <h1>📊 判斷紀錄</h1>
      <div class="sub">${esc(who().name)} 走到每個結局之前，先猜了結果好不好</div>
      <div class="chk-num" style="margin-top:12px;">
        <div>猜過 <b>${rows.length}</b> 次</div>
        <div>猜對 <b>${hit.length}</b></div>
        <div>不確定 <b>${idk.length}</b></div>
      </div>
      ${rows.length === 0 ? `<div class="chk"><h3>還沒有紀錄</h3>
        <div style="font-size:13px; color:#6b5a7e; line-height:1.8;">
          第一次走到一個新結局的時候，遊戲會先問她覺得結果好不好，之後才揭曉。<br>
          玩過幾篇再回來看。</div></div>` : ''}
      ${!guessOn() ? `<div class="chk"><h3>⚡ 現在是「直接看答案」</h3>
        <div style="font-size:13px; color:#6b5a7e; line-height:1.8;">
          這個模式不會問她的判斷，所以不會累積新紀錄。<br>
          想再收集的話，回首頁把它切回「🤔 先猜再看」。</div></div>` : ''}
      ${over.length ? `<div class="chk">
        <h3>😮 她以為不錯，結果不是（${over.length}）</h3>
        <div style="font-size:12.5px; color:#6b5a7e; margin-bottom:6px;">這幾題最值得聊——她的判斷跟實際結果不一樣。</div>
        ${over.map(line).join('')}</div>` : ''}
      ${under.length ? `<div class="chk">
        <h3>🙂 她以為不好，其實不錯（${under.length}）</h3>
        <div style="font-size:12.5px; color:#6b5a7e; margin-bottom:6px;">她做對了但不太有把握，可以肯定她一下。</div>
        ${under.map(line).join('')}</div>` : ''}
      ${idk.length ? `<div class="chk">
        <h3>🤔 她說不確定（${idk.length}）</h3>
        ${idk.map(line).join('')}</div>` : ''}
      <div class="row" style="margin-top:12px;">
        <button id="chk-back" style="background:#6b4a9e; color:#fff;">← 回首頁</button>
      </div>
    </div>
  `;
  document.getElementById('chk-back').onclick = () => { Sfx.tap(); view = 'menu'; render(); };
}

function renderEnding() {
  if (predicting) return renderGuess();
  const cons = isCons(cur);
  const m = GRADE_META[ending.grade];
  app.innerHTML = `
    <div class="card">
      <div class="endgrid">
        <div class="result">
          <div class="scene pop">${sceneFor(cur.id, endingKey, ending.grade)}</div>
          <h1>${esc(ending.title)}</h1>
          ${cons
            ? `<span class="badge" style="background:#eee6f8; color:#6b4a9e;">💬 這個選擇的結果</span>`
            : `<span class="badge" style="background:${m.bg}; color:${m.color};">${m.badge}</span>`}
          ${!cons && improved && isGoodGrade(ending.grade) ? `<div style="font-weight:900; color:#c9a000; margin-top:8px;">🎉 比上次更好了！</div>` : ''}
          <div style="font-size:12px; color:#6b5a7e; margin-top:8px; line-height:1.6;">
            ${cons ? '這個故事沒有滿分答案。<br>' : ''}你走過 ${endsSeen(cur.id)} / ${Object.keys(cur.endings).length} 種結局${endsSeen(cur.id) < Object.keys(cur.endings).length ? '，再走一次看看別條路' : '，全部都看過了 🎉'}。
          </div>
        </div>
        <div>
          <div class="stage" style="margin-top:0;">
            <div class="narr">${narrate(ending.text)}</div>
          </div>
          <div class="lesson">
            <div style="font-weight:900; margin-bottom:5px; color:#1e7d46;">${cons ? '🤔 想一想' : '💡 學到了什麼'}</div>
            ${narrate(ending.lesson)}
          </div>
          ${ending.grade === 'bad' ? `<div class="dadsay">
            <div class="dadart"><svg viewBox="0 0 44 46" aria-hidden="true">${DAD(22, 43, 0.55, 'reachR')}</svg></div>
            <div><b>爸爸</b><br>${narrate(dadLine())}</div>
          </div>` : ''}
          <div class="talkbox">
            <div class="talkbox-h">💬 跟爸爸媽媽討論</div>
            <div>${narrate(cur.talk || '把這個故事講給爸爸媽媽聽，問問看他們會怎麼做？')}</div>
          </div>
          <div class="safeframe mini">
            <span class="sf-ico">🌱</span>
            <span class="sf-txt">大部分的人都是安全、願意幫忙的。<br>
              這個故事是在練習：<b>少數真的遇到危險的時候，你可以怎麼保護自己。</b></span>
          </div>
          ${replayOn() ? `
          <div class="replay">
            <h3>📖 回顧你的選擇</h3>
            ${path.map((p, i) => `
              <div class="step-row">
                <span class="step-n">${i + 1}</span>
                <span><span style="color:#6b5a7e;">${esc(p.text.slice(0, 26))}${p.text.length > 26 ? '…' : ''}</span><br>
                <b style="color:#6b4a9e;">→ ${esc(p.label)}</b></span>
              </div>`).join('')}
          </div>` : ''}
        </div>
      </div>
      ${fromTown ? `
      <div class="row">
        <button id="tgo" style="background:#2f6f8f; color:#fff; width:100%;">回小鎮 🏘️</button>
      </div>` : `
      <div class="row">
        <button id="again" style="background:#6b4a9e; color:#fff;">🔁 再走一次</button>
        <button id="rand">🎲 隨機下一個</button>
        <button id="menu" style="background:#fff;">🎭 選別的故事</button>
      </div>`}
      <div class="row" style="margin-top:8px;">
        <button class="mini" id="music2">${Sfx.isBgmOn() ? '🎵 音樂開' : '🎵 音樂關'}</button>
      </div>
    </div>
  `;
  if (fromTown) {
    document.getElementById('tgo').onclick = () => {
      Sfx.tap(); fromTown = false; townFree = false; townMsg = null; view = 'town'; render();
    };
  } else {
    document.getElementById('again').onclick = () => { Sfx.tap(); startScenario(cur.id); };
    document.getElementById('rand').onclick = () => { Sfx.tap(); startRandom(); };
    document.getElementById('menu').onclick = () => { Sfx.tap(); view = 'menu'; render(); };
  }
  document.getElementById('music2')?.addEventListener('click', () => { Sfx.toggleBgm(); render(); });
}

// 瀏覽器規定要有使用者動作才能播放聲音，第一次碰畫面就解鎖並開始音樂
['pointerdown', 'keydown'].forEach(ev =>
  document.addEventListener(ev, () => Sfx.unlock(), { once: true }));

render();

/* 一打開就自動對一次版本。
   頁面上那兩行 <meta http-equiv="Cache-Control"> 其實瀏覽器不理，
   只有伺服器回傳的標頭算數，而 GitHub Pages 的我們改不了——
   所以按重新載入不一定拿得到新版，已經害人卡在舊版三次。
   這裡靜靜問一次伺服器，有新版才重載，網址帶上版本號避開快取。
   sessionStorage 那道鎖確保「同一次開啟最多只自動重載一次」，不會變成無限重整。 */
(async function autoUpdate() {
  if (location.protocol === 'file:') return;          // 本機開檔不用查
  if (sessionStorage.getItem('theater-autoreload')) return;
  try {
    const r = await fetch(location.pathname + '?t=' + Date.now(), { cache: 'no-store' });
    const m = (await r.text()).match(/name="build" content="([^"]+)"/);
    if (m && m[1] !== BUILD) {
      sessionStorage.setItem('theater-autoreload', '1');
      location.replace(location.pathname + '?v=' + m[1]);
    }
  } catch (e) { /* 沒網路就算了，照樣可以玩 */ }
})();
