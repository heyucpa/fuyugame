// 🦊 怪盜狐狸事件：預告信→🦊按鈕→三個線索→警察局設陷阱→圖書館放網子（太早沒抓到、剛好抓到）→道歉變朋友、送面具＋300→按鈕消失；存檔檢查
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
    G.fox = {}; G.guide = 'done'; const inv0 = G.inv.fox_mask || 0;
    const at = async place => { document.getElementById('modal').hidden = true; closeGameWindow(); travelArrive(place); await w(400); document.getElementById('modal').hidden = true; document.querySelectorAll('#showcase').forEach(x => x.remove()); await w(1500); };
    const closeScene = async () => { for (let k = 0; k < 10 && document.getElementById('vevScene'); k++) { vevScene.test.go(); await w(60); } };
    o.letter = foxLetter() && foxState().st === 1; await w(200); o.sceneShown = !!document.getElementById('vevScene'); await closeScene();
    o.chip = !!document.getElementById('foxChip');
    openFoxBox(); o.box = /找線索（0 \/ 3）/.test(document.getElementById('modalCard').textContent); document.getElementById('modal').hidden = true;
    await at('police'); o.policeTooEarly = foxState().st === 1 && !document.getElementById('vevScene');
    await at('library'); await closeScene(); await at('museum'); await closeScene(); o.twoClues = foxState().clues.length === 2 && foxState().st === 1;
    await at('park'); await closeScene(); o.st2 = foxState().st === 2;
    await at('police'); await closeScene(); o.st3 = foxState().st === 3;
    await at('library'); o.trap = !!openFoxTrap.test && /抓住怪盜狐狸/.test((document.querySelector('.game-card') || {}).textContent || '');
    const T = openFoxTrap.test; T.setFx(260); T.drop(); await w(500); o.missEarly = !T.caught && T.tries === 1;
    await w(300); T.setFx(170); await w(150); T.drop(); await w(500); o.caught = T.caught;
    await w(1500); o.ending = !!document.getElementById('vevScene'); const b0 = G.bells; await closeScene(); await w(200);
    o.done = foxState().st === 5 && (G.inv.fox_mask || 0) === inv0 + 1 && G.bells === b0 + 300 && !document.getElementById('foxChip');
    document.querySelectorAll('#showcase').forEach(x => x.remove()); goHome();
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { fox: { st: 9, clues: ['library', 'library', 'x'], z: 1 } })); o.saveClean = n.fox.st === 0 && JSON.stringify(n.fox.clues) === '["library"]' && !('z' in n.fox);
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
