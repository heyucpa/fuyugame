// ☁️ 烏雲大王：5-3 是烏雲大王（其他世界還是原本的大王）；飄著的時候踩不到、休息時踩得到；三個階段（打雷、雲朵台階）；
// 雨滴落地變水窪、走比較慢；打倒變白雲、旗子出現、💰 +30、第一次送限定貼紙；輸了可以從階段繼續；自動玩家打得過（簡單、一般從大魔王開始）；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; $('#modal').hidden = true; G.cloudKing = null;
    const QT = 18;
    const bot = (T, secs) => {   // 跟 quest.js 一樣的自動玩家（大魔王那段）
      let held = false; const log = [];
      for (let i = 0; i < 60 * secs && T.state() === 'play'; i++) {
        const P = T.P, bs = T.cloud(); let dir = 1;
        if (bs && bs.alive) { const cx = bs.x + bs.w / 2, px = P.x + P.w / 2, near = bs.mode === 'rest' || bs.mode === 'down';
          let tx = near ? cx : cx + (px < cx ? -100 : 100); if (!near && (tx < bs.ax0 + 10 || tx > bs.ax1 - 10)) tx = cx + (px < cx ? 100 : -100);
          const bolt = T.bolts.find(b => !b.hit && px > b.x - 8 && px < b.x + b.w + 8); if (bolt) tx = px + (px < bolt.x + bolt.w / 2 ? -40 : 40); const drop = T.rain.find(d => Math.abs(d.x - px) < 16 && d.y < P.y + 4 && d.y > P.y - 90); if (drop && !near) tx = px + (px < drop.x ? -40 : 40); const hv = T.items.find(it => it.k === 'heart' && !it.got); if (hv && !near && !drop && !bolt) tx = hv.x;
          dir = Math.abs(tx - px) < 6 ? 0 : Math.sign(tx - px); }
        T.keys.ArrowRight = dir > 0; T.keys.ArrowLeft = dir < 0;
        const foe = bs && bs.alive && bs.dizzy > 0 && Math.abs(bs.x + bs.w / 2 - P.x - P.w / 2) < 70;
        const fx = Math.floor((P.x + P.w + 14) / QT), mid = Math.floor((P.y + P.h - 6) / QT), wall = T.solid(T.tileAt(fx, mid));
        if (P.on && (foe || wall)) { T.jump(); held = true; } else if (held && !P.on && P.vy > 0) { T.release(); held = false; }
        const h0 = P.hearts; T.step(1 / 60); if (P.hearts < h0) log.push(bs ? bs.phase : 0);
      }
      return log;
    };
    // 別的世界還是原本的大王
    playQuest('1-3'); o.oldBoss = playQuest.test.ents.some(e => e.k === 'boss') && !playQuest.test.cloud(); closeGameWindow();
    // 一般：從大魔王開始
    questState().mode = 'normal'; playQuest('5-3', { bossStart: true }); let T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
    const ck = T.cloud(); o.isCloud = !!ck && ck.hp === 6 && ck.phase === 1;
    // 還沒走過去：不會下雨
    for (let i = 0; i < 60; i++) T.step(1 / 60); o.idle = T.rain.length === 0;
    // 飄在天上：碰不到（直接把小可愛放上去也不會扣血）
    T.keys.ArrowRight = true; for (let i = 0; i < 200 && !T.bossZone(); i++) T.step(1 / 60); T.keys.ArrowRight = false; o.zone = T.bossZone();
    for (let i = 0; i < 90; i++) T.step(1 / 60); o.rain = T.rain.length > 0;
    const hp0 = ck.hp; T.P.x = ck.x + 20; T.P.y = ck.y + 2; T.P.vy = 50; T.step(1 / 60); o.noHitFloat = ck.hp === hp0;
    // 水窪：走比較慢
    T.puddles.push({ x: T.P.x + T.P.w / 2, t: 4 }); T.P.y = ck.gy - T.P.h; T.P.vy = 0; T.P.on = true; T.step(1 / 60); o.wet = T.P.wet === true; T.puddles.length = 0;
    // 階段：打兩下進第 2 階段（會打雷）、再兩下第 3 階段（雲朵台階）
    T.P.inv = 0; T.P.hearts = 3;
    T.ckHit(ck); o.h1 = ck.hp === 5 && ck.mode === 'rise'; ck.hurt = 0; T.ckHit(ck); o.p2 = ck.phase === 2 && ck.inv > 0; ck.inv = 0; ck.hurt = 0;
    ck.mode = 'float'; ck.boltT = 0; for (let i = 0; i < 5; i++) T.step(1 / 60); o.bolt = T.bolts.length > 0;
    T.ckHit(ck); ck.hurt = 0; T.ckHit(ck); o.p3 = ck.phase === 3 && T.tileAt(ck.kx - 6, 9) === '-'; ck.inv = 0; ck.hurt = 0;
    T.ckHit(ck); ck.hurt = 0; T.ckHit(ck); o.ko = !ck.alive && T.P.cloudKO && T.items.some(it => it.k === 'goal' && !it.hidden);
    closeGameWindow();
    // 輸了：從階段繼續
    playQuest('5-3', { bossStart: true, cloudPhase: 3 }); T = playQuest.test; o.resume = T.cloud().hp === 2 && T.cloud().phase === 3; closeGameWindow();
    const fw = { stage: document.createElement('div'), btns: document.createElement('div'), status: {}, card: document.createElement('div') };
    questFail(fw, '5-3', 1, 2); o.failBtn = /第 2 階段繼續/.test(fw.btns.textContent);
    // 自動玩家打得過：一般（從大魔王開始）、簡單（從頭）
    const runs = {};
    for (const [mode, bs] of [['normal', true], ['normal', true], ['easy', false]]) {
      questState().mode = mode; playQuest('5-3', bs ? { bossStart: true } : undefined); T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
      if (!bs) { for (let i = 0; i < 60 * 120 && !T.bossZone() && T.state() === 'play'; i++) { T.keys.ArrowRight = true; const P = T.P, fx = Math.floor((P.x + P.w + 14) / QT), feet = Math.floor((P.y + P.h + 2) / QT); if (P.on && (!T.solid(T.tileAt(fx, feet)) || T.solid(T.tileAt(fx, Math.floor((P.y + P.h - 6) / QT))))) T.jump(); T.step(1 / 60); } }
      const log = bot(T, 150); runs[mode + (bs ? 'B' : '')] = (runs[mode + (bs ? 'B' : '')] || []).concat([T.state() + ' hp' + (T.cloud() ? T.cloud().hp : '-') + ' hurt@' + log.join('')]);
      if (T.state() === 'flag' || T.state() === 'win') { for (let i = 0; i < 400 && T.state() !== 'win'; i++) T.frameStep(1 / 60); }
      closeGameWindow();
    }
    o.runs = runs; o.botWins = Object.values(runs).flat().filter(r => /^(flag|win)/.test(r)).length >= 2;
    // 打倒後過關：記次數、第一次送貼紙
    G.cloudKing = null; questDone(fw, '5-3', { coins: 30, stars: 0, cloudKO: true }); o.beat = G.cloudKing && G.cloudKing.beat === 1;
    await wait(1200); o.sticker = !!document.querySelector('#showcase') || SC_QUEUE.length > 0; document.querySelectorAll('#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0;
    openTab('book'); await wait(200); o.book = /烏雲剋星/.test(document.getElementById('tabBody').textContent); openTab('inv');
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.cloudKing && raw.cloudKing.beat === 1;
    o.bad = normalizeSave(Object.assign({}, raw, { cloudKing: { beat: -2 } })).cloudKing == null && normalizeSave(Object.assign({}, raw, { cloudKing: 'x' })).cloudKing == null;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.entries(out).every(([k, v]) => k === 'runs' || Boolean(v)) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
