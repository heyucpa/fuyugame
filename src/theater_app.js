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

/* 每個玩家是家裡的老大還是老二。
   這不是裝飾：小事是「她的日子」，所以「妹妹弄斷你的色筆」這種
   只有當姊姊才成立——妹妹玩的時候看到會對不上。
   劇本不分角色，因為那是「故事」，不是她的日子。 */
const ROLES = {
  big:    { label: '姊姊', sib: '妹妹', dress: '#ff8fb8', sibDress: '#ffd23f' },
  little: { label: '妹妹', sib: '姊姊', dress: '#ffd23f', sibDress: '#ff8fb8' },
  only:   { label: '沒有兄弟姊妹', sib: '',  dress: '#ff8fb8', sibDress: '#ffd23f' },
};
function defaultPlayers() {
  return [{ id: 'p1', name: '姊姊', emoji: '⭐', role: 'big' },
          { id: 'p2', name: '妹妹', emoji: '🌸', role: 'little' }];
}
// 舊存檔沒有 role，用順序補：第一個是老大，其他是老二
function withRole(p, i) { return p.role ? p : Object.assign({}, p, { role: i === 0 ? 'big' : 'little' }); }
function myRole() { const r = who().role; return ROLES[r] ? r : 'big'; }
const ME = () => ROLES[myRole()];
/* 主角／手足的裙子顏色由 CSS 變數決定（見 art_lib.js 的 ME_DRESS），
   這裡只負責把角色貼到 <body> 上，讓那兩個變數換值。 */
function setRoleAttr() { try { document.body.dataset.role = myRole(); } catch (e) {} }

/* 手足要畫多大。顏色可以用 CSS 變數，大小不行（scale 是寫死在 transform 字串裡），
   所以只有「畫的時候才產生」的圖能跟著角色變——小鎮地圖與小事的定場圖都是。
   118 張結局插圖是載入時就算好的，改不了；不過那兩篇劇本的手足本來就是妹妹，
   畫得比主角小是對的。

   妹妹玩的時候手足是姊姊，一定要比她高——
   第一版忘了這件事，畫面上她的姊姊比她還矮一截。 */
