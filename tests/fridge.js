// 找點心真的會吃：冰箱拿出一份小點心吃掉會變飽、記住時間；10 分鐘內再找會打開吃東西選單；存檔檢查擋掉壞的時間
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
      G.guide = 'done'; G.away = null; commit(); await w(400);
      delete G.fridgeAt; G.kid.hunger = 20;
      const it = { uid: 990001, id: 'fridge', x: 2, y: 2, rot: 0 };
      fufuStartAct('snack', performance.now(), it, false); await w(1600);
      o.ate = G.kid.hunger === 35 && Number.isFinite(G.fridgeAt);
      o.autoNoEat = (() => { const h = G.kid.hunger, at = G.fridgeAt; delete G.fridgeAt; fufuStartAct('snack', performance.now(), it, true); const r = G.kid.hunger === h && !G.fridgeAt; G.fridgeAt = at; return r; })();
      document.getElementById('foodMenu').hidden = true; const h2 = G.kid.hunger;
      fufuStartAct('snack', performance.now(), it, false); await w(1300);
      o.waitThenMenu = G.kid.hunger === h2 && !document.getElementById('foodMenu').hidden;
      document.getElementById('foodMenu').hidden = true;
      G.fridgeAt = Date.now() - 11 * 60e3; fufuStartAct('snack', performance.now(), it, false); await w(1500); o.refills = G.kid.hunger > h2;
      const bad = JSON.parse(JSON.stringify(G)); bad.fridgeAt = 'x'; o.saveClean = normalizeSave(bad).fridgeAt === undefined;
      const good = JSON.parse(JSON.stringify(G)); o.saveKeep = normalizeSave(good).fridgeAt === G.fridgeAt;
      fufu.act = null; close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
