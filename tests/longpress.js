// 📱 iPad 長按不跳出「拷貝／貼上」：整個畫面不能選字、不跳系統選單；輸入框、邀請卡連結框還是可以選、可以貼
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1500);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const o = {}, us = el => getComputedStyle(el).webkitUserSelect || getComputedStyle(el).userSelect, co = el => getComputedStyle(el).webkitTouchCallout;
    G.guide = 'done'; $('#modal').hidden = true; openTab('inv');
    const n = document.querySelector('#tabBody .note') || document.querySelector('#tabBody h3');
    o.body = us(document.body) === 'none'; o.text = us(n) === 'none';
    o.callout = co(document.body) === 'none' || co(document.body) === undefined;
    // 試著選字：不會被選到
    const r = document.createRange(); r.selectNodeContents(n); const ev = new Event('selectstart', { bubbles: true, cancelable: true }); n.dispatchEvent(ev); o.selectBlocked = ev.defaultPrevented;
    // 長按跳的選單：擋掉
    const cm = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); n.dispatchEvent(cm); o.menuBlocked = cm.defaultPrevented;
    // 輸入框、邀請卡框還是可以選、貼上
    openInvitePaste(); const ta = document.querySelector('#modalCard textarea');
    o.taSelect = us(ta) === 'text'; const ev2 = new Event('selectstart', { bubbles: true, cancelable: true }); ta.dispatchEvent(ev2); o.taAllowed = !ev2.defaultPrevented;
    const cm2 = new MouseEvent('contextmenu', { bubbles: true, cancelable: true }); ta.dispatchEvent(cm2); o.taMenu = !cm2.defaultPrevented;
    $('#modal').hidden = true;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
