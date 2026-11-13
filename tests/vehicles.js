// 🚗 交通工具＋⛵ 坐船：商店買、小島上騎（比較快、畫得出來）、下車；新小島走路到不了、坐船才到得了、坐回來
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
    shopKind = 'car'; openTab('shop'); await wait(100);
    o.cards = [...document.querySelectorAll('#tabBody .card')].map(c => c.textContent).filter(t => /腳踏車|休旅車|工程車|公車|跑車|機器人/.test(t)).length;
    G.bells = 2000; [...document.querySelectorAll('#tabBody .card')].find(c => /跑車/.test(c.textContent)).click(); o.noMoney = !(G.vehicles || []).includes('sports');
    [...document.querySelectorAll('#tabBody .card')].find(c => /腳踏車/.test(c.textContent)).click(); o.bought = (G.vehicles || []).includes('bike') && G.bells === 500 && G.ride === 'bike';
    SC_QUEUE.length = 0; const sc = document.getElementById('showcase'); if (sc) sc.remove(); $('#modal').hidden = true;
    [1, 2, 3].forEach(w => questState().clear[questBossId(w)] = 1); islMapCache = null;
    openIsland(); await wait(300);
    // 真的用手點：「🚲 交通工具」→ 選單看得到 → 換成別台、下車（家長：大地圖中無法切換交通工具）
    G.vehicles = ['bike', 'suv']; G.ride = null; islRideBtn();
    document.getElementById('islRide').click(); await wait(100);
    const mn = $('#itemMenu'), rr = mn.getBoundingClientRect(), topEl = document.elementFromPoint(rr.left + rr.width / 2, rr.top + 10);
    o.menuVisible = !mn.hidden && rr.width > 20 && !!topEl && mn.contains(topEl);
    [...mn.querySelectorAll('button')].find(x => /休旅車/.test(x.textContent)).click(); o.switched = G.ride === 'suv';
    document.getElementById('islRide').click(); await wait(50); [...$('#itemMenu').querySelectorAll('button')].find(x => /下車/.test(x.textContent)).click(); o.off = G.ride == null;
    document.querySelector('.isl-emo').click(); await wait(50); const em = $('#itemMenu').getBoundingClientRect(); o.emoteMenu = em.width > 20; hideItemMenu();
    G.ride = 'bike'; islRideBtn();
    o.btn = document.getElementById('islRide').textContent;
    o.fast = islSpd() > 1.4; G.ride = null; o.walk = islSpd() <= 1.7; G.ride = 'bike';
    // 走路到不了新小島
    const m = isl.m, sp = m.specials[0], dock = m.docks.find(d => d.side === 'main' && d.id === sp.id);
    const reach = islFindPath(m, Math.floor(isl.x), Math.floor(isl.y), (x, y) => Math.abs(x - sp.x) + Math.abs(y - sp.y) <= 1);
    o.noWalk = !reach || !reach.length || (() => { const last = reach[reach.length - 1]; return Math.abs(last[0] - sp.x) + Math.abs(last[1] - sp.y) > 1; })();
    o.docks = m.docks.length;
    // 坐船
    isl.x = dock.x + .5; isl.y = dock.y + .5; islFun({ kind: 'dock', d: dock }); o.boat = isl.act && isl.act.kind === 'boat' && !rideNow();
    for (let i = 0; i < 100 && isl.act; i++) await wait(100);
    o.arrived = Math.floor(isl.x) === dock.to[0] && Math.floor(isl.y) === dock.to[1] && m.isletAt[dock.to[1]][dock.to[0]] === sp.id;
    const back = m.docks.find(d => d.side === 'islet' && d.id === sp.id); islFun({ kind: 'dock', d: back }); for (let i = 0; i < 100 && isl.act; i++) await wait(100);
    o.backHome = Math.floor(isl.x) === dock.x && Math.floor(isl.y) === dock.y && !!rideNow();
    closeIsland();
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    o.saved = raw.vehicles.includes('bike') && raw.ride === 'bike';
    const bad = normalizeSave(Object.assign({}, raw, { vehicles: ['bike', 'ufo', 'bike'], ride: 'bus' }));
    o.badCleaned = JSON.stringify(bad.vehicles) === '["bike"]' && bad.ride == null;
    // 🤖 機器人：買得到、坐上去會走、跑得比走路快、存檔留得住
    G.bells = 20000; G.vehicles = (G.vehicles || []).filter(v => v !== 'robot'); openTab('shop'); shopKind = 'car'; renderTab(); await wait(100);
    [...document.querySelectorAll('#tabBody .card')].find(c => /機器人/.test(c.textContent)).click();
    o.robot = (G.vehicles || []).includes('robot') && G.ride === 'robot' && G.bells === 10000 && rideNow().id === 'robot' && islSpd() > 2
      && normalizeSave(Object.assign({}, JSON.parse(localStorage.getItem(SAVE_KEY)), { vehicles: ['robot'], ride: 'robot' })).ride === 'robot';
    { const c = document.createElement('canvas'); c.width = 120; c.height = 120; const g = c.getContext('2d'); g.translate(60, 110); drawVehicle(g, 'robot', 1.2, 1, true, () => {}); o.robot = o.robot && g.getImageData(60, 50, 1, 1).data[3] > 0; }
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = out.menuVisible && out.switched && out.off && out.emoteMenu && out.cards === 6 && out.robot && out.noMoney && out.bought && /腳踏車/.test(out.btn) && out.fast && out.walk && out.noWalk && out.docks === 6 && out.boat && out.arrived && out.backHome && out.saved && out.badCleaned && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
