// 合併遊戲＋賽車場＋打雪仗：選單沒有重複（對打、跑步大會收好）、每個遊戲還在、打開選擇畫面；賽車場在地圖上、主人選單；賽車用改裝的顏色與貼紙；打雪仗冬天才有、雪地雪球、離開後籃球等不受影響
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
    document.getElementById('modal').hidden = true; G.guide = 'done';
    SEASON_TODAY = [11, 22]; const names = allQuickGames().map(g => g.name);
    o.noDup = !names.includes('對練') && !names.includes('對決') && !names.includes('百米衝刺') && !names.includes('起跑反應王') && !names.includes('跳遠') && !names.includes('大隊接力') && names.includes('對打（練習／比賽）') && names.includes('跑步大會');
    openFightChoice(); o.fight = document.querySelectorAll('#modalCard .lv-btn').length === 2; document.querySelectorAll('#modalCard .lv-btn')[0].click(); await w(200); o.sparOpen = /練|對/.test(document.querySelector('.game-card h2, .game-card').textContent); close();
    openRunMeet(); o.meet = document.querySelectorAll('#modalCard .lv-btn').length === 5; for (let i = 0; i < 5; i++) { openRunMeet(); document.querySelectorAll('#modalCard .lv-btn')[i].click(); await w(200); if (!document.querySelector('.game-card')) o['meetFail' + i] = true; close(); }
    o.funcs = ['openSparGame', 'openDuelGame', 'openSprint', 'openRelay', 'openLongJump', 'openStartGame', 'openRunGame'].every(f => typeof window[f] === 'function' || typeof eval(f) === 'function');
    // 賽車場
    islMapCache = null; o.raceway = islMap(0).blds.some(b => b.id === 'raceway') && !!PLACES.raceway && !!HOSTS.racer;
    host.n = HOSTS.racer; o.racerMenu = hostMenuEntries().some(e => /賽車/.test(e[0]));
    o.racewayHub = allQuickGames().some(g => g.where === 'raceway');
    G.vehicles = ['sports']; G.carLook = { sports: { c: 'pink', st: 'heart', gl: 'blue' } };
    openKart(); await w(100); const lvb = document.querySelector('#modalCard .lv-btn'); lvb.click(); await w(300);
    const btns = [...document.querySelectorAll('#modalCard .lv-btn')]; o.modLabel = btns.some(b => /🎨/.test(b.textContent));
    btns.find(b => /🎨/.test(b.textContent)).click(); await w(1500); o.kartRuns = !!document.querySelector('.game-card canvas'); close();
    // 打雪仗
    SEASON_TODAY = [8, 1]; o.snowOff = !allQuickGames().some(g => g.id === 'x:snowball');
    SEASON_TODAY = [1, 15]; o.snowOn = allQuickGames().some(g => g.id === 'x:snowball');
    openSnowball(); await w(100); document.querySelector('#modalCard .lv-btn').click(); await w(800); o.snowing = dbSnowOn === true && !!document.querySelector('.game-card canvas'); close(); o.snowReset = dbSnowOn === false;
    openDodge(); o.dodgeNormal = dbSnowOn === false; close();
    SEASON_TODAY = null;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
