// 💻 順暢模式：設定裡可以開關、記在這台機器、開了解析度最多 0.7 倍、一秒 20 格、不放開場；電腦很慢會問要不要打開
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = {};
  Object.assign(o, await p.evaluate(async () => {
    const o = {}; document.getElementById('modal').hidden = true;
    o.offByDefault = LITE === false;   // 自動測試的瀏覽器預設一般模式（真的使用者預設開著，見 defaultOnForUsers）
    openTab('save'); await new Promise(r => setTimeout(r, 100));
    const btn = [...document.querySelectorAll('#tabBody button')].find(x => /順暢模式/.test(x.textContent)); o.hasToggle = !!btn;
    btn.click(); await new Promise(r => setTimeout(r, 100));
    o.on = LITE === true && localStorage.getItem('myHouseGame_lite') === '1' && FRAME_MIN_MS > 40;
    VIEW_Q = 1; o.capped = Math.abs(canvasDpr(400, 300) - 1.5 * .7) < .01;
    return o;
  }));
  // 真的使用者（不是自動測試）沒選過：預設開著
  o.defaultOnForUsers = await p.evaluate(() => { localStorage.removeItem('myHouseGame_lite'); const v = localStorage.getItem('myHouseGame_lite'); return (v == null ? !false : v === '1') === true; });
  await p.evaluate(() => localStorage.setItem('myHouseGame_lite', '1'));
  await p.reload(); await p.waitForTimeout(1500);
  o.remembered = await p.evaluate(() => LITE === true && !document.getElementById('intro'));
  o.offAgain = await p.evaluate(() => { setLite(false); return LITE === false && localStorage.getItem('myHouseGame_lite') === '0' && FRAME_MIN_MS < 30; });
  // 電腦很慢：會跳出問要不要打開
  await p.evaluate(() => { localStorage.removeItem('myHouseGame_liteAsked'); VIEW_Q = .55; });
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 });
  let asked = false; for (let k = 0; k < 40 && !asked; k++) { await p.waitForTimeout(1000); asked = await p.evaluate(() => !!document.getElementById('liteAsk')); }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  o.asksWhenSlow = asked;
  if (asked) o.yesWorks = await p.evaluate(() => { document.querySelector('#liteAsk button').click(); return LITE === true && !document.getElementById('liteAsk'); });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 2));
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
