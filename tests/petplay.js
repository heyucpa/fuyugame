// 🏁 賽跑猜冠軍、🎾 丟球（寵物屋「叫大家來…」）：排隊→猜→跑→第一名、猜對拿錢（一天有上限）；丟球→搶著撿→叼回來→可以再丟；一分鐘沒丟就結束；不能只有一隻寵物賽跑
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
    G.guide = 'done'; $('#modal').hidden = true;
    const sp = G.pet.species;
    enterPetHouse(); await wait(300);
    o.oneOnly = phCallAll('race') === false;
    const sps = Object.keys(PET_SPECIES_BY_ID).filter(x => x !== G.pet.species).slice(0, 3); sps.forEach((x, k) => G.pets.push(Object.assign({}, G.pet, { species: x, name: '測' + k, stage: 'kid' })));
    G.pets.forEach(q => { if (q.stage === 'egg') q.stage = 'kid'; });
    homeArrive(); await wait(200); enterPetHouse(); await wait(400);
    openCallAll(); o.picks = [...document.querySelectorAll('.call-pick')].map(x => x.textContent).filter(t => /賽跑|丟球/.test(t)); $('#modal').hidden = true;
    const b0 = G.bells;
    o.walkers = phWalkers().length; o.raceStarted = phCallAll('race'); if (!phMode) return o;
    for (let i = 0; i < 120 && phMode.phase !== 'guess'; i++) await wait(100);
    o.guessPhase = phMode.phase;
    const pick = phWalkers()[0]; phModeTap(pick, performance.now()); o.guessed = phMode.guess === pick;
    for (let i = 0; i < 300 && phMode && phMode.phase !== 'done'; i++) await wait(100);
    o.done = phMode && phMode.phase === 'done'; o.winner = phMode && phMode.order[0] ? true : false;
    o.paidRight = phMode && ((phMode.order[0] === pick) ? G.bells === b0 + 20 : G.bells === b0);
    for (let i = 0; i < 60 && phMode; i++) await wait(100); o.ended = !phMode;
    // 🎾 丟球
    phCallAll('fetch'); await wait(1500);
    const room = curRoom(), blk = blockedGrid(room); let tx = -1, ty = -1;
    for (let i = room.w - 1; i >= 0 && tx < 0; i--) for (let j = room.d - 1; j >= 0; j--) if (!blk[i][j] && Math.hypot(i - fufu.x, j - fufu.y) > 2.5) { tx = i; ty = j; break; }
    const q = iso(tx + .5, ty + .5, 0); const cv = $('#view'), r = cv.getBoundingClientRect();
    // 直接呼叫丟球（模擬點那一格）
    const w = { x: q.x, y: q.y }; o.thrown = PH_EXTRA.fetch.floorTap(Object.assign(w, {})) && phMode.ball.state === 'fly';
    for (let i = 0; i < 150 && phMode.ball.state !== 'carried'; i++) await wait(100); o.carried = phMode.ball.state === 'carried';
    for (let i = 0; i < 200 && phMode.ball.state !== 'held'; i++) await wait(100); o.back = phMode.ball.state === 'held' && phMode.n === 1;
    phMode.lastAt -= 61000; await wait(300); o.fetchEnds = !phMode;
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    o.badRaceDay = normalizeSave(Object.assign({}, raw, { raceDay: { d: 3, n: 'x' } })).raceDay == null;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = out.oneOnly && out.picks.length === 2 && out.guessPhase === 'guess' && out.guessed && out.done && out.winner && out.paidRight && out.ended && out.thrown && out.carried && out.back && out.fetchEnds && out.badRaceDay && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
