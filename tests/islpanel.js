// ☰ 在外面（小島）左邊選單預設收起來、地圖變大；按「☰ 選單」打開、「◀ 收起選單」收起；點分頁會自動打開；回家選單回來
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)), vis = () => getComputedStyle($('.panel')).display !== 'none';
    G.guide = 'done'; $('#modal').hidden = true;
    o.homeShown = vis();
    openIsland(); await wait(200); const w0 = isl.cv.clientWidth;
    o.collapsed = !vis(); const btn = document.getElementById('islMenuBtn'); o.btn = /選單/.test(btn.textContent);
    btn.click(); await wait(100); o.open = vis() && /收起/.test(btn.textContent) && isl.cv.clientWidth < w0;
    btn.click(); await wait(100); o.close = !vis();
    openTab('dress'); await wait(100); o.tabOpens = vis();
    o.roomFreed = document.getElementById('view').width <= 1 && isl.cv.width <= Math.ceil(isl.cv.clientWidth * 1.5) + 1;   // 在外面：房間畫布先還記憶體、小島最多 1.5 倍
    closeIsland(); await wait(100); o.back = vis() && !document.body.classList.contains('isl-out');
    await wait(400); o.roomBack = document.getElementById('view').width > 100;
    // 在家：寬螢幕可以把整個選單收起來（記住），按「☰ 選單」打開；在外面按「☰ 選單」就算家裡收起來也打開
    setBigRoom(false); $('#btnZoom').click(); await wait(80); o.homeHide = !vis() && /選單/.test($('#btnZoom').textContent) && localStorage.getItem(BIG_KEY) === '1';
    openIsland(); await wait(100); document.getElementById('islMenuBtn').click(); await wait(80); o.islOverride = vis(); closeIsland(); await wait(80); o.homeStillHidden = !vis();
    $('#btnZoom').click(); await wait(80); o.homeShow = vis() && /收起/.test($('#btnZoom').textContent);
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
