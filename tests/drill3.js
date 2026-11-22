// 🎭 演習：我當小偷三關＋寵物出動：選關鎖、倉庫過關、博物館雷射（亮著碰到被抓、寵物關掉雷射）、金庫（紙條、密碼錯重來、對了開門、換班警衛不見）、存檔 dlv
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
    G.jail = null; const cs = copState(); cs.dlv = 0; if (G.pet.stage === 'egg') G.pet.stage = 'kid'; G.pet.hunger = G.pet.clean = G.pet.mood = 100;
    openThiefDrill(); await w(100); o.picker = /第 3 關/.test(document.querySelector('.game-card').textContent);
    [...document.querySelectorAll('.game-card .lv-btn')][1].click(); await w(100); o.lockWorks = /演習：我當小偷/.test(document.querySelector('.game-card h2, .game-card').textContent) && !openThiefDrill.test?.lasers?.length;
    close(); openThiefDrill(1); await w(200); openThiefDrill.test.win(); await w(300); o.lv1 = cs.dlv === 1; close();
    // 博物館
    openThiefDrill(2); await w(150); let T = openThiefDrill.test; o.hasLasers = T.lasers.length === 4;
    const L = T.lasers[0]; let tt = 1; while (!((tt + L.ph) % L.per < L.per * .55)) tt += .05; T.setT(tt); T.me.x = L.x; T.me.y = 120; await w(120);
    o.laserCatches = !!G.jail || /雷射/.test(document.querySelector('.game-card').textContent); await w(1200); G.jail = null; close(); document.getElementById('modal').hidden = true;
    openThiefDrill(2); await w(150); T = openThiefDrill.test; T.petGo(); o.petLongCare = T.helpDur > 5.5 && T.petT > 5;
    o.petOffLasers = T.lasers.every(l => !T.laserOn(l)); T.win(); await w(300); o.lv2 = cs.dlv === 2; close();
    // 金庫
    openThiefDrill(3); await w(150); T = openThiefDrill.test;
    T.me.x = 160; T.me.y = 44; await w(200); o.needNote = !T.coding;
    T.me.x = 290; T.me.y = 190; await w(150); o.gotNote = T.note;
    T.me.x = 160; T.me.y = 44; await w(200); o.coding = T.coding;
    const wrong = DRILL_COLS.map(c => c[0]).find(k => k !== T.code[0]); T.press(wrong); o.wrongResets = !T.vaultOpen;
    T.code.forEach(k => T.press(k)); o.vaultOpens = T.vaultOpen && !T.coding;
    T.setT(8.5); o.shiftOn = T.onShift(); T.setT(3); o.shiftOff = !T.onShift();
    T.win(); await w(300); o.lv3 = cs.dlv === 3; close();
    G.pet.hunger = G.pet.clean = G.pet.mood = 10; openThiefDrill(1); await w(100); o.petShortLowCare = openThiefDrill.test.helpDur < 3.2; close();
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { cop: { dlv: 9 } })); o.saveCap = n.cop.dlv === 3;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
