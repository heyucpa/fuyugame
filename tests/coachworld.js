// 👑 挑戰熊熊教練（黑帶才可以、16 滴血、會放必殺技：擋住痛 2、沒擋痛 4、第一次贏給 3,000）＋🌏 世界大賽（三場越來越強、決賽對手會放必殺技、名次獎牌、一天 3 次）；存檔驗證
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
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true; REST_TEST_OFF = true;
    const t = tkdState(); t.belt = 3; delete t.coach; delete t.world; G.kid.hunger = 100;
    let said = ''; const rt = toast; toast = m => { said = m; };
    openCoachChallenge(); o.needBlack = /黑帶/.test(said) && $('#modal').hidden; toast = rt;
    t.belt = TKD_BELTS.length - 1; openCoachChallenge(); await wait(1400); let D = playDuel.test;
    o.coach = D.foe.id === 'tkd' && D.S.foe === 16 && D.S.foeMax === 16;
    // 教練的必殺技：擋住痛 2
    D.S.turn = 3; D.newIntent(); o.fsp = D.S.intent === 'fsp' && /一定要擋/.test(document.querySelector('#modalCard').textContent + '') !== null;
    const m0 = D.S.me; D.act('block'); await wait(4200); o.blockSp = D.S.me === m0 - 2;
    D.S.turn = 7; D.newIntent(); const m1 = D.S.me; D.act('hit'); await wait(4200); o.hitSp = D.S.me <= m1 - 4;
    // 打贏教練
    D.S.foe = 1; D.S.intent = 'rest'; D.S.phase = 'choose'; const b0 = G.bells; D.act('hit'); await wait(3000);
    o.coachWin = t.coach === 1 && G.bells >= b0 + 3000 && /道館冠軍/.test(document.querySelector('.game-status').textContent);
    closeGameWindow(); await wait(100); clear();
    // 世界大賽
    G.kid.hunger = 100; openWorldCup(); await wait(1400); D = playDuel.test;
    o.r1 = D.S.foe === 9 && /第一輪/.test(document.querySelector('#modalCard h2, #modalCard .game-title') ? document.querySelector('#modalCard').textContent : '') && !D.opt.foeSp;
    D.S.foe = 1; D.S.intent = 'rest'; D.act('hit'); await wait(3000);
    const nx = [...document.querySelectorAll('#modalCard button')].find(x => /準決賽/.test(x.textContent)); o.next = !!nx && /進入準決賽/.test(document.querySelector('.game-status').textContent);
    nx.click(); await wait(1400); D = playDuel.test; o.r2 = D.S.foe === 11;
    D.S.foe = 1; D.S.intent = 'rest'; D.act('hit'); await wait(3000);
    [...document.querySelectorAll('#modalCard button')].find(x => /決賽/.test(x.textContent)).click(); await wait(1400); D = playDuel.test; o.r3 = D.S.foe === 13 && !!D.opt.foeSp;
    D.S.me = 1; D.S.intent = 'big'; D.act('hit'); await wait(3600);
    o.silver = worldState().best === 2 && /銀牌/.test(document.querySelector('.game-status').textContent) && [...document.querySelectorAll('#modalCard button')].some(x => /去吃東西/.test(x.textContent));
    closeGameWindow(); await wait(100); clear();
    // 一天 3 次
    worldState().n = 3; worldState().d = today(); said = ''; toast = m => { said = m; }; openWorldCup(); o.dayMax = /明天/.test(said) && $('#modal').hidden; toast = rt;
    // 道館選單
    o.menu = typeof openCoachChallenge === 'function' && typeof openWorldCup === 'function';
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.tkd.coach === 1 && raw.tkd.world.best === 2;
    const bad = normalizeSave(Object.assign({}, raw, { tkd: Object.assign({}, raw.tkd, { coach: -1, world: { best: 9, gold: 'x', d: 3, n: 1 } }) })); o.bad = bad.tkd.coach == null && bad.tkd.world.best === -1 && bad.tkd.world.gold === 0 && bad.tkd.world.d == null;
    return o;
  });
  console.log(JSON.stringify(o));
  const ok = Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
