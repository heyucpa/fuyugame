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

/* ===== 平安的一天 =====
   另一種玩法：不是挑一篇看，而是走完一天。
   早上出門 → 在學校 → 放學後 → 晚上回到家，四段。

   不是每一段都會出事——一天裡隨機兩到三段有狀況，其餘是平順的。
   這是刻意的：首頁那句安全提醒寫著「大部分的人都是安全、願意幫忙的」，
   讓大部分的路段真的平安無事，比用文字講一次有用。

   四段的分法照劇本裡實際寫的時間與地點：
   「去買早餐」是週末早上、「等不到爸媽」是放學鐘響、
   「一個人在家」是爸媽出門之後。 */
const STOPS = [
  { key: 'morning', icon: '🌅', name: '早上<br>出門',   pool: ['breakfast', 'scam'] },
  { key: 'school',  icon: '🏫', name: '在學校',         pool: ['bully', 'quake', 'money', 'candy', 'knife', 'wish'] },
  { key: 'after',   icon: '🌆', name: '放學後',         pool: ['gate', 'road', 'dojo', 'lost', 'pool'] },
  { key: 'night',   icon: '🏠', name: '晚上<br>回到家', pool: ['home', 'fire', 'fakecop', 'shop', 'imposter', 'exam', 'online', 'secret'] },
];
const CALM = {
  morning: ['你自己出門，路上很順，準時到學校。', '今天早上什麼事都沒有，真好。'],
  school:  ['今天在學校很平常，上課、下課、跟同學玩。', '一整天都很順，沒發生什麼特別的事。'],
  after:   ['放學後你直接回家，路上沒什麼特別的。', '今天很準時被接到，一路平安。'],
  night:   ['晚上在家寫功課、看電視，很安靜的一個晚上。', '今天晚上沒什麼事，早早就睡了。'],
};

/* 現實時間 → 時段。底色與問候都看這個。 */
function todNow() {
  const h = new Date().getHours();
  if (h < 10) return 'morning';
  if (h < 16) return 'day';
  if (h < 19) return 'dusk';
  return 'night';
}
const TOD_OF_STOP = { morning: 'morning', school: 'day', after: 'dusk', night: 'night' };
function setTod(t) { try { document.body.dataset.tod = t; } catch (e) {} }

/* 開始一天的時候，依現在幾點跟她打個招呼。
   不改流程——一天還是從早上走到晚上，只是承認「現在幾點」。 */
// 「走完一天」的問候：那個玩法是從早上重走一次，所以這樣講
const GREET = {
  morning: ['早安 ☀️', '今天正要開始。'],
  day:     ['午安 🌤️', '今天過了一半，我們從頭走一次。'],
  dusk:    ['傍晚了 🌇', '來看看今天這一天。'],
  night:   ['晚安 🌙', '睡前來走一次今天。'],
};
// 小鎮的問候：這裡是「現在」的鎮上，不是重走，所以講法不一樣
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

/* 鎮上的人。每天講一句，不是教條，就是日常——
   偶爾夾一句安全的提醒，像鄰居會講的那種。 */
const NPC = {
  home: { who: '媽媽', emoji: '👩', lines: [
    '今天過得還好嗎？',
    '回到家先洗手喔。',
    '有什麼事都可以跟我說，不管是什麼事。',
    '如果有人叫你不要告訴媽媽，那件事一定要告訴我。',
    '晚餐想吃什麼？' ] },
  school: { who: '老師', emoji: '👨‍🏫', lines: [
    '今天上課很專心喔。',
    '班上有人看起來不開心的話，可以來跟我說。',
    '有問題隨時可以問，不會的事情不丟臉。',
    '走廊上不要跑。' ] },
  shop: { who: '店員阿姨', emoji: '🧑‍🍳', lines: [
    '早餐要吃喔，不吃會餓一整天。',
    '零錢收好，不要掉了。',
    '一個人來買東西啊？很厲害耶。',
    '有需要幫忙就跟我說，阿姨都在這裡。' ] },
  park: { who: '警衛伯伯', emoji: '👮', lines: [
    '天黑了就早點回家喔。',
    '等不到爸媽的話，回學校裡面等比較安全。',
    '公園裡有什麼事，來警衛室找我。',
    '今天風有點大，小心一點。' ] },
  dojo: { who: '教練', emoji: '🥋', lines: [
    '今天的踢腿很有力氣。',
    '下課要等家人來接，不要自己先走。',
    '樓梯間光線暗，慢慢走。',
    '練功要慢慢來，不用急。' ] },
  pool: { who: '救生員', emoji: '🏊', lines: [
    '下水前先暖身喔。',
    '看到有人在水裡怪怪的，馬上大聲喊我，不要自己下去。',
    '不要在池邊跑，地滑。',
    '今天水溫剛剛好。' ] },
};

