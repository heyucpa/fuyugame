// 🕐 天色跟著玩的時間：一開始是早上、25 分鐘傍晚、30 分鐘晚上、40 分鐘天亮；離開 20 分鐘重來；每 15 秒累積；切回真實時間；存檔檢查
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
    ISL_HOUR_TEST = null; delete G.realClock; const now = Date.now(), at = m => { G.playClock = { m, at: Date.now() }; return islPhase(); };
    delete G.playClock; o.startMorning = islPhase() === 'morning' && Math.abs(islHour() - 7) < .1;
    o.day = at(12) === 'day'; o.evening = at(27) === 'evening'; o.night = at(33) === 'night' && islHour() >= 19; o.lateNight = at(38) === 'night'; o.dawnAgain = at(41) === 'morning';
    G.playClock = { m: 33, at: now - 25 * 60e3 }; o.resetAfterAway = islPhase() === 'morning' && G.playClock.m === 0;
    G.playClock = { m: 33, at: now - 5 * 60e3 }; o.keepAfterReload = islPhase() === 'night';
    G.playClock = { m: 10, at: now - 30e3 }; playClockTick(); o.tickAdds = Math.abs(G.playClock.m - 10.5) < .02;
    G.playClock = { m: 10, at: now - 15 * 60e3 }; playClockTick(); o.tickCapped = G.playClock.m <= 11.001;
    G.playClock = { m: 33, at: now }; G.realClock = 1; const d = new Date(); o.realClock = Math.abs(islHour() - (d.getHours() + d.getMinutes() / 60)) < .05; delete G.realClock;
    G.playClock = { m: 33, at: now }; requestDraw(); await w(300); o.roomTintNight = !document.getElementById('dayTint').hidden;
    G.playClock = { m: 5, at: Date.now() }; requestDraw(); await w(300); o.roomDayClear = document.getElementById('dayTint').hidden;
    const n1 = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { playClock: { m: -5, at: 'x' }, realClock: 'yes' })); o.saveClean = n1.playClock === undefined && n1.realClock === undefined;
    const n2 = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { playClock: { m: 12.5, at: now, junk: 1 }, realClock: 1 })); o.saveKeep = n2.playClock.m === 12.5 && !('junk' in n2.playClock) && n2.realClock === 1;
    openTab('save'); await w(200); o.settingBtn = [...document.querySelectorAll('button')].some(b => /玩 30 分鐘變晚上/.test(b.textContent));
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
