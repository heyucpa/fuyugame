
/* ===== 平安的一天 =====
   跟「情境劇場」共用同一份劇本與插圖，但玩法不同：
   劇場是一篇一篇挑著看；這裡是走完一天。

   早上出門 → 在學校 → 放學後 → 晚上回到家，四段。
   不是每一段都會出事——一天裡隨機兩到三段有狀況，其餘是平順的。
   這是刻意的：遊戲自己的安全提醒就寫著「大部分的人都是安全、願意幫忙的」，
   讓大部分的路段真的平安無事，比用文字講一次有用。
*/

/* 音效：自己放一份精簡的。
   Sfx 原本定義在 theater_app.js，但那個檔案屬於情境劇場，
   為了不動到它（theater.html 要保持一個位元組都不變），這裡另外寫。 */
const Sfx = (() => {
  let ctx = null;
  const muted = () => localStorage.getItem('world-muted') === '1';
  function get() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, d, v = 0.15, type = 'sine', delay = 0) {
    if (muted()) return;
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
  return {
    unlock() { get(); },
    tap()    { tone(680, 0.07, 0.12, 'triangle'); },
    page()   { tone(520, 0.09, 0.1); tone(700, 0.1, 0.09, 'sine', 0.07); },
    best()   { [523, 659, 784, 1046, 1318].forEach((n, i) => tone(n, 0.16, 0.16, 'triangle', i * 0.09)); },
    good()   { [523, 784, 1046].forEach((n, i) => tone(n, 0.14, 0.15, 'triangle', i * 0.09)); },
    escape() { [440, 660, 880].forEach((n, i) => tone(n, 0.13, 0.14, 'sine', i * 0.1)); },
    bad()    { tone(300, 0.25, 0.15, 'sawtooth'); tone(200, 0.35, 0.13, 'sawtooth', 0.2); },
  };
})();

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const narrate = s => esc(s).replace(/&lt;(\/?(?:br|b))&gt;/g, '<$1>');

const GRADE = {
  best:   { label: '完美',   badge: '完美結局', color: '#1e7d46', bg: '#b7f0c2' },
  good:   { label: '差一步', badge: '只差一步', color: '#1f6fa8', bg: '#c5e4ff' },
  escape: { label: '驚險',   badge: '驚險結局', color: '#b06a00', bg: '#ffe6a8' },
  bad:    { label: '再試',   badge: '再試結局', color: '#a33',    bg: '#ffd0d0' },
};

/* 一天的四段，以及每一段可能遇到的事。
   分法照劇本裡實際寫的時間與地點，不是硬塞的：
   「去買早餐」是週末早上、「等不到爸媽」是放學鐘響、
   「一個人在家」是爸媽出門之後。 */
const STOPS = [
  { key: 'morning', icon: '🌅', name: '早上<br>出門',  pool: ['breakfast', 'scam'] },
  { key: 'school',  icon: '🏫', name: '在學校',        pool: ['bully', 'quake', 'money', 'candy', 'knife', 'wish'] },
  { key: 'after',   icon: '🌆', name: '放學後',        pool: ['gate', 'road', 'dojo', 'lost', 'pool'] },
  { key: 'night',   icon: '🏠', name: '晚上<br>回到家', pool: ['home', 'fire', 'fakecop', 'shop', 'imposter', 'exam', 'online', 'secret'] },
];

/* 這一段沒事發生的時候寫什麼。照段落給，才不會每次都同一句 */
const CALM = {
  morning: ['你自己出門，路上很順，準時到學校。', '今天早上什麼事都沒有，真好。'],
  school:  ['今天在學校很平常，上課、下課、跟同學玩。', '一整天都很順，沒發生什麼特別的事。'],
  after:   ['放學後你直接回家，路上沒什麼特別的。', '今天很準時被接到，一路平安。'],
  night:   ['晚上在家寫功課、看電視，很安靜的一個晚上。', '今天晚上沒什麼事，早早就睡了。'],
};

