// 🔴 躲避球升級：段位考試（四級、每級學一招新必殺技）、必殺技隨機不連續、新招打得到人、世界躲避球大賽（鎖、晉級、輸了再挑戰變弱、冠軍金冠）、存檔驗證
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
    G.exams = {};
    o.track = EXAM_TRACKS.dodge.ranks.length === 4 && EXAM_TRACKS.ball.ranks[2].kind === 'pingpong';
    o.pool = dbSpecialPool().length === 3 && (G.exams.dodge = 2, dbSpecialPool().length === 5) && (G.exams.dodge = 4, dbSpecialPool().length === 7);
    // 選單：猴子教練有球類、躲避球段位、世界大賽
    host.n = HOSTS.arena; const labels = hostMenuEntries().map(e => e[0]).join('|'); o.menu = /球類檢定/.test(labels) && /躲避球段位/.test(labels) && /世界躲避球大賽/.test(labels);
    // 新必殺技：連放幾次，種類會換、對手被打
    const w = openGameWindow('🔴', ''); playDodge(w, DB_LEVELS[0], { hp: 9 }); await wait(1600);
    const T = playDodge.test, seen = new Set(); let rep = false, prev = '';
    for (let i = 0; i < 6; i++) { for (let k = 0; k < 30 && T.st().phase !== 'aim'; k++) await wait(150); if (T.st().phase !== 'aim') break; T.setSp(100); T.special(); const s = T.lastSp(); if (s === prev) rep = true; prev = s; seen.add(s); await wait(2600); }
    o.random = seen.size >= 3 && !rep;
    o.damaged = T.them.some(q => q.hp < q.maxHp || q.out);
    closeGameWindow(); $('#modal').hidden = true; clear();
    // 世界大賽：還沒考到正式隊員 → 鎖住
    G.exams.dodge = 0; openDbCup(); o.locked = $('#modal').hidden;
    G.exams.dodge = 1; openDbCup(); await wait(100); const B = dbCupBoard.test; o.board = !!B && document.querySelectorAll('.exam-step').length === 5 && B.cup.path[4] === '月球';
    // 第一場：直接開打（不等飛機），打贏 → 晉級
    dbCupPlay(B.w, B.cup, 0); await wait(300); playDodge.test.finish(true); await wait(1900);
    o.advance = dbCupBoard.test.r === 1 && dbCupState().best === 1;
    // 第二場輸了 → 可以再挑戰，對手變弱
    dbCupPlay(B.w, B.cup, 1); await wait(300); const hp0 = dbCupPlay.test.hp; playDodge.test.finish(false); await wait(1900);
    o.retryBtn = /再挑戰十六強/.test(B.w.btns.textContent) && /不比了/.test(B.w.btns.textContent);
    [...B.w.btns.querySelectorAll('button')].find(x => /再挑戰/.test(x.textContent)).click(); await wait(300);
    o.easier = dbCupPlay.test.hp === hp0 - 1;
    // 決賽打贏 → 冠軍、金冠
    playDodge.test.finish(false); await wait(1900); dbCupPlay(B.w, B.cup, 4); await wait(300); const b0 = G.bells; playDodge.test.finish(true); await wait(1900); clear();
    o.champ = dbCupState().gold === 1 && dbCupState().best === 5 && ownsClothes('db_crown') && G.bells >= b0 + 4000;
    closeGameWindow(); $('#modal').hidden = true;
    // 段位考試畫面
    G.exams.dodge = 0; openExam('dodge'); o.examUi = /正式隊員/.test($('#modalCard').textContent) && /龍捲風球/.test($('#modalCard').textContent); closeGameWindow(); $('#modal').hidden = true;
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.dbcup.gold === 1 && raw.dbcup.best === 5;
    const bad = normalizeSave(Object.assign({}, raw, { dbcup: { best: 9, gold: -1 }, exams: { dodge: 3 } })); o.bad = bad.dbcup.best === 0 && bad.dbcup.gold === 0 && bad.exams.dodge === 3;
    o.bad2 = normalizeSave(Object.assign({}, raw, { dbcup: 'x' })).dbcup == null;
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
