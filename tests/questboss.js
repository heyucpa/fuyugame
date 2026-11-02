// 🗺️ 簡單模式不會自動跑、按 ◀ ▶ 自由走、站在水管上 ⬇ 出現、按 ⬇ 進得去；
// 🔥 一般模式大魔王：飛上天（往上、跟著小可愛、踩下來頭暈久一點）、噴火球（會彈、碰到會痛）；簡單模式的大魔王不會
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const o = {}, QT = 18, run = (T, n) => { for (let i = 0; i < n; i++) T.step(1 / 60); };
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true;
    // 簡單：◀ ▶ 一直都在、按了照她走
    questState().mode = 'easy'; playQuest('1-1'); let T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
    o.btns = document.querySelector('.qb-l').style.display !== 'none' && document.querySelector('.qb-r').style.display !== 'none';
    run(T, 60); const x1 = T.P.x; o.noAuto = Math.abs(x1 - T.P.x) < 1 && (run(T, 60), Math.abs(T.P.x - x1) < 4);
    T.keys.ArrowRight = true; run(T, 40); o.manualRight = T.P.x > x1 + 20; T.keys.ArrowRight = false; const x2 = T.P.x;
    T.keys.ArrowLeft = true; run(T, 40); o.manualLeft = T.P.x < x2 - 20; T.keys.ArrowLeft = false;
    closeGameWindow();
    // 水管：找一關有水管的
    const pid = QUEST_IDS.find(id => questBuild(id, true).g.some(r => r.includes('P')));
    playQuest(pid); T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
    let px = -1, py = -1; T.L.g.forEach((r, y) => r.forEach((ch, x) => { if (px < 0 && ch === 'P' && T.L.g[y - 1][x] !== 'P') { px = x; py = y; } }));
    T.P.x = px * QT + 2; T.P.y = py * QT - T.P.h - 2; T.P.vy = 0; run(T, 10);
    o.pipeStop = document.querySelector('.qb-dn').style.display !== 'none';
    T.down(); run(T, 2); o.inPipe = T.inBonus();
    closeGameWindow();
    // 一般模式大魔王
    questState().mode = 'normal'; playQuest(questBossId(1), { bossStart: true }); T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
    const bs = T.ents.find(e => e.k === 'boss'); T.P.x = bs.x - 120; run(T, 5);
    const gy = bs.y; bs.mode = 'fly'; bs.mt = 0; run(T, 40); o.fly = bs.y < gy - 3 * QT;
    T.P.inv = 99; let landed = false; for (let i = 0; i < 200 && !landed; i++) { T.step(1 / 60); landed = !bs.mode; } o.slam = landed && Math.abs(bs.y - gy) < 2 && bs.dizzy > 1.2; T.P.inv = 0;
    T.P.inv = 99; T.P.x = bs.x - 120; bs.mode = 'fire'; bs.mt = 0; bs.shots = 0; bs.dizzy = 0; let shot = 0, bounced = false; for (let i = 0; i < 90; i++) { T.step(1 / 60); shot = Math.max(shot, bs.shots || 0); if (T.bossFire.some(f => f.vy < -100 && f.life < 3)) bounced = true; } o.fire = shot >= 2 && bounced;
    T.P.inv = 0; T.P.big = false; const h0 = T.P.hearts; T.bossFire.push({ x: T.P.x - 4, y: T.P.y + 8, w: 10, h: 10, vx: 0, vy: 0, life: 1 }); T.step(1 / 60); o.fireHurts = T.P.hearts === h0 - 1;
    // 會自己用招（跳三下換一招）
    T.P.inv = 99; bs.mode = null; bs.acts = 0; const seen = {}; for (let i = 0; i < 60 * 25; i++) { T.step(1 / 60); if (bs.mode) seen[bs.mode] = 1; } o.uses = !!(seen.fly && seen.fire);
    closeGameWindow();
    // 簡單模式大魔王不會
    questState().mode = 'easy'; playQuest(questBossId(1), { bossStart: true }); T = playQuest.test; gameCleanup && gameCleanup(); gameCleanup = null;
    const be = T.ents.find(e => e.k === 'boss'); T.P.inv = 99; T.keys.ArrowRight = true; run(T, 30); T.keys.ArrowRight = false; let any = false; for (let i = 0; i < 60 * 20; i++) { T.P.inv = 99; T.step(1 / 60); if (be.mode) any = true; } o.easyPlain = !any && !T.bossFire.length;
    closeGameWindow();
    return o;
  });
  console.log(JSON.stringify(o));
  const ok = Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
