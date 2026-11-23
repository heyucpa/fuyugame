// ⬆️⬇️ 百貨公司電梯、電扶梯：每層都有、不在百貨公司不能搭、電梯選幾樓就到幾樓、電扶梯一次一層、頂樓只能往下
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
    o.everyFloor = PLACES.dept.rooms.every(r => r.items.some(it => it.id === 'dept_elevator') && r.items.some(it => it.id === 'dept_escalator'));
    o.act = FURNITURE_ACT.dept_elevator === 'dept_lift' && FURNITURE_ACT.dept_escalator === 'dept_esc';
    goHome(); await w(300); openDeptLift('lift'); o.notOutside = !document.querySelector('.game-card');
    travelArrive('dept', 0); await w(800); document.querySelectorAll('#showcase').forEach(x => x.remove()); document.getElementById('modal').hidden = true;
    openDeptLift('lift'); await w(100); openDeptLift.test.go(3); await w(4500); o.liftTo3 = G.away.idx === 3;
    openDeptLift('esc'); await w(100); const btns = [...document.querySelectorAll('.game-card button')].map(b => b.textContent).join('|'); o.topOnlyDown = /下樓/.test(btns) && !/上樓/.test(btns);
    openDeptLift.test.go(2); await w(3000); o.escDown = G.away.idx === 2;
    goHome(); await w(300);
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
