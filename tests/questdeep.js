// 🌊 更多水裡的關卡：2-4 海底、3-4 森林湖底（大石頭）、4-4 冰海（冰柱）整關都在水裡；按住 ▶（湖底偶爾按跳）游得到旗子；在水裡身體往前趴著游
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(() => {
    const o = {}; G.guide = 'done'; $('#modal').hidden = true;
    const run = (id, mode) => {
      questState().mode = mode; playQuest(id); const T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
      const deep = T.deep() && T.P.swim; T.P.inv = 999; T.keys.ArrowRight = true; let n = 0;
      while (T.state() === 'play' && n < 60 * 60) { if (id === '3-4') { if (n % 40 === 0) T.jump(); if (n % 40 === 12) T.release(); } T.step(1 / 60); n++; }
      T.keys.ArrowRight = false; const ok = deep && (T.state() === 'flag' || T.state() === 'win');
      closeGameWindow(); $('#modal').hidden = true; return ok;
    };
    ['2-4', '3-4', '4-4'].forEach(id => ['easy', 'normal'].forEach(m => { o[id + m] = run(id, m); }));
    o.ids = QUEST_IDS.length === 30;
    o.help = (() => { questState().mode = 'easy'; playQuest('4-4'); const t = document.body.innerText; closeGameWindow(); $('#modal').hidden = true; return /整關都在水裡/.test(t); })();
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
