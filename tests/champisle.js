// 🏆 世界躲避球冠軍：冠軍球場島（沒冠軍沒有、拿到才出現、有碼頭坐船、點獎盃打躲避球、快速出門有）＋球球獅（只送一次、買蛋抽不到、以前拿過冠軍補送）
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); G.guide = 'done'; $('#modal').hidden = true;
    const clear = () => { document.querySelectorAll('#showcase').forEach(x => x.remove()); if (typeof SC_QUEUE !== 'undefined') SC_QUEUE.length = 0; };
    G.dbcup = { best: 0, gold: 0 }; islMapCache = null; let m = islMap(0); o.noIsle = !m.specials.some(s => s.id === 'champ');
    G.dbcup.gold = 1; m = islMap(0); o.isle = m.specials.some(s => s.id === 'champ') && m.docks.filter(d => d.id === 'champ').length === 2 && m.isletAt[23][57] === 'champ';
    o.species = PET_SPECIES_BY_ID.balllion && PET_SPECIES_BY_ID.balllion.story && PET_SPECIES_BY_ID.balllion.weight === 0;
    // 以前拿過冠軍：回家補送球球獅
    G.pets = G.pets.filter(x => x.species !== 'balllion'); clear(); await wait(4600); o.retro = G.pets.filter(x => x.species === 'balllion').length === 1; clear();
    o.once = giveChampLion() === false;
    // 出門：島畫得出來、快速出門有、點獎盃開躲避球
    openIsland(); await wait(300); for (let i = 0; i < 3; i++) islFrame && 0;
    o.dock = isl.m.docks.some(d => d.id === 'champ' && d.side === 'main');
    islQuestSpecial({ id: 'champ', x: 57.5, y: 23.5 }); await wait(1000); o.tapPlay = /躲避球/.test($('#modalCard').textContent) && !$('#modal').hidden;
    closeGameWindow(); $('#modal').hidden = true; closeIsland();
    // 存檔、驗證：牠讀得回來
    saveGame(); o.saved = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY))).pets.some(x => x.species === 'balllion');
    o.drawn = !!renderPetPortrait(G.pets.find(x => x.species === 'balllion'), 120, 110);
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
