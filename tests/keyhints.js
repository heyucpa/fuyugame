// ⌨️ 按鍵旁邊標示鍵盤：電腦（有滑鼠）看得到 X、C、空白…；iPad（手指）不顯示
const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const errs = [];
  const check = async ctxOpt => {
    const p = await (await b.newContext(ctxOpt)).newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
    try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
    return p.evaluate(() => { G.guide = 'done'; $('#modal').hidden = true; questState().mode = 'normal'; playQuest('1-1');
      const j = document.querySelector('.quest-btn.qb-j'), f = document.querySelector('.qb-fire'), after = getComputedStyle(j, '::after').content;
      const r = { jump: j.dataset.key, fire: f.dataset.key, shown: after && after !== 'none' && after !== 'normal' }; closeGameWindow(); return r; });
  };
  const pc = await check({ viewport: { width: 1366, height: 768 } });
  const pad = await check(Object.assign({}, devices['iPad (gen 7) landscape']));
  const o = { keys: pc.jump === '空白' && pc.fire === 'X', pcShown: pc.shown, padHidden: !pad.shown };
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
