// 舊地方的事件：阿婆家大野狼假扮阿婆（接對打）、烏鴉、叔叔家強盜（先報警再對打）、公園松鼠和野餐大會、遊樂園摩天輪；一天最多兩封信；存檔檢查
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
      G.guide = 'done';
      const ids = ['wolfgran', 'crow', 'robber', 'acorn', 'picnic', 'ferris'];
      o.reqs = ids.every(id => HELP_REQS[id] && PLACES[HELP_REQS[id].place] && HELP_REQS[id].steps.length >= 2);
      o.oldPlaces = ['grandma', 'uncle', 'park'].every(pl => ids.some(id => HELP_REQS[id].place === pl));
      o.battles = !!EVENT_BATTLES.wolfgran && !!EVENT_BATTLES.robber && HELP_REQS.wolfgran.battle === 'wolfgran' && HELP_REQS.robber.battle === 'robber';
      const h = helpState(); h.list = []; h.done = {}; const b0 = G.bells;
      helpRun('robber'); await w(300); helpRun.test.pick(0); o.mustCallPolice = helpRun.test.k === 0; helpRun.test.pick(1); await w(1100); helpRun.test.pick(0); await w(1800);
      const T = openStoryBattle.test; o.battleStarts = !!T && !T.over;
      T.foe.hp = 1; T.act(0); for (let i = 0; i < 20 && !T.over; i++) await w(150);
      const cont = [...document.querySelectorAll('button')].find(b => /繼續/.test(b.textContent)); o.continueBtn = !!cont; cont && cont.click(); await w(600);
      o.helpEnded = (helpState().done.robber || 0) === 1 && G.bells > b0;
      document.querySelectorAll('#vevScene').forEach(e => e.remove());
      h.d = today(); h.dn = 1; o.secondLetterOk = !((h.d === today() && (h.dn || 0) >= 2));
      h.dn = 2; o.thirdBlocked = (h.d === today() && (h.dn || 0) >= 2);
      const bad = JSON.parse(JSON.stringify(G)); bad.help = { list: ['robber', 'nope'], done: { picnic: 2, x: 1 }, d: today(), dn: 'x' }; const nh = normalizeSave(bad).help;
      o.saveClean = nh.list.join() === 'robber' && nh.done.picnic === 2 && !('x' in nh.done) && nh.dn === undefined;
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
