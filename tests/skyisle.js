// ☁️ 天空島：停機坪、坐直升機上去（爸爸媽媽家＝媽媽、天空花園＝爸爸）、下來降落在停機坪、爸媽選單、每天一次、修東西和摺襪子小遊戲、幫爸媽家換外觀、存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); G.guide = 'done'; $('#modal').hidden = true;
    const clear = () => { document.querySelectorAll('#showcase').forEach(x => x.remove()); if (typeof SC_QUEUE !== 'undefined') SC_QUEUE.length = 0; };
    islMapCache = null; const m = islMap(0); const hp = m.blds.find(b => b.id === 'helipad'); o.helipad = !!hp && m.land[hp.door[1]][hp.door[0]];
    // 走到停機坪 → 直升機 → 天空島
    openIsland(); await wait(200); islEnter('helipad'); await wait(300); o.heliUp = /直升機/.test($('#modalCard').textContent) && !$('#modal').hidden;
    heliTrip.test.finish(); await wait(400); o.sky = G.away && G.away.place === 'sky' && G.away.idx === 0;
    hostTick(.016, performance.now()); o.mom = host.n && host.n.id === 'mom';
    const labels = hostMenuEntries().map(e => e[0]).join('|'); o.momMenu = /一起吃飯/.test(labels) && /床邊故事/.test(labels) && /零用錢/.test(labels) && /全家福/.test(labels) && /換外觀/.test(labels);
    G.kid.hunger = 20; hostMenuEntries().find(e => /吃飯/.test(e[0]))[1](); o.meal = G.kid.hunger === 100 && G.par.meal === today();
    G.kid.hunger = 20; hostMenuEntries().find(e => /吃飯/.test(e[0]))[1](); o.mealOnce = G.kid.hunger === 20;
    goPlaceRoom(1); await wait(200); hostTick(.016, performance.now()); o.dad = host.n && host.n.id === 'dad';
    const l2 = hostMenuEntries().map(e => e[0]).join('|'); o.dadMenu = /舉高高/.test(l2) && /修東西/.test(l2) && /摺襪子/.test(l2) && /風箏/.test(l2) && /彈跳床/.test(l2);
    // 修東西：點對的工具
    openFixGame(); const F = openFixGame.test; F.pick('🧨'); let guard = 0; while (!F.done() && guard++ < 30) F.pick(F.need()); o.fix = F.done() && /全部修好/.test(document.querySelector('.game-status').textContent); closeGameWindow(); $('#modal').hidden = true;
    // 摺襪子
    openChoreGame(); const C = openChoreGame.test; const left = () => C.cards.filter(c => !c.done); guard = 0; while (left().length && guard++ < 30) { const a = left()[0], b2 = left().find(c => c !== a && c.s === a.s); C.tap(a); C.tap(b2); } o.chore = /摺好/.test(document.querySelector('.game-status').textContent); closeGameWindow(); $('#modal').hidden = true;
    // 幫爸媽家換外觀
    G.bells = 50000; openHomeLook('par'); homeTab = 'roof'; openHomeLook.test.render(); [...document.querySelectorAll('.home-grid .card')].find(x => x.textContent.includes('綠屋頂')).click();
    o.parLook = homeParState().roof === 'green' && homeState().roof === 'red' && homeOwns('roof', 'green') && !/門牌/.test(document.querySelector('.home-tabs').textContent); closeGameWindow(); $('#modal').hidden = true; clear();
    // 下來：直升機降落在停機坪
    openIsland(); await wait(300); o.heliDown = /回地面/.test($('#modalCard').textContent); heliTrip.test.finish(); await wait(400);
    o.landed = !!isl && Math.abs(isl.x - (hp.door[0] + .5)) < 1.5 && Math.abs(isl.y - (hp.door[1] + .5)) < 1.5; closeIsland();
    // 快速出門也有天空島
    o.quick = PLACES.sky && /直升機/.test(PLACES.sky.desc);
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.par.meal === today() && raw.home.par.roof === 'green';
    const bad = normalizeSave(Object.assign({}, raw, { par: { meal: 5, foo: 'x', kite: today() }, home: Object.assign({}, raw.home, { par: { roof: 'ufo', wall: 'pink', zzz: 1 } }) }));
    o.bad = bad.par.meal == null && bad.par.foo == null && bad.par.kite === today() && bad.home.par.roof == null && bad.home.par.wall === 'pink' && bad.home.par.zzz == null;
    if (typeof goHome === 'function') goHome();
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
