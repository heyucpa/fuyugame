// 🛍️ 百貨公司第二版：櫃台分樓層、試衣間先試穿再買（名牌衣服不在一般換裝）、美食街吃完變飽、小火車扣 50、集點卡蓋章換禮物、一天滿 2000 送抽獎券、大轉盤給獎、存檔檢查
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), close = () => { closeGameWindow(); document.getElementById('modal').hidden = true; };
    try {
    G.dept = {}; G.bells = 50000;
    o.notInDressTab = !CLOTHES.some(c => c.id === 'dept_gown') && PLACE_CLOTHES.some(c => c.id === 'dept_gown');
    openBoutique('dept_gown'); await w(100); o.tryOn = /星光公主禮服/.test(document.getElementById('modalCard').textContent) && !ownsClothes('dept_gown');
    [...document.querySelectorAll('#modalCard button')].find(b => /買這件/.test(b.textContent)).click(); await w(100); o.boughtGown = ownsClothes('dept_gown');
    const gownPrice = deptSale() ? Math.round(6000 * .8) : 6000; o.stamps = deptState().stamps === Math.floor(gownPrice / 1000) && deptState().tix >= 1;
    document.getElementById('modal').hidden = true;
    G.kid.hunger = 10; openFoodCourt(); await w(100); [...document.querySelectorAll('.game-card button')].find(b => /拉麵/.test(b.textContent)).click(); await w(100);
    for (let k = 0; k < 5; k++) openFoodCourt.test.bite(); await w(800); o.ate = G.kid.hunger >= 40; closeGameWindow();
    const b0 = G.bells; openKidTrain(); await w(100); o.train = G.bells === b0 - 50; closeGameWindow();
    const d = deptState(); d.stamps = 9; d.carry = 900; deptSpend(200); o.tenStamps = d.stamps === 10;
    openDeptStore(); await w(100); [...document.querySelectorAll('#modalCard button')].find(b => /換禮物/.test(b.textContent)).click(); await w(100); o.gift = deptState().stamps === 0 && G.inv.dept_balloon === 1;
    deptState().tix = 1; openLuckyWheel(); await w(100); const n0 = JSON.stringify(G.inv) + G.bells; openLuckyWheel.test.spin(); await w(3000); o.wheel = deptState().tix === 0 && (JSON.stringify(G.inv) + G.bells) !== n0 && /🎉/.test(document.querySelector('.game-card').textContent); closeGameWindow();
    o.floorsAct = FURNITURE_ACT.dept_mirror === 'dept_fashion' && FURNITURE_ACT.food_stall === 'dept_food' && FURNITURE_ACT.kid_train === 'dept_train' && FURNITURE_ACT.dept_toyshelf === 'dept_toys';
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { dept: { stamps: 50, tix: -1, got: 9, gift1: 2, x: 1 } })); o.saveClean = n.dept.stamps === 10 && n.dept.tix === undefined && n.dept.got === 3 && n.dept.gift1 === undefined && !('x' in n.dept);
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
