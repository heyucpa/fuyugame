// 第三批：彈弓會動的氣球（第 2 關上下飄、第 3 關淘氣氣球躲一次再打得到）；抓小偷碰到要「抓穩」（時間暫停、沒按準溜走且綠色變寬、空白鍵抓穩）
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
    // 彈弓
    openSlingGame(); const S = openSlingGame.test; await w(100);
    const nextLv = async () => { S.balloons().forEach(b => { b.popped = true; }); S.place(-100, 100, -50, 0); S.step(.02); await w(1100); };
    o.lv1Still = S.balloons().every(b => !b.mx && !b.my);
    await nextLv(); o.lv2 = S.level() === 1;
    const mb = S.balloons().find(b => b.my); const y0 = mb.cy; for (let i = 0; i < 10; i++) S.step(.03); o.floats = Math.abs(mb.cy - y0) > 2;
    await nextLv(); o.lv3 = S.level() === 2;
    const db = S.balloons().find(b => b.dodge); o.hasDodge = !!db;
    S.place(db.cx - 40, db.cy, 300, 0); S.step(.005); o.dodged = db.dodge === 0 && !db.popped;
    S.step(.005); S.place(db.cx, db.cy, 1, 0); S.step(.005); o.popAfter = db.popped; close();
    // 抓小偷：抓穩
    openCopChase(1); const C = openCopChase.test; await w(150);
    const q = C.thieves[0], onIt = () => { C.me.x = q.x; C.me.y = q.y; };
    onIt(); await w(120); const g1 = C.grab(); o.grabStarts = !!g1 && !q.caught && /抓穩/.test(document.querySelector('.game-card').textContent);
    const tA = C.time(); await w(300); o.timeFrozen = C.time() === tA;
    const z1 = g1.z1 - g1.z0; C.setP(g1.z0 > .3 ? 0 : 1); C.press(); o.missSlips = !q.caught && !C.grab() && q.slip > 0;
    onIt(); await w(100); o.noRegrabWhileSlip = !C.grab();
    await w(1300); onIt(); await w(120); const g2 = C.grab(); o.wider = !!g2 && (g2.z1 - g2.z0) > z1 + .05;
    C.setP((g2.z0 + g2.z1) / 2); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true })); await w(50);
    o.spaceCatch = q.caught && !C.grab(); close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
