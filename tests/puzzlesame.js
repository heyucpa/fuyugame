// 🧩 拼圖：長得一樣的兩片（空白底色）互換位置也算拼好；真的不一樣的兩片互換不算
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
    openPuzzleGame(); await w(100); document.querySelector('.lv-row button:last-child').click(); await w(300);
    const P = openPuzzleGame.test, N = P.n * P.n, S = P.same();
    o.hasSame = !!S;
    let pa = -1, pb = -1, da = -1, db = -1;
    for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) { if (S[a][b] && pa < 0) { pa = a; pb = b; } if (!S[a][b] && da < 0) { da = a; db = b; } }
    o.foundBlankPair = pa >= 0; o.foundDiffPair = da >= 0;
    const id = [...Array(N).keys()];
    if (pa >= 0) { const ord = id.slice(); [ord[pa], ord[pb]] = [ord[pb], ord[pa]]; P.setOrder(ord); o.blankSwapSolved = P.solved(); }
    { const ord = id.slice(); [ord[da], ord[db]] = [ord[db], ord[da]]; P.setOrder(ord); o.diffSwapNotSolved = !P.solved(); }
    // 實際點兩下把不一樣的換回來 → 過關
    P.tap(da); P.tap(db); await w(200); o.winsByTap = /過關|拼好|🎉/.test(document.querySelector('.game-card').textContent);
    o.notTooLoose = S.flat().filter(Boolean).length < N * N;   // 不能全部都算一樣
    close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
