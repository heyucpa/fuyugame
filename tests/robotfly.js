// 🚀 機器人會飛：坐機器人才有「飛起來」；飛的時候可以飛過海、直直飛到點的地方；海上不能降落、陸地可以；飛的時候不會走進門；換車要先降落
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true;
    G.vehicles = ['bike', 'robot']; G.ride = 'bike'; openIsland(); await wait(800);
    const fb = document.getElementById('islFly'); o.hiddenOnBike = fb.hidden;
    G.ride = 'robot'; islRideBtn(); o.shownOnRobot = !fb.hidden && /飛起來/.test(fb.textContent);
    fb.click(); await wait(50); o.flying = isl.fly.on && /降落/.test(fb.textContent);
    // 找一格海：從現在的位置往外找第一個不是陸地的格子
    const m = isl.m; let sea = null; for (let r = 1; r < 30 && !sea; r++) for (let a = 0; a < 16 && !sea; a++) { const x = Math.floor(isl.x + Math.cos(a / 16 * 6.283) * r), y = Math.floor(isl.y + Math.sin(a / 16 * 6.283) * r); if (x > 0 && y > 0 && x < m.W - 1 && y < m.H - 1 && !m.land[y][x]) sea = [x, y]; }
    isl.flyTo = [sea[0] + .5, sea[1] + .5]; for (let k = 0; k < 400 && isl.flyTo; k++) islStep(.05);
    o.overSea = Math.floor(isl.x) === sea[0] && Math.floor(isl.y) === sea[1] && !m.land[sea[1]][sea[0]];
    o.high = isl.fly.h > .8;
    fb.click(); await wait(50); o.noLandOnSea = isl.fly.on;
    // 飛回出發點（陸地）降落
    const st = islStartTile(m); let lt = null; for (let r = 1; r < 6 && !lt; r++) for (let dy = -r; dy <= r && !lt; dy++) for (let dx = -r; dx <= r && !lt; dx++) { const x = st.x + dx, y = st.y + dy; if (islPass(m, x, y) && !m.blds.some(bd => bd.door[0] === x && bd.door[1] === y)) lt = [x, y]; } isl.flyTo = [lt[0] + .5, lt[1] + .5]; for (let k = 0; k < 600 && isl.flyTo; k++) islStep(.05);
    fb.click(); await wait(50); o.landed = !isl.fly.on && /飛起來/.test(fb.textContent);
    for (let k = 0; k < 40; k++) islStep(.05); o.down = isl.fly.h < .1;
    // 飛到門上也不會進去
    fb.click(); const door = m.blds.find(bd => bd.id !== 'home' && bd.door); isl.flyTo = [door.door[0] + .5, door.door[1] + .5];
    let entered = false; for (let k = 0; k < 600 && isl.flyTo; k++) { if (islStep(.05) === false) { entered = true; break; } }
    o.noDoorWhileFlying = !entered && !!isl;
    // 換腳踏車：在陸地上（門口）可以，會自動降落
    G.ride = 'bike'; islRideBtn(); o.switchLands = !isl.fly.on && document.getElementById('islFly').hidden;
    // 🏠 飛到停機坪上面按降落：直接去爸爸媽媽家
    try { closeIsland(); } catch (e) {} await wait(400); G.away = null; G.guide = 'done'; G.ride = 'robot'; document.getElementById('modal').hidden = true; document.querySelectorAll('#showcase').forEach(x => x.remove()); for (let k = 0; k < 10 && !isl; k++) { openIsland(); await wait(400); }
    islToggleFly(); const hp = isl.m.blds.find(bd => bd.id === 'helipad');
    isl.flyTo = [hp.x + hp.w / 2, hp.y + hp.h / 2]; for (let k = 0; k < 600 && isl.flyTo; k++) islStep(.05);
    islToggleFly(); for (let k = 0; k < 40 && !(G.away && G.away.place === 'sky'); k++) await wait(250);
    o.landHelipad = !isl && G.away && G.away.place === 'sky';
    // ☁️ 飛到天上那朵雲的爸爸媽媽家按降落：直接飛上去
    G.away = null; try { closeIsland(); } catch (e) {} await wait(400); document.getElementById('modal').hidden = true; for (let k = 0; k < 10 && !isl; k++) { openIsland(); await wait(400); }
    islToggleFly(); isl.flyTo = [13.5, 3.5]; for (let k = 0; k < 600 && isl.flyTo; k++) islStep(.05); islToggleFly();
    for (let k = 0; k < 20 && !(G.away && G.away.place === 'sky'); k++) await wait(200);
    o.landSkyIsle = G.away && G.away.place === 'sky';
    // 👥 在大地圖上：家裡不會有訪客
    G.away = null; try { closeIsland(); } catch (e) {} openIsland(); await wait(500);
    vis.nextAt = performance.now() - 1; visitorTick(.016, performance.now()); o.noVisitorOnIsland = !vis.who && vis.nextAt > performance.now() + 50000;
    try { closeIsland(); } catch (e) {}
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
