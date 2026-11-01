// 📋 當機紀錄：JS 錯誤會記（含之前在做什麼）、同一個錯誤一直跳只算次數、上次沒有正常關掉會記、正常關掉不記、設定裡看得到、複製的文字有機器資訊、清得掉、最多 30 筆
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const url = 'file://' + path.resolve(__dirname, '../house.html');
  await p.goto(url); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = {};
  Object.assign(o, await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true; localStorage.removeItem(CRASH_KEY);
    openZhuyinGame(); closeGameWindow(); openTab('shop');
    setTimeout(() => { throw new Error('測試用的錯誤'); }, 0); await wait(50);
    for (let i = 0; i < 3; i++) setTimeout(() => { throw new Error('一直跳'); }, 0); await wait(50);
    const a = crashLogGet(); o.err = a.length === 2 && /測試用的錯誤/.test(a[0].msg) && a[0].did.some(x => /注音/.test(x)) && a[0].did.some(x => /分頁 shop/.test(x));
    o.count = a[1].n === 3;
    for (let i = 0; i < 40; i++) crashLog('錯誤', 'x' + i); o.cap = crashLogGet().length === 30;
    localStorage.removeItem(CRASH_KEY);
    return o;
  }));
  // 沒有正常關掉：假裝上次只留下「還活著」
  await p.evaluate(() => { localStorage.setItem(ALIVE_KEY, JSON.stringify({ t: Date.now() - 3000, clean: false, did: ['10:00:00 開 🗺️ 世界闖關'] })); });
  await p.evaluate(() => { window.__noBeat = 1; }); const p2 = await p.context().newPage();
  await p2.goto(url); await p2.waitForTimeout(1200);
  o.unclean = await p2.evaluate(() => { const a = crashLogGet(); return a.length === 1 && a[0].kind === '上次沒有正常關掉' && /世界闖關/.test(a[0].did.join()); });
  // 正常離開（切到背景）→ 下次不記
  await p2.evaluate(() => { localStorage.removeItem(CRASH_KEY); localStorage.setItem(ALIVE_KEY, JSON.stringify({ t: Date.now(), clean: true })); });
  const p3 = await p.context().newPage(); await p.close(); await p2.close(); await p3.goto(url); await p3.waitForTimeout(1200);
  o.clean = await p3.evaluate(() => crashLogGet().length === 0);
  try { await p3.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  Object.assign(o, await p3.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true; crashLog('錯誤', '看看');
    openTab('save'); await wait(200); const b = [...document.querySelectorAll('#tabBody button')].find(x => /當機紀錄（1 筆）/.test(x.textContent)); o.btn = !!b; b.click(); await wait(100);
    const t = document.querySelector('.crash-box').value; o.text = /當機紀錄/.test(t) && /螢幕/.test(t) && /看看/.test(t);
    [...document.querySelectorAll('#modalCard button')].find(x => /清掉/.test(x.textContent)).click(); await wait(50); o.cleared = crashLogGet().length === 0;
    return o;
  }));
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) ? '✅ 全部通過' : '❌ 有問題');
  await b.close();
})();
