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
    // 趣味事件：四種都有、不移動玩家、點了有錢、壞存檔清掉、選單開著不跳出來
    openIsland(); $('#modal').hidden = true;
    const ix = isl.x, iy = isl.y, bell0 = G.bells;
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
    isl.fun = null; isl.nextFun = 0; $('#modal').hidden = false; isleFunStep(2);
    o.noCover = !isl.fun;
    $('#modal').hidden = true; isleFunStart('snow');
    try { islDraw(performance.now()); o.draw = true; } catch (e) { o.draw = false; }
    closeIsland();
    return o;
  });
  console.log(JSON.stringify(o, null, 2));
  const ok = o && Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + (errs.join(' | ') || JSON.stringify(o)));
  await b.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
