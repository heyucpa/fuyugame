// 🏀 體育館：運動島上有體育館；籃球（投籃、蓋火鍋、比完有結果）、躲避球（丟球打人、閃球／接球）、桌球（接球、combo、比完有結果）；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; $('#modal').hidden = true;
    islMapCache = null; const m = islMap(0), ar = m.blds.find(x => x.id === 'arena'); o.bld = !!ar && ar.islet;
    // 🏀 投籃機（一般：有力量條、三關）：力量剛好、瞄準籃框一直投；亂投沒進；到目標分數進下一關；沒到 GAME OVER
    openBasket(); document.querySelectorAll('.lv-btn')[1].click(); await wait(300);
    const B = playBasket.test; B.skipIntro(); await wait(100);
    for (let k = 0; k < 6; k++) { B.shootAt(B.hx(), 1); await wait(400); }
    await wait(900); const s1 = B.st(); o.bbMade = s1.made === 6 && s1.score >= 14;   // 連進 3 球火球、空心多 1 分
    B.shootAt(30, 1); await wait(1200); o.bbMiss = B.st().made === 6 && B.st().combo === 0;
    B.shootAt(B.hx(), 1.4); await wait(1200); o.bbTooStrong = B.st().shots === 8;
    B.endRound(); await wait(200); o.bbNext = B.st().round === 1 && B.st().cleared === 1 && B.st().phase === 'intro';
    B.skipIntro(); await wait(100); B.endRound(); for (let i = 0; i < 40 && !/分/.test(document.querySelector('.game-status').textContent); i++) await wait(100);
    o.bbStatus = /過了 1 關/.test(document.querySelector('.game-status').textContent) && arenaState().bm === B.st().score; closeGameWindow();
    // ⛹️ 籃球比賽 2 對 2：開外掛投進 3 球（簡單），防守時等「！」再跳
    openBball(); document.querySelectorAll('.lv-btn')[0].click(); await wait(300);
    const B2 = playBball.test; B2.cheat(true);
    for (let i = 0; i < 400 && !B2.st().ended; i++) {
      const s = B2.st();
      if (s.phase === 'atk') B2.press();
      if (s.phase === 'def' && s.defT > s.shootAt + .05) B2.press();
      await wait(60);
    }
    o.b2End = B2.st().ended && B2.st().score[0] === 3; await wait(1800);
    o.b2Status = /贏了/.test(document.querySelector('.game-status').textContent) && arenaState().bb === 1; closeGameWindow();
    openBallChoice(); o.ballChoice = document.querySelectorAll('.lv-row button').length === 2; closeGameWindow();
    // 🔴 躲避球：一直瞄準打人，球來了等最後一刻接
    openDodge(); document.querySelectorAll('.lv-btn')[0].click(); await wait(300);
    const D = playDodge.test; let dodged = 0; D.setSp(100);   // 一開始就能放必殺技
    for (let i = 0; i < 900 && !D.st().ended; i++) {
      const s = D.st();
      if (s.phase === 'aim') { if (s.sp >= 100) D.special(); else { const q = D.them.find(x => !x.out); D.throwAt(q.x, q.y); } }
      if (s.phase === 'inc' && s.tgKid && s.left < .12) { D.dodge(); dodged++; }
      await wait(40);
    }
    o.dbEnd = D.st().ended && D.st().outs >= 3; o.dbSpecial = D.st().spCount >= 1; o.dbCatch = D.st().catches >= 0 && dodged >= 0; await wait(1800);
    o.dbStatus = /打中/.test(document.querySelector('.game-status').textContent); closeGameWindow();
    // 🏓 桌球：自動跟球，一定會贏
    openPingPong(); document.querySelectorAll('.lv-btn')[0].click(); await wait(300);
    const P = playPingPong.test; P.setAuto(true);
    for (let i = 0; i < 1500 && !P.st().ended; i++) await wait(80);
    o.ppEnd = P.st().ended && P.st().score[0] === 3 && P.st().best >= 1; await wait(1700);
    o.ppStatus = /最多連續/.test(document.querySelector('.game-status').textContent); closeGameWindow();
    // 桌球：球拍放旁邊不動 → 對手得分
    openPingPong(); document.querySelectorAll('.lv-btn')[2].click(); await wait(300);
    const ivp = setInterval(() => playPingPong.test.setPaddle(-1.1), 16); for (let i = 0; i < 150 && playPingPong.test.st().score[1] < 1; i++) await wait(100); clearInterval(ivp); o.ppMiss = playPingPong.test.st().score[1] >= 1; closeGameWindow();
    // 主人選單、快速選單、存檔
    travelArrive('arena'); await wait(300); $('#modal').hidden = true;
    o.host = host.n && host.n.id === 'arena' && hostMenuEntries().some(e => /投籃機/.test(e[0])) && hostMenuEntries().some(e => /籃球比賽/.test(e[0]));
    o.quick = ['籃球比賽', '投籃機', '躲避球', '桌球'].every(n => allQuickGames().some(g => g.name === n && g.where === 'arena'));
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.arena && raw.arena.bm >= 14;
    const bad = normalizeSave(Object.assign({}, raw, { arena: { bb: 'x', pp: -3, db: 2.7 } })).arena; o.bad = bad.bb == null && bad.pp == null && bad.db === 2;
    o.bad2 = normalizeSave(Object.assign({}, raw, { arena: 5 })).arena == null;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