function sibScale(base) { return myRole() === 'little' ? base * 1.35 : base; }
/* 雙向的小事寫成 {sib}，這裡依角色填回去 */
function fillSib(t) { return String(t).split('{sib}').join(ME().sib || '家人'); }
function players() {
  try {
    const p = JSON.parse(localStorage.getItem(PKEY));
    if (Array.isArray(p) && p.length) return p.map(withRole);
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

/* 按日期／時段命名的 key 會一直長出來，而且永遠不會有人去刪：
     hunt-<日期>#<格>    一天最多 144 個（十分鐘一輪）
     town-<日期>-<時段>  一天 4 個
     huntday-<日期>      一天 1 個
   一年下來一個玩家大約七千個，兩個玩家一萬四。
   這些 key 過了那一天就完全沒用，開起來就掃掉。

   比對日期一定要連分隔符號一起比：只用 indexOf(todayStamp()) 的話，
   今天是 2026-10-3 會把 2026-10-30 的也當成今天。 */
const DATED_PREFIX = ['theater-hunt-', 'theater-huntday-', 'theater-town-'];
function sweepOldKeys() {
  let today;
  try { today = todayStamp(); } catch (e) { return; }
  const keep = ['theater-hunt-' + today + '#',
                'theater-huntday-' + today + ':',
                'theater-town-' + today + '-'];
  try {
    const all = [];
    for (let i = 0; i < localStorage.length; i++) all.push(localStorage.key(i));
    all.forEach(k => {
      if (!k || !DATED_PREFIX.some(p => k.indexOf(p) === 0)) return;
      if (keep.some(p => k.indexOf(p) === 0)) return;
      localStorage.removeItem(k);
    });
  } catch (e) {}
}

/* 清掉某一個玩家的全部東西。按鈕上寫「清除所有紀錄」，
   那就真的要全部——以前漏掉寶物盒跟熟悉度，按完寶物還在。 */
function wipePlayer(id) {
  const suffix = ':' + id;
  try {
    const all = [];
    for (let i = 0; i < localStorage.length; i++) all.push(localStorage.key(i));
    all.forEach(k => {
      if (k && k.indexOf('theater-') === 0 && k.slice(-suffix.length) === suffix)
        localStorage.removeItem(k);
    });
  } catch (e) {}
}
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

const isGoodGrade = g => g === 'best' || g === 'good';
/* 結局頁的「📖 回顧你的選擇」——已經看過很多次之後會變成雜訊，可以關掉。
   一樣是每個玩家各自的設定。 */
function replayOn() { return localStorage.getItem(pKey('replay')) !== 'off'; }
function toggleReplay() {
  try { localStorage.setItem(pKey('replay'), replayOn() ? 'off' : 'on'); } catch (e) {}
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
  school: ['bully', 'quake', 'money', 'candy', 'knife', 'wish', 'sisbully'],
  home:   ['home', 'fire', 'fakecop', 'shop', 'imposter', 'exam', 'online', 'secret', 'scam'],
  shop:   ['lost', 'breakfast', 'sislost'],
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
    { who: '{sib}', emoji: '👧',
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

   三種可能：
     小事（約一半）　三十秒、不評分，大部分是純日常
     劇本（約四成）　21 篇裡的一篇，有結局、會進圖鑑
     沒事（約一成）　就是平常的鎮上

   小事給得比劇本多，是刻意的。這個遊戲的安全提醒寫著
   「大部分的人都是安全、願意幫忙的」——如果每個時段都出事，
   那句話就被畫面推翻了。日子本來就大多是普通的。

   劇本要先均勻抽「哪一篇」再反推地點，不能先抽地點：
   泳池只有 1 篇、家有 9 篇，先抽地點的話泳池那篇會一直重複出現。 */
function periodEvent(tod) {
  const key = todayStamp() + '/' + (tod || todNow()) + ':' + whoId();
  const sd = seedOf(key);
  const roll = (sd >>> 3) % 100;
  if (roll < 10) return { kind: null, place: null, id: null, seed: sd };  // 這個時段沒事
  if (roll < 62) {
    // 只從這個玩家看得到的小事裡抽（種子已經含 whoId，所以每個人各自穩定）
    const pool = momentsFor(myRole());
    const m = pool[(sd >>> 11) % pool.length];
    return { kind: 'moment', place: m.place, id: m.id, seed: sd };
  }
  const id = DAY_IDS[sd % DAY_IDS.length];
  return { kind: 'story', place: PLACE_OF[id], id: id, seed: sd };
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

/* ===== 每十分鐘藏一個東西 =====
   十分鐘換一樣，藏在鎮上某個角落，點到就收進寶物盒。

   為什麼要有這個：小事跟劇本都要「等下一個時段」，
   但她可能十分鐘後就想再打開一次。這個是唯一一件
   「打開就可以做」的事，而且不用讀字、不用選，只要看。

   本來是一天一樣，改成十分鐘是因為她會一直想再開。
   十分鐘一輪收得很快，所以東西要夠多：六十樣、分五類，
   其中八樣是稀有的（出現機率只有別人的四分之一）。
   收集要有「今天運氣真好」的時刻，不然六十樣只是六十次一樣的體驗。

   刻意做得小又不閃不動：要用眼睛找，才有找到的感覺。
   十二個藏的位置都避開了六個地點的名牌，
   不然那顆透明的點擊圈會把名牌的點擊搶走。 */
/* 六十樣，分五類。
   舊的 24 個 id 一個都沒有改——改掉的話她已經收集到的會全部歸零。

   rare 的東西出現機率是別人的四分之一。收集要有「今天運氣真好」
   的時刻，不然六十樣只是六十次一樣的體驗。

   全部都是「路上撿得到、撿了不會受傷」的東西。
   刻意沒有玻璃碎片、針、打火機那一類——她會真的去翻。 */
const TREASURE_GROUPS = [
  { key: 'nature', name: '大自然', emoji: '🌿', items: [
    { id: 't-clover',  emoji: '🍀', name: '四葉草',     line: '聽說找到的人，那天會有好事。', rare: true },
    { id: 't-petal',   emoji: '🌸', name: '掉下來的花', line: '還很新，應該是剛剛才掉的。' },
    { id: 't-leaf',    emoji: '🌿', name: '香香的葉子', line: '搓一搓，手上留著味道。' },
    { id: 't-shroom',  emoji: '🍄', name: '小蘑菇',     line: '長在樹根旁邊。你沒有摘它。' },
    { id: 't-acorn',   emoji: '🌰', name: '橡實',       line: '圓圓的，搖起來有聲音。' },
    { id: 't-feather', emoji: '🪶', name: '羽毛',       line: '白得發亮，比你的手掌還長。' },
    { id: 't-shell',   emoji: '🐚', name: '貝殼',       line: '離海那麼遠，不知道是誰帶來的。' },
    { id: 't-egg',     emoji: '🥚', name: '空的蛋殼',   line: '很小很小，淡藍色的。' },
    { id: 't-maple',   emoji: '🍁', name: '楓葉',       line: '紅得很誇張，你夾進書裡了。' },
    { id: 't-stone',   emoji: '🪨', name: '扁扁的石頭', line: '摸起來滑滑的，正好放得進口袋。' },
    { id: 't-dande',   emoji: '🌼', name: '蒲公英',     line: '你吹了三次才全部飛走。' },
    { id: 't-grass',   emoji: '🌾', name: '狗尾草',     line: '拿去搔妹妹的脖子，她笑到跑掉。' },
  ] },

  { key: 'bug', name: '小生物', emoji: '🐞', items: [
    { id: 't-bug',     emoji: '🐞', name: '瓢蟲',       line: '牠在你手上停了三秒才飛走。' },
    { id: 't-fly',     emoji: '🦋', name: '蝴蝶',       line: '停在你的袖子上，翅膀一開一合。' },
    { id: 't-snail',   emoji: '🐌', name: '蝸牛',       line: '走得超級慢，你等牠爬過一整塊磚。' },
    { id: 't-ants',    emoji: '🐜', name: '螞蟻隊伍',   line: '從這塊磚排到那棵樹，中間一次都沒斷。' },
    { id: 't-beetle',  emoji: '🪲', name: '金龜子',     line: '背上有金屬的光，像一顆綠色的珠子。', rare: true },
    { id: 't-frog',    emoji: '🐸', name: '小青蛙',     line: '你才蹲下來，牠就跳走了。' },
    { id: 't-web',     emoji: '🕸️', name: '蜘蛛網',     line: '上面沾了水珠，一整片在發亮。' },
    { id: 't-worm',    emoji: '🐛', name: '毛毛蟲',     line: '你沒有碰牠，只是看著。' },
    { id: 't-gecko',   emoji: '🦎', name: '壁虎',       line: '在牆上停很久，你以為牠是假的。', rare: true },
    { id: 't-bee',     emoji: '🐝', name: '蜜蜂',       line: '你退了兩步，牠也沒理你。' },
    { id: 't-cricket', emoji: '🦗', name: '蟋蟀',       line: '叫聲一直換位置，找不到牠在哪。' },
    { id: 't-earthw',  emoji: '🪱', name: '蚯蚓',       line: '下過雨才會看到。你把牠撥回土裡。' },
  ] },

  { key: 'shiny', name: '亮亮的', emoji: '✨', items: [
    { id: 't-star',    emoji: '⭐', name: '掉下來的星星', line: '摸起來還是溫的。', rare: true },
    { id: 't-marble',  emoji: '💎', name: '玻璃珠',     line: '對著太陽看，裡面有一條藍色的線。' },
    { id: 't-coin',    emoji: '🪙', name: '舊錢幣',     line: '上面的字都磨掉了。' },
    { id: 't-key',     emoji: '🔑', name: '小鑰匙',     line: '不知道開哪裡的，你先收著。' },
    { id: 't-glitter', emoji: '✨', name: '亮片',       line: '一片一片，怎麼掃都掃不乾淨。' },
    { id: 't-bubble',  emoji: '🫧', name: '泡泡',       line: '飄了很久才破，你一路跟著走。' },
    { id: 't-dew',     emoji: '💧', name: '露水',       line: '早上的草上面全都是，太陽出來就不見了。' },
    { id: 't-rainbow', emoji: '🌈', name: '彩虹的一角', line: '只看得到一小段，另一半被大樓擋住。', rare: true },
    { id: 't-orb',     emoji: '🔮', name: '透明的珠子', line: '對著燈看，牆上會出現一個小光點。', rare: true },
    { id: 't-wrapper', emoji: '🪞', name: '銀色糖果紙', line: '攤平之後，可以隱隱約約照到自己。' },
    { id: 't-candle',  emoji: '🕯️', name: '蠟燭頭',     line: '上面還留著燒過的痕跡。' },
    { id: 't-sticker', emoji: '🌟', name: '星星貼紙',   line: '邊邊翹起來了，還是黏得住。' },
  ] },

  { key: 'lost', name: '別人掉的', emoji: '🧦', items: [
    { id: 't-sock',    emoji: '🧦', name: '一隻襪子',   line: '只有一隻。另一隻到底去哪了？' },
    { id: 't-puzzle',  emoji: '🧩', name: '一片拼圖',   line: '不知道是哪一盒的，形狀很特別。' },
    { id: 't-ribbon',  emoji: '🎀', name: '緞帶',       line: '粉紅色的，綁在欄杆上。' },
    { id: 't-kite',    emoji: '🪁', name: '斷線的風箏', line: '卡在樹上很久了，尾巴都褪色了。' },
    { id: 't-bell',    emoji: '🔔', name: '小鈴鐺',     line: '聲音很小，要靠很近才聽得到。' },
    { id: 't-bone',    emoji: '🦴', name: '恐龍的骨頭', line: '只有一小塊，猜不出是哪一隻。' },
    { id: 't-compass', emoji: '🧭', name: '壞掉的指南針', line: '針一直轉，指不出方向。' },
    { id: 't-button',  emoji: '🔘', name: '一顆鈕扣',   line: '四個洞，還留著一小截線。' },
    { id: 't-ticket',  emoji: '🎫', name: '一張票根',   line: '上面的日期是三年前。' },
    { id: 't-crayon',  emoji: '🖍️', name: '蠟筆頭',     line: '短到握不住了，顏色還很漂亮。' },
    { id: 't-cap',     emoji: '🧢', name: '一頂帽子',   line: '掛在圍牆上，好像在等主人。' },
    { id: 't-yoyo',    emoji: '🪀', name: '溜溜球',     line: '線纏死了，你解了十分鐘。' },
  ] },

  { key: 'keep', name: '帶著走的', emoji: '🍬', items: [
    { id: 't-candy',   emoji: '🍬', name: '一顆糖',     line: '包裝紙是你沒看過的顏色。' },
    { id: 't-balloon', emoji: '🎈', name: '汽球',       line: '繩子纏在樹枝上，你把它解下來了。' },
    { id: 't-nest',    emoji: '🪺', name: '空的鳥巢',   line: '掉在地上，裡面墊著細細的草。', rare: true },
    { id: 't-clip',    emoji: '📎', name: '迴紋針',     line: '被折成一個小小的愛心。' },
    { id: 't-thread',  emoji: '🧵', name: '一段線',     line: '五顏六色的，不知道是誰的手工。' },
    { id: 't-tag',     emoji: '🏷️', name: '一張標籤',   line: '上面的字被雨淋糊了。' },
    { id: 't-stick',   emoji: '🪄', name: '一根樹枝',   line: '你決定它是魔法棒。' },
    { id: 't-spoon',   emoji: '🥄', name: '小湯匙',     line: '塑膠的，卡在水溝蓋旁邊。' },
    { id: 't-page',    emoji: '📖', name: '一頁書',     line: '只有一頁，看不出來是哪一本。' },
    { id: 't-dice',    emoji: '🎲', name: '一顆骰子',   line: '六點那一面磨到快看不見了。' },
    { id: 't-ice',     emoji: '🧊', name: '一塊冰',     line: '你握在手裡，走到家就沒了。' },
    { id: 't-watch',   emoji: '🕰️', name: '停住的手錶', line: '指針停在三點十七分。', rare: true },
  ] },
];
const TREASURES = TREASURE_GROUPS.reduce(
  (a, g) => a.concat(g.items.map(t => Object.assign({ group: g.key }, t))), []);
/* 抽獎袋：普通的放四張，稀有的放一張 */
const TREASURE_BAG = [];
TREASURES.forEach(t => { for (let i = 0; i < (t.rare ? 1 : 4); i++) TREASURE_BAG.push(t); });
const HIDE_SPOTS = [
  [20, 150], [304, 84], [112, 30], [186, 26], [248, 160], [92, 96],
  [214, 46], [30, 92], [140, 148], [292, 186], [66, 186], [176, 70],
];
const HUNT_MIN = 10;   // 幾分鐘換一樣
// 抽出來是為了走查可以換掉它（不然只能真的等十分鐘）
function nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
// 這一輪是哪一格。同一格裡算幾次都一樣，跨格才會換東西
const huntSlot = () => todayStamp() + '#' + Math.floor(nowMin() / HUNT_MIN);
function huntNow() {
  const sd = seedOf('h:' + huntSlot() + ':' + whoId());
  const t = TREASURE_BAG[sd % TREASURE_BAG.length];
  return { id: t.id, emoji: t.emoji, name: t.name, line: t.line, rare: !!t.rare,
           at: HIDE_SPOTS[(sd >>> 9) % HIDE_SPOTS.length] };
}
// 還有幾分鐘換下一個——講得出數字，她才知道要不要等
const huntLeft = () => HUNT_MIN - (nowMin() % HUNT_MIN);
const huntKey = () => pKey('hunt-' + huntSlot());
const foundNow = () => localStorage.getItem(huntKey());
const huntDayKey = () => pKey('huntday-' + todayStamp());
const foundCountToday = () => parseInt(localStorage.getItem(huntDayKey()) || '0', 10);
function loadTreasures() {
  try { return JSON.parse(localStorage.getItem(pKey('treasures'))) || {}; } catch (e) { return {}; }
}
function recordFind(id) {
  const box = loadTreasures();
  box[id] = (box[id] || 0) + 1;
  try {
    localStorage.setItem(pKey('treasures'), JSON.stringify(box));
    localStorage.setItem(huntKey(), id);
    localStorage.setItem(huntDayKey(), String(foundCountToday() + 1));
  } catch (e) {}
}
const treasureById = id => TREASURES.find(t => t.id === id);
const boxCount = () => { const b = loadTreasures(); return TREASURES.filter(t => b[t.id]).length; };

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
let huntTimer = null;   // 十分鐘換一樣東西的計時器（只有一個，進小鎮就重設）
/* 計時器實際做的事抽成這個變數，走查直接叫它就好——
   不然驗「過十分鐘會不會換」要真的等十分鐘。跟 walkMs 一樣是刻意留的接縫。 */
let huntTimerFn = null;
let townMsg = null;     // 點了鎮上的人之後要顯示的話
let townTaps = {};      // 每個地點點過幾下，決定講到第幾句

/* ===== 寶物圖鑑 =====
   結局圖鑑是「她走過的路」，這一頁是「她撿過的東西」——
   一個是練習的成果，一個純粹是玩。兩件事分開，
   所以沒有合併到同一頁。

   沒撿過的只顯示 ❓，連名字都不給：先知道有什麼，
   等於把找的樂趣先花掉了。 */
function renderBox() {
  const b = loadTreasures(), have = boxCount(), total = TREASURES.length;
  const rareHave = TREASURES.filter(t => t.rare && b[t.id]).length;
  const rareAll = TREASURES.filter(t => t.rare).length;
  app.innerHTML = `
    <div class="card anim">
      <h1>🎁 寶物圖鑑</h1>
      <div class="galtop">
        <div class="galnum">${have} <small>/ ${total}</small></div>
        <div class="gal-bar"><i style="width:${total ? (have / total * 100) : 0}%"></i></div>
        <div style="font-size:12.5px; color:#8a7fa8; margin-top:7px;">
          稀有的 ${rareHave} / ${rareAll}　·　鎮上每十分鐘換一樣
        </div>
      </div>
      ${TREASURE_GROUPS.map(g => {
        const n = g.items.filter(t => b[t.id]).length;
        return `<div class="gal">
          <h3>${g.emoji} ${esc(g.name)} <span class="n">${n} / ${g.items.length}</span></h3>
          <div class="tbox-grid">
            ${g.items.map(t => b[t.id] ? `
              <div class="tcell${t.rare ? ' rare' : ''}">
                <div class="te">${t.emoji}</div>
                <div class="tn">${esc(t.name)}</div>
                <div class="tl">${esc(t.line)}</div>
                ${b[t.id] > 1 ? `<div class="tc">撿過 ${b[t.id]} 次</div>` : ''}
              </div>` : `<div class="tcell lock">❓</div>`).join('')}
          </div>
        </div>`;
      }).join('')}
      <div class="row" style="margin-top:6px;">
        <button class="mini" id="box-town">← 回小鎮</button>
        <button class="mini" id="box-menu">🎭 劇本選單</button>
      </div>
    </div>`;
  document.getElementById('box-town').onclick = () => { Sfx.tap(); view = 'town'; render(); };
  document.getElementById('box-menu').onclick = () => { Sfx.tap(); view = 'menu'; render(); };
}

function renderTown() {
  const tod = todNow(), ev = periodEvent(tod), wx = weatherToday();
  const done = ev.id ? isPeriodDone(tod) : false;
  const stage = townStage(), friend = loadFriend();
  let hunt = huntNow();
  /* 抽成函式，是因為找到東西、或十分鐘換一輪的時候只換這一段，
     不重畫整張卡片（重畫會閃，而且地圖也會跟著重新產生）。 */
  function huntHTML() {
    const gotId = foundNow(), t = gotId ? treasureById(gotId) : null;
    const n = foundCountToday(), have = boxCount();
    const head = t
      ? `🎁 找到了：<b>${t.emoji} ${esc(t.name)}</b>${t.rare ? ' <i class="rare">稀有</i>' : ''}　${esc(t.line)}<br>` +
        `<small>再 <b>${huntLeft()}</b> 分鐘會換一個新的。今天已經找到 ${n} 個。</small>`
      : `👀 鎮上藏了一個小東西，找找看。` +
        (n ? `<br><small>今天已經找到 ${n} 個。</small>` : '');
    // 六十格排不進一行，所以只放一顆按鈕，細節留給寶物圖鑑那一頁
    return head + `<button class="boxbtn" id="tbox">🎁 寶物圖鑑　${have} / ${TREASURES.length}</button>`;
  }

  const marks = {};
  Object.keys(PLACE_POOL).forEach(k => { marks[k] = NPC[k] ? '💬' : ''; });
  // ❗ 是「有事情要處理」，💭 是「有件小事」——記號不一樣，她才知道等一下是哪一種
  if (ev.place) marks[ev.place] = done ? '✓' : (ev.kind === 'moment' ? '💭' : '❗');

  const hint = ev.place && !done
    ? (ev.kind === 'moment' ? '有個地方有一件小事 💭　點它看看。' : '有一個地方出事了 ❗　點它看看。')
    : `${ev.place ? `這個時段的事處理完了 ✓　<b>${NEXT_PERIOD[tod]}</b>還會有新的。<br>` : '這個時段鎮上很平靜。<br>'}`
      + '想繼續玩的話，<b>點任何一個地方都可以</b>。';

  app.innerHTML = `
    <div class="card anim">
      <div class="daytop">
        <div class="greet"><b>${GREET_TOWN[tod][0]}</b>${GREET_TOWN[tod][1]}</div>
        <div class="wx">${WEATHER[wx].icon} ${WEATHER[wx].name}　·　🖼️ ${seenTotal()} / ${totalEnds()}</div>
      </div>
      <div class="townwrap">
        <div class="town">${townSVG(tod, marks, WHERE_NOW[tod], wx, stage, foundNow() ? null : hunt)}</div>
        <div class="saybox" hidden></div>
      </div>
      <div class="hunt">${huntHTML()}</div>
      <div class="townhint">${hint}</div>
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
        walkTo(k, () => {
          townMsg = null;
          if (ev.kind === 'moment') startMoment(ev.id);
          else { fromTown = true; townFree = false; startScenario(ev.id); }
        });
        return;
      }
      // 鎮上的人講話。再點同一個人會講下一句（關掉再點也接得下去）
      Sfx.tap();
      const nth = townTaps[k] || 0;
      townTaps[k] = nth + 1;
      const n = bumpFriend(k);
      const msg = npcLine(k, ev.seed + seedOf(k), nth, {
        justDone: done && k === ev.place,
        weather: wx,
        close: n >= CLOSE_AT,
      });
      if (msg) msg.place = k;
      showSay(msg);
    };
  });

  /* 只換講話框，不重畫整張卡片。
     以前這裡是 render()，每點一個人整張卡（含 .card.anim 的淡入）
     都重來一次，畫面就會閃一下。 */
  const saybox = app.querySelector('.saybox');
  function showSay(msg) {
    townMsg = msg;
    if (!msg) { saybox.hidden = true; saybox.innerHTML = ''; return; }
    const left = placeUnseen(msg.place);
    saybox.innerHTML = `
      <div class="says">
        <span class="x" aria-hidden="true">✕</span>
        <span class="face">${msg.emoji}</span>
        <span><b>${esc(fillSib(msg.who))}</b><br>${narrate(fillSib(msg.text))}
          ${msg.more ? '<span class="more">再點他一次還有話說 ▸</span>' : ''}
          <button id="tplay" class="playhere">
            🎭 在${esc(PLACE_NAME[msg.place] || '這裡')}玩一篇
            ${left ? `<small>還有 ${left} 種結局沒看過</small>`
                   : '<small>這裡的結局都看過了，再走一次也可以</small>'}
          </button>
        </span>
      </div>`;
    saybox.hidden = false;
    // 點框上任何地方就關起來，除了那顆「玩一篇」的按鈕
    saybox.onclick = () => { Sfx.tap(); showSay(null); };
    const play = saybox.querySelector('#tplay');
    play.onclick = (e) => {
      e.stopPropagation();
      const place = msg.place, id = pickFreePlay(place);
      if (!id) return;
      Sfx.page();
      showSay(null);
      walkTo(place, () => { fromTown = true; townFree = true; startScenario(id); });
    };
  }
  if (townMsg) showSay(townMsg);   // 從別的畫面回小鎮時，把剛才那句接回去

  /* 找到藏的東西。這個 g 刻意不在任何 .spot 裡面，不會跟地點搶點擊。
     它永遠存在（找到了就是空的），所以只要換 innerHTML，不用重畫地圖。 */
  const hg = app.querySelector('.hide');
  const huntLine = app.querySelector('.hunt');
  function paintHunt() {
    const got = foundNow();
    hg.innerHTML = got ? '' : hideArt(hunt);
    hg.style.cursor = got ? '' : 'pointer';
    huntLine.innerHTML = huntHTML();
    // 這一行是整段重寫的，按鈕每次都是新的節點，事件要跟著重掛
    huntLine.querySelector('#tbox').onclick = () => { Sfx.tap(); showSay(null); view = 'box'; render(); };
  }
  paintHunt();
  hg.onclick = (e) => {
    if (foundNow()) return;                 // 這一輪已經找到了
    if (e && e.stopPropagation) e.stopPropagation();
    Sfx.good();
    recordFind(hunt.id);
    paintHunt();
    showSay(null);
  };

  /* 十分鐘換一樣東西。她可能一直開著這一頁，所以要自己換，
     不能等她重新整理——但一樣只換那一塊，不重畫整張卡片。
     計時器掛在全域並且每次進小鎮都重設，不然離開小鎮之後
     它還會繼續對著舊的 DOM 亂寫。 */
  let slotShown = huntSlot();
  huntTimerFn = () => {
    if (view !== 'town' || !document.body.contains(hg)) return;
    if (huntSlot() === slotShown) return;
    slotShown = huntSlot();
    hunt = huntNow();
    paintHunt();
  };
  clearInterval(huntTimer);
  huntTimer = setInterval(huntTimerFn, 15000);
  document.getElementById('tmenu').onclick = () => { Sfx.tap(); townMsg = null; view = 'menu'; render(); };
  document.getElementById('tgal').onclick  = () => { Sfx.tap(); townMsg = null; view = 'gallery'; render(); };
}


/* ===== 小事 =====
   刻意不走 startScenario 那一套：沒有節點、沒有結局、不記圖鑑、不評分。
   她按完看到的是一句回應，不是一個評價。

   為什麼不給分：這些是「日子」，不是考題。
   如果連「妹妹弄斷色筆你怎麼辦」都要被打分數，
   那她會學到的是「做什麼都在被評」，那跟這個遊戲想教的相反。 */
let curMoment = null;   // 正在進行的小事
let momentPick = -1;    // 她選了哪一個，-1 是還沒選

function startMoment(id) {
  curMoment = momentById(id);
  momentPick = -1;
  if (!curMoment) { view = 'town'; return render(); }
  view = 'moment';
  render();
}

function renderMoment() {
  const m = curMoment;
  if (!m) { view = 'town'; return renderTown(); }
  const tod = todNow(), wx = weatherToday();
  const p = PLACES.find(x => x.key === m.place) || {};
  const picked = momentPick >= 0 ? m.choices[momentPick] : null;

  app.innerHTML = `
    <div class="card anim">
      <h1>${p.emoji || '💭'} ${esc(PLACE_NAME[m.place] || '')}</h1>
      <div class="sub">小事一件</div>
      <div class="scene pop">${placeCloseup(m.place, tod, wx, m.sis)}</div>
      <div class="stage">
        <div class="narr">${narrate(fillSib(m.text))}</div>
      </div>
      ${picked ? `
        <div style="font-size:14px; font-weight:800; color:#6b4a9e; margin:12px 0 0;">
          你選了：${esc(fillSib(picked.label))}
        </div>
        <div class="stage" style="margin-top:7px;">
          <div class="narr">${narrate(fillSib(picked.reply))}</div>
        </div>
        <div class="row">
          <button id="mback" style="background:#2f6f8f; color:#fff; width:100%;">回小鎮 🏘️</button>
        </div>`
      : `
        <div style="font-size:14px; font-weight:800; color:#6b4a9e; margin-bottom:7px;">你要怎麼做？</div>
        <div class="choices">
          ${m.choices.map((c, i) => `<button class="choice" data-i="${i}">${esc(fillSib(c.label))}</button>`).join('')}
        </div>
        <div class="row">
          <button class="mini" id="mquit">← 回小鎮</button>
        </div>`}
    </div>`;

  app.querySelectorAll('.choice').forEach(b => {
    b.onclick = () => {
      Sfx.page();
      momentPick = parseInt(b.dataset.i, 10);
      markPeriodDone();       // 小事也算這個時段的事，做完就等下一個時段
      render();
    };
  });
  const back = document.getElementById('mback') || document.getElementById('mquit');
  if (back) back.onclick = () => { Sfx.tap(); curMoment = null; momentPick = -1; view = 'town'; render(); };
}

function render() {
  setTod(todNow());
  setRoleAttr();
  if (view === 'menu') renderMenu();
  else if (view === 'gallery') renderGallery();
  else if (view === 'who') renderWho();
  else if (view === 'story') renderStory();
  else if (view === 'town') renderTown();
  else if (view === 'box') renderBox();
  else if (view === 'moment') renderMoment();
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
                <span class="g">${esc(ROLES[p.role] ? ROLES[p.role].label : '姊姊')}　·　完美通關 ${done} / ${SCENARIOS.length}</span>
              </span>
              ${p.id === me ? '<span class="done">✅</span>' : '<span class="done" style="opacity:.25;">▶️</span>'}
            </button>`;
        }).join('')}
      </div>
      <div class="rolebox">
        <div class="roleq">「${esc(who().name)}」在家裡是：</div>
        <div class="roles">
          ${Object.keys(ROLES).map(r => `
            <button class="mini role-pick${myRole() === r ? ' on' : ''}" data-role="${r}">${esc(ROLES[r].label)}</button>`).join('')}
        </div>
        <div class="rolenote">
          有些小事只有當姊姊才會遇到（像「妹妹把你的色筆弄斷了」），
          有些只有當妹妹才會遇到。選對了才不會看到對不上的內容。<br>
          主角的裙子顏色也會跟著換。
        </div>
      </div>
      <button id="addwho" style="width:100%; margin-top:10px; background:#a8e6c0;">＋ 新增一個玩家</button>
      ${list.length > 1 ? `<button id="delwho" class="mini" style="margin-top:8px;">🗑️ 刪掉目前這個玩家</button>` : ''}
      <div class="row" style="margin-top:12px;">
        <button class="mini" id="whoback">← 回劇本選單</button>
      </div>
    </div>
  `;
  document.querySelectorAll('.role-pick').forEach(b => {
    b.onclick = () => {
      Sfx.tap();
      savePlayers(players().map(p => p.id === whoId() ? Object.assign({}, p, { role: b.dataset.role }) : p));
      render();
    };
  });
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
        <button class="mini" id="replaymode">${replayOn() ? '📖 回顧開' : '📖 回顧關'}</button>
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
  document.getElementById('replaymode').onclick = () => { Sfx.tap(); toggleReplay(); render(); };
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
    if (confirm('要清除「' + who().name + '」的所有紀錄嗎？\n\n結局圖鑑、寶物圖鑑、跟鎮民的熟悉度都會歸零。')) {
      wipePlayer(whoId());
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
    if (isCons(cur)) {
      improved = false;
      Sfx.good();                       // 中性的收尾音，不用高低分暗示好壞
    } else {
      improved = recordResult(cur.id, ending.grade);
      ({ best: Sfx.best, good: Sfx.good, escape: Sfx.escape, bad: Sfx.bad }[ending.grade] || Sfx.good)();
    }
    if (fromTown && !townFree) markPeriodDone();
    view = 'end';
    render();
  } else {
    console.error('找不到目標節點:', nxt);
  }
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

/* 安全提醒要不要出現在結局頁。
   這句話的工作是：不要讓遊戲教出「每個人都很危險」。
   但每一頁都放，看過幾十次之後就只是雜訊——她會直接跳過，
   真正需要的時候反而看不進去。

   而且小鎮現在有一半的時段是純日常的小事，
   那個結構本身就在講同一件事，比一行字有力得多。

   所以分三段：前八個結局講完整的；之後只在她剛被嚇到的時候
   （驚險、再試）補一句短的；做對的時候就不用再安慰她了。
   次數是每個玩家各自算的，所以妹妹第一次玩還是會看到完整版。 */
const SAFE_FULL_UNTIL = 8;
function safeFrame(grade) {
  if (seenTotal() <= SAFE_FULL_UNTIL) return `
    <div class="safeframe mini">
      <span class="sf-ico">🌱</span>
      <span class="sf-txt">大部分的人都是安全、願意幫忙的。<br>
        這個故事是在練習：<b>少數真的遇到危險的時候，你可以怎麼保護自己。</b></span>
    </div>`;
  if (grade === 'escape' || grade === 'bad') return `
    <div class="safeframe mini one">
      <span class="sf-ico">🌱</span>
      <span class="sf-txt">大部分的人都是安全的——這是在練習<b>少數</b>的時候。</span>
    </div>`;
  return '';
}

function renderEnding() {
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
          ${safeFrame(ending.grade)}
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

sweepOldKeys();   // 把昨天以前那一堆按日期命名的 key 掃掉
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
