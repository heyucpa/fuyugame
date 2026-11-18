// 🖌️ 用處理器畫圖：Windows 預設開、其他預設關、設定可以切換；開著時房間／大地圖／小遊戲照常跑、沒有錯誤
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const url = 'file://' + path.resolve(__dirname, '../house.html'), o = {}, errs = [];
  const open = async ua => { const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, userAgent: ua }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.stack || e.message)); await p.goto(url, { timeout: 90000 }); await p.waitForTimeout(1500); return p; };
  let p = await open('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1');
  o.ipadOff = await p.evaluate(() => SOFT_CANVAS === false && !canvas.getContext('2d').getContextAttributes().willReadFrequently);
  await p.context().close();
  p = await open('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36');
  Object.assign(o, await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)); document.getElementById('modal').hidden = true; G.guide = 'done';
    o.winOn = SOFT_CANVAS === true && canvas.getContext('2d').getContextAttributes().willReadFrequently === true;
    for (let i = 0; i < 5; i++) draw(); o.roomLayered = roomLayerStats.frames > 0 && USE_ROOM_LAYER;
    o.spriteSoft = [...roomSprites.values()].every(sp => sp.c.getContext('2d').getContextAttributes().willReadFrequently === true);
    openIsland(); await w(1200); o.island = !!isl && USE_ISL_CHUNKS && isl.m._chunks.size > 0; closeIsland(); await w(300);
    openDodge(); await w(300); const lb = document.querySelectorAll('.lv-btn')[0]; if (lb) lb.click(); await w(1200); o.game = document.getElementById('modalCard').classList.contains('in-game'); closeGameWindow();
    openTab('save'); await w(100); o.toggle = [...document.querySelectorAll('#tabBody button')].some(x => /畫圖方式/.test(x.textContent));
    localStorage.setItem('myHouseGame_soft', '0'); return o;
  }));
  await p.reload(); await p.waitForTimeout(1500);
  o.remembersOff = await p.evaluate(() => SOFT_CANVAS === false);
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 2)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
