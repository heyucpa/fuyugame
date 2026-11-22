// 🐭 小偷鼠一天最多 3 次、兩次至少隔 5 分鐘、舊存檔今天來過算 1 次；❄️ 聖誕節小島下雪一陣一陣；🔫 第一人稱沒有手臂
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), close = () => { closeGameWindow(); document.getElementById('modal').hidden = true; };
    try {
    const st = thiefState(); st.day = ''; delete st.cnt;
    o.fresh = thiefDayLeft() === 3;
    st.day = today(); delete st.cnt; o.oldSaveCountsOne = thiefDayLeft() === 2;
    st.day = ''; G.guide = 'done'; document.getElementById('modal').hidden = true;
    goHome(); for (let k = 0; k < 40 && G.away; k++) await w(100); document.querySelectorAll('#tripLayer,#showcase').forEach(x => x.remove()); document.getElementById('modal').hidden = true;
    { const room = curRoom(); room.items = [{ uid: 8801, id: 'dining_table', x: 2, y: 2, rot: 0, top: 'flower_vase' }]; }
    const now = () => performance.now();
    o.can0 = thiefCanCome(now() + 1e7);
    if (thiefStart(true)) { o.cnt1 = st.cnt === 1; thiefAct.on = false; o.gapBlocks = !thiefCanCome(now() + 60e3); o.afterGap = thiefCanCome(now() + 6 * 60e3); } else { o.cnt1 = 'no start'; }
    st.cnt = 3; o.maxThree = !thiefCanCome(now() + 1e7);
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { thief: { day: today(), cnt: 'x', n: 2, bag: [] } })); o.saveCnt = n.thief.cnt === undefined && n.thief.n === 2;
    // ❄️ 下雪一陣一陣
    const base = Math.floor(Date.now() / 300000) * 300000;
    o.snowOn = festSnowAmount(base + 50000) === 1; o.snowOff = festSnowAmount(base + 200000) === 0; o.snowFade = festSnowAmount(base + 3000) > 0 && festSnowAmount(base + 3000) < 1;
    o.noHand = FP_HAND === false && FP_GUN_S < 1;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
