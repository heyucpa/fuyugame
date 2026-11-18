// 🐛 電腦上卡住好幾秒的主因：長度 0 的無聲 <audio> 一直重播。電腦上不可以再建立；點了走路之後網頁要一直有回應
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const o = {}, errs = [], url = 'file://' + path.resolve(__dirname, '../house.html');
  const spy = () => { window.__au = []; const A = window.Audio; window.Audio = function (src) { const a = new A(src); window.__au.push(a); return a; }; window.Audio.prototype = A.prototype; };
  // 電腦：不建立
  let ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(spy);
  await p.goto(url, { timeout: 90000 }); await p.waitForTimeout(1500);
  const box = await p.evaluate(() => { document.getElementById('modal').hidden = true; G.guide = 'done'; const r = document.getElementById('view').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  let worst = 0;
  for (let i = 0; i < 12; i++) { await p.mouse.click(box.x + box.w * (.35 + .3 * Math.random()), box.y + box.h * (.4 + .3 * Math.random())); await p.waitForTimeout(800); const s = Date.now(); await p.evaluate(() => 1); worst = Math.max(worst, Date.now() - s); }
  o.desktopNoSilentAudio = await p.evaluate(() => window.__au.length === 0);
  o.staysResponsive = worst < 400;
  await ctx.close();
  // 舊版 iPad（沒有 audioSession）：有放，而且不是長度 0
  ctx = await b.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Version/15.0 Mobile/15E148 Safari/604.1' }); p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(spy);
  await p.goto(url, { timeout: 90000 }); await p.waitForTimeout(1500);
  await p.mouse.click(600, 400); await p.waitForTimeout(1200);
  const au = await p.evaluate(async () => { const a = window.__au[0]; if (!a) return null; for (let k = 0; k < 30 && !(a.duration > 0); k++) await new Promise(r => setTimeout(r, 100)); return { n: window.__au.length, dur: a.duration, loop: a.loop }; });
  o.oldIpadHasIt = !!au && au.n === 1 && au.loop === true; o.notZeroLength = !!au && au.dur > .9;
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), '最慢回應 ' + worst + 'ms', JSON.stringify(au), errs.slice(0, 2)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
