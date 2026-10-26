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
    o.worlds = QUEST_WORLDS.length === 6 && QUEST_IDS.length === 18 && QUEST_IDS.includes('6-3');
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
    // 存檔：6 個世界的關卡都留著，奇怪的拿掉
    const raw = JSON.parse(JSON.stringify(G)); raw.quest = { mode: 'easy', clear: { '6-3': 1, '7-1': 1 }, stars: { '5-2': 3 } };
    const n = normalizeSave(raw).quest; o.save = n.clear['6-3'] === 1 && !n.clear['7-1'] && n.stars['5-2'] === 3;
    // 地圖
    openQuestMap(); o.map = document.querySelectorAll('.quest-world').length === 6 && /城堡世界/.test($('#modalCard').innerText) && /獎盃/.test($('#modalCard').innerText); $('#modal').hidden = true;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