function todayStamp() {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
// 把字串轉成一個穩定的數字，拿來當「今天」的種子
function seedOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// 哪一篇屬於哪個地點（由 PLACE_POOL 反推），六個池子加起來剛好 21 篇
const PLACE_OF = {};
Object.keys(PLACE_POOL).forEach(k => PLACE_POOL[k].forEach(id => { PLACE_OF[id] = k; }));
const DAY_IDS = Object.keys(PLACE_OF);

/* 今天發生什麼事。同一天同一個人，算出來永遠一樣。
   要先均勻抽「哪一篇」再反推地點——不能先抽地點：
   泳池只有 1 篇、家有 9 篇，先抽地點的話泳池那篇會一直重複出現。 */
function todayEvent() {
  const sd = seedOf(todayStamp() + ':' + whoId());
  const id = DAY_IDS[sd % DAY_IDS.length];
  return { place: PLACE_OF[id], id: id, seed: sd };
}
function npcLine(place, sd) {
  const n = NPC[place];
  return n ? { who: n.who, emoji: n.emoji, text: n.lines[(sd >>> 13) % n.lines.length] } : null;
}
const townDoneKey = () => pKey('town-' + todayStamp());
const isTodayDone = () => localStorage.getItem(townDoneKey()) === '1';
function markTodayDone() { try { localStorage.setItem(townDoneKey(), '1'); } catch (e) {} }

// 現實時間決定她人在哪裡
const WHERE_NOW = { morning: 'home', day: 'school', dusk: 'park', night: 'home' };

let fromTown = false;   // 這一篇是從小鎮點進來的
let townMsg = null;     // 點了鎮上的人之後要顯示的話

function renderTown() {
  const tod = todNow(), ev = todayEvent(), done = isTodayDone();
  const marks = {};
  Object.keys(PLACE_POOL).forEach(k => { marks[k] = NPC[k] ? '💬' : ''; });
  marks[ev.place] = done ? '✓' : '❗';

  app.innerHTML = `
    <div class="card anim">
      <div class="daytop">
        <div class="greet"><b>${GREET_TOWN[tod][0]}</b>${GREET_TOWN[tod][1]}</div>
      </div>
      <div class="town">${townSVG(tod, marks, WHERE_NOW[tod])}</div>
      ${townMsg ? `<div class="says">
          <span class="face">${townMsg.emoji}</span>
          <span><b>${esc(townMsg.who)}</b><br>${narrate(townMsg.text)}</span>
        </div>` : `<div class="townhint">${done
          ? '今天的事情處理完了 ✓　點點看鎮上的人，他們有話想說。'
          : '有一個地方出事了 ❗　點它看看。'}</div>`}
      <div class="row" style="margin-top:10px;">
        <button class="mini" id="tmenu">🎭 劇本選單</button>
        <button class="mini" id="tday">☀️ 走完一天</button>
        <button class="mini" id="tgal">🖼️ 結局圖鑑</button>
      </div>
    </div>`;

  app.querySelectorAll('.spot').forEach(g => {
    g.style.cursor = 'pointer';
    g.onclick = () => {
      const k = g.dataset.spot;
      if (k === ev.place && !done) {          // 今天的事
        Sfx.page(); townMsg = null; fromTown = true; startScenario(ev.id);
      } else {                                 // 鎮上的人講一句話
        Sfx.tap();
        townMsg = npcLine(k, ev.seed + seedOf(k));
        render();
      }
    };
  });
  document.getElementById('tmenu').onclick = () => { Sfx.tap(); townMsg = null; view = 'menu'; render(); };
  document.getElementById('tday').onclick  = () => { Sfx.tap(); townMsg = null; startDay(); };
  document.getElementById('tgal').onclick  = () => { Sfx.tap(); townMsg = null; view = 'gallery'; render(); };
}

let dayRun = null;   // 不是 null 就代表正在過一天
let dayAt = 0;

const pickOne = a => a[Math.floor(Math.random() * a.length)];

function loadDayStats() {
  try { return JSON.parse(localStorage.getItem(pKey('daystats'))) || { days: 0, perfect: 0 }; }
  catch (e) { return { days: 0, perfect: 0 }; }
}
function saveDayStats(v) { try { localStorage.setItem(pKey('daystats'), JSON.stringify(v)); } catch (e) {} }
// 最近遇過的先避開，免得同一篇一直重複
function loadDayRecent() {
  try { return JSON.parse(localStorage.getItem(pKey('dayrecent'))) || []; } catch (e) { return []; }
}
function pushDayRecent(id) {
  const r = loadDayRecent().filter(x => x !== id);
  r.unshift(id);
  try { localStorage.setItem(pKey('dayrecent'), JSON.stringify(r.slice(0, 8))); } catch (e) {}
}

function startDay() {
  const recent = loadDayRecent();
  const n = 2 + Math.floor(Math.random() * 2);           // 四段裡兩到三段有事
  const hit = STOPS.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, n);
  const used = [];
  dayRun = STOPS.map((stop, i) => {
    if (hit.indexOf(i) < 0) return { stop, calm: pickOne(CALM[stop.key]), result: null };
    const avail = stop.pool.filter(x => used.indexOf(x) < 0);
    const fresh = avail.filter(x => recent.indexOf(x) < 0);
    const id = pickOne(fresh.length ? fresh : avail);
    used.push(id);
    return { stop, calm: null, scenarioId: id, result: null };
  });
  dayAt = 0;
  view = 'route';
  render();
}

