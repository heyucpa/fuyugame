// 🍒 闖關的新東西：道具磚（長大果、火火花、無敵星星）、變大被打不扣愛心、火球打倒怪物、無敵撞倒怪物、隱藏磚塊、水管祕密房間來回、烏龜踩成殼再踢、會動的雲、岩漿火焰、雪地滑滑的、6 個世界存檔
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const o = {}, QT = 18;
    G.guide = 'done'; $('#modal').hidden = true;
    const start = (id, mode) => { questState().mode = mode || 'normal'; playQuest(id); const T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null; return T; };
    const run = (T, n) => { for (let i = 0; i < n; i++) T.step(1 / 60); };
    const find = (T, ch) => { for (let y = 0; y < T.L.g.length; y++) { const x = T.L.g[y].indexOf(ch); if (x >= 0) return [x, y]; } return null; };
    o.worlds = QUEST_WORLDS.length === 6 && QUEST_IDS.length === 30 && QUEST_IDS.includes('6-3') && QUEST_IDS.includes('1-4') && questBossId(1) === '1-5' && questBossId(6) === '6-5';
    // 道具磚：從下面頂 → 跳出道具 → 碰到就拿到
    let T = start('1-1'); let [mx, my] = find(T, 'M'); T.P.x = mx * QT + 2; T.P.y = (my + 1) * QT + 2; T.P.vy = -300; run(T, 6);
    const pw = T.items.find(it => it.k === 'pow'); o.powBlock = !!pw && T.L.g[my][mx] === 'u';
    T.P.x = pw.x - 6; T.P.y = pw.y - 15; T.P.vy = 0; run(T, 2); o.gotPow = pw.got === 1 && (T.P.big || T.P.starT > 0);
    // 變大被打：變回原樣、愛心不變
    T.givePower('grow'); T.P.starT = 0; T.P.inv = 0; const h0 = T.P.hearts; const en = T.ents.find(e => e.k === 'slime' && e.alive); T.P.x = en.x - 4; T.P.y = en.y - 16; T.P.vy = -50; run(T, 2);
    o.bigHurt = !T.P.big && T.P.hearts === h0;
    // 火火花：丟火球打倒怪物
    T.givePower('fire'); T.P.inv = 2; const en2 = T.ents.find(e => e.alive && e.k === 'slime'); T.P.x = en2.x - 60; T.P.y = en2.y + en2.h - T.P.h; T.P.face = 1; T.P.vx = 0; T.shootFire(); o.fireBall = T.fbs.length === 1; run(T, 40); o.fireKill = !en2.alive;
    // 無敵星星：撞到就打倒
    T = start('2-1'); T.givePower('inv'); const crab = T.ents.find(e => e.alive); T.P.x = crab.x; T.P.y = crab.y + crab.h - T.P.h; run(T, 2); o.starKill = !crab.alive && T.P.hearts === 3;
    // 隱藏磚塊
    T = start('1-1'); const [hx, hy] = find(T, 'H'); const c0 = T.P.coins; T.P.x = hx * QT + 2; T.P.y = (hy + 1) * QT + 2; T.P.vy = -300; run(T, 6); o.hidden = T.L.g[hy][hx] === 'u' && T.P.coins >= c0 + 5;
    // 水管：進祕密房間、再出來
    T = start('1-2'); const px = T.L.pipes[0]; T.P.x = px * QT + 4; T.P.y = 11 * QT - T.P.h; T.P.vy = 0; run(T, 3); T.down(); run(T, 2); o.pipeIn = T.inBonus() && T.P.x > T.L.bonusX * QT;
    const [qx] = find(T, 'Q'); T.P.x = qx * QT + 4; T.P.y = 11 * QT - T.P.h; T.P.vy = 0; run(T, 3); T.down(); run(T, 2); o.pipeOut = !T.inBonus() && Math.abs(T.P.x - (px + 3) * QT) < 40;
    // 烏龜：踩一下變殼，碰一下踢出去，撞倒別的怪物
    T = start('4-1'); const tt = T.ents.find(e => e.k === 'turtle'); T.P.x = tt.x; T.P.y = tt.y - T.P.h - 2; T.P.vy = 200; run(T, 3); o.shell = tt.k === 'shell' && tt.still;
    T.P.inv = 0; T.P.x = tt.x - T.P.w - 1; T.P.y = tt.y + tt.h - T.P.h; T.P.vy = 0; T.P.vx = 60; run(T, 4); o.kick = !tt.still && Math.abs(tt.vx) > 100;
    // ❄️ 雪地：放開之後滑比較遠
    const slide = id => { const T2 = start(id); T2.P.x = 3 * QT; T2.P.y = 13 * QT - T2.P.h; run(T2, 10); T2.keys.ArrowRight = true; run(T2, 60); T2.keys.ArrowRight = false; const x0 = T2.P.x; run(T2, 30); return T2.P.x - x0; };
    o.ice = slide('4-1') > slide('1-1') * 2;
    // ☁️ 會動的雲；🔥 岩漿裡的火焰
    T = start('5-1'); const pl = T.plats[0], x1 = pl.x; run(T, 30); o.plat = T.plats.length >= 2 && pl.x !== x1;
    T = start('6-1'); o.flame = T.ents.some(e => e.k === 'flame') && !!find(T, 'L');
    closeGameWindow(); $('#modal').hidden = true;
    // 磚塊：小的時候頂一下還在，變大就頂破；藤蔓按住跳會往上；水裡換成企鵝泳衣，上岸換回來
    T = start('1-1'); const br = find(T, 'B'); T.P.big = false; T.P.x = br[0] * QT + 2; T.P.y = (br[1] + 1) * QT + 2; T.P.vy = -300; run(T, 8);
    o.brickBump = T.L.g[br[1]][br[0]] === 'B';
    T.P.big = true; T.P.x = br[0] * QT + 2; T.P.y = (br[1] + 1) * QT + 2; T.P.vy = -320; run(T, 8); o.brickBreak = T.L.g[br[1]][br[0]] === ' ';
    // 簡單模式：小時也打得破一般磚，會有碎片
    T = start('1-1', 'easy'); const ebr = find(T, 'B'); T.P.big = false; T.P.fire = false; T.P.starT = 0; T.P.vx = 0;
    T.P.x = ebr[0] * QT + 2; T.P.y = (ebr[1] + 1) * QT + 2; T.P.vy = -300; run(T, 8);
    o.easyBrick = T.L.g[ebr[1]][ebr[0]] === ' ' && T.bits.length >= 4;
    // 1-1 粉紅問號：框（alcove）的 M 在從下面頂得到的那一排，頂了就拿到道具；左右留空，金幣跳得進去
    const gB = questBuild('1-1', true).g, S = c => '#=?BMNRuPQU'.includes(c);
    const gapTo = (g, x, y) => { for (let yy = y + 1; yy < g.length; yy++) if (S(g[yy][x])) return { yy, ch: g[yy][x], gap: yy * QT - 30 - (y + 1) * QT }; return null; };
    let ax = -1, ay = -1, openX = -1, coinN = 0, roofOk = false, openBelow = false;
    for (let y = 1; y < gB.length; y++) for (let x = 1; x < gB[y].length - 1; x++) {
      if (gB[y][x] === 'M' && gB[y - 1][x] === 'o' && (gB[y][x - 1] === 'B' || gB[y][x - 1] === 'M' || gB[y][x + 1] === 'B' || gB[y][x + 1] === 'M')) { ax = x; ay = y; }
    }
    if (ay > 0) {
      roofOk = gB[ay - 3][ax] === '=';
      openBelow = true; for (let y = ay + 1; y < 13; y++) if (S(gB[y][ax])) openBelow = false;
      for (let y = 0; y < ay; y++) for (let x = ax - 4; x <= ax + 3; x++) if (gB[y] && gB[y][x] === 'o') coinN++;
      for (let x = ax - 4; x <= ax + 3; x++) if (gB[ay][x] === ' ' && gB[ay - 1][x] === 'o') openX = x;
    }
    o.alcovePlace = ay === 8 && roofOk && openBelow && coinN >= 8 && openX >= 0;
    T = start('1-1', 'easy'); T.P.big = false; T.P.fire = false; T.P.starT = 0; T.P.vx = 0;
    T.P.x = ax * QT + 2; T.P.y = (ay + 1) * QT + 2; T.P.vy = -300; run(T, 8);
    o.alcovePow = T.L.g[ay][ax] === 'u' && (T.P.big || T.P.fire || T.P.starT > 0);
    const coin0 = T.P.coins; T.P.x = openX * QT + 2; T.P.y = 13 * QT - T.P.h; T.P.vy = 0; T.P.vx = 0; run(T, 4); T.jump(); run(T, 45); T.release();
    o.alcoveCoins = T.P.coins > coin0;
    // 往上同時頂到粉紅和旁邊的 B：要算粉紅，B 留著
    T = start('1-1', 'normal'); T.L.g[9][3] = 'B'; T.L.g[9][4] = 'M';
    T.P.big = false; T.P.fire = false; T.P.starT = 0; T.P.vx = 0; T.P.x = 4 * QT - 6; T.P.y = 10 * QT + 1; T.P.vy = -300; run(T, 8);
    o.bonkPref = T.L.g[9][4] === 'u' && T.L.g[9][3] === 'B';
    // staircoin 粉紅在橋上、從地面頂得到；brickline／pipehouse／blocks 的問號磚沒有被另一層天花板擋住
    const stairM = () => { for (let y = 0; y < gB.length; y++) for (let x = 3; x < gB[y].length - 3; x++) {
      if (gB[y][x] !== 'M' || gB[y][x - 1] !== '=' || gB[y][x + 1] !== '=') continue;
      const stacked = [-3, -2, -1, 1, 2, 3].some(dx => gB[y][x + dx] === '=' && gB[y + 1] && gB[y + 1][x + dx] === '=');
      const gap = gapTo(gB, x, y); if (stacked && gap && gap.ch === '#' && gap.gap >= 0 && gap.gap <= 24) return true;
    } return false; };
    const lineM = () => { for (let y = 0; y < gB.length; y++) for (let x = 2; x < gB[y].length - 2; x++) {
      if (gB[y][x] !== 'M') continue;
      const has = (ch, ds) => ds.some(d => gB[y][x + d] === ch);
      const gap = gapTo(gB, x, y);
      if (has('?', [-3, -2, -1, 1, 2, 3]) && has('N', [-3, -2, -1, 1, 2, 3]) && gap && gap.ch === '#' && gap.gap <= 36) return true;
    } return false; };
    const pipeM = () => { for (let y = 0; y < gB.length; y++) for (let x = 6; x < gB[y].length; x++) {
      if (gB[y][x] !== 'M') continue; let nearP = false; for (let dx = -6; dx <= -3; dx++) for (let dy = 1; dy <= 4; dy++) if (gB[y + dy] && gB[y + dy][x + dx] === 'P') nearP = true;
      const gap = gapTo(gB, x, y); if (nearP && gap && gap.ch === '#' && gap.gap <= 50) return true;
    } return false; };
    const blocksRow = () => { let n = 0; for (let y = 0; y < gB.length; y++) for (let x = 0; x < gB[y].length - 4; x++) {
      if (![0, 1, 2, 3, 4].every(i => '?NRB'.includes(gB[y][x + i]))) continue;
      const gap = gapTo(gB, x + 2, y); if (!gap || gap.ch !== '#' || gap.gap > 36) return false; n++;
    } return n >= 1; };
    o.stairPink = stairM(); o.linePink = lineM(); o.pipePink = pipeM(); o.blocksRow = blocksRow();
    T = start('1-4'); let vx0 = -1, vy0 = -1; T.L.g.forEach((r, y) => { const x = r.indexOf('V'); if (x >= 0 && y >= 7) { vx0 = x; vy0 = y; } }); T.P.x = vx0 * QT + 2; T.P.y = vy0 * QT; T.jump(); const yv = T.P.y; run(T, 20); o.vine = vy0 >= 7 && T.P.y < yv - 12;
    T = start('2-4'); let sx = -1; T.L.g[12].forEach((ch, x) => { if (sx < 0 && ch === 'W' && T.L.g[13][x] === '#') sx = x; });
    T.P.x = sx * QT; T.P.y = 13 * QT - T.P.h; T.P.vy = 0; run(T, 4); o.swim = T.P.swim === true && T.penguin() === true;
    T.P.x = 2 * QT; T.P.y = 13 * QT - T.P.h; T.P.vy = 0; run(T, 6); o.shore = T.P.swim === false && T.penguin() === false;
    const ux = T.L.waterPipes[0]; T.P.x = ux * QT + 4; T.P.y = 11 * QT - T.P.h; T.P.vy = 0; run(T, 3); T.down(); run(T, 3); o.waterPipe = T.inBonus() && T.P.swim === true;
    closeGameWindow(); $('#modal').hidden = true;
    // 存檔：6 個世界的關卡都留著，奇怪的拿掉
    const raw = JSON.parse(JSON.stringify(G)); raw.quest = { mode: 'easy', clear: { '6-3': 1, '7-1': 1 }, stars: { '5-2': 3 } };
    const n = normalizeSave(raw).quest; o.save = n.clear['6-3'] === 1 && !n.clear['7-1'] && n.stars['5-2'] === 3 && n.legacy['6'] === 1 && !n.clear['6-4'] && !n.clear['6-5'];
    const kept = normalizeSave(Object.assign({}, JSON.parse(JSON.stringify(G)), { quest: { mode: 'normal', clear: { '1-1': 1, '1-2': 1, '1-3': 1, '2-3': 1, '3-3': 1, '4-3': 1, '5-3': 1, '6-3': 1 }, stars: { '1-3': 2, '6-3': 3 } } })).quest;
    o.keepOld = ['1-1', '1-2', '1-3', '2-3', '3-3', '4-3', '5-3', '6-3'].every(k => kept.clear[k] === 1) && !kept.clear['1-4'] && !kept.clear['1-5'] && kept.stars['1-3'] === 2 && kept.stars['6-3'] === 3 && [1, 2, 3, 4, 5, 6].every(w => kept.legacy[String(w)] === 1);
    const neu = normalizeSave(Object.assign({}, JSON.parse(JSON.stringify(G)), { quest: { mode: 'easy', rev: 2, legacy: {}, clear: { '1-3': 1 }, stars: { '1-1': 1 } } })).quest;
    o.noFalseWorld = neu.rev === 2 && neu.legacy['1'] == null && neu.clear['1-3'] === 1 && neu.stars['1-1'] === 1;
    // 地圖
    openQuestMap(); o.map = document.querySelectorAll('.quest-world').length === 6 && /城堡世界/.test($('#modalCard').innerText) && /獎盃/.test($('#modalCard').innerText); $('#modal').hidden = true;
    // 第 4 顆星星（1-3 藤蔓雲上）：以前 P.stars 變成 4，'☆'.repeat(-1) 把畫面迴圈弄停
    if (!(G.pet && G.pet.stage && G.pet.stage !== 'egg')) G.pet = { species: 'bunny', stage: 'kid', hunger: 80, clean: 100, mood: 80 };
    questState().mode = 'easy'; playQuest('1-3');
    T = playQuest.test;
    const vineStar = T.items.find(it => it.k === 'star' && it.y < 80);
    T.P.stars = 3; T.P.vx = 0; T.P.vy = 0; T.P.x = vineStar.x - 6; T.P.y = 4 * QT - T.P.h;
    let starErr = '';
    try { for (let i = 0; i < 6; i++) T.frameStep(1 / 60); } catch (e) { starErr = e.message; }
    const sx0 = T.P.x; T.keys.ArrowRight = true;
    try { for (let i = 0; i < 24; i++) T.frameStep(1 / 60); } catch (e) { starErr += e.message; }
    o.starLive = !starErr && vineStar.got === 1 && T.P.stars === 3 && T.P.x > sx0 + 12 && T.state() === 'play';
    gameCleanup && gameCleanup(); gameCleanup = null; $('#modal').hidden = true;
    // 階梯金幣：橋下從左邊平地走得進去，跳一下頂到粉紅而且拿到道具。上面仍有金色問號。
    const g13 = questBuild('1-3', true).g;
    let stx = -1, sty = -1;
    for (let y = 0; y < g13.length; y++) for (let x = 2; x < g13[y].length - 2; x++) if (g13[y][x] === 'M' && g13[y - 3] && (g13[y - 3][x] === '?' || g13[y - 3][x] === 'N')) { stx = x; sty = y; }
    const wall = c => '#=?BMNPRQU'.includes(c);
    let path = stx > 2 && sty === 10;
    for (let x = stx - 5; x <= stx; x++) if (wall(g13[12][x]) || wall(g13[11][x])) path = false;
    o.archOpen = path && g13[sty - 3][stx - 1] === '?' && g13[sty - 3][stx + 1] === '?';
    questState().mode = 'easy'; playQuest('1-3');
    T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
    T.P.big = false; T.P.fire = false; T.P.starT = 0; T.P.vy = 0; T.P.x = (stx - 5) * QT; T.P.y = 13 * QT - T.P.h; T.keys.ArrowRight = true;
    let archHit = false;
    for (let i = 0; i < 420 && !archHit; i++) {
      const cx = (T.P.x + T.P.w / 2) / QT;
      if (T.P.on && cx > stx - 0.4 && cx < stx + 1.3) T.jump();
      T.step(1 / 60);
      if (T.L.g[sty][stx] === 'u') archHit = true;
    }
    o.archHit = archHit && (T.P.big || T.P.fire || T.P.starT > 0);
    // 長跳頂得到、但道具以前掉在磚塊上面撿不到：火火花那一排、水管旁的粉紅
    const reach = pred => {
      questState().mode = 'easy'; playQuest('1-3');
      const T2 = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
      let mx = -1, my = -1;
      T2.L.g.forEach((row, y) => row.forEach((ch, x) => { if (ch === 'M' && pred(T2, x, y)) { mx = x; my = y; } }));
      if (mx < 0) return false;
      T2.P.big = false; T2.P.fire = false; T2.P.starT = 0; T2.P.vx = 0; T2.P.inv = 9; T2.P.x = mx * QT + 2; T2.P.y = 13 * QT - T2.P.h;
      for (let i = 0; i < 4; i++) T2.step(1 / 60);
      T2.jump();
      for (let i = 0; i < 100; i++) T2.step(1 / 60);
      return T2.L.g[my][mx] === 'u' && T2.items.some(it => it.k === 'pow' && it.got === 1);
    };
    o.powReach = reach((T2, x, y) => y === 9 && T2.L.g[y][x - 1] === '=');
    o.pipeReach = reach((T2, x, y) => y === 8 && T2.L.g[y][x - 1] === 'N');
    closeGameWindow(); $('#modal').hidden = true;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
