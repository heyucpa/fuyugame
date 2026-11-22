// 🖐️ 第一人稱 B：消防局（地點、主人、選單）、滅火三關（噴水熄火、時間到、三關送消防車）、救援（太短再伸、太長縮回、剛好救下、三隻完成）、泳池水槍大戰（噴中得分、沒噴被噴）、存檔檢查
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
    o.place = !!PLACES.firestation && PLACES.firestation.host === 'fireman' && ISL_BLD.some(b => b.id === 'firestation') && !!HOSTS.fireman;
    o.awayGames = AWAY_GAMES.some(g => g[2] === 'firestation' && /滅火/.test(g[1])) && AWAY_GAMES.some(g => g[2] === 'pool' && /水槍大戰/.test(g[1])) && !AWAY_GAMES.some(g => g[2] === 'pool' && /打水比賽/.test(g[1]));
    o.firetruckVeh = !!VEHICLE_BY_ID.firetruck && VEHICLE_BY_ID.firetruck.price === 0;
    // 滅火
    G.fire = {}; G.vehicles = (G.vehicles || []).filter(v => v !== 'firetruck');
    openFireFight(1); await w(100); let F = openFireFight.test; const f0 = F.fires[0];
    F.setAim(f0.x, f0.y - 10); F.press(true); await w(1300); F.press(false); o.sprayPutsOut = f0.hp <= 0;
    F.win(); await w(200); o.lv1 = F.done && fireState().lv === 1; close();
    openFireFight(2); await w(100); F = openFireFight.test; F.lose(); await w(200); o.loseOk = F.done && fireState().lv === 1; close();
    openFireFight(2); await w(100); openFireFight.test.win(); await w(200); close();
    openFireFight(3); await w(100); openFireFight.test.win(); await w(300); o.truckGiven = fireState().lv === 3 && G.vehicles.includes('firetruck'); close(); document.querySelectorAll('#showcase').forEach(x => x.remove());
    // 救援
    openFireRescue(); await w(100); const R = openFireRescue.test;
    R.setLen(R.target - 40); R.judge(); o.tooShortKeeps = R.state === 'aim';
    R.setLen(R.target + 40); R.judge(); o.tooLongBack = R.state === 'back'; await w(1500);
    for (let k = 0; k < 3; k++) { R.setLen(R.target); R.judge(); R.skipClimb(); await w(150); }
    await w(200); o.rescued = fireState().res === 3 && /三隻小動物都救下來/.test(document.querySelector('.game-card').textContent); close();
    // 水槍大戰
    openWaterFight(); await w(1600); const Wf = openWaterFight.test;
    const u = Wf.ups.find(q => !q.out && !q.hit);
    if (u) { u.k = 1; Wf.setAim(Wf.SPOTS[u.s][0], Wf.SPOTS[u.s][1] - 34); const m0 = Wf.me; Wf.shoot(); o.hitScores = Wf.me === m0 + 1; } else o.hitScores = false;
    { const t0 = Wf.them; const busy = Wf.ups.map(q => q.s); const sp = [0, 1, 2, 3, 4].find(k => !busy.includes(k)); Wf.ups.push({ s: sp, n: NEIGHBORS.filter(Boolean)[0], age: 99, k: 1, life: 1.5, hit: 0, out: false, gone: false }); await w(150); o.theyScore = Wf.them === t0 + 1; }
    Wf.end(); await w(200); o.fightEnds = Wf.done; close();
    o.oldSwimKept = typeof openSwimRace === 'function';
    // 存檔
    const n1 = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { fire: { lv: 9, res: -1, junk: 1 } })); o.saveClean = JSON.stringify(n1.fire) === '{}';
    const n2 = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { fire: { lv: 2, res: 5 } })); o.saveKeep = n2.fire.lv === 2 && n2.fire.res === 5;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
