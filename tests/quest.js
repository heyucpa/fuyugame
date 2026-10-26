// 🗺️ 世界任務：9 關在「簡單」「一般」都打得過（自動玩：前面有坑、牆、怪物就跳；簡單模式到大魔王那裡要自己按 ◀ ▶）；過關存檔、解鎖下一關、破完世界多一座小島；壞資料清掉
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = { runs: {} };
    G.guide = 'done'; $('#modal').hidden = true;
    o.locked = !questUnlocked('1-2') && questUnlocked('1-1');
    // 快轉模擬：停掉畫面迴圈，直接一小步一小步算（每步 1/60 秒），自動玩家：往右走；前面有坑／牆／怪物就跳
    const sim = (normal) => {
      const T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
      let held = false;
      for (let i = 0; i < 60 * 150 && T.state() === 'play'; i++) {
        const P = T.P, QT = 18, fx = Math.floor((P.x + P.w + 14) / QT), feet = Math.floor((P.y + P.h + 2) / QT), mid = Math.floor((P.y + P.h - 6) / QT);
        { const bs = T.ents.find(e => e.k === 'boss' && e.alive && Math.abs(e.x - P.x) < 200); const dir = bs ? Math.sign(bs.x + bs.w / 2 - P.x - P.w / 2) || 1 : 1; T.keys.ArrowRight = dir > 0; T.keys.ArrowLeft = dir < 0; }   // 打大王：朝著大王走、牠暈的時候跳上去
        const gap = !T.solid(T.tileAt(fx, feet)) && !T.solid(T.tileAt(fx + 1, feet)) && T.tileAt(fx, feet) !== '-';
        const wall = T.solid(T.tileAt(fx, mid)) || T.solid(T.tileAt(fx, mid - 1));
        const foe = T.ents.find(e => e.alive && (e.k === 'boss' ? (e.dizzy > 0 && Math.abs(e.x + e.w / 2 - P.x - P.w / 2) < 70) : (e.x > P.x - 4 && e.x - (P.x + P.w) < 30)) && Math.abs(e.y - P.y) < 50);
        if (P.on && (gap || wall || foe)) { T.jump(); held = true; } else if (held && !P.on && P.vy > 0) { T.release(); held = false; }
        T.step(1 / 60);
      }
      return T.state() + (normal ? ' ❤' + T.P.hearts : '') + ' x=' + Math.round(T.P.x / 18) + '/' + T.L.W;
    };
    for (const mode of ['easy', 'normal']) {
      for (const id of QUEST_IDS) {
        questState().mode = mode; playQuest(id); const r = sim(mode === 'normal'); o.runs[mode + ' ' + id] = r;
        if (/^win/.test(r)) { questDone({ stage: document.createElement('div'), btns: document.createElement('div'), status: {}, card: document.createElement('div') }, id, playQuest.test.P); }
        closeGameWindow(); $('#modal').hidden = true; SC_QUEUE.length = 0; const sc = document.getElementById('showcase'); if (sc) sc.remove();
        if (mode === 'easy' && !/^win/.test(r)) { questState().clear[id] = 1; }   // 讓下一關可以玩
      }
    }
    // 簡單模式：到大魔王前面會出現 ◀ ▶，不按就停住、按 ◀ 會往後退
    { questState().mode = 'easy'; playQuest('1-3', { bossStart: true }); const T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
      for (let i = 0; i < 60; i++) T.step(1 / 60); const lb = document.querySelector('.qb-l'); o.bossBtns = lb && lb.style.display !== 'none';
      const x0 = T.P.x; for (let i = 0; i < 60; i++) T.step(1 / 60); o.bossStill = Math.abs(T.P.x - x0) < 4;
      T.keys.ArrowLeft = true; for (let i = 0; i < 40; i++) T.step(1 / 60); T.keys.ArrowLeft = false; o.bossBack = T.P.x < x0 - 20;
      closeGameWindow(); $('#modal').hidden = true; }
    o.cleared = Object.keys(questState().clear).length; o.worlds = questWorldsCleared();
    islMapCache = null; const m = islMap(0); o.islets = m.specials.map(s => s.id); o.isletLand = m.specials.every(sp => m.land[sp.y][sp.x]);
    openIsland(); await wait(300); o.btn = !!document.querySelector('.isl-quest');
    const fun = islFunAt({ fx: m.specials[0].x + .5, fy: m.specials[0].y + .3 }); o.fun = fun && fun.kind; const b0 = G.bells; islFun(fun); o.gift = G.bells === b0 + 50; islFun(fun); o.onceDay = G.bells === b0 + 50;
    closeIsland();
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    o.saved = raw.quest && raw.quest.clear['3-3'] === 1;
    const bad = normalizeSave(Object.assign({}, raw, { quest: { mode: 'zz', clear: { '9-9': 1, '1-1': 'x', '2-2': 1 }, stars: { '1-1': 9, '1-2': 2 } } }));
    o.badCleaned = bad.quest.mode === 'easy' && JSON.stringify(bad.quest.clear) === '{"2-2":1}' && JSON.stringify(bad.quest.stars) === '{"1-2":2}';
    return o;
  });
  console.log(JSON.stringify(out));
  const easyAll = Object.entries(out.runs).filter(([k]) => /^easy/.test(k)).every(([, v]) => /^win/.test(v));
  const normalWins = Object.entries(out.runs).filter(([k]) => /^normal/.test(k)).filter(([, v]) => /^win/.test(v)).length;
  const ok = out.locked && easyAll && normalWins >= 7 && out.worlds === 3 && out.islets.length === 3 && out.isletLand && out.btn && out.fun === 'qspecial' && out.gift && out.onceDay && out.saved && out.badCleaned && out.bossBtns && out.bossStill && out.bossBack && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
