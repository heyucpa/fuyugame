// 🔤 英文小達人＋💰 收銀台找錢：卡片上的 🔤 點了跳英文、記單字、不會順便買／拿出家具；徽章；圖鑑；每日目標；找錢：答對算、答錯提示、第 3 次示範、略過；店長徽章；存檔驗證
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
    G.guide = 'done'; G.openGift = true; $('#modal').hidden = true; G.enLearn = {}; G.cash = null; G.cashDay = null; G.bells = 50000;
    G.daily = { d: today(), ids: ['en3', 'cash', 'feed'], n: {}, paid: {}, seen: today() };
    // 商店：點 🔤 不會買
    openTab('shop'); await wait(200); const b0 = G.bells, chips = [...document.querySelectorAll('#tabBody .en-chip')]; o.shopChips = chips.length > 50;
    chips[0].click(); await wait(100); o.pop = !!document.querySelector('.en-pop'); o.noBuy = G.bells === b0; o.learned1 = Object.keys(G.enLearn).length === 1;
    // 學 3 個 → 每日目標
    const words = new Set(); for (const c of chips) { c.click(); words.add(document.querySelector('.en-pop b').textContent); if (words.size >= 3) break; } o.daily = G.daily.n.en3 === 3;
    // 我的東西：點 🔤 不會拿起家具
    openTab('inv'); await wait(200); const ic = document.querySelector('#tabBody .en-chip'); if (ic) { ic.click(); await wait(100); } o.noHold = !hold;
    // 徽章：10 個
    const all = [...new Set(Object.values(EN_WORDS))]; const st0 = Object.keys(G.stickers || {}).length; all.slice(0, 12).forEach(w => enLearn(w)); o.badge = Object.keys(G.enLearn).length >= 10 && Object.keys(G.stickers || {}).length >= st0;
    document.querySelectorAll('#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0;
    // 💰 找錢
    openCashGame(); document.querySelectorAll('.lv-btn')[0].click(); await wait(100); const C = playCash.test;
    const c1 = C.cur(); C.greedy(c1.change).forEach(v => C.add(v)); C.submit(); await wait(700); o.cashRight = C.right() === 1 && G.cash.ok === 1;
    const c2 = C.cur(); C.add(1); if (c2.change === 1) C.add(1); C.submit(); await wait(50); o.hint = /還差|多了/.test(document.querySelector('.cash-msg').textContent) && C.i() === 1;
    C.submit(); C.submit(); await wait(100); o.demo = /看看怎麼找/.test(document.querySelector('.cash-msg').textContent); await wait(2800); o.next = C.i() === 2;
    [...document.querySelectorAll('#modalCard button')].find(x => /略過/.test(x.textContent)).click(); await wait(50); o.skip = C.i() === 3;
    for (let k = 0; k < 2; k++) { C.greedy(C.cur().change).forEach(v => C.add(v)); C.submit(); await wait(700); }
    o.done = /找對 3 位/.test(document.querySelector('.game-status').textContent) && G.daily.n.cash === 1; closeGameWindow();
    // 店長徽章
    G.cash.ok = 9; cashBadge(); G.cash.ok = 10; const bb = G.bells; cashBadge(); o.cashBadge = G.bells === bb + 500;
    document.querySelectorAll('#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0;
    // 圖鑑
    openTab('book'); await wait(200); o.book = !!document.getElementById('dexEn') && !!document.getElementById('dexCash') && document.querySelectorAll('.en-word').length >= 10; openTab('inv');
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.enLearn && Object.keys(raw.enLearn).length >= 10 && raw.cash.ok === 10;
    const bad = normalizeSave(Object.assign({}, raw, { enLearn: { bed: 1, '<b>': 1, cat: 5 }, cash: { ok: -1 }, cashDay: 'x' })); o.bad = Object.keys(bad.enLearn).join() === 'bed' && bad.cash == null && bad.cashDay == null;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
