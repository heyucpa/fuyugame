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
    const t = tkdState();     t.belt = 3; delete t.coach; delete t.world; G.kid.hunger = 100;
    let said = ''; const rt = toast; toast = m => { said = m; };
    host.n = HOSTS.tkd; o.menuLocked = !hostMenuEntries().some(e => /世界大賽/.test(e[0]));
    openWorldCup(); o.cupLocked = /教練/.test(said) && $('#modal').hidden;
    const away0 = G.away; G.away = { place: 'dojo', idx: 0 }; worldNextAd = 1; worldAdSaid = false; $('#modal').hidden = true;
    worldAdTick(); o.noAd = !worldAdSaid; G.away = away0;
    said = ''; openCoachChallenge(); o.needBlack = /黑帶/.test(said) && $('#modal').hidden; toast = rt;
    t.belt = TKD_BELTS.length - 1; coachTries = 2; openCoachChallenge(); await wait(1400); o.coachEase = playDuel.test && playDuel.test.S.foe === 12 && playDuel.test.opt.lvl === 2 && /累了/.test(playDuel.test.opt.intro); closeGameWindow(); await wait(100); coachTries = 0; openCoachChallenge(); await wait(1400); let D = playDuel.test;
    o.coach = D.foe.id === 'tkd' && D.S.foe === 16 && D.S.foeMax === 16;
    // 教練的必殺技：擋住痛 2
    D.S.turn = 3; D.newIntent(); o.fsp = D.S.intent === 'fsp' && /一定要擋/.test(document.querySelector('#modalCard').textContent + '') !== null;
    const m0 = D.S.me; D.act('block'); await wait(4200); o.blockSp = D.S.me === m0 - 2;
    D.S.turn = 7; D.newIntent(); const m1 = D.S.me; D.act('hit'); await wait(4200); o.hitSp = D.S.me <= m1 - 4;
    // 打贏教練
    D.S.foe = 1; D.S.intent = 'rest'; D.S.phase = 'choose'; const b0 = G.bells; D.act('hit'); await wait(3000);
    o.coachWin = t.coach === 1 && G.bells >= b0 + 3000 && /道館冠軍/.test(document.querySelector('.game-status').textContent);
    o.intro = /報名世界大賽/.test(document.querySelector('.game-status').textContent);
    closeGameWindow(); await wait(100); clear();
    host.n = HOSTS.tkd; o.menuOpen = hostMenuEntries().some(e => /報名世界大賽/.test(e[0]));
    // 難度一場比一場高；一般模式決賽再硬。選手每次重抽。
    const easyPlans = [0, 1, 2, 3, 4].map(worldRoundPlan);
    o.ramp = easyPlans.every((p, i) => i === 0 || (p.hp > easyPlans[i - 1].hp && p.agg > easyPlans[i - 1].agg && (easyPlans[i - 1].every === 0 || p.every < easyPlans[i - 1].every))) && easyPlans[0].every === 0 && easyPlans[4].moon;
    const q0 = G.quest; G.quest = Object.assign({}, G.quest, { mode: 'normal' }); const hardF = worldRoundPlan(4); G.quest = q0 && typeof q0 === 'object' ? q0 : {}; if (G.quest) G.quest.mode = 'easy';
    o.hard = hardF.hp > easyPlans[4].hp && hardF.every < easyPlans[4].every && hardF.pow >= easyPlans[4].pow && hardF.fast && !easyPlans[4].fast;
    const sig = c => c.path.join('|') + '/' + c.opps.map(x => x.id + x.venue).join('|');
    let prevS = sig(worldBuildCup()), differ = false;
    for (let i = 0; i < 6 && !differ; i++) { const s = sig(worldBuildCup()); if (s !== prevS) differ = true; prevS = s; }
    o.rand = differ;
    // 世界大賽：對戰表 → 搭機（決賽火箭＋外星人）→ 五場，越後面越強
    G.kid.hunger = 100; openWorldCup(); await wait(80);
    const boardTxt = document.querySelector('#modalCard').textContent;
    const cup0 = worldRound.test;
    o.board = /三十二強/.test(boardTxt) && /十六強/.test(boardTxt) && /八強/.test(boardTxt) && /準決賽/.test(boardTxt) && /決賽/.test(boardTxt) && /晉級|還在比賽|只剩你們/.test(boardTxt);
    o.lineup = cup0 && cup0.cup.opps.length === 5 && cup0.cup.opps[4].venue === '月球' && new Set(cup0.cup.opps.map(f => f.venue)).size === 5 && cup0.cup.opps.every(f => f.short.indexOf(f.venue) === 0);
    const clickRe = re => { const b = [...document.querySelectorAll('#modalCard button')].find(x => re.test(x.textContent)); if (b) b.click(); return !!b; };
    const hps = [];
    for (let r = 0; r < 5; r++) {
      o['fly' + r] = clickRe(/飛去|坐火箭/);
      if (r === 4) {
        let sawR = false, sawA = false;
        for (let i = 0; i < 40 && !(sawR && sawA); i++) {
          const st = document.querySelector('.game-stage');
          if (st && st.dataset.kind === 'rocket') sawR = true;
          if (st && st.dataset.kind === 'alien') sawA = true;
          await wait(200);
        }
        o.moonTrip = sawR && sawA;
      }
      o['land' + r] = clickRe(/到了/);
      let D2 = null;
      for (let i = 0; i < 25; i++) {
        await wait(200);
        if (playDuel.test && playDuel.test.opt && playDuel.test.opt.venue && playDuel.test.S.phase === 'choose') { D2 = playDuel.test; break; }
      }
      hps.push(D2 && D2.S.foe);
      if (!D2) break;
      if (r === 0) {
        o.r1 = D2.S.foe === 7 && /三十二強/.test(document.querySelector('#modalCard').textContent) && !D2.opt.foeSp && D2.opt.venue === cup0.cup.opps[0].venue && /跆拳道場/.test(D2.opt.arena);
        D2.S.phase = 'choose'; D2.S.intent = 'rest'; D2.act('hit'); await wait(900); o.foeHurt = !!D2.faceOf('foe');
        D2.S.phase = 'foe'; D2.S.intent = 'atk'; D2.S.myAct = 'hit'; D2.S.foeDone = false; D2.S.at = performance.now() - 700; await wait(300); o.meHurt = !!D2.faceOf('me');
      }
      if (r === 4) {
        o.rFinal = D2.S.foe === 13 && !!D2.opt.foeSp && D2.opt.venue === '月球' && /月球/.test(D2.opt.arena);
        D2.S.me = 1; D2.S.intent = 'big'; D2.S.phase = 'choose'; D2.act('hit'); await wait(4200);
      } else {
        D2.S.foe = 1; D2.S.intent = 'rest'; D2.S.phase = 'choose'; D2.act('hit'); await wait(2800);
        clear();
        o['next' + r] = /晉級|飛去|坐火箭/.test(document.querySelector('#modalCard').textContent);
      }
    }
    o.hps = hps.join() === '7,8,10,12,13';
    // 冠軍賽輸了：可以再挑戰（不算今天次數、同一位對手、變弱），也可以不比了拿銀牌
    const nDay = worldState().n, btnTxt = [...document.querySelectorAll('#modalCard button')].map(x => x.textContent).join('|');
    o.retryBtn = /再挑戰決賽（對手變弱）/.test(btnTxt) && /不比了，拿銀牌/.test(btnTxt) && worldState().best === 4;
    const hp0 = worldRoundPlan(4).hp, e1 = worldEase(worldRoundPlan(4), 1), e3 = worldEase(worldRoundPlan(4), 3);
    o.easier = e1.hp === hp0 - 2 && e1.lvl < worldRoundPlan(4).lvl && e3.hp < e1.hp && e3.hp >= 4 && e3.agg <= e1.agg;
    clickRe(/再挑戰決賽/); let D3 = null;
    for (let i = 0; i < 25; i++) { await wait(200); if (playDuel.test && playDuel.test.S.phase === 'choose') { D3 = playDuel.test; break; } }
    o.retryEasier = !!D3 && D3.S.foe === hp0 - 2 && worldState().n === nDay && D3.opt.venue === '月球';
    D3.S.me = 1; D3.S.intent = 'big'; D3.S.phase = 'choose'; D3.act('hit'); await wait(4200);
    clickRe(/不比了/); await wait(300);
    o.silver = worldState().best === 4 && /銀牌/.test(document.querySelector('.game-status').textContent) && [...document.querySelectorAll('#modalCard button')].some(x => /去吃東西/.test(x.textContent));
    closeGameWindow(); await wait(100); clear();
    // 一天 3 次
    worldState().n = 3; worldState().d = today(); said = ''; toast = m => { said = m; }; openWorldCup(); o.dayMax = /明天/.test(said) && $('#modal').hidden; toast = rt;
    // 道館選單
    o.menu = typeof openCoachChallenge === 'function' && typeof openWorldCup === 'function';
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.tkd.coach === 1 && raw.tkd.world.best === 4 && raw.tkd.world.v === 2;
    const bad = normalizeSave(Object.assign({}, raw, { tkd: Object.assign({}, raw.tkd, { coach: -1, world: { best: 9, gold: 'x', d: 3, n: 1 } }) })); o.bad = bad.tkd.coach == null && bad.tkd.world.best === -1 && bad.tkd.world.gold === 0 && bad.tkd.world.d == null;
    const mig = wv => normalizeSave(Object.assign({}, raw, { tkd: Object.assign({}, raw.tkd, { world: wv }) })).tkd.world;
    o.migGold = mig({ best: 3, gold: 2 }).best === 5 && mig({ best: 3, gold: 2 }).gold === 2;
    o.migSilver = mig({ best: 2, gold: 0 }).best === 4;
    o.migBronze = mig({ best: 1, gold: 0 }).best === 3;
    o.noRemig = mig({ best: 1, gold: 0, v: 2 }).best === 1;
    return o;
  });
  console.log(JSON.stringify(o));
  const ok = Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
