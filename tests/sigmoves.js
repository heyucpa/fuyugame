// 🥋 每個角色自己的招：12 位朋友＋教練都有招、動畫畫得出來；對決時朋友用自己的招；第一次打贏學會（再贏不會重複）；
// 必殺技只從學會的招裡隨機挑；對練、教練挑戰贏了也學得到；圖鑑「🥋 招式」；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {}, clear = () => { document.querySelectorAll('#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0; };
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true; G.moves = {}; tkdState().belt = 0; G.kid.hunger = 100;
    o.all = NEIGHBORS.filter(Boolean).every(n => SIG_MOVES[n.id] && SIG_MOVES[n.id].name) && SIG_MOVES.tkd === COACH_SP;
    const c = document.createElement('canvas'); c.width = 360; c.height = 230; const g = c.getContext('2d');
    Object.values(SIG_MOVES).forEach(mv => { for (let k = 0; k <= 1; k += .1) tkdMoveAnim(g, mv, k, { x: 100, y: 180 }, { x: 260, y: 180 }, k * 2); }); o.anims = true;
    o.start = myMoves().length === 1;
    // 對決兔兔米米：牠會用自己的招
    const mimi = NEIGHBORS.find(n => n.id === 'mimi'); openDuelGame(mimi); await wait(1400); let D = playDuel.test;
    o.foeSig = D.fSp === SIG_MOVES.mimi; D.S.turn = 4; D.newIntent(); o.foeUses = D.S.intent === 'fsp';
    const m0 = D.S.me; D.act('block'); await wait(4300); o.blocked = D.S.me === m0 - 2;
    D.S.foe = 1; D.S.intent = 'rest'; D.S.phase = 'choose'; D.act('hit'); await wait(3200);
    o.learned = G.moves.mimi === 1 && myMoves().includes(SIG_MOVES.mimi); await wait(500); o.show = !!document.querySelector('#showcase') || SC_QUEUE.length > 0; clear(); closeGameWindow();
    // 再贏一次不會再學一次
    openDuelGame(mimi); await wait(1400); D = playDuel.test; D.S.foe = 1; D.S.intent = 'rest'; D.act('hit'); await wait(3200); await wait(500); o.once = !document.querySelector('#showcase') && !SC_QUEUE.length && Object.keys(G.moves).length === 1; clear(); closeGameWindow();
    // 隨機只從學會的招挑
    const seen = new Set(); let prev = null, rep = false; for (let i = 0; i < 40; i++) { const m = tkdRandomMove(); seen.add(m.name); if (m === prev) rep = true; prev = m; }
    o.randomMine = seen.size === 2 && seen.has('月亮跳跳踢') && seen.has('旋風踢') && !rep;
    // 對練贏了也學得到
    const bobo = NEIGHBORS.find(n => n.id === 'bobo'); openSparGame(bobo); await wait(100); document.querySelector('.lv-btn').click(); await wait(1700);
    const SP = playSpar.test; for (let i = 0; i < 3; i++) { SP.setKi(100); SP.special(); await wait(2900); } await wait(1800); o.spar = G.moves.bobo === 1; clear(); closeGameWindow();
    // 教練
    tkdState().belt = 5; openCoachChallenge(); await wait(1400); D = playDuel.test; D.S.foe = 1; D.S.intent = 'rest'; D.act('hit'); await wait(3200); o.coach = G.moves.tkd === 1; clear(); closeGameWindow();
    // 圖鑑
    openTab('book'); await wait(200); o.book = !!document.getElementById('dexMoves') && /招式收集 9 \/ 19/.test(document.getElementById('tabBody').textContent); openTab('inv');
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.moves.mimi === 1 && raw.moves.bobo === 1 && raw.moves.tkd === 1;
    const bad = normalizeSave(Object.assign({}, raw, { moves: { mimi: 1, '<x>': 1, bobo: 2 } })); o.bad = Object.keys(bad.moves).join() === 'mimi' && normalizeSave(Object.assign({}, raw, { moves: 'x' })).moves == null;
    return o;
  });
  console.log(JSON.stringify(o));
  const ok = Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
