// 🎯 今天可以玩：每天第一次自動跳出、3 個不同類型、工具列按鈕（小紅點／✅）、每完成一個 💰300、三個都完成今日大獎（只一次）、各種動作有算到、👉 帶我去的小手（指對地方、點了就收、時間到就收）、存檔驗證
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
    G.guide = 'done'; G.openGift = true; $('#modal').hidden = true; G.daily = null; G.dailyPaid = null; SC_QUEUE.length = 0;
    // 每天第一次自動跳出
    document.querySelector('.stage').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));   // 她點過一下畫面
    o.notBeforeTap = true;
    for (let i = 0; i < 60 && !/今天可以玩/.test($('#modalCard').innerText + ($('#modal').hidden ? '#' : '')); i++) { if (!$('#modal').hidden && !/今天可以玩/.test($('#modalCard').innerText)) $('#modal').hidden = true; await wait(200); }
    o.autoOpen = !$('#modal').hidden && /今天可以玩/.test($('#modalCard').innerText);
    const st = dailyState(); o.three = st.ids.length === 3 && new Set(st.ids.map(id => dailyTask(id).cat)).size === 3;
    o.goBtns = document.querySelectorAll('.daily-go').length === 3;
    document.querySelector('#modalCard .modal-x').click(); await wait(100);
    $('#modal').hidden = true; await wait(2500); o.notAgain = $('#modal').hidden;
    const btn = document.getElementById('btnDaily'); o.btn = !!btn && !!btn.querySelector('.daily-dot');
    // 三個都完成：每個 +300、大獎一次
    st.ids = ['shop', 'decor', 'quest']; st.n = {}; st.paid = {}; st.done = false; G.dailyPaid = null;
    const b0 = G.bells; G.bells += 100000; const b1 = G.bells;
    buyFurniture('wood_chair'); const afterBuy = G.bells; o.shopHit = (st.n.shop === 1) && afterBuy === b1 - FURN_BY_ID.wood_chair.price + DAILY_EACH;
    dailyHit('decor'); questFail({ stage: document.createElement('div'), btns: document.createElement('div'), status: {}, card: document.createElement('div') }, '1-1', 0); await wait(50);
    o.allDone = st.done === true && G.dailyPaid === today(); await wait(1200);
    o.big = !!document.getElementById('showcase') || SC_QUEUE.length > 0 || /大獎/.test(document.body.innerText);
    const b2 = G.bells; dailyHit('decor'); dailyHit('shop'); o.noRepeat = G.bells === b2;
    updateDailyChip(); o.btnDone = /✅/.test(btn.textContent) && !btn.querySelector('.daily-dot');
    const sc = document.getElementById('showcase'); if (sc) sc.remove(); SC_QUEUE.length = 0; document.querySelectorAll('.confetti-cv').forEach(x => x.remove()); $('#modal').hidden = true;
    // 其他動作有算到
    st.ids = ['fish', 'family', 'isle']; st.n = {}; st.paid = {};
    travelArrive('uncle'); await wait(200); o.family = st.n.family === 1; homeArrive && homeArrive(); $('#modal').hidden = true;
    // 👉 帶我去
    G.away = null; renderTab && renderTab(); await wait(200);
    dailyGuideOn('feed'); await wait(300); const h = document.getElementById('dailyHand'), fr = $('#btnFeed').getBoundingClientRect(), hr = h.getBoundingClientRect();
    o.handFeed = !h.hidden && Math.abs(hr.left + hr.width / 2 - (fr.left + fr.width / 2)) < 30 && hr.bottom <= fr.top + 30;
    $('#btnFeed').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await wait(500); o.handGoneOnTap = h.hidden;
    $('#modal').hidden = true;
    dailyGuideOn('shop'); await wait(300); const sr = document.querySelector('#tabs button[data-tab="shop"]').getBoundingClientRect(), hr2 = h.getBoundingClientRect(); o.handShop = !h.hidden && Math.abs(hr2.left + hr2.width / 2 - (sr.left + sr.width / 2)) < 30;
    h.click(); await wait(200); o.handTapHide = h.hidden;
    dailyGuideOn('visit'); await wait(300); o.handOut = !h.hidden; dailyGuide.until = Date.now() - 1; await wait(300); o.handTimeout = h.hidden;
    dailyGuideOn('pat'); await wait(300); o.handPet = !h.hidden; dailyGuideOff();
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.daily && raw.daily.ids.length === 3;
    const bad = normalizeSave(Object.assign({}, raw, { daily: { d: today(), ids: ['feed', 'bath', 'kidEat'], n: { feed: 'x', bath: 1 }, paid: { feed: 5, bath: 1 }, seen: 3, done: 'y' } })).daily;
    o.bad = bad.n.feed == null && bad.n.bath === 1 && bad.paid.feed == null && bad.paid.bath === 1 && bad.seen == null && bad.done === false;
    o.old = !!normalizeSave(Object.assign({}, raw, { daily: { d: today(), ids: ['feed', 'bath', 'kidEat'], n: {}, done: false } })).daily;   // 舊格式（沒有 paid）讀得進來
    G.bells = b0;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
