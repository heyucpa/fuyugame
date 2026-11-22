// 🖐️ 第一人稱 A：寵物洗澡（三步驟、洗完照顧效果、快快洗好）、水槍射泡泡（射中加分、沒射中不加）、澆花（倒滿才長大、等待中不開）
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
    if (G.pet.stage === 'egg') G.pet.stage = 'kid';
    G.pet.clean = 10; document.getElementById('btnBath').click(); await w(150);
    const B = openPetBathGame.test; o.bathOpens = !!B && /洗澡/.test(document.querySelector('.game-card').textContent) && G.pet.clean === 10;
    B.cells.forEach(cl => B.rub(cl.x, cl.y)); o.bathStep2 = B.step === 1;
    B.all(); await w(1700); o.bathDone = B.done && G.pet.clean > 50 && /香香/.test(document.querySelector('.game-card').textContent); close();
    G.pet.clean = 10; document.getElementById('btnBath').click(); await w(150); [...document.querySelectorAll('.game-card button')].find(b => /快快洗好/.test(b.textContent)).click(); await w(150);
    o.quickBath = G.pet.clean > 50 && document.getElementById('modal').hidden;
    // 射泡泡
    openBubbleGame(); await w(1500); const P = openBubbleGame.test; o.bubbleTitle = /水槍射泡泡/.test(document.querySelector('.game-card').textContent);
    const bb = P.bubbles[0]; if (bb) { P.setAim(bb.drawX ?? bb.x, bb.y); const s0 = P.score; P.shoot(); o.shootHits = P.score > s0; } else o.shootHits = false;
    P.setAim(5, 40); const s1 = P.score; P.shoot(); o.missNoScore = P.score === s1; close();
    o.menuName = earnGameList().some(g => g[1] === '水槍射泡泡');
    // 澆花
    G.garden = G.garden || {}; G.garden[99902] = { s: 1, w: 0 }; let called = 0;
    openWaterFlower({ uid: 99902 }, () => { called++; gardenWater({ uid: 99902 }); }); const F = openWaterFlower.test;
    F.cx = 196; F.press(true); await w(1200); F.press(false); o.waterFills = F.fill > 0;
    F.setFill(1); await w(1700); o.waterDone = called === 1 && G.garden[99902].s === 2;
    // 從房間的花盆澆花：可以長才開遊戲；剛澆過不開
    const room = G.rooms[G.cur], it = { uid: 99903, id: 'planter', x: 0, y: 0, rot: 0 }; G.garden[99903] = { s: 1, w: 0 };
    fufuStartAct('water', performance.now(), it, false); await w(200); o.actOpensGame = /澆花/.test((document.querySelector('.game-card h2, .game-card') || {}).textContent || '') && !document.getElementById('modal').hidden; close();
    G.garden[99903] = { s: 2, w: Date.now() }; fufuStartAct('water', performance.now(), it, false); await w(200); o.waitNoGame = document.getElementById('modal').hidden;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
