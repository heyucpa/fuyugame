// 🎄 聖誕節第二批：做薑餅人（要貼在身上、3 個才能烤、烤好拿餅乾）、裝飾聖誕樹（記憶、對錯判斷、過關）、雪橇送禮（禮物掉進煙囪才算、過關）；12 月每個小遊戲每天一顆星星；22 顆送聖誕小村莊；遊戲選單；聖誕音樂；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), close = () => { closeGameWindow(); document.getElementById('modal').hidden = true; document.querySelectorAll('#showcase').forEach(x => x.remove()); };
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.xmas = { stars: 0, got: [] }; G.gameBonusDay = today(); G.kidFood.xmas_cookie = 0;
    SEASON_TODAY = [11, 21]; o.hubNotNov = !allQuickGames().some(g => g.id === 'x:sleigh');
    o.hubAway = ['airport', 'police', 'hospital'].every(pl => allQuickGames().some(g => g.where === pl));
    SEASON_TODAY = [12, 5]; o.hubDec = ['x:ginger', 'x:tree', 'x:sleigh'].every(id => allQuickGames().some(g => g.id === id));
    o.music = gameMusicFor('🛷 雪橇送禮・第 1 關') === 'xmas' && !!(Sound.songs ? true : true);
    o.treeAct = FURNITURE_ACT.xmas_tree === 'xmas_treegame';
    // 薑餅人
    openGingerbread(); let T = openGingerbread.test; T.place(10, 10); o.gOutside = T.dec.length === 0;
    T.place(150, 60); T.pick(3); T.place(160, 100); o.gOven = document.querySelector('.game-card button.big:not(.alt)').disabled === true;
    T.place(160, 120); T.undo(); T.place(165, 125); o.gThree = T.dec.length === 3 && T.dec[1].k === 'star';
    T.oven(); T.skipBake(); await w(200); o.gDone = T.done && G.kidFood.xmas_cookie === 2 && G.xmas.stars === 1 && G.xmas.gm.ck === today(); close();
    openGingerbread(); T = openGingerbread.test; T.place(150, 60); T.place(150, 90); T.place(150, 100); T.oven(); T.skipBake(); await w(200); o.gOncePerDay = G.xmas.stars === 1 && G.kidFood.xmas_cookie === 4; close();
    // 聖誕樹
    openXmasTree(1); let R = openXmasTree.test; o.tShow = R.ph === 'show' && R.target.filter(Boolean).length === 3; R.skipShow(); o.tPlay = R.ph === 'play';
    R.target.forEach((k, i) => { if (k) { R.pick(TREE_COLS.findIndex(c => c[0] === k)); R.hang(i); } }); R.check(); await w(100);
    o.tWin = R.checked.ok && G.xmas.tl === 1 && G.xmas.stars === 2; close();
    openXmasTree(2); R = openXmasTree.test; R.skipShow(); R.check(); o.tLose = !R.checked.ok && R.checked.wrong === 5 && G.xmas.tl === 1; close();
    // 雪橇
    openSleigh(1); let S = openSleigh.test; await w(100);
    const h = S.houses[0]; S.houses.forEach(q => { if (q !== h) q.x = 1000; }); h.x = 96 - h.cx + 10; h.roof = 150; const g0 = S.got; S.gifts.push({ x: 96, y: h.roof - 20, vy: 0, py: h.roof - 20, col: '#f00' }); await w(400); o.sChimney = S.got === g0 + 1 && h.hit;
    S.houses.forEach(q => { q.x = 1000; }); S.gifts.push({ x: 96, y: 150, vy: 0, py: 150, col: '#f00' }); await w(400); o.sMiss = S.got === g0 + 1;
    S.got = 4; const h2 = S.houses[1]; S.houses.forEach(q => { q.x = 1000; }); h2.x = 96 - h2.cx + 10; h2.roof = 150; h2.hit = false; S.gifts.push({ x: 96, y: 130, vy: 0, py: 130, col: '#f00' }); await w(400);
    o.sWin = G.xmas.sl === 1 && G.xmas.stars === 3; close();
    // 22 顆 → 聖誕小村莊
    G.xmas.stars = 21; G.xmas.got = ['santa_suit', 'reindeer_sleigh', 'xmas_star_clip']; const v0 = G.inv.xmas_village || 0; xmasStar(1); o.village = (G.inv.xmas_village || 0) === v0 + 1 && G.xmas.got.includes('xmas_village');
    await w(1800); document.querySelectorAll('#showcase').forEach(x => x.remove());
    // 送禮物卡片有三個小遊戲
    openXmasPrizes(); o.card = /做薑餅人/.test($('#modalCard').textContent) && /雪橇送禮/.test($('#modalCard').textContent) && /22/.test($('#modalCard').textContent); $('#modal').hidden = true;
    // 存檔
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { xmas: { stars: 3, got: [], gm: { ck: '2026-12-05', bad: 'x', tr: 5 }, tl: 9, sl: 2 } }));
    o.save = JSON.stringify(n.xmas.gm) === JSON.stringify({ ck: '2026-12-05' }) && n.xmas.tl === undefined && n.xmas.sl === 2;
    SEASON_TODAY = null;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
