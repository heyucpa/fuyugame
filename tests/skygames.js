// ☁️ 爸爸媽媽家：雲朵背景、新家具、幫媽媽找東西、放風箏、雲朵彈跳床、天空花園家具可以玩
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
    o.furn = ['cloud_tramp', 'rainbow_arch', 'hot_air_balloon', 'kite_post'].every(id => FURN_BY_ID[id] && !FURN_BY_ID[id].price);
    travelArrive('sky', 0); await wait(400); hostTick(.016, performance.now());
    o.inSky = G.away && G.away.place === 'sky' && curRoom().items.length >= 15;
    // 雲朵背景：左上角是藍天
    draw(); const c = $('#view'), px = c.getContext('2d').getImageData(4, 4, 1, 1).data; o.skyBg = px[2] > 200 && px[2] > px[0];
    // 找東西
    G.bells = 0; const m = hostMenuEntries().find(e => /找東西/.test(e[0])); o.menu = !!m; m[1]();
    const F = startFindGame.test; o.banner = /幫媽媽找/.test(($('#findBanner') || {}).textContent || '');
    const items = curRoom().items; const tgt0 = items.find(x => x.uid === F.list[0].uid), wrong = items.find(x => x.uid !== tgt0.uid && !F.list.some(l => l.uid === x.uid) && FURN_BY_ID[x.id].layer !== 'floor');
    findTap(wrong); o.hint = /好冷|溫溫|好熱/.test($('#findBanner').textContent);
    for (let i = 0; i < 3; i++) findTap(items.find(x => x.uid === F.list[F.i].uid));
    o.found = findGame === null && !$('#findBanner') && G.bells >= 150;
    document.querySelectorAll('#showcase').forEach(x => x.remove()); if (typeof SC_QUEUE !== 'undefined') SC_QUEUE.length = 0;
    // 爸爸：放風箏、彈跳床
    goPlaceRoom(1); await wait(200); hostTick(.016, performance.now());
    hostMenuEntries().find(e => /風箏/.test(e[0]))[1](); await wait(300); const K = openKiteGame.test;
    K.hold(true); await wait(500); const y1 = K.st().y; K.hold(false); await wait(600); o.kiteMove = K.st().y > y1;
    K.wind(60); K.hold(true); await wait(1800); o.kiteTopInWind = K.st().y <= 45; K.hold(false); K.wind(0); await wait(300);   // 風往下吹也拉得到最上面
    K.addStar(); await wait(100); o.kiteStar = K.st().score >= 1; K.fast(); await wait(200); o.kiteEnd = K.st().ended && /風箏飛了/.test(document.querySelector('.game-status').textContent);
    closeGameWindow(); $('#modal').hidden = true;
    hostMenuEntries().find(e => /彈跳床/.test(e[0]))[1](); await wait(200); const B = openBounceGame.test;
    let guard = 0; while (!B.st().ended && guard++ < 2500) { const s = B.st(); if (s.vh < 0 && s.h < 40) B.press(); await wait(16); }
    o.bst = JSON.stringify(B.st()); o.bounce = B.st().ended && B.st().best > 300 && /公尺/.test(document.querySelector('.game-status').textContent);
    closeGameWindow(); $('#modal').hidden = true;
    o.acts = FURNITURE_ACT.cloud_tramp === 'skybounce' && typeof ACTIVITIES.skybounce.open === 'function' && ACTIVITIES.skyballoon.lines.length >= 3;
    // 離開爸媽家：背景回到四季
    goHome(); await wait(1200); o.leave = !findGame;
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
