// 📰 下次登入列最新三次更新：看過的也列（只這一次）、之後不再跳；太久沒玩也最多列三則、舊的算看過；新存檔不跳；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {}, shown = () => !$('#modal').hidden && /更新了 3 次/.test(document.getElementById('modalCard').textContent) ? document.querySelectorAll('#modalCard details.news-hist').length : 0;
    G.guide = 'done'; G.guideAsked = true; G.openGift = true;
    o.fresh = G.newsTop3 === NEWS_TOP3_KEY;   // 新存檔：不用再跳
    $('#modal').hidden = true; maybeShowNews(); o.freshNo = $('#modal').hidden;
    // 都看過了、還沒看過「最新三則」
    G.newsSeen = NEWS.map(n => n.id); delete G.newsTop3; maybeShowNews(); await wait(50);
    o.top3 = shown() === 3 && [...document.querySelectorAll('#modalCard details.news-hist summary')][0].textContent.includes(NEWS[0].title) && G.newsTop3 === NEWS_TOP3_KEY;
    $('#modal').hidden = true; maybeShowNews(); o.once = $('#modal').hidden;
    // 太久沒玩：12 則沒看過 → 只列 3 則，其他算看過
    G.newsSeen = NEWS.slice(12).map(n => n.id); maybeShowNews(); await wait(50); o.cap3 = shown() === 3 && unseenNews().length === 0;
    $('#modal').hidden = true;
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.newsTop3 === NEWS_TOP3_KEY;
    o.bad = typeof normalizeSave(Object.assign({}, raw, { newsTop3: 5 })).newsTop3 === 'string';   /* 壞的值清掉、補回預設 */
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
