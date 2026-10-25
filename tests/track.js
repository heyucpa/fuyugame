// 🏅 運動島＋🏟️ 田徑場：游泳池、跆拳道館、田徑場都在運動島上（走木橋到得了）；百米衝刺（偷跑重來、跑完有名次、破紀錄）、大隊接力（完美交棒、掉棒）、跳遠紀錄；房間裡的東西都能點
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
    islMapCache = null; const m = islMap(0), sp = ['pool', 'dojo', 'track'].map(id => m.blds.find(b => b.id === id));
    o.onSportIsle = sp.every(b => b && b.islet);
    const home = m.blds.find(b => b.id === 'home');
    o.walkable = sp.every(b => { const pth = islFindPath(m, home.door[0], home.door[1], (x, y) => x === b.door[0] && y === b.door[1]); const l = pth && pth[pth.length - 1]; return l && l[0] === b.door[0] && l[1] === b.door[1]; });
    // 百米：偷跑
    openSprint(); await wait(50); document.querySelectorAll('.lv-row button')[1].click(); await wait(200);
    playSprint.test.press('L'); o.falseStart = playSprint.test.phase() === 'false'; await wait(1600);
    for (let i = 0; i < 40 && playSprint.test.phase() !== 'go'; i++) await wait(100);
    let f = 'L'; const iv = setInterval(() => { playSprint.test.press(f); f = f === 'L' ? 'R' : 'L'; }, 110);
    for (let i = 0; i < 150 && !/秒/.test(document.querySelector('.game-status').textContent); i++) await wait(100);
    clearInterval(iv); o.sprint = /名/.test(document.querySelector('.game-status').textContent) && trackState().best > 0; closeGameWindow();
    // 接力：掉棒（不按交棒）
    openRelay(); await wait(50); document.querySelectorAll('.lv-row button')[1].click(); await wait(100);
    let ff = 'L'; const iv2 = setInterval(() => { playRelay.test.run1(ff); ff = ff === 'L' ? 'R' : 'L'; }, 100);
    for (let i = 0; i < 80 && !playRelay.test.st().passed.length; i++) await wait(100);
    o.drop = playRelay.test.st().passed[0] === 'drop'; clearInterval(iv2); closeGameWindow();
    // 跳遠紀錄
    openLongJump(); await wait(50); for (let k = 0; k < 3; k++) { const z = meterRound.test.zone(); meterRound.test.setPos(z[0] + z[1] / 2); meterRound.test.hit(); await wait(1800); }
    o.lj = trackState().lj > 3; closeGameWindow();
    // 房間
    travelArrive('track'); await wait(300); $('#modal').hidden = true;
    o.host = host.n && host.n.id === 'track' && hostMenuEntries().some(e => /百米/.test(e[0]));
    o.usable = curRoom().items.every(it => canUse(it) || FURN_BY_ID[it.id].layer === 'floor' && FURNITURE_ACT[it.id]);
    o.quick = allQuickGames().some(g => g.name === '大隊接力' && g.where === 'track');
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.track && raw.track.best > 0;
    o.bad = normalizeSave(Object.assign({}, raw, { track: { best: 'x', lj: 999 } })).track.best == null;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
