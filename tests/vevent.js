// 🎬 朋友來玩的事件：昏倒（過場→點朋友拿水→毯子→打電話→救護車過場→照顧小遊戲→結局）、被偷（過場→腳印→追→結局）、不見了（過場→好冷好熱→找到→結局）；提示、愛的小手、空白鍵；取消；一天上限；訪客簿；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), bar = () => document.getElementById('vevBar'), act = () => bar() && bar().querySelector('.vev-act');
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.away = null; G.vev = {}; G.friends = G.friends || {};
    try {
    const arrive = () => { vis.who = null; vis.state = 'none'; visitorArrive(performance.now()); vis.alpha = 1; vis.a.path = []; };
    // ── 😵 昏倒 ──
    arrive(); const n1 = vis.who, b0 = G.bells; vevStart('faint');
    o.scene = !!document.getElementById('vevScene') && vev.lie === true && /頭好暈/.test(document.querySelector('.vev-cap').textContent);
    vevScene.test.go(); o.scene2 = /昏倒/.test(document.querySelector('.vev-cap').textContent);
    vevScene.test.close(); await w(50); o.water = vev.step === 'water' && /拿水/.test(bar().textContent);
    vev.act = performance.now() - 13000; vevTick(performance.now()); o.hand = vev.hand === true && !!vevTarget();
    const pv = iso(vis.a.x, vis.a.y, 0); o.tapFriend = vevTap({ x: pv.x, y: pv.y - 20 }) && vev.step === 'blanket' && vev.hand === false;
    act().click(); o.blanket = vev.blanket && vev.step === 'call';
    vev.act = performance.now() - 13000; vevTick(performance.now()); o.btnHand = act().classList.contains('vev-point');
    act().click(); await w(50); o.amb = vev.step === 'scene' && /救護車/.test(document.querySelector('.vev-cap').textContent);
    vevScene.test.close(); await w(100); o.care = vev.step === 'game' && /照顧/.test(document.querySelector('.game-card').textContent) && vev.lie === false;
    vevCare.test.press(2); o.careOrder = /先量體溫/.test(document.querySelector('.game-card').textContent);
    [0, 1, 2, 3].forEach(i => vevCare.test.press(i)); await w(1900); o.faintEnd = !!document.getElementById('vevScene') && /救了我/.test(document.querySelector('.vev-cap').textContent);
    vevScene.test.close(); await w(50); o.faintDone = !vev && G.bells === b0 + 150 && G.vev.done === 1 && vis.did.vev === 'faint' && !bar();
    // ── 🦝 被偷 ──
    arrive(); vevStart('stolen'); vevScene.test.close(); await w(50);
    o.prints = vev.step === 'prints' && vev.prints.length >= 1 && /腳印/.test(bar().textContent) && vevDrawEntries().length === vev.prints.length;
    const p0 = vev.prints[0], sp = iso(p0.x, p0.y, 0); o.tapPrint = vevTap({ x: sp.x, y: sp.y }) && p0.got;
    vev.prints.slice(1).forEach(q => { fufu.x = q.x; fufu.y = q.y; vevTick(performance.now()); }); o.walkPrints = vev.step === 'chase';
    vevKeyUse(); await w(100); o.chase = vev.step === 'game' && /追小偷鼠/.test(document.querySelector('.game-card').textContent);
    vevChase.test.end(); await w(1600); o.stolenEnd = /小偷鼠/.test(document.querySelector('.vev-cap').textContent); vevScene.test.close(); vevScene.test.close(); await w(50);
    o.stolenDone = !vev && G.vev.done === 2;
    // ── 🔍 不見了 ──
    { const rm = curRoom(); [[1, 1], [6, 2], [2, 6], [7, 7]].forEach(([x, y], i) => { const f = nearestFree(rm, x + .5, y + .5); if (f) rm.items.push({ uid: 'vt' + i, id: 'plant_l', x: f[0], y: f[1], rot: 0 }); }); }
    arrive(); const room = curRoom(); o.enoughItems = vevHideSpots(room).length >= 3;
    vevStart('lost'); vevScene.test.close(); await w(50); const hide = room.items.find(x => x.uid === vev.hide);
    const wrong = vevHideSpots(room).find(x => x.uid !== vev.hide); vevFindTap(wrong); o.hotCold = /好冷|溫溫|好熱/.test(vev.last) && /鑰匙/.test(bar().textContent);
    bar().querySelector('.vev-hint').click(); o.region = vev.region === true && /房間的/.test(vis.say || '');
    bar().querySelector('.vev-hint').click(); o.findHand = vev.hand === true;
    const def = FURN_BY_ID[hide.id], fp = footprint(def, hide.rot || 0); fufu.x = hide.x + fp.w + .3; fufu.y = hide.y + fp.d / 2; vevKeyUse(); await w(50);
    o.found = /找到了/.test(document.querySelector('.vev-cap').textContent); vevScene.test.close(); vevScene.test.close(); await w(50); o.lostDone = !vev && G.vev.done === 3;
    // ── 其他 ──
    G.vev.n = 3; vis.vevAt = 0; vevMaybe(performance.now()); o.dayCap = !vis.vevAt;
    G.vev.n = 0; arrive(); vevStart('lost'); vevScene.test.close(); vis.who = null; vevTick(performance.now()); o.cancel = !vev && !bar();
    const n2 = NEIGHBORS[0]; animalGuestbook(n2, { vev: 'stolen' }); const last = G.animalBook[G.animalBook.length - 1] || G.animalBook[0]; o.book = G.animalBook.some(e => e.id === n2.id && /書包|小英雄/.test(JSON.stringify(e)));
    const nn = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { vev: { d: '2026-11-21', n: 2, last: 'faint', done: 5, junk: 1 } }));
    o.save = JSON.stringify(nn.vev) === JSON.stringify({ d: '2026-11-21', n: 2, last: 'faint', done: 5 }) && normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { vev: { last: 'boom', n: -1 } })).vev.last === undefined;
    } catch (e) { o.err = String(e.stack).slice(0, 400); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
