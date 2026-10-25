// 🔒 設定整頁上鎖：點「⚙️ 設定」要密碼（沒密碼就算數學題）、錯了進不去、對了進去後裡面不再重複問、換分頁重新上鎖；其他分頁、備份照常
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
    G.guide = 'done'; $('#modal').hidden = true;
    const btn = n => document.querySelector(`#tabs button[data-tab="${n}"]`), pinBox = () => document.getElementById('pinBox');
    const type = async v => { const inp = pinBox().querySelector('input'); inp.value = v; [...pinBox().querySelectorAll('button')].find(x => /確定|好|OK/.test(x.textContent)).click(); await wait(100); };
    // 沒有密碼：算數學題
    const c = restCfg(); c.pin = ''; saveRestCfg(c);
    btn('shop').click(); await wait(50); btn('save').click(); await wait(100);
    o.asked = !!pinBox() && tab !== 'save';
    await type('1'); o.wrongStays = tab !== 'save';
    btn('save').click(); await wait(100); await type(String(settingsGate.test)); o.mathIn = tab === 'save';
    // 有密碼
    btn('shop').click(); await wait(50); const c2 = restCfg(); c2.pin = '2468'; saveRestCfg(c2);
    btn('save').click(); await wait(100); await type('1111'); o.badPin = tab !== 'save';
    btn('save').click(); await wait(100); await type('2468'); o.pinIn = tab === 'save';
    // 裡面的按鈕不再問
    let asked = false; askPin('修改台詞', () => { asked = true; }); await wait(50); o.innerNoAsk = asked && !pinBox();
    // 換分頁重新上鎖
    btn('inv').click(); await wait(50); btn('save').click(); await wait(100); o.relock = !!pinBox() && tab !== 'save'; pinBox().remove();
    // 備份分頁照常進得去
    btn('backup').click(); await wait(50); o.backup = tab === 'backup';
    // 備份裡危險的還是要密碼
    let ok2 = false; askPin('用備份蓋掉現在的進度', () => { ok2 = true; }); await wait(50); o.backupStillPin = !ok2 && !!pinBox(); if (pinBox()) pinBox().remove();
    const c3 = restCfg(); c3.pin = ''; saveRestCfg(c3);
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
