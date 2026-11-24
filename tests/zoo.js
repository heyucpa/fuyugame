// 新動物：獨角獸、大象、長頸鹿、斑馬、老虎、獅子當朋友；重複的主人換成不同動物（id 不變，存檔沒事）；新的畫法都畫得出來
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
      const ids = ['caicai', 'dudu', 'gaogao', 'tiaotiao', 'ahu', 'houhou'];
      o.friends = ids.every(id => NEIGHBOR_BY_ID[id] && SIG_MOVES[id] && WORLD_EMO[id] && ANIMAL_STAMPS[id]);
      o.draw = ids.map(id => NEIGHBOR_BY_ID[id]).concat(['clerk', 'clerk_furn', 'clerk_toy', 'chef_food', 'fireman', 'bank_guard', 'cinema', 'ranger', 'librarian'].map(k => HOSTS[k])).every(n => { try { return !!renderNeighborPortrait(n, 60, 60, false); } catch (e) { return false; } });
      const kinds = Object.values(HOSTS).filter(h => !['mom', 'dad'].includes(h.id)).map(h => (h.name.match(/^(貓頭鷹|貓咪|貓熊|熊熊|狗狗|兔兔|河馬|小羊|山羊|綿羊|長頸鹿|獨角獸|大象|獅子|斑馬|老虎|乳牛|鴨嘴獸|[^\s]{2})/) || [''])[0]);
      const cnt = {}; kinds.forEach(k => cnt[k] = (cnt[k] || 0) + 1);
      o.fewDupes = Object.values(cnt).every(n => n <= 2) || JSON.stringify(cnt);
      o.idsKept = ['clerk', 'clerk_furn', 'clerk_toy', 'chef_food', 'fireman', 'bank_guard', 'cinema', 'ranger', 'librarian'].every(k => HOSTS[k] && HOSTS[k].id === k);
      o.noOldNames = !/兔兔店員|綿羊店員|小熊店員|狗狗廚師|熊熊消防員|河馬警衛|貓頭鷹放映師|柴犬園長|貓咪館員/.test(document.documentElement.innerHTML);
      o.save = !!normalizeSave(JSON.parse(JSON.stringify(G)));
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
