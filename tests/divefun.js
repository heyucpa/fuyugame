// 🌊 跳水多 3 種玩法：選單有三個新玩法、原本花式還在；💣 抱球水花比較大、朋友會濕；🎯 力量決定落點、跳進泳圈得分；🤪 擺越多種姿勢分數越高；三種都玩得完、給錢
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true;
    openJumpDive(); await wait(100);
    o.menu = document.querySelectorAll('.dive-mode').length === 3 && document.querySelectorAll('.lv-btn').length === 3;
    // 💣：不抱 vs 抱
    document.querySelectorAll('.dive-mode')[0].click(); await wait(100); document.querySelectorAll('.lv-btn')[2].click(); await wait(100); let D = playDiveFun.test;
    D.go(); await wait(2600); const s1 = D.st().best; await wait(2800);
    D.go(); await wait(150); D.go(); await wait(2500); const s2 = D.st().best; o.bomb = s2 > s1 + 40; await wait(3000);
    D.go(); await wait(2600); await wait(3000); o.bombDone = /最大的水花/.test(document.querySelector('.game-status').textContent);
    closeGameWindow();
    // 🎯：力量對準泳圈
    openDiveMode('ring'); await wait(100); document.querySelectorAll('.lv-btn')[0].click(); await wait(100); D = playDiveFun.test;
    const f = D.floats[0]; f.v = 0; D.floats.forEach(x => { if (x !== f) x.v = 0, x.x = 5000; });
    const W = 480, PX = 118; D.setPower((f.x - PX - 60) / (W - 150 - PX - 60)); D.go(); await wait(2000); o.ringHit = D.st().total === f.pts;
    await wait(2700); f.x = 300; D.setPower(0); D.go(); await wait(2000); o.ringMiss = D.st().total === f.pts;
    closeGameWindow();
    // 🤪：四種姿勢
    openDiveMode('pose'); await wait(100); document.querySelectorAll('.lv-btn')[1].click(); await wait(100); D = playDiveFun.test;
    D.go(); await wait(200); o.poseBtns = [...document.querySelectorAll('.dive-pose')].every(x => !x.disabled);
    ['star', 'flamingo', 'duck', 'rocket'].forEach(k => D.doPose(k)); await wait(3000); const t1 = D.st().total; o.poseAll = t1 >= 4 + 8 + 4;
    await wait(2700); D.go(); await wait(200); D.doPose('star'); D.doPose('star'); await wait(3000); o.poseVariety = D.st().total - t1 < t1;
    await wait(2700); const b0 = G.bells; D.go(); await wait(3000); await wait(2800); o.poseDone = G.bells > b0 && [...document.querySelectorAll('#modalCard button')].some(x => /換別的跳水玩法/.test(x.textContent));
    closeGameWindow();
    // 原本的花式還能玩
    openJumpDive(); await wait(100); document.querySelectorAll('.lv-btn')[0].click(); await wait(100); o.classic = !!playJumpDive.test && playJumpDive.test.st().ph === 'stand'; closeGameWindow();
    return o;
  });
  console.log(JSON.stringify(o));
  const ok = Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
