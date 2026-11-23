// 郵輪船上變熱鬧：上下船有動畫、舷梯可以下船、四間房間有東西和主人、自助餐免費吃會飽、劇場表演、船艙沒有客人、房間圖示不重複
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
      G.guide = 'done';
      travelArrive('cruise', 0); await w(500);
      shipBoard(); await w(300); o.boardScene = !!document.getElementById('vevScene');
      vevScene.test.close(); await w(400); o.onShip = G.away && G.away.place === 'ship';
      const rooms = PLACES.ship.rooms;
      o.filled = rooms.every(r => r.items.length >= 6);
      o.icons = new Set(rooms.map((r, i) => roomIcon(r, i))).size === rooms.length;
      o.gangway = rooms[0].items.some(q => q.id === 'ship_gangway') && FURNITURE_ACT.ship_gangway === 'ship_off';
      travelArrive('ship', 1); await w(600); o.chef = host.n && host.n.id === 'ship_chef';
      const bal = G.bells; G.kid.hunger = 10; openFoodCourt('ship'); await w(200);
      const fb = [...document.querySelectorAll('#gameWin button, .game-win button, button')].find(b => /壽司/.test(b.textContent)); fb && fb.click(); await w(200);
      const cv = document.querySelector('canvas.game-canvas, #gameWin canvas, .game-stage canvas'); for (let i = 0; i < 6; i++) { document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })); await w(60); }
      await w(900); o.buffetFree = G.bells === bal; o.ate = G.kid.hunger > 10; close();
      travelArrive('ship', 2); await w(600); o.mc = host.n && host.n.id === 'ship_mc';
      shipShow(); await w(300); o.show = !!document.getElementById('vevScene') && vevScene.test.frames.length === 4; vevScene.test.close();
      travelArrive('ship', 3); await w(600); o.cabinQuiet = !(host.crowd || []).length;
      travelArrive('ship', 0); await w(600); o.deckCrowd = (host.crowd || []).length === 3;
      shipLeave(); await w(300); vevScene.test.close(); await w(400); o.offShip = G.away && G.away.place === 'cruise';
      o.save = !!normalizeSave(JSON.parse(JSON.stringify(G)));
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
