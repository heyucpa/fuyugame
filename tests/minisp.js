// 💥 其他小遊戲的必殺技：籃球比賽「彩虹灌籃」（進 2 球）、桌球「火焰殺球」（對手接不到）、打水比賽「海豚衝刺」（衝很遠）、打地鼠「大槌地震」（全部打到＋3）
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
    // ⛹️ 彩虹灌籃
    openBball(); document.querySelectorAll('.lv-btn')[1].click(); await wait(200);
    const B = playBball.test; for (let i = 0; i < 40 && B.st().phase !== 'atk'; i++) await wait(100);
    B.setPw(100); await wait(50); B.dunk(); o.bbCut = B.st().phase === 'cut';
    for (let i = 0; i < 40 && B.st().score[0] < 2; i++) await wait(100); o.bbDunk = B.st().score[0] === 2 && B.dunks() === 1; closeGameWindow();
    // 🏓 火焰殺球：自動接球，能量滿就殺球 → 我們得分
    openPingPong(); document.querySelectorAll('.lv-btn')[1].click(); await wait(200);
    const P = playPingPong.test; P.setAuto(true); P.setPw(100); P.arm();
    for (let i = 0; i < 120 && P.st().score[0] < 1; i++) await wait(100); o.ppSmash = P.smashes() === 1 && P.st().score[0] >= 1; closeGameWindow();
    // 🐬 海豚衝刺
    openSwimRace(); document.querySelectorAll('.lv-btn')[0].click(); await wait(100);
    const S = playSwim.test; S.start(); await wait(100); const m0 = S.me(); S.setPw(100); S.special(); await wait(2400); o.swimDash = S.dashes() === 1 && S.me() - m0 > 5; closeGameWindow();
    // 🔨 大槌地震
    openMoleGame(); document.querySelectorAll('.lv-btn')[0].click(); await wait(800);
    const M = playMole.test, s0 = M.score(); M.setPw(100); M.quake(); o.cut = !!document.querySelector('.sp-cut'); await wait(1400); o.moleQuake = M.quakes() === 1 && M.score() >= s0 + 3 && !M.holes.some(h => h.kind === 'mole' && false); closeGameWindow();
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
