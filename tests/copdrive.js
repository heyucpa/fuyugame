// 🚓 開警車抓小偷：警車按出勤先選任務；追小偷車（小偷會逃、會丟香蕉皮、壓到會停、碰到就抓到、過關記下、時間到沒抓到）；找可疑的車（第 1 關顏色都不同、第 3 關假車三樣有兩樣一樣、攔錯車會說不是我、攔對就過關）；換車取消；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.cop = {}; G.vehicles = ['bike', 'police']; G.ride = 'police';
    openIsland(); await w(900); islRideBtn();
    document.getElementById('islSos').click(); await w(100); o.menu = /追小偷車/.test($('#modalCard').textContent) && /找可疑的車/.test($('#modalCard').textContent); $('#modal').hidden = true;
    // 追小偷車
    copRunStart('chase'); o.chase = copRun && copRun.kind === 'chase' && copRun.lv === 1 && copTileOk(isl.m, Math.floor(copRun.thief.x), Math.floor(copRun.thief.y));
    const th = copRun.thief, x0 = th.x, y0 = th.y; await w(1200); o.thiefMoves = Math.hypot(th.x - x0, th.y - y0) > .5 && copTileOk(isl.m, Math.floor(th.x), Math.floor(th.y));
    o.btnText = /追小偷中/.test(document.getElementById('islSos').textContent);
    copRun.peels.push({ x: isl.x, y: isl.y, t: 1 }); await w(150); o.slip = copRun.slip > 0; const sx = isl.x; isl.x += 1; await w(100); o.slipFreeze = Math.abs(isl.x - sx) < .01;
    copRun.slip = 0; const b0 = G.bells; th.x = isl.x + .3; th.y = isl.y; th.route = []; await w(150); o.caught = !copRun && copState().chaseLv === 1 && G.bells === b0 + 180;
    copRunStart('chase'); o.next = copRun.lv === 2; copRun.t = 59.99; await w(200); o.timeout = !copRun && copState().chaseLv === 1;
    // 找可疑的車：第 1 關
    copRunStart('sus'); let r = copRun; o.sus1 = r.cars.length === 4 && r.cars.filter(c => c.sus).length === 1 && new Set(r.cars.map(c => c.c)).size === 4 && /的車/.test(r.clue);
    const wrong = r.cars.find(c => !c.sus); isl.x = wrong.x; isl.y = wrong.y; wrong.tx = null; await w(150); o.wrongCar = wrong.checked === true && copRun === r;
    const right = r.cars.find(c => c.sus); isl.x = right.x; isl.y = right.y; await w(150); o.rightCar = !copRun && copState().susLv === 1;
    // 第 3 關：假車三樣裡有兩樣一樣
    copState().susLv = 2; copRunStart('sus'); r = copRun; const s = r.cars.find(c => c.sus);
    o.sus3 = r.lv === 3 && r.cars.length === 6 && r.cars.filter(c => !c.sus).every(c => [c.type === s.type, c.c === s.c, c.st === s.st].filter(Boolean).length === 2) && /貼紙的/.test(r.clue);
    o.draws = (() => { try { copRunDraw(isl.cv.getContext('2d'), performance.now()); return true; } catch (e) { return e.message; } })() === true;
    G.ride = 'bike'; islRideBtn(); await w(200); o.cancel = !copRun;
    G.ride = 'police'; islRideBtn(); copRunStart('chase'); closeIsland(); o.closeCancel = !copRun; await w(200); document.getElementById('modal').hidden = true;
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { cop: { chaseLv: 9, susLv: 2, junk: 1 } }));
    o.save = n.cop.chaseLv === 3 && n.cop.susLv === 2 && n.cop.junk === undefined;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
