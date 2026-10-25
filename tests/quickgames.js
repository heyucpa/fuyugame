// 🎮 小遊戲快速選單：上面有按鈕、家裡的遊戲直接開始、外面的走過去（要門票的先付）再開始、記得最近玩過、存檔讀回來
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; $('#modal').hidden = true; G.bells = 5000;
    document.getElementById('btnGames').click(); await wait(100);
    const tiles = [...document.querySelectorAll('.qg-tile')]; o.tiles = tiles.length >= 30;
    o.homeNames = tiles.some(t => /換裝走秀/.test(t.textContent)) && tiles.some(t => /對練/.test(t.textContent) && /跆拳道館/.test(t.textContent));
    // 家裡的：直接開始
    tiles.find(t => /翻牌配對/.test(t.textContent)).click(); await wait(300);
    o.homeStart = !$('#modal').hidden && /翻牌/.test($('#modalCard').innerText); closeGameWindow();
    // 外面的（不用門票）：走過去再開始
    document.getElementById('btnGames').click(); await wait(100);
    walkTrip = (n, d) => d();   // 測試：省掉走路過場
    [...document.querySelectorAll('.qg-tile')].find(t => /對練/.test(t.textContent)).click();
    for (let i = 0; i < 60 && !/對練/.test($('#modalCard').innerText + '') ; i++) { await wait(200); if (G.away && G.away.place === 'dojo' && !$('#modal').hidden && !/對練/.test($('#modalCard').innerText)) $('#modal').hidden = true; }
    o.awayStart = G.away && G.away.place === 'dojo' && /對練/.test($('#modalCard').innerText); closeGameWindow(); homeArrive(); await wait(300);
    // 要門票的：先問付錢
    document.getElementById('btnGames').click(); await wait(100);
    [...document.querySelectorAll('.qg-tile')].find(t => /打水比賽/.test(t.textContent)).click(); await wait(300);
    o.feeAsked = /付/.test($('#modalCard').innerText) && /游泳池/.test($('#modalCard').innerText); $('#modal').hidden = true;
    // 最近玩過
    document.getElementById('btnGames').click(); await wait(100);
    o.recent = /最近玩過/.test($('#modalCard').innerText) && G.recentGames[0].includes('打水比賽') && G.recentGames.length === 3;
    $('#modal').hidden = true;
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = Array.isArray(raw.recentGames) && raw.recentGames.length === 3;
    o.bad = normalizeSave(Object.assign({}, raw, { recentGames: 'x' })).recentGames == null;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
