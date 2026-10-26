// 💪 健身房：運動島上有、走得到；五種器材小遊戲都能玩完並加經驗；升級；體能讓運動遊戲變強；商店買得到器材、家裡點了能練；存檔驗證
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
    G.guide = 'done'; $('#modal').hidden = true; G.fit = {};
    islMapCache = null; const m = islMap(0), gb = m.blds.find(x => x.id === 'gym'), home = m.blds.find(x => x.id === 'home'); o.bld = !!gb && gb.islet;
    const pth = islFindPath(m, home.door[0], home.door[1], (x, y) => x === gb.door[0] && y === gb.door[1]); o.walk = !!pth && pth.length > 0;
    const statusOk = re => re.test(document.querySelector('.game-status').textContent);
    // 🏃 跑步機：讓速度一直在綠色裡
    openFitRun(); await wait(100); const R = openFitRun.test; const iv = setInterval(() => R.setV(.35), 50); await wait(2000); clearInterval(iv); R.end(); await wait(200); o.run = statusOk(/速度 \+/) && G.fit.spd > 10;
    // 🏋️ 啞鈴
    openFitLift(); await wait(100); const Lf = openFitLift.test; for (let i = 0; i < 40; i++) { Lf.tap(); if (i % 8 === 7) await wait(800); } o.reps = Lf.reps(); Lf.end(); await wait(200); o.lift = Lf.reps() >= 2 && statusOk(/力量 \+/);
    // 🚴 飛輪：踩在拍子上
    openFitBike(); await wait(50); const Bk = openFitBike.test; for (let k = 0; k < 4; k++) { const at = Bk.beatAt(k); await wait(Math.max(0, at - performance.now())); Bk.tap(); } o.bikeGood = Bk.good(); Bk.end(); await wait(200); o.bike = Bk.good() >= 3 && statusOk(/耐力 \+/);
    // 📦 跳箱：在跳板上跳
    openFitBox(); await wait(50); const Bx = openFitBox.test; for (let k = 0; k < 2; k++) { for (let i = 0; i < 100 && !(Bx.st().ph === 'run' && Bx.st().x > 236); i++) await wait(16); Bx.jump(); await wait(2100); }
    o.boxCleared = Bx.st().cleared; for (let i = 0; i < 80 && !statusOk(/跳過/); i++) await wait(100); o.box = Bx.st().cleared >= 2 && statusOk(/速度 \+.*力量 \+/);
    // 🧘 瑜珈：選對、按住 2 秒
    openFitYoga(); await wait(50); const Y = openFitYoga.test; Y.pick(true); Y.hold(true); await wait(2400); o.yogaNext = !!Y.pose(); for (let k = 0; k < 4; k++) Y.skip(); await wait(300); o.yoga = statusOk(/做對 1 \/ 5/);
    closeGameWindow();
    // 升級＋讓遊戲變強
    G.fit = { spd: 499, str: 250, sta: 0 }; o.lv = fitLv('spd') === 4 && fitLv('str') === 2 && fitMul('spd') === 1.12;
    // 主人選單、快速選單、體能畫面
    travelArrive('gym'); await wait(300); $('#modal').hidden = true;
    o.host = host.n && host.n.id === 'gym' && hostMenuEntries().some(e => /跑步機/.test(e[0])) && hostMenuEntries().some(e => /我的體能/.test(e[0]));
    o.usable = curRoom().items.every(it => canUse(it));
    o.quick = ['跑步機', '舉啞鈴', '飛輪', '跳箱', '瑜珈'].every(n => allQuickGames().some(g => g.name === n && g.where === 'gym'));
    openFitStats(); o.stats = /速度 Lv\.4/.test($('#modalCard').innerText) && /力量 Lv\.2/.test($('#modalCard').innerText); $('#modal').hidden = true;
    // 商店買得到、家裡能練
    o.shop = ['gym_treadmill', 'gym_dumbbell', 'gym_bike', 'gym_box', 'gym_mat'].every(id => FURNITURE.some(f => f.id === id && f.price > 0)) && FURNITURE_ACT.gym_bike === 'fit_bike';
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.fit && raw.fit.spd === 499;
    const bad = normalizeSave(Object.assign({}, raw, { fit: { spd: 'x', str: 9999, sta: 12.4 } })).fit; o.bad = bad.spd == null && bad.str == null && bad.sta === 12;
    o.bad2 = normalizeSave(Object.assign({}, raw, { fit: 3 })).fit == null;
    G.fit = {};
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.entries(out).filter(([k]) => !['reps', 'bikeGood', 'boxCleared'].includes(k)).every(([, v]) => v) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
