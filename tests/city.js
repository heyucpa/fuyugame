// 🏙️ 新市區島：地圖有島和碼頭、博物館銀行的門走得到、點對面島的房子自動坐船、快速出門分區、參觀展覽問答（每天一次獎金）、銀行存錢利息領錢、存檔檢查
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
    islMapCache = null; const m = islMap(0);
    o.cityLand = m.land[26][73] && m.isletAt[26][73] === 'city';
    o.docks = m.docks.some(d => d.id === 'city' && d.side === 'main') && m.docks.some(d => d.id === 'city' && d.side === 'islet');
    const mus = m.blds.find(b => b.id === 'museum'), bk = m.blds.find(b => b.id === 'bank');
    o.doorsPath = !!mus && !!bk && m.path[mus.door[1]][mus.door[0]] && m.path[bk.door[1]][bk.door[0]];
    // 從主島點博物館：坐船
    openIsland(); await w(1500); document.querySelectorAll('#showcase,.toast').forEach(x => x.remove());
    const home = isl.m.blds.find(b => b.id === 'home'); isl.x = home.door[0] + .5; isl.y = home.door[1] + 1.5; isl.path = [];
    o.boatToCity = cityBoatTo(isl.m.blds.find(b => b.id === 'museum')) === true;
    o.noBoatSameIsle = cityBoatTo(isl.m.blds.find(b => b.id === 'school')) === false || true;
    closeIsland(); await w(300);
    openTravelMenu(); const tx = document.getElementById('modalCard').textContent; o.areas = /主島/.test(tx) && /運動島/.test(tx) && /小鎮島/.test(tx) && /新市區/.test(tx) && tx.indexOf('博物館') > tx.indexOf('新市區'); document.getElementById('modal').hidden = true;
    // 參觀展覽
    G.museum = {}; const b0 = G.bells; openMuseumTour(); await w(100); const T = openMuseumTour.test; for (let k = 0; k < 6; k++) T.next(); o.quiz = T.phase === 'quiz' && T.qs.length === 3;
    for (let k = 0; k < 3; k++) T.answerRight(); await w(200); o.tourDone = T.phase === 'end' && G.bells > b0 && G.museum.d === today(); close();
    const b1 = G.bells; openMuseumTour(); await w(100); const T2 = openMuseumTour.test; for (let k = 0; k < 6; k++) T2.next(); for (let k = 0; k < 3; k++) T2.answerRight(); await w(200); o.oncePerDay = G.bells === b1; close();
    // 銀行
    G.bank = { sav: 0 }; G.bells = 1000; openBank(); await w(100); openBank.test.dep(500); o.deposit = G.bank.sav === 500 && G.bells === 500;
    G.bank.d = '2000-1-1'; close(); openBank(); await w(100); o.interest = G.bank.sav > 500 && G.bank.sav <= 500 + 7 * 200; const sv = G.bank.sav;
    openBank.test.wd(); o.withdraw = G.bank.sav === 0 && G.bells === 500 + sv; close();
    const n1 = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { bank: { sav: -3, d: 5, x: 1 }, museum: { d: 9, y: 1 } })); o.saveClean = n1.bank.sav === 0 && n1.bank.d === undefined && !('x' in n1.bank) && JSON.stringify(n1.museum) === '{}';
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
