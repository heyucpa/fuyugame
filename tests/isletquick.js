// 🏝️ 快速出門可以去闖關送的小島：沒破關不出現；破關後出現，點了會坐船到那座島
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
    openTravelMenu(); o.hiddenBefore = !/花花島/.test($('#modalCard').innerText); $('#modal').hidden = true;
    questState().clear['1-3'] = 1; islMapCache = null;
    openTravelMenu(); const btn = [...document.querySelectorAll('#modalCard .place-pick')].find(x => /花花島/.test(x.innerText)); o.shown = !!btn && !/糖果島/.test($('#modalCard').innerText);
    btn.click(); await wait(300); o.onIsland = !!isl;
    for (let i = 0; i < 200 && isl && (isl.boat || isl.path.length || isl.afterBoat); i++) await wait(100);
    const sp = isl.m.specials.find(x => x.id === 'flower'); o.near = Math.hypot(isl.x - sp.x - .5, isl.y - sp.y - .5) < 2.5; o.pos = [isl.x, isl.y, sp.x, sp.y];
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = out.hiddenBefore && out.shown && out.onIsland && out.near && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
