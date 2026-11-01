// 🎯 每日任務收起來了：沒有 🎯 按鈕、不會自動跳出、做事不給每日獎勵；舊存檔的 G.daily 還讀得進來
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  await p.mouse.click(700, 400); await p.waitForTimeout(8000);
  const o = await p.evaluate(() => {
    const o = {}, bt = document.getElementById('btnDaily');
    o.off = DAILY_ON === false; o.noBtn = !bt || bt.hidden; o.noPopup = !/今天可以玩/.test(document.getElementById('modalCard').textContent) || $('#modal').hidden;
    G.daily = { d: today(), ids: ['feed', 'bath', 'kidEat'], n: {}, paid: {}, seen: '' }; const b0 = G.bells; o.noHit = dailyHit('feed') === false && G.bells === b0;
    saveGame(); o.saveOk = !!normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY))).daily;
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
