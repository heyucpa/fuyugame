// 📥「打開剛剛複製的邀請卡」不要一直跳：離開 5 秒～15 分鐘才跳、30 分鐘內一次、按 ✕ 七天不跳、太久沒回來不跳
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  const o = await p.evaluate(() => {
    const o = {}, pill = () => !!document.getElementById('clipInvite'), clear = () => { const x = document.getElementById('clipInvite'); if (x) x.remove(); };
    window.isIosApp = () => true; localStorage.removeItem(CLIP_PILL_KEY);
    showClipPill(2000); o.short = !pill();
    showClipPill(60000); o.minute = pill(); clear();
    showClipPill(60000); o.cap30 = !pill();
    clipPillSet({ last: 0 }); showClipPill(3600000); o.longAway = !pill();
    showClipPill(60000); document.querySelector('#clipInvite .clip-x').click(); o.xMute = !pill() && clipPillGet().muteUntil > Date.now() + 6 * 864e5;
    clipPillSet({ last: 0 }); showClipPill(60000); o.muted = !pill();
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
