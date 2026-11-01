// 🗺️ 闖關：下面沒有「回地圖」、右上角 ⏸ 暫停（暫停時不會動、繼續、回地圖、Esc）；手指按畫面：左邊往左、右邊往右、中間跳、往上滑跳；簡單模式整個畫面都是跳
// 🎵 背景音樂 10 首、每首 64 拍；放 10 分鐘自動換別首、可以關掉、闖關音樂不會被換掉
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await (await b.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  await p.mouse.click(600, 400);   // 讓聲音可以開始
  const o = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true;
    questState().mode = 'normal'; playQuest('1-1'); let T = playQuest.test; await wait(300);
    o.noMapBtn = ![...document.querySelectorAll('#modalCard .game-btns button, #modalCard button')].some(x => x.offsetParent && /^回地圖$/.test(x.textContent.trim()));
    const pb = document.querySelector('.quest-pause'); o.pauseBtn = !!pb && !!pb.offsetParent;
    pb.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(50);
    o.paused = T.paused() && !document.querySelector('.quest-pauseov').hidden;
    const x0 = T.P.x, t0 = T.P.t; T.keys.ArrowRight = true; await wait(400); o.frozen = T.P.t === t0;
    [...document.querySelectorAll('.quest-pauseov button')].find(x => /繼續/.test(x.textContent)).click(); await wait(50); o.resumed = !T.paused() && document.querySelector('.quest-pauseov').hidden;
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' })); o.esc = T.paused(); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' })); o.esc2 = !T.paused();
    // 手指：停掉畫面迴圈，自己一步一步算
    gameCleanup && gameCleanup(); gameCleanup = null; for (let i = 0; i < 30; i++) T.step(1 / 60);
    const c = T.canvas, r = c.getBoundingClientRect(), at = (fx, type, id, dy) => c.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: id, clientX: r.left + r.width * fx, clientY: r.top + r.height * .5 + (dy || 0) }));
    at(.9, 'pointerdown', 1); const a = T.P.x; for (let i = 0; i < 30; i++) T.step(1 / 60); o.right = T.P.x > a + 20; at(.9, 'pointerup', 1);
    for (let i = 0; i < 30; i++) T.step(1 / 60);
    at(.1, 'pointerdown', 2); const bx = T.P.x; for (let i = 0; i < 30; i++) T.step(1 / 60); o.left = T.P.x < bx - 20; at(.1, 'pointerup', 2);
    for (let i = 0; i < 40; i++) T.step(1 / 60);
    at(.5, 'pointerdown', 3); T.step(1 / 60); o.jump = T.P.vy < 0; at(.5, 'pointerup', 3);
    for (let i = 0; i < 60; i++) T.step(1 / 60);
    at(.85, 'pointerdown', 4); T.step(1 / 60); at(.85, 'pointermove', 4, -40); T.step(1 / 60); o.swipe = T.P.vy < 0; at(.85, 'pointerup', 4);
    o.twoHands = (() => { at(.9, 'pointerdown', 5); at(.5, 'pointerdown', 6); const ok = T.keys.TouchR && T.touches.size === 2; at(.9, 'pointerup', 5); at(.5, 'pointerup', 6); return ok && !T.keys.TouchR && T.touches.size === 0; })();
    closeGameWindow();
    questState().mode = 'easy'; playQuest('1-1'); T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
    o.easyJump = T.zoneOf({ clientX: T.canvas.getBoundingClientRect().left + 5 }) === 'J'; closeGameWindow();
    // 回地圖
    questState().mode = 'normal'; playQuest('1-1'); await wait(100); playQuest.test.pause(true); [...document.querySelectorAll('.quest-pauseov button')].find(x => /回地圖/.test(x.textContent)).click(); await wait(200);
    o.toMap = !document.querySelector('.quest-pauseov') && /闖關|世界/.test(document.getElementById('modalCard').textContent); closeGameWindow(); $('#modal').hidden = true;
    // 🎵
    o.songs = Sound.songCount === 10 && Sound._t.songs.every(sg => Math.abs(sg.melody.reduce((t, n) => t + n[1], 0) - 64) < 1e-9);
    const ac = Sound._t.getAc(); o.ac = !!ac;
    Sound.pickSong(0); let said = ''; const realToast = toast; toast = m => { said = m; };
    Sound._t.shuffleNow(); await wait(50); o.shuffled = Sound.prefs.song !== 0 && /換一首/.test(said);
    const s1 = Sound.prefs.song; Sound.setShuffle(false); Sound._t.shuffleNow(); o.off = Sound.prefs.song === s1; Sound.setShuffle(true);
    Sound.setSpecial('quest'); Sound._t.shuffleNow(); o.questKeep = Sound.special() === 'quest'; Sound.setSpecial(null);
    toast = realToast;
    openMusicMenu(); o.menu = [...document.querySelectorAll('#musicMenu button')].some(x => /自動換歌/.test(x.textContent)) && document.querySelectorAll('#musicMenu .music-song').length === 11; closeMusicMenu();
    return o;
  });
  console.log(JSON.stringify(o));
  const ok = Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
