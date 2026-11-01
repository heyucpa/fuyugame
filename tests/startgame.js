// 🏁 起跑反應王：點起跑架會開；太早按是偷跑；聽到嗶再按有反應時間、比同學快算贏；比 5 次給錢；高手有假動作（假動作時按也是偷跑）
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {}, until = async (f, ms) => { const t = performance.now(); while (!f() && performance.now() - t < ms) await wait(20); return f(); };
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true;
    o.blocks = typeof ACTIVITIES.crouch.open === 'function' && FURNITURE_ACT.tr_blocks === 'crouch';
    ACTIVITIES.crouch.open(); await wait(100); o.opens = /起跑反應王/.test(document.getElementById('modalCard').textContent);
    document.querySelectorAll('.lv-btn')[0].click(); await wait(100); const S = playStartGame.test;
    await until(() => S.st().ph === 'set', 3000); S.go(); o.falseStart = S.st().falses === 1 && S.st().ph === 'false';
    const b0 = G.bells;
    for (let r = 1; r < 5; r++) { await until(() => S.st().n === r && S.st().ph !== 'false', 5000); await until(() => S.st().ph === 'go', 8000); S.go(); if (r === 1) o.react = S.st().react > 0 && S.st().react < .2 && S.st().wins === 1; await wait(50); }
    await until(() => /比了 5 次/.test(document.querySelector('.game-status').textContent), 8000);
    o.done = /比了 5 次，4 次第一個衝出去/.test(document.querySelector('.game-status').textContent) && G.bells > b0;
    closeGameWindow();
    // 高手：假動作
    openStartGame(); await wait(100); document.querySelectorAll('.lv-btn')[2].click(); await wait(100); const H = playStartGame.test;
    let sawFake = false; for (let k = 0; k < 6 && !sawFake; k++) { await until(() => H.st().ph === 'set', 4000); if (H.st().fakeKind) sawFake = true; else { await until(() => H.st().ph === 'go', 6000); H.go(); await until(() => H.st().ph === 'ready', 4000); } }
    o.fakeExists = sawFake; closeGameWindow();
    return o;
  });
  console.log(JSON.stringify(o));
  const ok = Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
