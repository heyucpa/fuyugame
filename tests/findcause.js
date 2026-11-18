// 🔬 自動找原因：先讓遊戲停下來量、再照常量，給結論、寫進當機紀錄；量的時候遊戲真的停著
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)); document.getElementById('modal').hidden = true; G.guide = 'done';
    openTab('save'); await w(100); const btn = [...document.querySelectorAll('#tabBody button')].find(x => /自動找原因/.test(x.textContent)); o.hasBtn = !!btn;
    openFindCause.sec = 2; btn.click(); await w(700);
    const f0 = roomLayerStats.frames + roomLayerStats.full; await w(600); o.gameHeld = FIND_CAUSE_HOLD === true && roomLayerStats.frames + roomLayerStats.full === f0;
    await w(4500);
    const r = openFindCause.last; o.done = !!r && r.A.fps > 0 && r.B.fps > 0 && FIND_CAUSE_HOLD === false;
    const t = document.querySelector('#modalCard pre').textContent; o.text = /① 遊戲停下來/.test(t) && /② 遊戲照常跑/.test(t) && /👉/.test(t);
    o.logged = crashLogGet().some(x => x.kind === '自動找原因');
    o.copyBtn = [...document.querySelectorAll('#modalCard button')].some(x => /複製/.test(x.textContent));
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 2)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
