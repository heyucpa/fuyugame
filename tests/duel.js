// ⚔️ 對決＋💥 必殺技動畫：太餓不能打（有「去吃東西」）；看意圖：擋住會反擊、休息時打多 1 點；必殺技要氣滿、有動畫、打 5 點；
// 贏了給錢、飽足少一點、記次數；輸了飽足少比較多、有「去吃東西」；道館、學校、公園、遊樂園會有人來挑戰；六招動畫都畫得出來；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true; G.duel = null;
    // 太餓
    G.kid.hunger = 10; openDuelGame(); await wait(100); o.hungry = /肚子好餓/.test(document.querySelector('.game-status').textContent) && [...document.querySelectorAll('#modalCard button')].some(x => /去吃東西/.test(x.textContent)); closeGameWindow();
    // 打一場：看意圖出招
    G.kid.hunger = 100; openDuelGame(NEIGHBORS[0]); await wait(1400); let D = playDuel.test;
    o.start = D.S.me === 10 && D.S.phase === 'choose' && D.S.intent === 'atk';
    const f0 = D.S.foe; D.act('block'); await wait(2100); o.counter = D.S.foe === f0 - 1 && D.S.me === 10 && D.S.ki >= 40;
    // 休息時打：3 點以上
    D.S.intent = 'rest'; const f1 = D.S.foe; D.act('hit'); await wait(2100); o.restHit = f1 - D.S.foe >= 3;
    // 必殺技：氣不夠不能放；滿了放 → 動畫 → 5 點
    D.S.ki = 50; D.S.phase = 'choose'; D.act('sp'); o.spLocked = D.S.phase === 'choose';
    D.S.ki = 100; D.S.foe = 9; D.S.intent = 'rest'; D.act('sp'); await wait(1500); o.spAnim = D.S.phase === 'me' && D.S.foe === 9; await wait(1400); o.spHit = D.S.foe === 4;
    await wait(1500);
    // 打贏
    D.S.foe = 1; D.S.intent = 'rest'; D.S.phase = 'choose'; const b0 = G.bells; D.act('hit'); await wait(3000);
    o.win = G.duel.win === 1 && G.bells > b0 && G.kid.hunger <= 100 - DUEL_COST_WIN + 1 && /你贏了/.test(document.querySelector('.game-status').textContent);
    closeGameWindow(); document.querySelectorAll('#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0;
    // 打輸
    G.kid.hunger = 80; openDuelGame(NEIGHBORS[1]); await wait(1400); D = playDuel.test; D.S.me = 1; D.S.intent = 'big'; D.act('hit'); await wait(3500);
    o.lose = G.duel.lose === 1 && G.kid.hunger <= 80 - DUEL_COST_LOSE && /去吃東西補體力/.test(document.querySelector('.game-status').textContent) && [...document.querySelectorAll('#modalCard button')].some(x => /去吃東西/.test(x.textContent));
    [...document.querySelectorAll('#modalCard button')].find(x => /去吃東西/.test(x.textContent)).click(); await wait(200); o.foodMenu = !$('#modal').hidden || !!document.querySelector('.menu, .pop-menu, #itemMenu');
    closeGameWindow(); $('#modal').hidden = true; document.querySelectorAll('.menu').forEach(x => x.remove());
    // 六招動畫都畫得出來
    const c = document.createElement('canvas'); c.width = 360; c.height = 230; const g = c.getContext('2d');
    TKD_SPECIALS.forEach(mv => { for (let k = 0; k <= 1; k += .1) tkdMoveAnim(g, mv, k, { x: 100, y: 180 }, { x: 260, y: 180 }, k * 2); }); o.anims = true;
    // 對練的必殺技也有動畫
    openSparGame(); await wait(200); const lv = document.querySelector('.lv-btn'); if (lv) lv.click(); await wait(1700); const SP = playSpar.test; SP.setKi(100); SP.special(); await wait(1600); o.sparAnim = SP.state() === 'special'; await wait(1400); o.sparHit = SP.score()[0] === 2; closeGameWindow();
    // 隨機挑戰：學校也會（不只道館）
    o.places = ['dojo', 'school', 'park', 'amusement'].every(k => DUEL_PLACES[k]);
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.duel.win === 1 && raw.duel.lose === 1;
    o.bad = normalizeSave(Object.assign({}, raw, { duel: { win: -3, lose: 'x' } })).duel.win === 0 && normalizeSave(Object.assign({}, raw, { duel: 5 })).duel == null;
    return o;
  });
  console.log(JSON.stringify(o));
  const ok = Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
