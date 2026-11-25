// 小修正：難度按鈕的字看得到（不是白字）、滅火第 3 關比較難、消防滑竿會爬上去溜下來、找蝴蝶的箭頭只指走得到的蝴蝶
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
      openStoryBattle('hero'); await w(200);
      const lb = document.querySelector('.lv-btn'); const col = getComputedStyle(lb).color, bg = getComputedStyle(lb).backgroundColor;
      o.lvVisible = col !== bg && !/255, 255, 255/.test(col); close();
      o.fireHarder = FIRE_PLAN[2].pow < FIRE_PLAN[0].pow && FIRE_PLAN[2].hp > FIRE_PLAN[0].hp && FIRE_PLAN[2].extra >= 4;
      o.fire3Time = FIRE_PLAN[2].hp / FIRE_PLAN[2].pow > 1.4;   // 一團火至少要噴 1.4 秒（以前 0.5 秒）
      travelArrive('firestation', 0); await w(800);
      const it = curRoom().items.find(q => q.id === 'fire_pole'); fufu.x = it.x + .5; fufu.y = it.y + 1.5;
      fufuStartAct('fire_slide', performance.now(), it, false); await w(2400);
      const p1 = ridePos(performance.now()); o.climbsUp = !!p1 && p1.z > 40;
      await w(1900); const p2 = ridePos(performance.now()); o.slidesDown = !!p2 && p2.z < 15;
      fufu.act = null; fufu.ride = null;
      openIsland(); await w(1500);
      const keepNow = window.islReqNow; window.islReqNow = () => ({ kind: 'bug', npc: 'none' });
      const m = isl.m; let water = null, land = null;
      for (let y = 0; y < m.H && (!water || !land); y++) for (let x = 0; x < m.W; x++) { if (!water && !m.land[y][x] && [[1,0],[-1,0],[0,1],[0,-1]].every(([a,b]) => !(m.land[y+b] && m.land[y+b][x+a]))) water = [x, y]; if (!land && islPass(m, x, y)) land = [x, y]; }
      const keepC = isl.critters; isl.critters = [{ fly: true, x: water[0] + .5, y: water[1] + .5 }];
      o.seaIgnored = islReqTarget() === null;
      isl.critters.push({ fly: true, x: land[0] + .5, y: land[1] + .5 }); const tg = islReqTarget();
      o.landPicked = !!tg && Math.abs(tg.x - (land[0] + .5)) < .01;
      isl.critters = keepC; window.islReqNow = keepNow;
      closeIsland && closeIsland(); close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
