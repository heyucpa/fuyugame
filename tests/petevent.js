// 🐾 寵物的事件：肚子痛、追蝴蝶跑不見（猜錯會說這裡沒有）、學新把戲、泥巴打滾，從過場一路到結局；有朋友在不會發生、蛋不會發生；一天上限；存檔驗證
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
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.away = null; G.pev = {}; G.pet.stage = 'adult'; vis.who = null; vis.state = 'none';
    const run = async kind => { const b0 = G.bells; petEvStart(kind); const intro = !!document.getElementById('vevScene') && document.querySelector('.vev-cap').textContent.length > 4; sc(); await w(50); let steps = 0;
      while (vev && vev.step === 'chain' && steps < 10) { const bs = [...bar().querySelectorAll('.vev-act')]; bs[0].click(); steps++; await w(50); }
      await w(1000); const endScene = !!document.getElementById('vevScene'); sc(); sc(); await w(50); return intro && endScene && !vev && G.bells > b0; };
    o.sick = await run('petsick'); o.trick = await run('pettrick'); o.mud = await run('petmud');
    petEvStart('petlost'); sc(); await w(50); bar().querySelector('.vev-act').click(); await w(50); bar().querySelector('.vev-act').click(); await w(50);
    const wrong = [...bar().querySelectorAll('.vev-act')].find(x => /垃圾桶/.test(x.textContent)); wrong.click(); await w(50); o.lostWrong = vev && vev.ci === 2 && /這裡沒有/.test(fufu.say || fufu.sayText || JSON.stringify(fufu.speech || '') + document.body.textContent);
    vevKeyUse(); await w(1000); sc(); sc(); await w(50); o.lostDone = !vev && G.pev.done === 4;
    o.dayCap = pevCanStart() === false;
    G.pev = {}; o.canStart = pevCanStart() === true;
    vis.who = NEIGHBORS[0]; vis.state = 'visit'; o.noWithFriend = pevCanStart() === false; vis.who = null; vis.state = 'none';
    G.pet.stage = 'egg'; o.noEgg = pevCanStart() === false && petEvStart('petsick') === false; G.pet.stage = 'adult';
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { pev: { d: '2026-11-22', n: 1, last: 'petmud', done: 3, x: 1 } }));
    o.save = JSON.stringify(n.pev) === JSON.stringify({ d: '2026-11-22', n: 1, last: 'petmud', done: 3 }) && normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { pev: { last: 'boom' } })).pev.last === undefined;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