/* ===== 玩家 =====
   沿用情境劇場那邊已經建好的玩家名單（唯讀），這樣兩邊是同一個人，
   但這個遊戲的紀錄分開存，不會互相影響。 */
function players() {
  try {
    const p = JSON.parse(localStorage.getItem('theater-players'));
    if (Array.isArray(p) && p.length) return p;
  } catch (e) {}
  return [{ id: 'p1', name: '姊姊', emoji: '⭐' }, { id: 'p2', name: '妹妹', emoji: '🌸' }];
}
function whoId() {
  const id = localStorage.getItem('world-who'), list = players();
  return list.some(p => p.id === id) ? id : list[0].id;
}
function who() { return players().find(p => p.id === whoId()) || players()[0]; }
const wKey = k => 'world-' + k + ':' + whoId();

function loadStats() {
  try { return JSON.parse(localStorage.getItem(wKey('stats'))) || { days: 0, perfect: 0 }; }
  catch (e) { return { days: 0, perfect: 0 }; }
}
function saveStats(s) { try { localStorage.setItem(wKey('stats'), JSON.stringify(s)); } catch (e) {} }
// 最近遇過的，下次盡量避開，免得同一篇一直重複
function loadRecent() {
  try { return JSON.parse(localStorage.getItem(wKey('recent'))) || []; } catch (e) { return []; }
}
function pushRecent(id) {
  const r = loadRecent().filter(x => x !== id);
  r.unshift(id);
  try { localStorage.setItem(wKey('recent'), JSON.stringify(r.slice(0, 8))); } catch (e) {}
}

const byId = id => SCENARIOS.find(s => s.id === id);
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ===== 排一天 ===== */
function newDay() {
  const recent = loadRecent();
  // 四段裡隨機挑 2～3 段會遇到事
  const n = 2 + Math.floor(Math.random() * 2);
  const idx = STOPS.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, n).sort((a, b) => a - b);

  const used = [];
  day = STOPS.map((stop, i) => {
    if (idx.indexOf(i) < 0) return { stop: stop, calm: pick(CALM[stop.key]), result: null };
    // 先從「最近沒遇過的」裡面挑，都遇過了才放寬
    const avail = stop.pool.filter(x => used.indexOf(x) < 0);
    const fresh = avail.filter(x => recent.indexOf(x) < 0);
    const id = pick(fresh.length ? fresh : avail);
    used.push(id);
    return { stop: stop, calm: null, scenarioId: id, result: null };
  });
  at = 0; cur = null; nodeId = null; ending = null;
  view = 'route';
}

/* ===== 狀態 ===== */
let view = 'title';   // title / route / story / end / tally
let day = [];         // 這一天的四段
let at = 0;           // 走到第幾段
let cur = null, nodeId = null, ending = null, endingKey = null;

const app = document.getElementById('app');

function render() {
  if (view === 'title')  return renderTitle();
  if (view === 'route')  return renderRoute();
  if (view === 'story')  return renderStory();
  if (view === 'end')    return renderEnding();
  if (view === 'tally')  return renderTally();
}

/* ===== 封面 ===== */
function renderTitle() {
  const st = loadStats(), list = players(), me = whoId();
  app.innerHTML = `
    <div class="card anim">
      <h1>🗺️ 平安的一天</h1>
      <div class="sub">從早上出門到晚上回家，一路上會遇到什麼？</div>
      <div class="safeframe">
        🌱 <b>大部分的日子都是平安的。</b><br>
        這個遊戲是在練習：真的遇到狀況的時候，你可以怎麼辦。
      </div>
      <div class="daytop" style="margin:14px 0 10px;">
        <span class="daynum">${esc(who().emoji)} ${esc(who().name)}　已經過了 ${st.days} 天${st.perfect ? `　🌟 全部完美的有 ${st.perfect} 天` : ''}</span>
      </div>
      <button id="go" style="width:100%; background:#2f6f8f; color:#fff; font-size:19px; padding:16px;">☀️ 開始新的一天</button>
      <div class="row" style="margin-top:12px;">
        ${list.map(p => `<button class="mini${p.id === me ? ' on' : ''}" data-who="${esc(p.id)}"
          style="${p.id === me ? 'background:#dff0fa; border-color:#2f6f8f;' : ''}">${p.emoji} ${esc(p.name)}</button>`).join('')}
      </div>
      <div class="row" style="margin-top:8px;">
        <button class="mini" id="toTheater">🎭 去情境劇場</button>
      </div>
    </div>`;
  document.getElementById('go').onclick = () => { Sfx.tap(); newDay(); render(); };
  document.getElementById('toTheater').onclick = () => { location.href = './theater.html'; };
  document.querySelectorAll('[data-who]').forEach(b => {
    b.onclick = () => { localStorage.setItem('world-who', b.dataset.who); Sfx.tap(); render(); };
  });
}