function routeBar() {
  return `<div class="route">${dayRun.map((d, i) => {
    const cls = i < dayAt ? ' done' : (i === dayAt ? ' now' : '');
    const mark = i < dayAt
      ? (d.result ? (d.result.grade === 'best' ? '🌟' : d.result.grade === 'bad' ? '🔁' : '✓') : '✓')
      : '';
    return `<div class="stop${cls}">${mark ? `<span class="mk">${mark}</span>` : ''}` +
      `<span class="dot">${d.stop.icon}</span><span class="nm">${d.stop.name}</span></div>`;
  }).join('')}</div>`;
}

function renderRoute() {
  const d = dayRun[dayAt];
  app.innerHTML = `
    <div class="card anim">
      <div class="daytop">
        ${dayAt === 0 ? `<div class="greet"><b>${GREET[todNow()][0]}</b>${GREET[todNow()][1]}</div>` : ''}
        <span class="daynum">${who().emoji} ${esc(who().name)} 的一天</span>
      </div>
      ${routeBar()}
      ${d.calm ? `
        <div class="calm">
          <span class="big">${d.stop.icon}</span>
          <div class="t">這一段很平順</div>
          <div class="s">${narrate(d.calm)}</div>
        </div>
        <button id="dnext" style="width:100%; background:#7cc9a0; color:#1e3d2c;">繼續 ▶</button>
      ` : `
        <div class="stage" style="margin-top:4px;">
          <div class="narr">${d.stop.icon} <b>${d.stop.name.replace('<br>', '')}</b>……有事情發生了。</div>
        </div>
        <button id="dnext" style="width:100%; background:#6b4a9e; color:#fff;">看看怎麼回事 ▶</button>
      `}
      <div class="row" style="margin-top:10px;">
        <button class="mini" id="dquit">← 先不玩了</button>
      </div>
    </div>`;
  document.getElementById('dnext').onclick = () => {
    Sfx.page();
    if (d.calm) dayAdvance();
    else startScenario(d.scenarioId);     // 借用劇場本來就有的故事引擎
  };
  document.getElementById('dquit').onclick = () => { Sfx.tap(); dayRun = null; view = 'menu'; render(); };
}

function dayAdvance() {
  dayAt++;
  if (dayAt >= dayRun.length) {
    const st = loadDayStats();
    st.days++;
    const done = dayRun.filter(d => d.result);
    if (done.length && done.every(d => d.result.grade === 'best')) st.perfect++;
    saveDayStats(st);
    view = 'tally';
  } else {
    view = 'route';
  }
  render();
}

