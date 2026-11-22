// 🔄 強制更新也在「備份」分頁（不用家長密碼）：設了家長密碼也能直接點備份分頁看到強制更新；設定頁也還在
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), close = () => { closeGameWindow(); document.getElementById('modal').hidden = true; };
    try {
    const c = restCfg(); const pin0 = c.pin; c.pin = '1234';
    document.querySelector('#tabs button[data-tab="backup"]').click(); await w(300);
    const btns = () => [...document.querySelectorAll('button')].filter(b => /強制更新/.test(b.textContent) && b.offsetParent);
    o.noPinAsked = !document.querySelector('.pin-pad, input[type="password"], .modal-card .pin') || document.getElementById('modal').hidden;
    o.inBackup = btns().length === 1;
    o.versionShown = /這一份的日期/.test(document.body.textContent);
    c.pin = pin0; parentOkUntil = Date.now() + 60000; openTab('save'); await w(300); o.stillInSettings = btns().length === 1;
    openTab('inv');
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
