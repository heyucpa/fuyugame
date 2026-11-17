// ⏸️ 沒在玩自動暫停 + 💻 順暢模式更省力（15 格、大地圖不畫蝴蝶海鷗腳踏車、背景音樂預設關）
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.addInitScript(() => { if (!sessionStorage.getItem('x')) { sessionStorage.setItem('x', '1'); localStorage.setItem('myHouseGame_lite', '1'); localStorage.setItem('myHouseAudio', JSON.stringify({ bgm: true, sfx: true })); } });
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)); document.getElementById('modal').hidden = true;
    o.fps15 = LITE === true && FRAME_MIN_MS > 60;
    o.bgmOffInLite = Sound.prefs.bgm === false && localStorage.getItem('myHouseGame_bgmLite') === '1';
    VIEW_Q = .75; o.liteSharp = canvasDpr(2560, 1080) >= .89 && canvasDpr(1707, 613) >= .89; setLite(false); o.normalStillAdapts = canvasDpr(1707, 613) < .8; setLite(true); VIEW_Q = 1;
    Sound.setPref('bgm', true); o.bgmCanTurnOn = Sound.prefs.bgm === true;
    // 大地圖：背景小動物不動
    G.guide = 'done'; openIsland(); await w(800);
    const before = JSON.stringify(isl.gulls.map(g => [g.x, g.y])) + JSON.stringify(isl.critters.map(c => [c.x, c.y]));
    await w(1200);
    const after = JSON.stringify(isl.gulls.map(g => [g.x, g.y])) + JSON.stringify(isl.critters.map(c => [c.x, c.y]));
    o.decorStill = before === after;
    closeIsland(); await w(300);
    // 沒在玩：自動暫停、點一下繼續
    IDLE_MS = 300; await w(5600);
    o.paused = IDLE_PAUSED === true && !!document.getElementById('idlePause');
    const f0 = typeof lastFrame !== 'undefined' ? lastFrame : 0; const t0 = G.t || 0;
    await w(600);
    document.getElementById('idlePause').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    o.resumed = IDLE_PAUSED === false && !document.getElementById('idlePause');
    // 看電影時不暫停
    IDLE_MS = 300; document.getElementById('modal').hidden = false; document.getElementById('modalCard').classList.add('in-movie'); await w(5600);
    o.noPauseInMovie = IDLE_PAUSED === false;
    document.getElementById('modalCard').classList.remove('in-movie'); document.getElementById('modal').hidden = true;
    IDLE_MS = Infinity; return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 2));
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
