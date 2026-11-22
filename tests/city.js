// 🏝️ 主島變大（家長 11/22：不要另外的新市區島）：主島東邊長出一大塊、博物館銀行在主島、從家走得到博物館銀行運動島小鎮島、快速出門按功能分類、島上有牌子、參觀展覽問答、銀行存錢利息領錢、存檔檢查
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
    o.bigMap = ISL.W >= 100 && m.land[27][70] && !m.isletAt[27][70];   // 主島東邊長出來的那一塊是主島（不是另外的島）
    o.noCityIsle = !m.docks.some(d => d.id === 'city');
    const reach = (from, to) => { const seen = new Set([from.join()]), q = [from]; while (q.length) { const [x, y] = q.shift(); if (x === to[0] && y === to[1]) return true; [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && islPass(m, nx, ny)) { seen.add(k); q.push([nx, ny]); } }); } return false; };
    const door = id => m.blds.find(b => b.id === id).door, home = door('home');
    o.walkMuseum = reach(home, door('museum')); o.walkBank = reach(home, door('bank')); o.walkPool = reach(home, door('pool')); o.walkHospital = reach(home, door('hospital')); o.walkSchool = reach(home, door('school'));
    o.doorsPath = m.path[door('museum')[1]][door('museum')[0]] && m.path[door('bank')[1]][door('bank')[0]];
    openTravelMenu(); const tx = document.getElementById('modalCard').textContent; o.areas = ['家和家人', '上學和學習', '運動', '幫助別人', '好玩的地方', '買東西和存錢'].every(k => tx.includes(k)) && tx.indexOf('博物館') > tx.indexOf('上學和學習') && tx.indexOf('博物館') < tx.indexOf('🏅 運動') && /小鎮島・走木橋/.test(tx) && /運動島・走木橋/.test(tx) && !/新市區/.test(tx); o.signs = islSigns(islMap(0)).length >= 6; document.getElementById('modal').hidden = true;
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