function renderTally() {
  const done = dayRun.filter(d => d.result);
  const allBest = done.length > 0 && done.every(d => d.result.grade === 'best');
  const redo = done.filter(d => d.result.grade === 'escape' || d.result.grade === 'bad');
  const st = loadDayStats();
  app.innerHTML = `
    <div class="card anim">
      <h1>🏠 今天回到家了</h1>
      <div class="sub">${allBest ? '而且每一件事都處理得很好' : '今天走過這些事'}</div>
      ${routeBar()}
      ${done.length ? `<div class="tally">
        ${done.map(d => {
          const g = GRADE_META[d.result.grade];
          return `<div class="tally-row">
            <span class="wh">${d.stop.icon}</span>
            <span class="ti">${esc(d.result.title)}</span>
            <span class="gd" style="background:${g.bg}; color:${g.color};">${g.label}</span>
          </div>`;
        }).join('')}
      </div>` : `<div class="calm"><span class="big">🌤️</span>
        <div class="t">今天一整天都很平安</div>
        <div class="s">什麼事都沒發生，這其實是最常見的一種日子。</div></div>`}
      ${allBest ? `<div class="safeframe">🌟 <b>今天每一關都做到了最好。</b></div>` : ''}
      ${redo.length ? `<div class="safeframe mini">
        <span class="sf-ico">🔁</span>
        <span class="sf-txt">有 ${redo.length} 件事還可以更好。<b>再過一天，說不定會再遇到一次。</b></span>
      </div>` : ''}
      <div class="daytop" style="margin:12px 0;">
        <span class="daynum">已經過了 ${st.days} 天${st.perfect ? `　🌟 全部完美的有 ${st.perfect} 天` : ''}</span>
      </div>
      <button id="dagain" style="width:100%; background:#6b4a9e; color:#fff;">☀️ 再過一天</button>
      <div class="row" style="margin-top:8px;">
        <button class="mini" id="dmenu">🎭 回劇本選單</button>
        <button class="mini" id="dgal">🖼️ 看結局圖鑑</button>
      </div>
    </div>`;
  document.getElementById('dagain').onclick = () => { Sfx.tap(); startDay(); };
  document.getElementById('dmenu').onclick = () => { Sfx.tap(); dayRun = null; view = 'menu'; render(); };
  document.getElementById('dgal').onclick  = () => { Sfx.tap(); dayRun = null; view = 'gallery'; render(); };
}

function render() {
  // 走一天的時候用那一段的時間，其他畫面用現實時間
  setTod(dayRun && !fromTown && (view === 'route' || view === 'story' || view === 'end')
    ? TOD_OF_STOP[dayRun[Math.min(dayAt, dayRun.length - 1)].stop.key]
    : todNow());
  if (view === 'menu') renderMenu();
  else if (view === 'check') renderCheck();
  else if (view === 'gallery') renderGallery();
  else if (view === 'who') renderWho();
  else if (view === 'story') renderStory();
  else if (view === 'town') renderTown();
  else if (view === 'route') renderRoute();
  else if (view === 'tally') renderTally();
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
  if (view === 'menu') { fromTown = false; dayRun = null; }   // 從選單進來就不是小鎮／一天模式
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
          <button class="mini" id="quit">${fromTown ? '← 回小鎮' : dayRun ? '← 回到今天的路線' : '← 選別的故事'}</button>
        </div>
      </div>
    `;
    document.getElementById('go').onclick = () => { Sfx.page(); nodeId = cur.start; render(); };
    document.getElementById('music2').onclick = () => { Sfx.toggleBgm(); render(); };
    document.getElementById('quit').onclick = () => {
      view = fromTown ? 'town' : dayRun ? 'route' : 'menu'; render();
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
        <button class="mini" id="quit">${fromTown ? '← 回小鎮' : dayRun ? '← 回到今天的路線' : '← 離開這個故事'}</button>
      </div>
    </div>
  `;
  document.querySelectorAll('.choice').forEach(b => {
    b.onclick = () => choose(parseInt(b.dataset.i, 10));
  });
  document.getElementById('music2')?.addEventListener('click', () => { Sfx.toggleBgm(); render(); });
  document.getElementById('quit').onclick = () => {
      view = fromTown ? 'town' : dayRun ? 'route' : 'menu'; render();
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
    if (fromTown) markTodayDone();
    if (dayRun && dayRun[dayAt] && dayRun[dayAt].scenarioId === cur.id) {
      dayRun[dayAt].result = { title: ending.title, grade: ending.grade };
      pushDayRecent(cur.id);
    }
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
      </div>` : dayRun ? `
      <div class="row">
        <button id="dgo" style="background:#2f6f8f; color:#fff; width:100%;">
          ${dayAt < dayRun.length - 1 ? '繼續今天 ▶' : '回到家了 🏠'}
        </button>
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
      Sfx.tap(); fromTown = false; townMsg = null; view = 'town'; render();
    };
  } else if (dayRun) {
    document.getElementById('dgo').onclick = () => { Sfx.tap(); dayAdvance(); };
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