/* ===== 路線圖 ===== */
function routeBar() {
  return `<div class="route">${day.map((d, i) => {
    const cls = i < at ? ' done' : (i === at ? ' now' : '');
    const mark = i < at ? (d.result ? (d.result.grade === 'best' ? '🌟' : GRADE[d.result.grade].label === '再試' ? '🔁' : '✓') : '✓') : '';
    return `<div class="stop${cls}">
      ${mark ? `<span class="mk">${mark}</span>` : ''}
      <span class="dot">${d.stop.icon}</span>
      <span class="nm">${d.stop.name}</span>
    </div>`;
  }).join('')}</div>`;
}

function renderRoute() {
  const d = day[at];
  app.innerHTML = `
    <div class="card anim">
      <div class="daytop"><span class="daynum">${esc(who().emoji)} ${esc(who().name)} 的一天</span></div>
      ${routeBar()}
      ${d.calm ? `
        <div class="calm">
          <span class="big">${d.stop.icon}</span>
          <div class="t">這一段很平順</div>
          <div class="s">${narrate(d.calm)}</div>
        </div>
        <button id="next" style="width:100%; background:#7cc9a0; color:#1e3d2c;">繼續 ▶</button>
      ` : `
        <div class="stage" style="margin-top:4px;">
          <div class="narr">${d.stop.icon} <b>${d.stop.name.replace('<br>', '')}</b>……有事情發生了。</div>
        </div>
        <button id="next" style="width:100%; background:#2f6f8f; color:#fff;">看看怎麼回事 ▶</button>
      `}
    </div>`;
  document.getElementById('next').onclick = () => {
    Sfx.page();
    if (d.calm) { advance(); }
    else { cur = byId(d.scenarioId); nodeId = null; view = 'story'; render(); }
  };
}

/* ===== 故事 ===== */
function renderStory() {
  if (nodeId === null) {
    app.innerHTML = `
      <div class="card anim">
        <h1>${cur.emoji} ${esc(cur.title)}</h1>
        <div class="sub">${esc(cur.tag)}</div>
        ${introFor(cur.id) ? `<div class="scene pop">${introFor(cur.id)}</div>` : ''}
        <div class="stage"><div class="narr">${narrate(cur.intro)}</div></div>
        <div class="choices">
          <button class="choice" id="go" style="text-align:center; background:#2f6f8f; color:#fff;">開始 ▶</button>
        </div>
      </div>`;
    document.getElementById('go').onclick = () => { Sfx.page(); nodeId = cur.start; render(); };
    return;
  }
  const n = cur.nodes[nodeId];
  app.innerHTML = `
    <div class="card anim">
      <div class="daytop"><span class="daynum">${cur.emoji} ${esc(cur.title)}</span></div>
      <div class="stage"><div class="narr">${narrate(n.text)}</div></div>
      <div class="choices">
        ${n.choices.map((c, i) => `<button class="choice" data-i="${i}">${esc(c.label)}</button>`).join('')}
      </div>
    </div>`;
  document.querySelectorAll('.choice').forEach(b => {
    b.onclick = () => { Sfx.tap(); choose(+b.dataset.i); };
  });
}

