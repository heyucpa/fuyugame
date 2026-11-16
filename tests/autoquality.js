// 💻 筆電不卡：畫布解析度上限 1920×1080；畫面一直很慢會自動降畫質，iPad 正常速度維持原本畫質
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const o = {};
  { // 大螢幕＋放大 150%、很慢的筆電：畫質自動降
    const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => { VIEW_Q = 1; return { cap: canvasDpr(1600, 900), small: canvasDpr(400, 300) }; });
    o.cap = Math.abs(r.cap - Math.sqrt(1920 * 1080 / (1600 * 900))) < .01; o.smallKeeps = r.small === 1.5;
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 8 });
    await p.evaluate(() => { document.getElementById('modal').hidden = true; try { openIsland(); } catch (e) {} });
    let q = 1; for (let k = 0; k < 20 && q >= 1; k++) { await p.waitForTimeout(1000); q = await p.evaluate(() => VIEW_Q); }
    o.dropsWhenSlow = q < 1 && q >= .55;
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    o.noErr1 = !errs.length; await ctx.close();
  }
  { // 一般速度的平板：維持畫質 1
    const ctx = await b.newContext({ viewport: { width: 1080, height: 810 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(8000);
    o.ipadKeeps = await p.evaluate(() => VIEW_Q === 1);
    await ctx.close();
  }
  const ok = Object.values(o).every(v => v === true);
  console.log(JSON.stringify(o));
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
