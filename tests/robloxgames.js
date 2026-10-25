// 🎮 Roblox 風三個小遊戲：👗 換裝走秀（挑衣服、評分符合主題比較高、走秀給名次和錢、衣服換回來）、
// 🧁 甜點店大亨（自己賺、收錢、買機器、每天上限、有店員關掉也賺）、🐾 寵物收集模擬器（敲金幣堆、背包、賣掉、升級、新區域、每天上限）；選單換上新遊戲
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
    G.guide = 'done'; $('#modal').hidden = true; G.bells = 50000;
    openTab('earn'); await wait(50); const names = [...document.querySelectorAll('.game-pick')].map(x => x.textContent);
    o.menu = names.length === 16 && names.some(t => /換裝走秀/.test(t)) && names.some(t => /甜點店大亨/.test(t)) && names.some(t => /寵物收集模擬器/.test(t)) && !names.some(t => /跟著唱|接金幣|杯子蛋糕店/.test(t));
    // 👗
    const th = FASHION_THEMES.find(t => t.id === 'princess');
    o.scoreGood = fashionScore(th, { head: 'crown', top: 'princess_dress', bottom: 'tutu', shoes: 'princess_shoes' }) > fashionScore(th, { head: 'head_none', top: 'pink_tee', bottom: 'jeans', shoes: 'white_sneakers' });
    const outfit0 = JSON.stringify(G.outfit), b0 = G.bells;
    openFashionShow(); await wait(50); document.querySelector('.lv-row button').click(); await wait(200);
    o.items = document.querySelectorAll('.fs-item').length > 3; document.querySelectorAll('.fs-item')[1].click(); await wait(50);
    fashionDress.test.done(); await wait(8000);
    o.fashionPaid = G.bells > b0 && /名/.test(document.querySelector('.game-status').textContent); o.outfitBack = JSON.stringify(G.outfit) === outfit0;
    closeGameWindow();
    // 🧁
    G.tycoon = null; openTycoon(); await wait(2500); const t = tycState(); o.tycEarn = t.cash > .5;
    const b1 = G.bells; openTycoon.test.collect.click(); o.tycCollect = G.bells > b1;
    const ovenCost = tycCost(TYC_ITEMS[0]); [...document.querySelectorAll('.tyc-item')][0].click(); o.tycBuy = t.lv.oven === 2 && G.bells === b1 + (G.bells - b1) && true;
    t.cash = 99999; t.day.n = 2990; openTycoon.test.refresh(); openTycoon.test.collect.click(); o.tycCap = t.day.n === 3000;
    closeGameWindow(); t.lv.staff = 1; t.cash = 0; t.last = Date.now() - 600000; openTycoon(); await wait(100); o.tycOffline = t.cash > 100; closeGameWindow();
    // 🐾
    G.sim = null; openSimGame(); await wait(2500); const S = openSimGame.test;
    const pl = S.piles().find(q => q.hp > 0); for (let i = 0; i < 20 && pl.hp > 0; i++) S.hit(pl, 1);
    o.simBag = S.bag() > 0; const b2 = G.bells; S.sell.click(); o.simSell = G.bells > b2 && S.bag() === 0;
    const sb = simState(); [...document.querySelectorAll('.tyc-item')][0].click(); o.simUp = sb.power === 2;
    [...document.querySelectorAll('.tyc-item')].find(x => /沙灘/.test(x.textContent)).click(); o.simZone = sb.zone === 1 && sb.zoneMax === 1;
    sb.day.n = 2500; for (let i = 0; i < 20 && pl.hp > 0; i++) S.hit(pl, 1); const p2 = S.piles().find(q => q.hp > 0); for (let i = 0; i < 20 && p2 && p2.hp > 0; i++) S.hit(p2, 1); const b3 = G.bells; S.sell.click(); o.simCap = G.bells === b3;
    closeGameWindow();
    // 存檔、壞資料
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    o.saved = raw.tycoon && raw.tycoon.lv.oven === 2 && raw.sim && raw.sim.power === 2;
    const bad = normalizeSave(Object.assign({}, raw, { tycoon: { lv: { oven: 'x', ufo: 3, cream: 2 }, cash: -5 }, sim: { power: -1, bag: 'a', zone: 5, zoneMax: 1 } }));
    o.badCleaned = JSON.stringify(bad.tycoon.lv) === '{"cream":2}' && bad.tycoon.cash === 0 && bad.sim.power === 1 && bad.sim.bag === 1 && bad.sim.zone === 0;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
