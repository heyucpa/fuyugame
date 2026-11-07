// 🍂 四季裝飾＋🎊 彩帶：每天換一季（春夏秋冬輪流）；四季都畫得出來不出錯；設定可以關；存檔驗證；慶祝的大事會撒彩帶、普通的新東西不會；彩帶不擋點擊
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
    o.defaultOn = SEASON_FX_ON === true;
    SEASON_FX_ON = true;
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true;
    const m = md => { SEASON_TODAY = md; return seasonOfMonth(); };
    const seq = [[11, 7], [11, 8], [11, 9], [11, 10], [11, 11]].map(m); o.daily = seq.join() === 'autumn,winter,spring,summer,autumn';
    o.sameDay = m([6, 3]) === m([6, 3]) && m([6, 3]) !== m([6, 4]);
    for (const md of [[4, 1], [7, 1], [10, 1], [1, 1]]) { SEASON_TODAY = md; draw(); await wait(80); }
    o.drew = true;
    openTab('save'); await wait(200); const btn = [...document.querySelectorAll('#tabBody button')].find(x => /季節裝飾/.test(x.textContent)); btn.click(); o.off = G.noSeasonFx === 1;
    saveGame(); o.saved = JSON.parse(localStorage.getItem(SAVE_KEY)).noSeasonFx === 1; draw();
    [...document.querySelectorAll('#tabBody button')].find(x => /季節裝飾/.test(x.textContent)).click(); o.on = !G.noSeasonFx; openTab('inv');
    o.bad = normalizeSave(Object.assign({}, JSON.parse(localStorage.getItem(SAVE_KEY)), { noSeasonFx: 'x' })).noSeasonFx == null;
    SEASON_TODAY = null;
    // 彩帶
    document.querySelectorAll('.confetti-cv,#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0;
    showcase('🎁', '新家具', '一般的新東西'); await wait(100); o.noParty = !document.querySelector('.confetti-cv');
    document.querySelectorAll('#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0;
    showcase(el('div', 'magic-pic', '🏆'), '破了天空世界！', '好厲害', { head: '🎉 太棒了！' }); await wait(100); const cv = document.querySelector('.confetti-cv'); o.party = !!cv && getComputedStyle(cv).pointerEvents === 'none';
    document.querySelectorAll('#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
