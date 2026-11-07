// 🌀 賽車甩尾看得出來：一按就跳一下、冒煙、往旁邊滑；按久了集氣變藍變橘，放開加速；手指滑出按鈕不會斷
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    G.guide = 'done'; $('#modal').hidden = true;
    G.vehicles = ['bus']; openKart(); document.querySelectorAll('.lv-btn')[0].click(); await wait(100); document.querySelectorAll('.lv-btn')[0].click(); await wait(200);
    const K = playKart.test; K.go(); await wait(2500);
    const px0 = K.st().px; K.startDrift(); await wait(120);
    let s = K.st(); o.hop = s.drift && s.hop > 0; await wait(400); s = K.st(); o.smoke = s.puffs > 0; o.slide = Math.abs(s.px - px0) > .05;
    const btn = [...document.querySelectorAll('.quest-btn')].find(x => /甩尾/.test(x.textContent));
    btn.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true })); o.noLeaveEnd = K.st().drift;
    await wait(900); s = K.st(); o.charged = s.charge > 1.1;
    K.endDrift(); s = K.st(); o.boost = !s.drift && s.boost > 1.2;
    closeGameWindow(); $('#modal').hidden = true;
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
