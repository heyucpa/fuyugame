// 第二批：北極熊抓魚（魚出來按到算我、沒魚亂按凍住、北極熊會抓、先 7 條贏）、冰雪國幫完企鵝才有按鈕；高速公路追小偷（換車道、撞到拉開、同車道貼近抓到、時間到溜走）；開飛機機長撿漏掉的圈圈；雪橇星星 +5 秒
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
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.bells = 9999; G.gameBonusDay = today(); G.help = { list: [], done: {} };
    // 冰雪國按鈕
    const arrive = async () => { openAirTravel(); openAirTravel.test.go('冰雪國'); airBoard.test.next(); airBoard.test.next(); airBoard.test.next(); airFlight.test.skip(); await w(300); return [...document.querySelectorAll('.game-card button')].some(x => /北極熊比賽/.test(x.textContent)); };
    o.noBtnBefore = !(await arrive()); close(); G.help.done.ice = 1; o.btnAfter = await arrive(); close();
    // 抓魚
    openBearFish(); let F = openBearFish.test; F.grab(); o.frozen = F.me === 0; await w(700);
    F.fishUp(); F.grab(); o.caught = F.me === 1;
    for (let i = 0; i < 6; i++) { await w(650); F.fishUp(); F.grab(); } await w(300); o.win = F.end && F.me === 7; await w(1400); close();
    openBearFish(); F = openBearFish.test; await w(8000); o.bearCatches = F.bear >= 1; close();
    // 高速公路
    openHighwayChase(); let C = openHighwayChase.test; C.move(1); o.laneMove = C.me.lane === 2; C.move(1); o.laneMax = C.me.lane === 2;
    C.obs.push({ x: 70, lane: C.me.lane, k: 'cone', hit: false }); const g0 = C.gap; await w(120); o.bump = C.gap > g0;
    C.th.lane = C.me.lane; C.th.y = C.me.y; C.th.swap = 99; C.obs.length = 0; C.gap = 31; await w(200); o.catch = /抓到浣熊小偷/.test(document.querySelector('.game-card').textContent); close();
    openHighwayChase(); C = openHighwayChase.test; C.th.lane = (C.me.lane + 1) % 3; C.th.swap = 99; C.end(); await w(150); o.escape = /溜走/.test(document.querySelector('.game-card').textContent); close();
    // 開飛機機長
    openPlaneGame(1); const T = openPlaneGame.test; await w(100); T.things.push({ k: 'ring', x: T.rv.x + 2, y: T.rv.y }); await w(120); o.rival = T.rv.got >= 1; close();
    // 雪橇星星
    openSleigh(1); const S = openSleigh.test; const l0 = S.limit; S.stars.push({ x: 150, y: 40, got: false }); o.star = S.takeStar(S.stars[S.stars.length - 1]) && S.limit === l0 + 5 && S.starGot === 1; close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
