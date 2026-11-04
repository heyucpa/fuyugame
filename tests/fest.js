// 🎃 夜晚訪客一整年＋萬聖節每年 10/15～10/31＋🎄 聖誕節 12/1～12/31。用 SEASON_TODAY、ISL_HOUR_TEST 假日期。
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const shotDir = '/opt/cursor/artifacts/screenshots';
  fs.mkdirSync(shotDir, { recursive: true });
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'));
  await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const o = {};
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true;
    const bad = s => [...String(s)].some(ch => { const cp = ch.codePointAt(0); return cp >= 0x1FA70 && cp <= 0x1FAFF; });
    const hw = SEASONS.find(s => s.id === 'halloween'), xm = SEASONS.find(s => s.id === 'christmas');
    o.dates = hw.from[0] === 10 && hw.from[1] === 15 && hw.to[0] === 10 && hw.to[1] === 31
      && xm.from[0] === 12 && xm.from[1] === 1 && xm.to[0] === 12 && xm.to[1] === 31;
    o.yearly = !/getFullYear|2026|2025|2027/.test(seasonNow.toString());
    const on = md => { SEASON_TODAY = md; return seasonNow() && seasonNow().id; };
    o.span = on([10, 14]) !== 'halloween' && on([10, 15]) === 'halloween' && on([10, 31]) === 'halloween' && on([11, 1]) !== 'halloween'
      && on([11, 30]) !== 'christmas' && on([12, 1]) === 'christmas' && on([12, 31]) === 'christmas' && on([1, 1]) !== 'christmas'
      && on([6, 1]) == null;
    o.emoji = ![...Object.values(FEST_NIGHT_LINES), ...Object.values(FEST_PAL_LINES), ...xm.costumes, xm.name, '聖誕餅乾'].some(bad);
    // 舊存檔：沒有新欄位，已經拿到的萬聖節衣服、家具、糖果都還在
    const g = JSON.parse(JSON.stringify(G));
    delete g.nightTreat; delete g.xmasGift;
    g.wardrobe = (g.wardrobe || []).concat(['pumpkin_clip', 'witch_hat', 'devil_horns', 'ghost_hat', 'vampire_cape', 'ghost_dress']);
    g.outfit = Object.assign({}, g.outfit, { head: 'pumpkin_clip', top: 'vampire_cape' });
    g.inv = Object.assign({}, g.inv, { pumpkin_lamp: (g.inv.pumpkin_lamp || 0) + 1, ghost_plush: 1 });
    g.rooms[0].items.push({ uid: 88001, id: 'pumpkin_lamp', x: 1, y: 1, rot: 0 });
    g.kidFood = Object.assign({}, g.kidFood, { hw_candy: 5 });
    g.hwEarned = 15; g.hwPrize = ['ghost_hat'];
    g.seasonDex = Object.assign({}, g.seasonDex, { pumpkin_lamp: true });
    const n = normalizeSave(g);
    o.keep = !!n && n.wardrobe.includes('pumpkin_clip') && n.wardrobe.includes('ghost_hat') && n.wardrobe.includes('ghost_dress')
      && n.outfit.clip === 'pumpkin_clip' && n.outfit.head === 'head_none' && n.outfit.top === 'vampire_cape'
      && n.inv.pumpkin_lamp >= 1 && n.rooms[0].items.some(it => it.id === 'pumpkin_lamp')
      && n.kidFood.hw_candy === 5 && n.hwEarned === 15 && n.hwPrize.includes('ghost_hat')
      && n.seasonDex.pumpkin_lamp === true && n.nightTreat == null && n.xmasGift == null;
    const badG = JSON.parse(JSON.stringify(G));
    badG.nightTreat = { d: 3, n: -2 }; badG.xmasGift = 'no';
    const nb = normalizeSave(badG);
    o.badFixed = !!nb && nb.nightTreat == null && nb.xmasGift == null && nb.rooms && nb.rooms.length === G.rooms.length;
    // 六月還穿得了、擺得了；商店不賣節日限定
    SEASON_TODAY = [6, 1];
    let drew = true;
    try { renderGirl(Object.assign({}, DEFAULT_OUTFIT, { head: 'pumpkin_clip', top: 'vampire_cape' }), 80, 100); thumb(FURN_BY_ID.pumpkin_lamp); } catch (e) { drew = false; }
    o.juneWear = drew && !!FURN_BY_ID.pumpkin_lamp && ownsClothes('pumpkin_clip') === false;
    G.wardrobe.push('pumpkin_clip');
    o.juneOwn = ownsClothes('pumpkin_clip') && !halloweenActive();
    openTab('shop'); await wait(80);
    const juneShop = $('#tabBody').textContent;
    o.juneShop = !document.querySelector('#tabBody .season-box') && !/萬聖節糖果|聖誕餅乾|聖誕樹/.test(juneShop);
    // 十二月商店
    SEASON_TODAY = [12, 20]; openTab('shop'); await wait(80);
    const xb = document.querySelector('#tabBody .season-box');
    const xCards = xb ? [...xb.querySelectorAll('.card .nm')].map(el => el.textContent) : [];
    const xFurn = SEASON_FURNITURE.filter(d => d.season === 'christmas').length;
    o.xmasShop = !!xb && /聖誕節限定/.test(xb.textContent) && xCards.includes('聖誕樹') && xCards.includes('聖誕毛衣') && xCards.includes('聖誕餅乾')
      && xb.querySelectorAll('.card').length === xFurn + seasonNow().clothes.length + 1;
    try { renderGirl(Object.assign({}, DEFAULT_OUTFIT, { head: 'snow_beanie', top: 'xmas_sweater' }), 80, 100); thumb(FURN_BY_ID.xmas_tree); thumb(FURN_BY_ID.snow_buddy); thumb(FURN_BY_ID.gift_pile); o.xmasDraw = true; } catch (e) { o.xmasDraw = false; }
    o.xmasNotDex = SEASON_FURNITURE.filter(d => d.season === 'christmas').every(d => FURNITURE.indexOf(d) < 0);
    // 小島：夜晚才自動出現；點了有糖或錢；每天 3 次；不會變少
    $('#modal').hidden = true; SEASON_TODAY = [6, 15]; ISL_HOUR_TEST = 10; G.funDay = { d: today(), n: 1 };
    const bells0 = G.bells, candy0 = G.kidFood.hw_candy || 0, earned0 = G.hwEarned || 0, inv0 = JSON.stringify(G.inv);
    openIsland(); await wait(60);
    isl.festNextNight = 0; festStep(0.05);
    o.morningQuiet = !isl.festNight;
    ISL_HOUR_TEST = 21; isl.festNextNight = 0; festStep(0.05);
    o.nightOut = !!(isl.festNight && FEST_NIGHT_LINES[isl.festNight.kind]);
    const kinds = ['ghost', 'pumpkin', 'bat', 'candy'];
    o.drewNight = true;
    kinds.forEach(k => { festSpawnNight(k); try { islDraw(performance.now()); } catch (e) { o.drewNight = false; } });
    G.nightTreat = null; G.kidFood.hw_candy = candy0; G.hwEarned = earned0; G.bells = bells0;
    festSpawnNight('ghost');
    const r1 = festNightClick(isl.festNight);
    const r2 = festNightClick(isl.festNight);
    const r3 = festNightClick(isl.festNight);
    const bells3 = G.bells, candy3 = G.kidFood.hw_candy || 0, earned3 = G.hwEarned || 0;
    const r4 = festNightClick(isl.festNight);
    o.reward = r1 === 'candy' && r2 === 'bells' && r3 === 'candy' && r4 === 'capped'
      && (G.kidFood.hw_candy || 0) === candy0 + 2 && G.hwEarned === earned0 + 2 && G.bells === bells0 + 30
      && G.bells === bells3 && (G.kidFood.hw_candy || 0) === candy3 && G.hwEarned === earned3
      && JSON.stringify(G.inv) === inv0 && G.funDay.n === 1;
    $('#itemMenu').hidden = false; festStep(0.05); o.menuHides = !isl.festNight;
    $('#itemMenu').hidden = true;
    isl.act = { kind: 'fish' }; isl.festNextNight = 0; festStep(0.05); o.fishHides = !isl.festNight;
    isl.act = null; $('#modal').hidden = false; isl.festNextNight = 0; festStep(0.05); o.gameHides = !isl.festNight;
    $('#modal').hidden = true;
    // 聖誕：樹在陸地上、下雪畫得出來、禮物每天 2 次、不會扣東西
    SEASON_TODAY = [12, 24]; ISL_HOUR_TEST = 14; closeIsland(); openIsland(); await wait(40);
    const tree = festTreeTile(isl.m);
    o.treeLand = !!(tree && isl.m.land[tree[1]][tree[0]] && islPass(isl.m, tree[0], tree[1]));
    isl.festTree = tree; isl.x = tree[0] + .5; isl.y = tree[1] + 2.2; isl.cam.x = tree[0] + .5; isl.cam.y = tree[1] + .4; isl.skipDoor = 'x';
    festSpawnPal('santa'); isl.festPal.x = tree[0] + 1.8; isl.festPal.y = tree[1] + 1.1; isl.festPal.vx = 0;
    try { islDraw(performance.now()); o.xmasIsland = true; } catch (e) { o.xmasIsland = false; }
    const bX = G.bells, cook0 = G.kidFood.xmas_cookie || 0, invX = JSON.stringify(G.inv);
    G.xmasGift = null;
    const t1 = festTap({ fx: tree[0] + .5, fy: tree[1] + .2, x: tree[0], y: tree[1] });
    festSpawnPal('deer'); isl.festPal.x = tree[0] + 1.6; isl.festPal.y = tree[1] + 1;
    const t2 = festTap({ fx: isl.festPal.x, fy: isl.festPal.y, x: 0, y: 0 });
    const bAfter = G.bells, cookAfter = G.kidFood.xmas_cookie || 0;
    const t3 = festTap({ fx: tree[0] + .5, fy: tree[1] + .2, x: tree[0], y: tree[1] });
    o.xmasGift = t1 === true && t2 === true && t3 === true
      && (G.kidFood.xmas_cookie || 0) === cook0 + 1 && G.bells === bX + 40
      && G.bells === bAfter && (G.kidFood.xmas_cookie || 0) === cookAfter
      && JSON.stringify(G.inv) === invX && (G.xmasGift && G.xmasGift.n) === 2;
    o.line = /聖誕/.test(festVisitLine(seasonNow())) && festVisitLine({ id: 'halloween' }) === '';
    // 六月的島上沒有聖誕樹那一筆（畫完再看有沒有丟錯）
    SEASON_TODAY = [6, 1]; try { islDraw(performance.now()); o.noTree = !festXmasOn(); } catch (e) { o.noTree = false; }
    closeIsland();
    SEASON_TODAY = null; ISL_HOUR_TEST = null;
    return o;
  });
  console.log(JSON.stringify(out, null, 2));
  await p.close();
  // 截圖用新的一頁，避免前一輪語音和畫面迴圈把截圖卡住。
  const shot = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  shot.on('pageerror', e => errs.push(e.stack || e.message));
  await shot.goto('file://' + path.resolve(__dirname, '../house.html'));
  await shot.waitForTimeout(800);
  try { await shot.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const clip = { x: 280, y: 40, width: 800, height: 740 };
  await shot.evaluate(() => {
    G.guide = 'done'; $('#modal').hidden = true;
    SEASON_TODAY = [6, 15]; ISL_HOUR_TEST = 21;
    openIsland();
    isl.x = 26.5; isl.y = 19.5; isl.cam.x = 26.5; isl.cam.y = 19.5; isl.skipDoor = 'x';
    festSpawnNight('ghost');
    isl.festNight.x = 28.6; isl.festNight.y = 18.2; isl.festNight.vx = .15; isl.festNight.t = 1;
    islDraw(performance.now());
    window.requestAnimationFrame = () => 0;
  });
  await shot.screenshot({ path: shotDir + '/fest-night.png', clip, animations: 'disabled', timeout: 15000 });
  await shot.goto('file://' + path.resolve(__dirname, '../house.html'));
  await shot.waitForTimeout(600);
  try { await shot.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  await shot.evaluate(() => {
    G.guide = 'done'; $('#modal').hidden = true;
    SEASON_TODAY = [12, 24]; ISL_HOUR_TEST = 15;
    openIsland();
    const tree = festTreeTile(isl.m);
    isl.festTree = tree;
    isl.x = tree[0] + .5; isl.y = tree[1] + 2.4; isl.cam.x = tree[0] + .6; isl.cam.y = tree[1] + .6; isl.skipDoor = 'x';
    festSpawnPal('santa');
    isl.festPal.x = tree[0] + 1.9; isl.festPal.y = tree[1] + 1.3; isl.festPal.vx = 0; isl.festPal.t = 1;
    islDraw(performance.now());
    window.requestAnimationFrame = () => 0;
  });
  await shot.screenshot({ path: shotDir + '/fest-christmas.png', clip, animations: 'disabled', timeout: 15000 });
  await shot.goto('file://' + path.resolve(__dirname, '../house.html'));
  await shot.waitForTimeout(600);
  try { await shot.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  await shot.evaluate(() => { G.guide = 'done'; SEASON_TODAY = [12, 20]; $('#modal').hidden = true; openTab('shop'); });
  await shot.screenshot({ path: shotDir + '/fest-shop.png', animations: 'disabled', timeout: 15000 });
  const ok = out && Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
  if (!ok) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });

