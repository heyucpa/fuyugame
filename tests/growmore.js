// 🎂 ⭐⭐⭐ 以後繼續長大：成長條重新長、長滿送長大禮物、名字旁邊 🎂×N；每一階記日期；📸 點星星打開長大相簿；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    try {
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.kid.small = null;
    // 長到下一階：記日期
    G.kid.height = KID_STAGES[1].at - .1; G.kid.stageAt = {}; G.kidGrowDay = null; kidAddGrowth(.5); o.stageDate = G.kid.stageAt.school === today();
    // ⭐⭐⭐ 以後
    G.kid.height = KID_STAGES[2].at + 1; G.kid.over = 0; G.kid.bday = 0; G.kidGrowDay = null; const h0 = G.kid.height;
    kidAddGrowth(5); o.overGrows = G.kid.over === 5 && G.kid.height === h0 && Math.abs(kidGrowPct() - 5 / KID_OVER_NEED) < .001;
    const w0 = G.wardrobe.length, b0 = G.bells, inv0 = JSON.stringify(G.inv); G.kid.over = KID_OVER_NEED - 1; G.kidGrowDay = null; kidAddGrowth(3); await w(900);
    o.gift = G.kid.bday === 1 && G.kid.over === 2 && (G.wardrobe.length > w0 || G.bells > b0 || JSON.stringify(G.inv) !== inv0) && !!document.getElementById('showcase');
    document.querySelectorAll('#showcase').forEach(x => x.remove());
    updatePetCard && updatePetCard(); await w(100); o.label = /⭐⭐⭐🎂1/.test(document.getElementById('kidStageLbl').textContent);
    o.title = /長大禮物/.test(document.getElementById('kidGrowRow').title);
    // 每天上限一樣有效
    G.kidGrowDay = { d: today(), n: KID_GROW_DAY_MAX }; const ov = G.kid.over; kidAddGrowth(3); o.dayCap = G.kid.over === ov;
    // 相簿
    document.getElementById('kidStageLbl').click(); await w(100); const cells = document.querySelectorAll('#modalCard .grow-cell');
    o.album = !document.getElementById('modal').hidden && cells.length === 3 && /長大相簿/.test(document.querySelector('#modalCard h2').textContent) && /長大的/.test(cells[1].textContent) && /很久以前/.test(cells[2].textContent);
    document.getElementById('modal').hidden = true;
    // 存檔
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { kid: Object.assign({}, G.kid, { over: -3, bday: 2.5, stageAt: { big: '2026-11-22', bad: 'x', school: 5 } }) }));
    o.save = n.kid.over === undefined && n.kid.bday === undefined && JSON.stringify(n.kid.stageAt) === JSON.stringify({ big: '2026-11-22' });
    o.saveKeep = (() => { const m = normalizeSave(JSON.parse(JSON.stringify(G))); return m.kid.bday === 1 && m.kid.over === G.kid.over; })();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
