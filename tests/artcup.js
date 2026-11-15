// 🏆 畫畫大賽：抽題目→畫→評審打星星→頒獎台；名畫框、作品牆；金牌送金盃＋調色盤小貓；存檔
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)), btn = re => [...document.querySelectorAll('#modalCard button')].find(x => re.test(x.textContent));
    document.getElementById('modal').hidden = true;
    // 評審：空空的畫 → 都是 2～3 顆；繽紛塗滿 → 高分
    const thin = { s: [[0, 0, 10, 10, 5, 5]] }, rich = { s: [] };
    for (let c = 0; c < 8; c++) for (let y = 0; y < 4; y++) { const st = [c, 2, 5, c * 20 + y * 5]; for (let i = 0; i < 12; i++) st.push(i % 2 ? -220 : 220, 0); rich.s.push(st); }
    const a = artJudge(thin), z = artJudge(rich);
    o.judgeLow = a.stars.every(n => n >= 2 && n <= 3); o.judgeHigh = z.stars.reduce((x, y) => x + y, 0) >= 14 && z.cov > .5 && z.colors === 8;
    // 整個流程
    G.pets = G.pets.filter(q => q.species !== 'paintcat'); delete (G.seen || {}).art_frame; delete (G.seen || {}).trophy_cup_art; delete G.inv.art_frame; delete G.inv.trophy_cup_art; delete sportsCupState().art;
    openArtCup(0); await wait(100);
    o.topic = /題目：我的寵物/.test(document.querySelector('#modalCard').textContent);
    btn(/換一個題目/).click(); await wait(50); o.reroll = openArtCup.test.T[1] !== '我的寵物';
    openArtCup.test.go(); await wait(100);
    o.padBig = !!openDrawPad.test && !document.getElementById('modalCard').classList.contains('in-game');
    openDrawPad.test.strokes.push(...rich.s.map(st => st.slice()));
    btn(/畫好了/).click(); await wait(100);
    o.judging = !!document.querySelector('#modalCard .art-frame canvas') && document.querySelectorAll('#modalCard .cup-judge').length === 3;
    await wait(3600); o.stars = [...document.querySelectorAll('.cup-stars')].every(x => /⭐⭐/.test(x.textContent));
    btn(/頒獎典禮/).click(); await wait(1600);
    o.medal = artCupFinish.last.medal === 3 && sportsCupState().art === 3;
    o.frame = (G.inv.art_frame || 0) === 1 && G.artCup.frame && padPoints(G.artCup.frame) > 100 && padPoints(G.artWall[0]) === padPoints(G.artCup.frame);
    o.trophy = (G.inv.trophy_cup_art || 0) === 1;
    o.pet = G.pets.some(q => q.species === 'paintcat');
    { const c = document.createElement('canvas'); c.width = 120; c.height = 60; const g = c.getContext('2d'); FURN_BY_ID.art_frame.draw(g, 120, 60); o.frameDraw = g.getImageData(60, 30, 1, 1).data[3] === 255; }
    // 再比一次（不會再送畫框、金盃）
    btn(/再比一次/).click(); await wait(100); o.again = /題目/.test(document.querySelector('#modalCard').textContent);
    closeGameWindow(); document.querySelectorAll('#showcase').forEach(x => x.remove());
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)), n = normalizeSave(raw);
    o.saved = n.sportsCup.art === 3 && padPoints(n.artCup.frame) > 100 && n.inv.art_frame === 1 && n.pets.some(q => q.species === 'paintcat');
    o.norm = normalizeSave(Object.assign({}, raw, { artCup: 'x' })).artCup == null && Object.keys(normalizeSave(Object.assign({}, raw, { artCup: { frame: { s: 'bad' }, topic: 5, zz: 1 } })).artCup).length === 0;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
