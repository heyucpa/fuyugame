// 📜 聖誕老公公的任務：五種任務都能接（過場）→ 大地圖找東西（小麋鹿會跟著走）→ 回聖誕老公公家門口完成（星星 +2、💰、借雪橇進度）；一天一個；聖誕節以外沒有；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), sc = () => { const s = document.getElementById('vevScene'); if (s) vevScene.test.close(); };
    try {
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.xmas = { stars: 0, got: [] }; SEASON_TODAY = [12, 5]; islMapCache = null;
    host.n = HOSTS.santa; o.menu = hostMenuEntries().some(e => /聖誕老公公的任務/.test(e[0]));
    o.allKinds = true;
    for (const kind of Object.keys(SANTA_MIS)) {
      G.xmas.mis = { d: today(), kind, done: 0 }; const st0 = G.xmas.stars, b0 = G.bells, gv0 = G.xmas.gave || 0;
      santaMisOpen(); const intro = !!document.getElementById('vevScene'); sc(); sc(); await w(50);
      openIsland(); await w(900); santaMisTick(); await w(50);
      if (kind === 'deer') { const d = smis.deer; isl.x = d.x; isl.y = d.y; await w(300); if (!smis.deer.follow) o.allKinds = false; isl.x += 3; await w(400); if (Math.hypot(smis.deer.x - isl.x, smis.deer.y - isl.y) > 2.5) { o.deerFollow = false; } }
      else { if (smis.items.length !== SANTA_MIS[kind].n) o.allKinds = false; for (const it of smis.items) { isl.x = it.x; isl.y = it.y; await w(120); } }
      const back = smis && smis.back; try { santaMisDraw(isl.cv.getContext('2d'), performance.now()); } catch (e) { o.drawErr = e.message; }
      islEnter('santa'); await w(500); const endScene = !!document.getElementById('vevScene'); sc(); sc(); await w(100); document.querySelectorAll('#showcase').forEach(x => x.remove());
      const ok = intro && back && endScene && !smis && G.xmas.mis.done === 1 && G.xmas.stars === st0 + 2 && G.bells >= b0 + 150 && G.xmas.gave === gv0 + 1;
      if (!ok) { o.allKinds = false; o['fail_' + kind] = [intro, back, endScene, !smis, G.xmas.mis.done, G.xmas.stars - st0].join(); }
      if (isl) closeIsland(); G.away = null; await w(200); document.getElementById('modal').hidden = true;
    }
    if (o.deerFollow === undefined) o.deerFollow = true;
    santaMisOpen(); await w(50); o.oncePerDay = !document.getElementById('vevScene') && !smis;
    o.label = /✅/.test(santaMisLabel());
    SEASON_TODAY = [1, 5]; o.offSeason = santaMisLabel() === ''; SEASON_TODAY = [12, 5];
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { xmas: { stars: 1, got: [], mis: { d: '2026-12-05', kind: 'bells', done: 1 }, misLast: 'deer' } }));
    o.save = n.xmas.mis && n.xmas.mis.kind === 'bells' && n.xmas.misLast === 'deer' && normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { xmas: { mis: { d: 'x', kind: 'boom', done: 1 } } })).xmas.mis === undefined;
    SEASON_TODAY = null;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
