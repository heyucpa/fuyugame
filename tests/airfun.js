// ✈️ 搭飛機變好玩：飛行途中一定發生一件事（亂流要繫安全帶、送餐選、小寶寶哭、窗外拍照收集）；每個國家都有自己的玩法（找、點、照順序）、第一次送錢；國旗有國家圖案；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), btns = () => [...document.querySelectorAll('.game-card .btns button, .game-card button.big')];
    try {
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.trip = { st: {} }; G.bells = 99999; G.gameBonusDay = today();
    const fly = async (dest, kind) => { airLastEv = ['bump', 'meal', 'baby', 'sight'].filter(k => k !== kind)[0]; let tries = 0; do { closeGameWindow(); openAirTravel(); openAirTravel.test.go(dest); airBoard.test.next(); airBoard.test.next(); airBoard.test.next(); tries++; } while (airFlight.test.kind !== kind && tries < 30); airFlight.test.start(); await w(50); return airFlight.test.ev; };
    let ev = await fly('冰雪國', 'bump'); o.bumpBtn = [...document.querySelectorAll('.game-card button')].some(x => /安全帶/.test(x.textContent));
    [...document.querySelectorAll('.game-card button')].find(x => /安全帶/.test(x.textContent)).click(); o.belt = ev.belt === true && ev.done;
    ev = await fly('冰雪國', 'meal'); [...document.querySelectorAll('.game-card button')].find(x => /咖哩飯/.test(x.textContent)).click(); o.meal = ev.food === '🍛';
    ev = await fly('冰雪國', 'baby'); o.babyCry = ev.cry === true; [...document.querySelectorAll('.game-card button')].find(x => /玩偶/.test(x.textContent)).click(); o.baby = ev.cry === false;
    ev = await fly('冰雪國', 'sight'); [...document.querySelectorAll('.game-card button')].find(x => /拍下來/.test(x.textContent)).click(); o.sight = G.trip.sky.includes(ev.sight[0]);
    airFlight.test.skip(); await w(300); o.arrive = !!airArrive.test && /找躲起來的企鵝/.test(document.querySelector('.game-card').textContent);
    // 冰雪國：找企鵝
    airArrive.test.act(); await w(100); let A = airActivity.test; o.hideCount = A.spots.length === 8 && A.spots.filter(s => s.item).length === 5;
    A.hit(A.spots.find(s => !s.item)); o.empty = A.got === 0; const b0 = G.bells;
    A.spots.filter(s => s.item).forEach(s => A.hit(s)); o.found = A.done && G.trip.act['冰雪國'] === 1 && G.bells > b0;
    // 星星國：照順序
    closeGameWindow(); openAirTravel(); openAirTravel.test.go('星星國'); airBoard.test.next(); airBoard.test.next(); airBoard.test.next(); airFlight.test.skip(); await w(300); airArrive.test.act(); await w(100); A = airActivity.test;
    A.hit(A.spots.find(s => s.num === 2)); o.orderWrong = A.got === 0; [...A.spots].sort((a, b) => a.num - b.num).forEach(s => A.hit(s)); o.orderDone = A.done;
    // 其他國家都畫得出來、點得完
    o.allActs = true;
    for (const d of ['沙漠國', '森林國', '大海國', '火山國', '雲朵國', '糖果國']) { closeGameWindow(); openAirTravel(); openAirTravel.test.go(d); airBoard.test.next(); airBoard.test.next(); airBoard.test.next(); airFlight.test.skip(); await w(250); airArrive.test.act(); await w(120); A = airActivity.test; (A.spots.some(s => s.num) ? [...A.spots].sort((a, b) => a.num - b.num) : A.spots.filter(s => s.item)).forEach(s => A.hit(s)); if (!A.done) o.allActs = false; }
    closeGameWindow();
    // 國旗
    o.flag = WORLD_VENUES['火山國'].flag.join() !== '#212529,#e03131,#ffd43b';
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { trip: { st: {}, sky: ['ufo', 'bad', 'ufo'], act: { '冰雪國': 1, '外星國': 1 } } }));
    o.save = JSON.stringify(n.trip.sky) === '["ufo"]' && JSON.stringify(n.trip.act) === JSON.stringify({ '冰雪國': 1 });
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
