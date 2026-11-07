// 🥋 世界大賽冠軍送「黑帶熊貓」：只送一次、買蛋抽不到、以前拿過冠軍的回家補送、圖鑑有提示、存檔讀得回來
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); G.guide = 'done'; $('#modal').hidden = true;
    const sp = PET_SPECIES_BY_ID.bbpanda; o.species = !!sp && sp.story && sp.weight === 0;
    o.notInEggs = (() => { const keep = JSON.stringify([G.pets, G.bells]); G.bells = 1e7; let bad = false; for (let i = 0; i < 40; i++) { const e = buyEgg(); if (e && e.species === 'bbpanda') bad = true; } const k = JSON.parse(keep); G.pets = k[0]; G.bells = k[1]; return !bad; })();
    openTab('book'); await wait(100); o.hint = /黑帶熊貓/.test($('#tabBody').textContent); openTab('inv');
    // 以前拿過冠軍：回家補送
    G.pets = G.pets.filter(x => x.species !== 'bbpanda'); tkdState().world = { best: 5, gold: 1, v: 2 };
    document.querySelectorAll('#showcase').forEach(x => x.remove()); await wait(4600);
    o.retro = G.pets.filter(x => x.species === 'bbpanda').length === 1;
    document.querySelectorAll('#showcase').forEach(x => x.remove()); if (typeof SC_QUEUE !== 'undefined') SC_QUEUE.length = 0;
    o.once = giveChampPanda() === false && G.pets.filter(x => x.species === 'bbpanda').length === 1;
    saveGame(); const back = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY))); o.saved = back.pets.some(x => x.species === 'bbpanda');
    const pc = renderPetPortrait(G.pets.find(x => x.species === 'bbpanda'), 120, 110); o.drawn = !!pc;
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
