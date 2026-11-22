// 寵物運動會：沒寵物（蛋）不能玩、照顧星星影響速度、障礙前按對動作順過／按錯不算／沒按停一下、點畫面＝做對的動作、名次與獎盃、存檔欄位檢查
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
    const P = G.pet; const keep = { stage: P.stage, hunger: P.hunger, clean: P.clean, mood: P.mood };
    P.stage = 'egg'; openPetSports(); o.eggBlocked = !document.querySelector('.game-card') || !/寵物運動會/.test((document.querySelector('.game-card') || {}).textContent || ''); P.stage = keep.stage === 'egg' ? 'kid' : keep.stage;
    P.hunger = P.clean = P.mood = 100; openPetSports(); const hi = openPetSports.test.mult, s3 = openPetSports.test.stars; close();
    P.hunger = P.clean = P.mood = 20; openPetSports(); const lo = openPetSports.test.mult, s1 = openPetSports.test.stars; close();
    o.careSpeed = hi > lo && s3 === 3 && s1 === 1; P.hunger = P.clean = P.mood = 100;
    openPetSports(); let S = openPetSports.test; S.setT(.1);
    const o0 = S.obs[0], need = { hurdle: 'jump', tunnel: 'crawl', beam: 'balance' }[o0.k], wrongA = need === 'jump' ? 'crawl' : 'jump';
    S.me.x = o0.x - 50; S.doAct(wrongA); o.wrongNotCount = !S.me.ok[0]; S.doAct(need); o.rightCounts = S.me.ok[0] === 'good';
    const o1 = S.obs[1]; S.me.x = o1.x - 200; S.doAct({ hurdle: 'jump', tunnel: 'crawl', beam: 'balance' }[o1.k]); o.tooEarly = !S.me.ok[1];
    S.me.x = o1.x - 30; S.tapAct(); o.tapDoesRight = S.me.ok[1] === 'good';
    const o2 = S.obs[2]; S.me.x = o2.x - 6; await w(250); o.stumble = S.stumbles === 1 && S.me.ok[2] === 'slow';
    S.rivals.forEach(r => { r.x = 0; r.base = 1; }); S.me.stun = 0; S.me.x = 1890; S.obs.forEach((_, i) => { S.me.ok[i] = 'good'; }); G.petSports = {}; const inv0 = (G.inv.pet_trophy || 0);
    await w(400); o.gold = S.done && /🥇/.test(document.querySelector('.game-card').textContent) && G.petSports.gold === 1 && (G.inv.pet_trophy || 0) === inv0 + 1; close();
    openPetSports(); S = openPetSports.test; S.setT(.1); S.rivals.forEach(r => { r.x = 1899; r.done = false; }); S.me.x = 1600; S.obs.forEach((_, i) => { S.me.ok[i] = 'good'; }); S.me.base = 2000; await w(500); o.third = S.done && /🥉/.test(document.querySelector('.game-card').textContent) && G.petSports.gold === 1; close();
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { petSports: { races: -3, gold: 'x', junk: 5 } })); o.saveClean = JSON.stringify(n.petSports) === '{}';
    const n2 = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { petSports: [1] })); o.saveBadType = n2.petSports === undefined;
    o.inMenu = allQuickGames().some(g => g.name === '寵物運動會');
    Object.assign(P, keep);
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
