// ⚡ 闖關的五種花：火球、閃電、冰箭（穿兩隻）、大石頭（會滾、撞破磚塊）、龍捲風（捲走一排）；按鈕圖示跟著換、被打到變回原樣
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(() => {
    const o = {}, QT = 18;
    G.guide = 'done'; $('#modal').hidden = true;
    const start = id => { questState().mode = 'normal'; playQuest(id); const T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null; return T; };
    const run = (T, n) => { for (let i = 0; i < n; i++) T.step(1 / 60); };
    // 平地上放一排怪物（把關卡清空成平地，比較好測）
    const flat = T => { T.L.g.forEach((r, y) => r.forEach((c, x) => { r[x] = y >= 13 ? '#' : ' '; })); T.ents.length = 0; T.items.length = 0; T.plats.length = 0; };
    const foe = (T, x) => { const en = { k: 'slime', x: x, y: 13 * QT - 14, w: 16, h: 14, vx: 0, vy: 0, alive: true, still: true }; T.ents.push(en); return en; };
    const setup = (el) => { const T = start('1-1'); flat(T); T.givePower('fire', el); T.P.inv = 99; T.P.x = 4 * QT; T.P.y = 13 * QT - T.P.h; T.P.vy = 0; T.P.vx = 0; T.P.face = 1; run(T, 2); return T; };
    const btn = () => document.querySelector('.qb-fire');
    let T = setup('fire'); o.fireIcon = btn().textContent === '🔥'; let a = foe(T, 9 * QT); T.shootFire(); run(T, 60); o.fire = !a.alive;
    T = setup('zap'); o.zapIcon = btn().textContent === '⚡' && T.P.elem === 'zap'; a = foe(T, 12 * QT); const far = foe(T, 30 * QT); T.shootFire(); o.zap = !a.alive && far.alive && T.fbs.some(f => f.el === 'zap'); run(T, 30); o.zapGone = T.fbs.length === 0;
    T = setup('ice'); a = foe(T, 8 * QT); let b2 = foe(T, 10 * QT), c = foe(T, 12 * QT); T.shootFire(); run(T, 60); o.icePierce = !a.alive && !b2.alive && c.alive;
    T = setup('rock'); T.L.g[12][14] = 'B'; a = foe(T, 9 * QT); T.shootFire(); run(T, 150); o.rockKill = !a.alive; o.rockBrick = T.L.g[12][14] === ' ';
    T = setup('wind'); a = foe(T, 7 * QT); b2 = foe(T, 9 * QT); c = foe(T, 10 * QT); T.shootFire(); run(T, 90); o.wind = !a.alive && !b2.alive && !c.alive;
    // 大魔王：一招只扣一下
    T = setup('wind'); const boss = { k: 'boss', x: 8 * QT, y: 13 * QT - 40, w: 40, h: 40, vx: 0, vy: 0, alive: true, hp: 3, hurt: 0, still: true }; T.ents.push(boss); T.shootFire(); for (let i = 0; i < 90; i++) { boss.vx = 0; boss.x = 8 * QT; run(T, 1); } o.bossOnce = boss.hp === 2;
    // 被打到：變回原樣、按鈕藏起來
    T = setup('ice'); T.P.inv = 0; T.P.starT = 0; const h0 = T.P.hearts; const en = foe(T, T.P.x); en.still = false; run(T, 3); o.hurtBack = !T.P.fire && btn().style.display === 'none' && T.P.hearts === h0;
    // 粉紅磚跳出來的花有不同種類
    const kinds = new Set(); for (let tx = 0; tx < 10; tx++) kinds.add(QUEST_ELEM_ORDER[(tx * 3 + 9 * 7) % QUEST_ELEM_ORDER.length]); o.variety = kinds.size === 5;
    closeGameWindow(); $('#modal').hidden = true;
    return o;
  });
  console.log(JSON.stringify(out));
  console.log(Object.values(out).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
