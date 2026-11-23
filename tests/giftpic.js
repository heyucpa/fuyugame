// 拿到禮物要有圖片：扭蛋先出扭蛋殼再打開（不被圖鑑大圖搶先）、集點卡禮物跳大圖、大轉盤獎品畫在視窗裡
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
      G.guide = 'done'; G.bells = 20000; travelArrive('dept', 3); await w(600);
      document.querySelectorAll('#showcase').forEach(e => e.remove()); SC_QUEUE.length = 0;
      deptGacha(); await w(300);
      const sc = document.getElementById('showcase');
      o.capsule = !!(sc && sc.querySelector('.sc-capsule'));
      o.oneOnly = SC_QUEUE.length === 0;
      if (sc && sc._reveal) sc._reveal(); await w(100);
      o.gachaPic = !!(sc && sc.querySelector('canvas, img, .sc-pic')) && /扭到了|稀有/.test(sc.textContent);
      document.querySelectorAll('#showcase').forEach(e => e.remove()); SC_QUEUE.length = 0;
      deptState().stamps = 10; delete G.dept.gift1; openDeptStore(); await w(200);
      [...document.querySelectorAll('#modal button')].find(b => /換禮物/.test(b.textContent)).click(); await w(300);
      const sc2 = document.getElementById('showcase');
      o.stampPic = !!(sc2 && /熊熊氣球/.test(sc2.textContent) && sc2.querySelector('.sc-pic')) && G.inv.dept_balloon > 0;
      document.querySelectorAll('#showcase').forEach(e => e.remove()); SC_QUEUE.length = 0;
      deptState().stamps = 10; openDeptStore(); await w(200);
      [...document.querySelectorAll('#modal button')].find(b => /換禮物/.test(b.textContent)).click(); await w(300);
      const sc3 = document.getElementById('showcase'); o.stampMoney = !!(sc3 && /1,500/.test(sc3.textContent));
      document.querySelectorAll('#showcase').forEach(e => e.remove()); SC_QUEUE.length = 0;
      const keep = WHEEL.map(q => q[2]); WHEEL.forEach(q => q[2] = q[1] === 'rare' ? 100 : 0);
      deptState().tix = 1; openLuckyWheel(); await w(200);
      [...document.querySelectorAll('button')].find(b => /轉！/.test(b.textContent)).click(); await w(3200);
      const pz = document.querySelector('.wheel-prize'); o.wheelPic = !!(pz && pz.querySelector('canvas, img, div'));
      WHEEL.forEach((q, i) => q[2] = keep[i]); close();
      o.save = !!normalizeSave(JSON.parse(JSON.stringify(G)));
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
