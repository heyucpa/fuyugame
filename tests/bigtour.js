// 🎬 主島變大的介紹：鏡頭一站一站移動、看過就記住、跳過會問要不要帶去新地方、帶去會走過去、設定可以再看一次、自動測試不自己播、存檔檢查
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
    G.guide = 'done'; delete G.introBig; openIsland(); await w(1800); o.noAutoInTest = !document.getElementById('islTour');
    o.started = islBigTour() && G.introBig === 1 && !!document.getElementById('islTour'); const T = islBigTour.test;
    o.stops = T.stops.length >= 8; await w(200); o.panHome = !!isl.pan;
    await w(3000); o.moved = T.i >= 2 && /土地|博物館/.test(document.getElementById('islTour').textContent);
    document.querySelector('.isl-tour-skip').click(); await w(200); o.ask = !document.getElementById('islTour') && /要去哪裡看看/.test(document.getElementById('modalCard').textContent) && !isl.pan;
    [...document.querySelectorAll('#modalCard button')].find(b => /百貨公司/.test(b.textContent)).click(); await w(200); o.walks = isl.pending && isl.pending.id === 'dept' && isl.path && isl.path.length > 0;
    closeIsland(); openTab('save'); await w(200); o.replayBtn = [...document.querySelectorAll('button')].some(b => /再看一次「主島變大了」/.test(b.textContent)); openTab('inv');
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { introBig: 'yes' })); o.saveClean = n.introBig === undefined;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
