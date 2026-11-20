// 🔍 小偵探破案、🛏️ 病房照顧、🎖️ 警察／醫生升級（家長 11/20 第一批）
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), status = () => document.querySelector('#modalCard .game-status').textContent;
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.cop = {}; G.town = {}; document.querySelectorAll('#showcase').forEach(x => x.remove());
    // 每個案子都猜得到：另外兩位至少兩樣線索跟犯人不一樣
    let ok = true; for (let i = 0; i < 200; i++) { const k = caseBuild(); if (!k || k.sus.length !== 3 || !k.sus.includes(k.culprit)) { ok = false; break; } k.sus.filter(n => n !== k.culprit).forEach(n => { if (caseTraits(n).filter((x, j) => x !== k.traits[j]).length < 2) ok = false; }); } o.solvable = ok;
    // 破案流程
    openDetective(); const T = openDetective.test; const wrong = T.k.sus.find(n => n !== T.k.culprit);
    T.pick(T.k.culprit); o.needClues = !G.cop.caught;
    [0, 1, 2].forEach(i => T.clue(i)); o.cluesShown = /線索都找到了/.test(status());
    T.pick(wrong); o.wrongSays = /不是我/.test(status()) && !G.cop.caught;
    T.pick(T.k.culprit); await w(200);
    o.solved = !!G.cop.caught && G.cop.caught.id === T.k.culprit.id && G.cop.xp === 2 && caseState().n === 1;
    o.inJail = prisonersToday()[0].n === T.k.culprit;
    for (let i = 0; i < 2; i++) { openDetective(); const t2 = openDetective.test; [0, 1, 2].forEach(k => t2.clue(k)); t2.pick(t2.k.culprit); await w(100); }
    const xp3 = G.cop.xp; openDetective(); const t3 = openDetective.test; [0, 1, 2].forEach(k => t3.clue(k)); t3.pick(t3.k.culprit); await w(100);
    o.dailyCap = caseState().n === 3 && G.cop.xp === xp3;
    // 病房照顧
    openWard(); o.wardLevels = document.querySelectorAll('#modalCard .lv-btn').length === 3;
    openWard(1); await w(300); const W1 = openWard.test; W1.beds[0].want = 'water'; W1.pick(1); W1.give(0); o.wrongItem = W1.beds[0].want === 'water' && /不是這個/.test(status());
    W1.pick(0); W1.give(0); o.rightItem = W1.beds[0].want === null;
    W1.win(); await w(300); o.wardWin = townState().wardLv === 1 && townState().docXp === 2;
    // 鍵盤：數字鍵選東西、空白鍵給
    openWard(2); await w(300); const W2 = openWard.test; W2.beds[0].want = 'book'; document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Digit4', bubbles: true })); document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true })); o.wardKeys = W2.beds[0].want === null;
    closeGameWindow();
    // 升級送衣服
    document.querySelectorAll('#showcase').forEach(x => x.remove());
    G.wardrobe = G.wardrobe.filter(id => !/^cop_|^nurse|^doc_coat|^steth/.test(id));
    copState().xp = 0; townState().docXp = 0; addRankXp('cop', 3); o.copRank1 = G.wardrobe.includes('cop_badge') && rankOf('cop', rankXp('cop')) === 1;
    addRankXp('cop', 30); o.copChief = ['cop_cap_gold', 'cop_jacket_gold', 'cop_chief_cap'].every(id => G.wardrobe.includes(id));
    addRankXp('doc', 25); o.docDean = ['nurse_cap', 'doc_coat', 'steth_neck', 'doc_coat_gold'].every(id => G.wardrobe.includes(id));
    openRankCard('cop'); o.rankCard = /警察局長/.test(document.getElementById('modalCard').textContent); closeGameWindow();
    o.clothesDraw = (() => { try { const c = document.createElement('canvas').getContext('2d'); ['cop_badge', 'cop_cap_gold', 'cop_jacket_gold', 'cop_chief_cap', 'nurse_cap', 'doc_coat', 'steth_neck', 'doc_coat_gold'].forEach(id => drawGirl(c, { t: 0, outfit: Object.assign({}, currentOutfit(), { [CLOTHES_BY_ID[id].slot]: CLOTHES_BY_ID[id] }), hair: G.hair })); return true; } catch (e) { return e.message; } })() === true;
    // 存檔驗證
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { cop: Object.assign({}, G.cop, { xp: -1, cases: { d: 3 }, caught: { d: 'x', id: 'nobody', ci: 1 } }), town: Object.assign({}, G.town, { docXp: 'a', wardLv: 9 }) }));
    o.saveSafe = !('xp' in n.cop) && !('cases' in n.cop) && !('caught' in n.cop) && !('docXp' in n.town) && n.town.wardLv === 3;
    const n2 = normalizeSave(JSON.parse(JSON.stringify(G))); o.saveKeeps = n2.cop.xp === G.cop.xp && n2.town.docXp === G.town.docXp && n2.cop.caught && n2.cop.caught.id === G.cop.caught.id;
    // 選單
    G.away = { place: 'police', idx: 0 }; host.n = HOSTS.police; o.copMenu = hostMenuEntries().some(e => /破案/.test(e[0])) && hostMenuEntries().some(e => /警察等級/.test(e[0]));
    G.away = { place: 'hospital', idx: 0 }; host.n = HOSTS.hospital; o.docMenu = hostMenuEntries().some(e => /病房照顧/.test(e[0])) && hostMenuEntries().some(e => /醫生等級/.test(e[0]));
    host.n = null; G.away = null;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
