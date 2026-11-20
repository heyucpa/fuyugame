// 🚨 出勤：開警車／救護車才有按鈕；警車開到有人需要幫忙的地方就幫好了（錢＋警察點數）；救護車先接人、送到醫院門口才完成（錢＋醫生點數）；換車就取消；畫面外有箭頭
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), btn = () => document.getElementById('islSos');
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.cop = {}; G.town = {}; G.vehicles = ['bike', 'police', 'ambulance']; G.ride = 'bike';
    openIsland(); await w(1000); islRideBtn();
    o.hiddenOnBike = btn().hidden === true;
    G.ride = 'police'; islRideBtn(); o.shownOnPolice = btn().hidden === false && /出勤/.test(btn().textContent);
    btn().click(); await w(200); o.started = !!dispatch && dispatch.kind === 'police' && Math.hypot(dispatch.x - isl.x, dispatch.y - isl.y) >= 8 && islPass(isl.m, Math.floor(dispatch.x), Math.floor(dispatch.y));
    o.arrowDraws = (() => { try { dispatchDraw(isl.cv.getContext('2d'), performance.now()); return true; } catch (e) { return e.message; } })() === true;
    const b0 = G.bells; isl.path = []; isl.x = dispatch.x; isl.y = dispatch.y; await w(600);
    o.policeDone = !dispatch && G.bells === b0 + 150 && copState().xp === 1;
    G.ride = 'ambulance'; islRideBtn(); btn().click(); await w(200); o.ambStart = !!dispatch && dispatch.kind === 'amb';
    isl.path = []; isl.x = dispatch.x; isl.y = dispatch.y; await w(600); o.pickedUp = !!dispatch && dispatch.carry === true && /醫院/.test(btn().textContent);
    const b1 = G.bells; islEnter('hospital'); await w(1500); document.querySelectorAll('#tripLayer').forEach(x => x.remove()); document.getElementById('modal').hidden = true;
    o.delivered = !dispatch && G.bells === b1 + 200 && townState().docXp === 1;
    // 換車取消
    goHome(); await w(1500); document.querySelectorAll('#tripLayer').forEach(x => x.remove()); document.getElementById('modal').hidden = true;
    openIsland(); await w(800); G.ride = 'police'; islRideBtn(); dispatchStart(); G.ride = 'bike'; islRideBtn(); await w(300); o.cancelOnSwitch = !dispatch && btn().hidden;
    closeIsland();
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
