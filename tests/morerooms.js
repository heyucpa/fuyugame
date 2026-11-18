// 🏠 房間再大一點、再多幾間：可以擴建到 12×12（家長：14×14 太大）、蓋到 8 間（加陽台），價格正確，存檔留得住，寵物上限還是 5
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(() => {
    const o = {}; document.getElementById('modal').hidden = true;
    G.bells = 1e7; const b0 = G.bells;
    while (canAddRoom()) addRoom();
    o.eight = normalRooms() === 8 && G.rooms.map(r => r.name).slice(4).join() === '遊戲室,書房,玩具房,音樂室';
    G.cur = 0; const r = curRoom(); while (nextSize(r)) expandRoom(); o.big = r.w === 12 && r.d === 12;
    o.paid = b0 - G.bells === NEW_ROOM_COST.reduce((a, c) => a + c, 0) + Object.entries(EXPAND_COST).filter(([k]) => ROOM_SIZES.includes(+k)).reduce((a, [, c]) => a + c, 0) - (r.w0 || 0);
    o.pets = petsOutLimit() === 5;
    commit(); openTab('build'); o.ui = /12×12/.test(document.getElementById('tabBody').textContent) && /已經是最大/.test(document.getElementById('tabBody').textContent);
    saveGame(); const n = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    o.saved = n.rooms.length === 8 && n.rooms[0].w === 12;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
