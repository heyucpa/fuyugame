// 道館、泳池：東西點了會動（每樣都有事做）、對練小遊戲、游泳圈
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
    travelArrive('dojo'); await wait(300); $('#modal').hidden = true;
    o.dojoUsable = curRoom().items.map(it => it.id + ':' + canUse(it));
    for (const id of ['tkd_sandbag', 'tkd_target', 'tkd_boards']) {
      const it = curRoom().items.find(x => x.id === id), act = FURNITURE_ACT[id];
      fufu.path = []; fufu.act = null; fufu.task = null;
      fufuStartAct(act, performance.now(), it); await wait(1200);
      o[id] = [fufu.act && fufu.act.key, !!fufu.say];
    }
    for (const id of ['tkd_mirror', 'tkd_banner', 'tkd_banner2']) { WALL_TAP[id](); await wait(200); o[id] = [fufu.act && fufu.act.key, fufu.say]; }
    WALL_TAP.tkd_belts(); await wait(1200); o.beltsOpen = !$('#modal').hidden && /腰帶/.test($('#modal').innerText); closeGameWindow(); $('#modal').hidden = true;
    // 🥋 同學穿道服、不定時來問要不要對打
    o.classmates = (host.crowd || []).map(c => !!c.n.dobok);
    dojoNextChal = performance.now() - 1; smallTick(); await wait(2300);
    const ch = host.crowd.find(c => c.challenge); o.challenge = ch ? ch.say : null;
    if (ch) { crowdTalk(ch, { clientX: 500, clientY: 400 }); await wait(100); o.chMenu = [...document.querySelectorAll('#itemMenu button')].map(b => b.textContent); document.querySelector('#itemMenu button').click(); await wait(800); o.chSpar = /對練/.test(document.querySelector('#modal').innerText); closeGameWindow(); $('#modal').hidden = true; }
    o.menu = hostMenuEntries().map(e => e[0]).filter(x => /對練/.test(x));
    const prac0 = tkdState().prac;
    openSparGame(); await wait(200);
    document.querySelector('.lv-row button').click(); await wait(1700);
    o.sparState = playSpar.test.state();
    let guard = 0;
    while (playSpar.test.state() === 'fight' && guard++ < 400) {
      const c = playSpar.test.cue();
      if (c === 'open') playSpar.test.press('kick'); else if (c === 'atk') playSpar.test.press('block');
      await wait(120);
    }
    await wait(1900);
    o.sparScore = playSpar.test.score(); o.sparStatus = document.querySelector('.game-status').textContent; o.pracUp = tkdState().prac > prac0 || tkdState().prac === 0;
    closeGameWindow(); $('#modal').hidden = true;
    // 🎵 節奏跆拳道：照時間按 → 大部分打中，結束有結果、算練習
    o.rhyMenu = hostMenuEntries().some(e => /節奏/.test(e[0]));
    openRhythmGame(); await wait(100); document.querySelector('.lv-row button').click(); await wait(50);
    const auto = setInterval(() => { const T = playRhythm.test, t = T.t(); T.notes().forEach(n => { if (!n.done && Math.abs(n.t - t) < 30) T.hit(n.lane); }); }, 10);
    for (let i = 0; i < 400 && !/打中|全部打中/.test(document.querySelector('.game-status').textContent); i++) await wait(100);
    clearInterval(auto); o.rhy = document.querySelector('.game-status').textContent;
    closeGameWindow(); $('#modal').hidden = true;
    travelArrive('pool'); await wait(300); $('#modal').hidden = true;
    o.poolUsable = curRoom().items.map(it => it.id + ':' + canUse(it));
    await wait(1500); const x0 = host.crowd.map(c => c.a.x); await wait(1200); o.poolMates = host.crowd.length === 2 && host.crowd.every((c, i) => poolWaterAt(c.a.x, c.a.y) && c.swim);
    const ring = curRoom().items.find(x => x.id === 'float_ring');
    fufuStartAct('ringon', performance.now(), ring); o.ringOn = swimRingOn();
    const towel = curRoom().items.find(x => x.id === 'towel_rack2');
    fufuStartAct('towel', performance.now(), towel); o.ringOffAfterTowel = !swimRingOn();
    const sh = curRoom().items.find(x => x.id === 'pool_shower'); G.kid.clean = 50; fufuStartAct('showerpool', performance.now(), sh); o.cleaner = G.kid.clean > 50;
    const pool = curRoom().items.find(x => x.id === 'swim_pool'); o.poolNotMenu = !canUse(pool);
    pet.x = pool.x + 2.5; pet.y = pool.y + 2.5; pet.path = [[pool.x + 4, pool.y + 2]]; await wait(600); o.petInWater = poolWaterAt(pet.x, pet.y);
    return o;
  });
  console.log(JSON.stringify(out));
  const bad = [];
  if (!out.dojoUsable.every(s => /:true$/.test(s))) bad.push('dojo 有東西不能玩');
  ['tkd_sandbag', 'tkd_target', 'tkd_boards'].forEach(k => { if (!out[k][0]) bad.push(k); });
  ['tkd_mirror', 'tkd_banner', 'tkd_banner2'].forEach(k => { if (!out[k][0] || !out[k][1]) bad.push(k); });
  if (!out.beltsOpen) bad.push('腰帶架');
  if (!out.classmates.length || !out.classmates.every(Boolean) || !/對打/.test(out.challenge || '') || !out.chSpar) bad.push('同學挑戰');
  if (!out.petInWater) bad.push('寵物游泳');
  if (!out.poolMates) bad.push('泳池同學');
  if (!out.rhyMenu || !/💰/.test(out.rhy || '')) bad.push('節奏跆拳道');
  if (!out.menu.length) bad.push('沒有對練');
  if (Math.max(...out.sparScore) < 5 || !/💰/.test(out.sparStatus)) bad.push('對練沒結束');
  if (!out.poolUsable.filter(s => !/^swim_pool/.test(s)).every(s => /:true$/.test(s))) bad.push('泳池有東西不能玩');
  if (!out.ringOn || !out.ringOffAfterTowel || !out.cleaner || !out.poolNotMenu) bad.push('泳池互動');
  if (errs.length) bad.push('JS 錯誤 ' + errs.join(' | '));
  console.log(bad.length ? '❌ ' + bad.join('、') : '✅ 全部通過');
  await b.close();
})();
