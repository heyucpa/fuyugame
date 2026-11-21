// 🎬 事件第二批：感冒、生日（選蛋糕）、淋雨、吵架（選不好的會被提醒）都能從過場一路做到結局；空白鍵按好的選項；大地圖流星雨許願、熱氣球；一天上限；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), bar = () => document.getElementById('vevBar'), sc = () => { const s = document.getElementById('vevScene'); if (s) vevScene.test.close(); };
    try {
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.away = null; G.vev = {}; NEIGHBORS.forEach(n => { G.friends[n.id] = 3; });
    const arrive = () => { vis.who = null; vis.state = 'none'; visitorArrive(performance.now()); vis.alpha = 1; vis.a.path = []; document.querySelectorAll('#showcase').forEach(x => x.remove()); };
    const run = async kind => { arrive(); vevStart(kind); const intro = !!document.getElementById('vevScene'); sc(); await w(50); let steps = 0;
      while (vev && vev.step === 'chain' && steps < 10) { const bs = [...bar().querySelectorAll('.vev-act')]; bs[0].click(); steps++; await w(50); }
      await w(1000); const endScene = !!document.getElementById('vevScene'); sc(); sc(); await w(50); return intro && endScene && !vev && steps >= 3; };
    o.sick = await run('sick'); o.bday = await run('bday'); o.rain = await run('rain');
    // 吵架：先選不好的
    arrive(); vevStart('fight'); sc(); await w(50); o.fightOther = !!vev.other && vev.other !== vev.n;
    const bad = [...bar().querySelectorAll('.vev-act')].find(x => /不要理他/.test(x.textContent)); bad.click(); await w(50); o.fightBadStays = vev.ci === 0 && /再想想/.test(vis.say || '');
    vevKeyUse(); await w(50); o.spaceGood = vev.ci === 1;
    vevKeyUse(); await w(1000); sc(); sc(); await w(50); o.fightDone = !vev && vis.did.vev === 'fight';
    o.count = G.vev.done === 4;
    // 大地圖
    G.islEv = {}; openIsland(); await w(900);
    const inv0 = Object.keys(G.inv).length; islEvStart('meteor'); o.meteorScene = /流星/.test(document.body.textContent); sc(); sc(); await w(100);
    const wish = [...document.querySelectorAll('#modalCard button')].find(x => /玩具/.test(x.textContent)); o.wishCard = !!wish; wish.click(); await w(200);
    o.wished = Object.keys(G.inv).length > inv0 || G.bells > 0; document.querySelectorAll('#showcase').forEach(x => x.remove());
    const b0 = G.bells; islEvStart('balloon'); sc(); sc(); sc(); await w(100); o.balloon = G.bells === b0 + 150 && G.islEv.n === 2;
    const n0 = G.islEv.n; for (let i = 0; i < 5; i++) { islEvNext = 1; islEvTick(); } o.dayCap = G.islEv.n === n0 && !document.getElementById('vevScene');
    closeIsland(); await w(200); document.getElementById('modal').hidden = true;
    const nn = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { islEv: { d: 'x', n: -1 }, vev: { last: 'bday', n: 1 } }));
    o.save = nn.islEv === undefined && nn.vev.last === 'bday';
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
