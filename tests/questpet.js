// 🐾 寵物一起闖關：有孵出來的寵物才有 🐾；能量慢慢集、撿金幣集更快；集滿才放得出來；畫面裡的小怪物打倒、大魔王扣一下、烏雲大王扣一下；
// 寶寶只打得到附近；大朋友小可愛無敵 2 秒＋3 枚金幣；招式照個性；蛋還沒孵就沒有
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
    G.guide = 'done'; $('#modal').hidden = true; questState().mode = 'normal';
    const stage0 = G.pet.stage, sp0 = G.pet.species;
    // 蛋：沒有 🐾
    G.pet.stage = 'egg'; playQuest('1-1'); o.eggNo = !document.querySelector('.qb-pet') && !playQuest.test.pet(); closeGameWindow();
    // 小朋友（活潑）
    G.pet.stage = 'kid'; G.pet.species = 'dragon'; delete G.pet.small;
    playQuest('1-1'); let T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
    const QP = T.pet(); o.btn = !!document.querySelector('.qb-pet') && QP.mv.name === '星星衝撞';
    T.petSpecial(); o.notFull = QP.uses === 0;
    for (let i = 0; i < 60; i++) T.step(1 / 60); o.slowFill = QP.meter > .3 && QP.meter < 1;
    T.P.coins += 5; T.step(1 / 60); o.coinFill = QP.meter > 5;
    QP.meter = QP.max; for (let i = 0; i < 12; i++) T.step(1 / 60); await wait(50); o.glow = document.querySelector('.qb-pet').classList.contains('glow');
    // 放在畫面裡放兩隻怪物、一隻很遠的
    T.ents.forEach(e => { e.alive = false; }); const mkE = dx => { const e = { k: 'slime', x: T.P.x + dx, y: T.P.y, w: 16, h: 14, vx: 0, alive: true }; T.ents.push(e); return e; }; const near = [mkE(100), mkE(300), mkE(2000)];
    const c0 = T.P.coins; T.petSpecial(); o.kidHit = !near[0].alive && !near[1].alive && near[2].alive && T.P.coins === c0 + 2 && QP.meter === 0 && QP.uses === 1;
    closeGameWindow();
    // 寶寶：只打得到附近
    G.pet.stage = 'baby'; G.pet.species = 'bunny'; playQuest('1-1'); T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
    const q2 = T.pet(); o.shy = q2.mv.name === '愛心泡泡'; q2.meter = q2.max; T.ents.forEach(e => { e.alive = false; }); const n2 = [80, 330].map(dx => { const e = { k: 'slime', x: T.P.x + dx, y: T.P.y, w: 16, h: 14, vx: 0, alive: true }; T.ents.push(e); return e; });
    T.petSpecial(); o.babyNear = !n2[0].alive && n2[1].alive; closeGameWindow();
    // 大朋友：無敵＋3 金幣；大魔王扣一下
    G.pet.stage = 'adult'; G.pet.species = 'penguin'; playQuest('1-3', { bossStart: true }); T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
    const q3 = T.pet(); o.fish = q3.mv.name === '大浪花'; const bs = T.ents.find(e => e.k === 'boss'); for (let i = 0; i < 5; i++) T.step(1 / 60);
    T.P.x = bs.x - 100; const hp = bs.hp, c3 = T.P.coins; q3.meter = q3.max; T.P.inv = 0; T.petSpecial(); o.boss = bs.hp === hp - 1 && T.P.inv >= 1.9 && T.P.coins >= c3 + 3; closeGameWindow();
    // 烏雲大王（飄在天上也打得到）
    playQuest('5-3', { bossStart: true }); T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null; const ck = T.cloud(), q4 = T.pet();
    T.P.x = ck.x - 50; T.step(1 / 60); const ch = ck.hp; q4.meter = q4.max; T.petSpecial(); o.cloud = ck.hp === ch - 1; closeGameWindow();
    // 畫面跑幾格不會出錯（真的畫出來）
    playQuest('2-1'); T = playQuest.test; T.pet().meter = 99; T.petSpecial(); await wait(600); o.drawn = T.pet().act > 0 || T.pet().uses === 1; closeGameWindow();
    G.pet.stage = stage0; G.pet.species = sp0;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
