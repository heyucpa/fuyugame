// 🏆 運動大賽：游泳大賽（換泳裝評分＋游泳）、跑步大賽（跳遠＋百米）、小鐵人三項（游泳→跑步→腳踏車）；選單、成績、存檔
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    const btn = re => [...document.querySelectorAll('#modalCard button')].find(x => re.test(x.textContent));
    document.getElementById('modal').hidden = true;
    // 選單
    o.swimMenu = !!SPORT_CUPS.swim && /世界全國游泳大賽/.test(cupMenuLabel('swim'));
    // ① 游泳大賽
    openSportsCup('swim'); btn(/開始比賽/).click(); await wait(200);
    o.dressUI = document.querySelectorAll('.cup-row').length === 4 && document.querySelectorAll('.cup-row')[3].querySelectorAll('button').length === 6;
    btn(/幫我搭/).click(); o.randomOk = CUP_SUIT_COLORS.some(c => c[0] === cupDress.test.s.suit);
    const S = cupDress.test.s; S.suit = S.cap = '#3fa9f5'; S.extra.goggle = S.extra.flower = true;
    cupDress.test.ok(); await wait(3400);
    o.stars = document.querySelectorAll('.cup-stars').length === 3 && [...document.querySelectorAll('.cup-stars')].every(x => /⭐⭐/.test(x.textContent));
    o.judgeSay = [...document.querySelectorAll('.cup-say')].every(x => x.textContent.length > 0);
    o.toSwim = !!btn(/下一關.*游泳/); btn(/下一關/).click(); await wait(300);
    o.swimCap = CUPRUN && CUPRUN.kind === 'swimRace';
    o.ducksShown = /小鴨/.test(document.querySelector('.game-status').textContent);
    examHook('swimRace', { place: 1, ducks: 2 }, openSportsCup.test.w); await wait(100);
    o.duckPts = /12 分/.test(document.querySelector('.game-status').textContent);
    btn(/看總分/).click(); await wait(300);
    o.podium = !!document.querySelector('#modalCard canvas') && typeof gameCleanup === 'function';
    o.swimMedal = cupFinish.last.medal >= 2 && sportsCupState().swim >= 2 && /總分/.test(document.querySelector('.cup-result').textContent);
    // ② 跑步大賽：跳遠只跳 2 次
    openSportsCup('run'); btn(/開始比賽/).click(); await wait(300);
    o.jumpTries = /第 1 \/ 2 跳/.test(document.querySelector('.game-status').textContent) && CUPRUN.kind === 'longjump';
    examHook('longjump', { score: 4.2 }, openSportsCup.test.w); await wait(100);
    btn(/下一關/).click(); await wait(300); o.sprint = CUPRUN.kind === 'sprint';
    examHook('sprint', { place: 2 }, openSportsCup.test.w); await wait(100); btn(/看總分/).click(); await wait(200);
    o.runDone = sportsCupState().run >= 1 && cupFinish.last.total === 8 + 7;
    // ③ 小鐵人三項：腳踏車真的騎
    openSportsCup('tri'); btn(/開始比賽/).click(); await wait(200);
    examHook('swimRace', { place: 3 }, openSportsCup.test.w); await wait(50); btn(/下一關/).click(); await wait(200);
    examHook('sprint', { place: 1 }, openSportsCup.test.w); await wait(50); btn(/下一關.*腳踏車/).click(); await wait(2800);
    const B = playTriBike.test; for (let k = 0; k < 10; k++) { B.pedal(); await wait(60); } o.bikeMoves = B.me.x > 0;
    B.me.x = 27; await wait(200); o.pad = playTriBike.fx().pads >= 1; B.me.x = 79.9; await wait(300); o.ramp = playTriBike.fx().ramp === 1;
    B.fin(); await wait(1800);
    o.bikeDone = !!btn(/看總分/); btn(/看總分/).click(); await wait(200);
    o.triDone = sportsCupState().tri >= 1 && cupFinish.last.total >= 5 + 10 + 3;
    // 中途離開：不會把成績交給下一個遊戲
    openSportsCup('swim'); btn(/開始比賽/).click(); await wait(100); closeGameWindow(); o.leaveClears = CUPRUN === null;
    // 🐾 金牌送寵物（跑步大賽 → 閃電小豹）；銅牌不送；拿過金牌的會補送
    G.pets = G.pets.filter(q => !['bubbleseal', 'zoomcheetah', 'medalcorgi'].includes(q.species));
    openSportsCup('run'); cupFinish(openSportsCup.test.w, 'run', [2, 3]); await wait(1300); o.noPetBronze = !G.pets.some(q => q.species === 'zoomcheetah');
    openSportsCup('run'); cupFinish(openSportsCup.test.w, 'run', [10, 10]); await wait(1300); o.petGold = G.pets.some(q => q.species === 'zoomcheetah') && /閃電小豹/.test(document.querySelector('.game-status').textContent);
    closeGameWindow(); document.querySelectorAll('#showcase').forEach(x => x.remove());
    o.petStory = ['bubbleseal', 'zoomcheetah', 'medalcorgi'].every(id => PET_SPECIES_BY_ID[id] && PET_SPECIES_BY_ID[id].story && !PET_SPECIES_BY_ID[id].weight);
    G.guide = 'done'; sportsCupState().tri = 3; document.getElementById('modal').hidden = true; await wait(5200); o.backfill = G.pets.some(q => q.species === 'medalcorgi');
    { const cv = document.createElement('canvas'); cv.width = cv.height = 60; const g = cv.getContext('2d'); g.translate(30, 50); g.scale(2, 2); ['bubbleseal', 'zoomcheetah', 'medalcorgi'].forEach(id => drawCreature(g, PET_SPECIES_BY_ID[id], { happy: true, blink: false, fx: 0, clean: 100, t: 1 })); o.petDraw = g.getImageData(30, 30, 1, 1).data[3] > 0; }
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    o.saved = raw.sportsCup && raw.sportsCup.swim >= 2 && normalizeSave(raw).pets.some(q => q.species === 'zoomcheetah');
    const n = normalizeSave(Object.assign({}, raw, { sportsCup: { swim: 9, run: 2, tri: 'x', bad: 1, n: 3 } })).sportsCup;
    o.norm = n.swim == null && n.run === 2 && n.tri == null && n.bad == null && n.n === 3 && normalizeSave(Object.assign({}, raw, { sportsCup: 5 })).sportsCup == null;
    o.oldSave = (() => { const r2 = Object.assign({}, raw); delete r2.sportsCup; return normalizeSave(r2).sportsCup == null; })();
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
