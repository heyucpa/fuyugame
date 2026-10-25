// 📲 iPad 收邀請卡少一步：小屋 App 從背景回來會出現「📥 打開剛剛複製的邀請卡」，點了讀剪貼簿收下（不碰存檔）；剪貼簿不是邀請卡就不動；
// 「收到邀請卡」也有「📋 用剛剛複製的」；🏡 快速出門去朋友家要坐船
const { chromium } = require('playwright');
const path = require('path');
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  // 先在另一個存檔做一張邀請卡（姊姊的）
  const c1 = await b.newContext({ viewport: { width: 1100, height: 820 } }); const p1 = await c1.newPage();
  await p1.goto('file://' + path.resolve(__dirname, '../house.html')); await p1.waitForTimeout(1500);
  const link = await p1.evaluate(async () => { G.inviteFrom = '姊姊'; return inviteLink(await encodeInvite(makeInvite())); });
  await c1.close();
  const c2 = await b.newContext({ viewport: { width: 1100, height: 820 }, userAgent: IPAD });
  await c2.addInitScript(([lk]) => { Object.defineProperty(navigator, 'standalone', { value: true }); window.__clip = 'hello'; Object.defineProperty(navigator, 'clipboard', { value: { readText: async () => window.__clip, writeText: async t => { window.__clip = t; } } }); window.__link = lk; }, [link]);
  const p = await c2.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1500);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; $('#modal').hidden = true;
    const save0 = localStorage.getItem(SAVE_KEY); G.bells = 777; saveGame(); const s1 = localStorage.getItem(SAVE_KEY);
    // 剪貼簿不是邀請卡：不動
    showClipPill(); o.pill = !!document.getElementById('clipInvite');
    o.notInvite = (await openClipInvite(true)) === false && loadInvites().length === 0;
    // 從 Safari 複製了邀請卡 → 回來點按鈕
    window.__clip = window.__link; o.opened = await openClipInvite(true); await wait(800);
    o.got = loadInvites().length === 1 && /姊姊/.test(JSON.stringify(loadInvites()[0]));
    o.saveSame = JSON.parse(localStorage.getItem(SAVE_KEY)).bells === 777;
    $('#modal').hidden = true; SC_QUEUE.length = 0; const sc = document.getElementById('showcase'); if (sc) sc.remove(); const ia = document.getElementById('isleAnim'); if (ia) ia.remove();
    // 收到邀請卡畫面有「用剛剛複製的」
    openInvitePaste(); o.clipBtn = [...document.querySelectorAll('#modalCard button')].some(x => /剛剛複製/.test(x.textContent)); $('#modal').hidden = true;
    // 快速出門去朋友家：坐船
    friendByBoat(0); await wait(200); o.boat = !!(isl && isl.act && isl.act.kind === 'boat');
    for (let i = 0; i < 150 && isl; i++) await wait(100);
    o.arrivedFriend = !isl && G.away && G.away.place === 'friend';
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = out.pill && out.notInvite && out.opened && out.got && out.saveSame && out.clipBtn && out.boat && out.arrivedFriend && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
