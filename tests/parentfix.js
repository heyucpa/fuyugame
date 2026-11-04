// 家長回報：1-1 自己往前衝、長大果看不出變大、島主只會講同一句、游泳池再大、小島趣味事件
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 }, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'));
  await p.waitForTimeout(900);
  try { await p.getByText('跳過').click({ timeout: 1200 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const o = {}, QT = 18, bad = cp => cp >= 0x1FA70 && cp <= 0x1FAFF;
    const noBan = s => ![...String(s)].some(ch => bad(ch.codePointAt(0)));
    G.guide = 'done'; $('#modal').hidden = true;
    const start = (id, mode) => { questState().mode = mode || 'easy'; playQuest(id || '1-1'); const T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null; return T; };
    const run = (T, n, dt) => { for (let i = 0; i < n; i++) T.step(dt || 1 / 60); };
    // 沒按鍵不會自己加速，也不會跑出關卡
    let T = start('1-1', 'easy');
    T.keys.ArrowRight = false; T.keys.ArrowLeft = false; T.keys.TouchR = false; T.keys.TouchL = false;
    T.P.vx = 0; T.P.vy = 0; T.P.x = 4 * QT; T.P.y = 13 * QT - T.P.h;
    const idle0 = T.P.x; run(T, 180); o.idle = Math.abs(T.P.x - idle0) < 1.5 && Math.abs(T.P.vx) < 1;
    T.P.x = -80; run(T, 2); o.xMin = T.P.x >= -0.01;
    T.P.x = T.L.W * QT + 500; run(T, 2); o.xMax = T.P.x <= T.L.W * QT - T.P.w + 0.2;
    // 陷進地板還往左：不可以被彈去右邊
    T.P.x = 6 * QT; T.P.y = 13 * QT - T.P.h + 2; T.P.vx = -120; T.P.vy = 0; T.P.on = true;
    const sink0 = T.P.x; run(T, 10); o.noLaunch = T.P.x <= sink0 + 0.8;
    // 放開之後要停下來
    T = start('1-1', 'normal');
    T.P.x = 4 * QT; T.P.y = 13 * QT - T.P.h; T.P.vx = 0; T.P.vy = 0;
    T.keys.ArrowRight = true; run(T, 40); const moving = T.P.vx > 40;
    T.keys.ArrowRight = false; const rel = T.P.x; run(T, 50);
    o.release = moving && T.P.vx < 8 && T.P.x - rel < 40;
    // 切換視窗：方向鍵清掉
    T.keys.ArrowRight = true; T.keys.TouchR = true; T.releaseInput();
    o.blur = !T.keys.ArrowRight && !T.keys.TouchR;
    // 長大果：人變高，被打變回來；頭頂仍頂得破磚
    T = start('1-1', 'normal');
    const h0 = T.P.h, y0 = T.P.y + T.P.h;
    T.givePower('grow');
    o.bigBody = T.P.big && T.P.h >= 46 && T.P.h > h0 + 12 && Math.abs((T.P.y + T.P.h) - y0) < 1 && T.kidScale() >= 1;
    const br = (() => { for (let y = 0; y < T.L.g.length; y++) { const x = T.L.g[y].indexOf('B'); if (x >= 0 && y <= 10) return [x, y]; } return null; })();
    T.P.x = br[0] * QT + 2; T.P.y = (br[1] + 1) * QT + 2; T.P.vy = -300; T.P.vx = 0; run(T, 8);
    o.headBonk = T.L.g[br[1]][br[0]] === ' ';
    const hBig = T.P.h; T.P.big = true; T.P.fire = false; T.P.starT = 0; T.P.inv = 0;
    const en = T.ents.find(e => e.alive && e.k === 'slime');
    T.P.x = en.x - 2; T.P.y = en.y - 8; T.P.vy = 40; const hearts = T.P.hearts; run(T, 4);
    o.shrink = !T.P.big && T.P.h < hBig && T.P.hearts === hearts && T.kidScale() < .7;
    // 台詞：很多句、接連不重複、沒有「島主來了」、沒有 Win10 顯示不出的表情
    const said = [];
    for (let i = 0; i < 10; i++) said.push(isleOwnerLine('flower'));
    o.lines = said.length === 10 && new Set(said).size >= 8 && said.every((s, i) => i === 0 || s !== said[i - 1]);
    o.notOnly = said.every(s => s !== '島主來了！' && s.length >= 4);
    const pools = ['flower', 'candy', 'dino'].map(id => isleOwnerPool(id).join('\n')).join('\n') + chatLinesSafe();
    o.emoji = noBan(pools);
    function chatLinesSafe() {
      try { return islGreet() + islGreet() + islGreet(); } catch (e) { return ''; }
    }
    // 游泳池變大，池邊走得到，水道還在水裡
    const def = FURN_BY_ID.swim_pool;
    o.poolBig = def.w >= 8 && def.d >= 6 && def.w * def.d >= 48;
    travelArrive('pool'); $('#modal').hidden = true;
    const sp = curRoom().items.find(i => i.id === 'swim_pool');
    o.water = poolWaterAt(sp.x + def.w / 2, sp.y + def.d / 2) && !poolWaterAt(0.4, 0.4) && !poolWaterAt(9.5, 9.4);
    const room = curRoom();
    o.walk = !!findPath(room, 0, 9, 9, 1);
    o.deck = !blockedGrid(room)[0][9] && !blockedGrid(room)[9][9];
    // 運動島上的池子房子變大，門口走得到
    islMapCache = null; const m = islMap(0), bld = m.blds.find(b => b.id === 'pool'), home = m.blds.find(b => b.id === 'home');
    const pth = islFindPath(m, home.door[0], home.door[1], (x, y) => x === bld.door[0] && y === bld.door[1]);
    const last = pth && pth[pth.length - 1];
    o.islePool = bld.w * bld.h >= 18 && last && last[0] === bld.door[0] && last[1] === bld.door[1];
    // 趣味事件：舊的四種＋打雷、沙塵暴、彩虹、流星雨、冰雹。不移動玩家、不扣東西、點了有錢、共用每天 3 次、壞存檔清掉、選單或小遊戲開著不跳出來
    openIsland(); $('#modal').hidden = true;
    const ix = isl.x, iy = isl.y, bell0 = G.bells;
    const funKinds = isleFunKinds();
    o.kindList = funKinds.join(',') === 'tornado,storm,snow,dino,thunder,sand,rainbow,meteor,hail';
    const talks = funKinds.map(k => (isleFunTalk(k) || []).join('\n')).join('\n');
    o.funEmoji = noBan(talks) && funKinds.every(k => { const t = isleFunTalk(k); return t && t.length === 2 && t[0].length >= 4 && t[1].length >= 4; });
    ['tornado', 'storm', 'snow', 'dino'].forEach(k => { isleFunStart(k); isleFunStep(0.2); });
    o.kinds = isl.fun && isl.fun.kind === 'dino' && isl.x === ix && isl.y === iy;
    isleFunTap();
    o.gift = G.bells > bell0 && G.funDay && G.funDay.n === 1 && isl.x === ix;
    G.funDay.n = 3; isl.fun.got = false; const b1 = G.bells; isleFunTap();
    o.cap = G.bells === b1;
    const raw = JSON.parse(JSON.stringify(G));
    o.oldSave = normalizeSave(Object.assign({}, raw, { funDay: undefined })).rooms.length === G.rooms.length;
    const badDay = normalizeSave(Object.assign({}, raw, { funDay: { d: 3, n: -4 } }));
    o.badFun = badDay && badDay.funDay == null && badDay.bells === raw.bells;
    const bare = JSON.parse(JSON.stringify(G)); delete bare.funDay;
    const oldRead = normalizeSave(bare);
    o.oldReads = !!(oldRead && oldRead.bells === raw.bells && oldRead.rooms.length === raw.rooms.length && oldRead.wardrobe.length === raw.wardrobe.length && oldRead.funDay == null);
    isl.fun = null; isl.nextFun = 0; $('#modal').hidden = false; isleFunStep(2);
    o.noCover = !isl.fun;
    $('#modal').hidden = true;
    const food0 = JSON.stringify(G.food), hunger0 = G.kid.hunger, mood0 = G.kid.mood, ward0 = G.wardrobe.length, keys0 = Object.keys(G).sort().join();
    let stay = true, drew = true, hitOk = true;
    ['thunder', 'sand', 'rainbow', 'meteor', 'hail'].forEach(k => {
      isleFunStart(k); isleFunStep(0.25);
      if (!isl.fun || isl.fun.kind !== k || isl.x !== ix || isl.y !== iy) stay = false;
      if (!isleFunHit({ fx: isl.x, fy: isl.y }) || isleFunHit({ fx: isl.x + 12, fy: isl.y + 12 })) hitOk = false;
      isl.fun.t = k === 'thunder' ? 0.48 : 1.3;
      try { islDraw(performance.now()); } catch (e) { drew = false; }
    });
    o.newStay = stay && hitOk && isl.x === ix && isl.y === iy;
    o.drawNew = drew;
    o.noHarm = JSON.stringify(G.food) === food0 && G.kid.hunger === hunger0 && G.kid.mood === mood0 && G.wardrobe.length === ward0 && Object.keys(G).sort().join() === keys0;
    // 打雷會讓畫面變亮；沙塵暴會偏黃。白天、跟沒有事件的同一張圖比
    ISL_HOUR_TEST = 12;
    const lum = () => { const c = isl.cv, g = c.getContext('2d'), w = c.width, h = c.height; const d = g.getImageData(Math.floor(w * .25), Math.floor(h * .15), Math.floor(w * .5), Math.floor(h * .55)).data; let s = 0, rb = 0, n = 0; for (let i = 0; i < d.length; i += 16) { s += d[i] + d[i + 1] + d[i + 2]; rb += d[i] - d[i + 2]; n++; } return { s: s / Math.max(1, n), rb: rb / Math.max(1, n) }; };
    isl.fun = null; islDraw(performance.now()); const basePx = lum();
    isleFunStart('thunder'); isl.fun.t = 0.48; islDraw(performance.now()); const boltPx = lum();
    isleFunStart('sand'); isl.fun.t = 1.2; islDraw(performance.now()); const sandPx = lum();
    o.flash = boltPx.s > basePx.s + 8;
    o.dust = sandPx.rb > basePx.rb + 12;
    // 次數上限是大家一起算：新事件也不會在送完之後再給錢，還沒滿還是給
    G.funDay.n = 3; isl.fun.got = false; const bCap = G.bells; isleFunTap();
    o.capStill = G.bells === bCap && G.funDay.n === 3;
    G.funDay.n = 2; isl.fun.got = false; const bShare = G.bells; isleFunTap();
    o.share = G.bells > bShare && G.funDay.n === 3 && JSON.stringify(G.food) === food0 && G.kid.hunger === hunger0 && G.wardrobe.length === ward0;
    isleFunStart('hail'); const bx = isl.x, by = isl.y, bh = G.bells; isl.fun.t = isl.fun.dur + 1; isleFunStep(0.1);
    o.ended = !isl.fun && isl.x === bx && isl.y === by && G.bells === bh;
    isl.fun = null; isl.nextFun = 0; isl.act = { kind: 'fish' }; isleFunStep(3);
    o.noFish = !isl.fun;
    isl.act = null; $('#modal').hidden = false; isleFunStep(3);
    o.noMenu = !isl.fun;
    $('#modal').hidden = true; isleFunStart('snow');
    try { islDraw(performance.now()); o.draw = true; } catch (e) { o.draw = false; }
    let drawAll = true;
    funKinds.forEach(k => { isleFunStart(k); isl.fun.t = k === 'thunder' ? 0.48 : 1.1; try { islDraw(performance.now()); } catch (e) { drawAll = false; } });
    o.drawAll = drawAll;
    closeIsland();
    return o;
  });
  console.log(JSON.stringify(o, null, 2));
  const ok = o && Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + (errs.join(' | ') || JSON.stringify(o)));
  await b.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
