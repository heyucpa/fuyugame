// 📬 求救信：收到信（過場）→ 等一下再去（收進信箱、📬 按鈕）→ 搭飛機到冰雪國有「🆘 幫忙」→ 選不好的被提醒、選好的往下 → 結局、拿錢、信箱少一封；現在就去（公園：走過去直接幫忙）；走進阿婆家會再問；一天一封；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), sc = () => { const s = document.getElementById('vevScene'); if (s) vevScene.test.close(); };
    const clean = () => { document.getElementById('modal').hidden = true; document.querySelectorAll('#showcase,#tripLayer').forEach(x => x.remove()); };
    try {
    G.guide = 'done'; G.help = {}; G.away = null; G.bells = 5000; clean();
    // ① 冰雪國：等一下再去
    helpNew('ice'); o.letter = /一封信/.test(document.querySelector('.vev-cap').textContent); vevScene.test.go(); o.letter2 = /企鵝/.test(document.querySelector('.vev-cap').textContent); sc(); await w(50);
    o.ask = /現在就去/.test($('#modalCard').textContent) && /等一下再去/.test($('#modalCard').textContent);
    [...document.querySelectorAll('#modalCard button')].find(x => /等一下/.test(x.textContent)).click(); await w(100);
    o.saved = JSON.stringify(G.help.list) === '["ice"]' && /📬 1/.test((document.getElementById('helpChip') || {}).textContent || '');
    o.oncePerDay = (() => { helpNext = 1; const n0 = G.help.list.length; helpTick(performance.now() + 1); return G.help.list.length === n0 && !document.getElementById('vevScene'); })();
    // 搭飛機（自己買票）去冰雪國
    openAirTravel(); openAirTravel.test.go('冰雪國'); airBoard.test.next(); airBoard.test.next(); airBoard.test.next(); airFlight.test.skip(); await w(300);
    const hb = [...document.querySelectorAll('.game-card button')].find(x => /幫企鵝的忙/.test(x.textContent)); o.arriveBtn = !!hb; hb.click(); await w(100);
    helpRun.test.pick(0); o.badStays = helpRun.test.k === 0 && /再想想/.test(document.querySelector('.game-card').textContent);
    const b0 = G.bells; helpRun.test.pick(1); await w(950); helpRun.test.pick(0); await w(950); helpRun.test.pick(0); await w(1600);
    o.endScene = /好朋友/.test(document.querySelector('.vev-cap').textContent); sc(); sc(); await w(50);
    o.done = G.help.list.length === 0 && G.help.done.ice === 1 && G.bells === b0 + 150 && !document.getElementById('helpChip');
    // ② 公園：現在就去
    G.help.d = null; helpNew('duck'); sc(); sc(); await w(50); [...document.querySelectorAll('#modalCard button')].find(x => /現在就去/.test(x.textContent)).click();
    await w(200); for (let i = 0; i < 30 && !(G.away && G.away.place === 'park'); i++) { await w(300); document.querySelectorAll('#tripLayer').forEach(x => x.remove()); document.querySelectorAll('.trip-skip, button').forEach(x => { if (/跳過/.test(x.textContent) && x.offsetParent && !x.closest('#vevScene')) x.click(); }); }
    clean(); await w(2200); o.parkRun = !!helpRun.test && /小鴨/.test(document.querySelector('.game-card') ? document.querySelector('.game-card').textContent : '');
    helpRun.test.pick(1); await w(950); helpRun.test.pick(0); await w(1600); sc(); sc(); await w(50); o.parkDone = G.help.done.duck === 1;
    // ③ 阿婆家：信箱裡有，走進去會再問
    homeArrive(); await w(300); clean(); G.help.list = ['lamb']; travelArrive('grandma'); await w(2200); clean();
    o.grandmaAsk = !!document.getElementById('vevScene') && /小羊/.test(document.querySelector('.vev-cap').textContent); sc(); await w(50);
    o.grandmaCard = /現在幫忙/.test($('#modalCard').textContent); clean();
    openHelpBox(); o.box = /小羊跑出柵欄/.test($('#modalCard').textContent); clean();
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { help: { list: ['ice', 'boom', 'ice'], done: { sea: 2, x: 1 }, d: '2026-11-22', z: 1 } }));
    o.save = JSON.stringify(n.help) === JSON.stringify({ list: ['ice'], done: { sea: 2 }, d: '2026-11-22' });
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
