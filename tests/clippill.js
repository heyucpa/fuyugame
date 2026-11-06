// 📥「打開剛剛複製的邀請卡」不要一直跳：離開 5 秒～15 分鐘才跳、30 分鐘內一次、按 ✕ 或收過邀請卡就再也不跳、太久沒回來不跳
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
    showClipPill(60000); document.querySelector('#clipInvite .clip-x').click(); o.xMute = !pill() && clipPillGet().done === 1;
    clipPillSet({ last: 0, muteUntil: 0 }); showClipPill(60000); o.muted = !pill();
    // 已經有邀請卡（舊存檔）：不跳，而且記成 done
    localStorage.removeItem(CLIP_PILL_KEY);
    window._li = loadInvites; window.loadInvites = () => [{ name: 'x' }];
    showClipPill(60000); o.hasInvite = !pill() && clipPillGet().done === 1;
    window.loadInvites = window._li;
    // 剪貼簿收下一張之後也不再跳
    localStorage.removeItem(CLIP_PILL_KEY); showClipPill(60000); o.freshShows = pill(); clear();
    clipPillSet({ done: 1 }); clipPillSet({ last: 0 }); showClipPill(60000); o.doneNever = !pill();
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