function choose(i) {
  const to = cur.nodes[nodeId].choices[i].to;
  if (cur.endings[to]) {
    ending = cur.endings[to]; endingKey = to;
    day[at].result = { scenarioId: cur.id, title: ending.title, grade: ending.grade };
    pushRecent(cur.id);
    ({ best: Sfx.best, good: Sfx.good, escape: Sfx.escape, bad: Sfx.bad }[ending.grade] || Sfx.good)();
    view = 'end';
  } else {
    nodeId = to; Sfx.page();
  }
  render();
}

function renderEnding() {
  const m = GRADE[ending.grade];
  app.innerHTML = `
    <div class="card">
      <div class="endgrid">
        <div class="result">
          <div class="scene pop">${sceneFor(cur.id, endingKey, ending.grade)}</div>
          <h1>${esc(ending.title)}</h1>
          <span class="badge" style="background:${m.bg}; color:${m.color};">${m.badge}</span>
        </div>
        <div>
          <div class="stage" style="margin-top:0;"><div class="narr">${narrate(ending.text)}</div></div>
          <div class="lesson">
            <div style="font-weight:900; margin-bottom:5px; color:#1e7d46;">💡 學到了什麼</div>
            ${narrate(ending.lesson)}
          </div>
        </div>
      </div>
      <button id="next" style="width:100%; margin-top:12px; background:#2f6f8f; color:#fff;">
        ${at < day.length - 1 ? '繼續今天 ▶' : '回到家了 🏠'}
      </button>
    </div>`;
  document.getElementById('next').onclick = () => { Sfx.tap(); advance(); };
}

function advance() {
  at++;
  if (at >= day.length) {
    const st = loadStats();
    st.days++;
    const done = day.filter(d => d.result);
    if (done.length && done.every(d => d.result.grade === 'best')) st.perfect++;
    saveStats(st);
    view = 'tally';
  } else {
    view = 'route';
  }
  render();
}

/* ===== 一天結算 ===== */
function renderTally() {
  const done = day.filter(d => d.result);
  const allBest = done.length > 0 && done.every(d => d.result.grade === 'best');
  const redo = done.filter(d => d.result.grade === 'escape' || d.result.grade === 'bad');
  const st = loadStats();
  app.innerHTML = `
    <div class="card anim">
      <h1>🏠 今天回到家了</h1>
      <div class="sub">${allBest ? '而且每一件事都處理得很好' : '今天走過這些事'}</div>
      ${routeBar()}
      ${done.length ? `<div class="tally">
        ${done.map(d => {
          const g = GRADE[d.result.grade];
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
      <button id="again" style="width:100%; background:#2f6f8f; color:#fff;">☀️ 再過一天</button>
      <div class="row" style="margin-top:8px;">
        <button class="mini" id="home">🗺️ 回封面</button>
        <button class="mini" id="toTheater">🎭 去情境劇場</button>
      </div>
    </div>`;
  document.getElementById('again').onclick = () => { Sfx.tap(); newDay(); render(); };
  document.getElementById('home').onclick = () => { Sfx.tap(); view = 'title'; render(); };
  document.getElementById('toTheater').onclick = () => { location.href = './theater.html'; };
}

['pointerdown', 'keydown'].forEach(ev =>
  document.addEventListener(ev, () => Sfx.unlock(), { once: true }));

render();

/* 一打開就對一次版本，有新版自動載入（跟情境劇場同一套作法） */
(async function autoUpdate() {
  if (location.protocol === 'file:') return;
  if (sessionStorage.getItem('world-autoreload')) return;
  try {
    const r = await fetch(location.pathname + '?t=' + Date.now(), { cache: 'no-store' });
    const m = (await r.text()).match(/name="build" content="([^"]+)"/);
    const mine = (document.querySelector('meta[name="build"]') || {}).content;
    if (m && mine && m[1] !== mine) {
      sessionStorage.setItem('world-autoreload', '1');
      location.replace(location.pathname + '?v=' + m[1]);
    }
  } catch (e) {}
})();
