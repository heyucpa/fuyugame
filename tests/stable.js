// 穩定性：餵一次只響一聲、只扣一份、側邊欄不重畫；叫牠會過來並說話；
// 世界大賽進行到一半被休息時間關掉，休息結束或重開後從同一場繼續，不重算今天的次數。
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'));
  await p.waitForTimeout(900);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const o = {};
    G.guide = 'done'; document.getElementById('modal').hidden = true;
    saveRestCfg({ on: false, play: 60, rest: 5, pin: '' });
    G.pet.stage = 'kid'; G.food = { xiaoansu: 7, cake: 1, onigiri: 2 };
    const plays = []; const real = Sound.play;
    Sound.play = function (n) { plays.push(n); return real.apply(this, arguments); };
    let renders = 0; const rt = renderTab; renderTab = function () { renders++; return rt.apply(this, arguments); };
    showFoodMenu('pet');
    const btn = [...document.querySelectorAll('#foodMenu button')].find(x => /小安素/.test(x.textContent));
    btn.click(); btn.click();
    o.once = G.food.xiaoansu === 6 && plays.filter(n => n === 'eat').length === 1 && !plays.includes('talk') && renders === 0;
    Sound.play = real; renderTab = rt;
    pet.x = 0.5; pet.y = 0.5; pet.path = []; pet.room = -1; pet.sleep = null;
    fufu.x = 4.5; fufu.y = 2.5;
    document.getElementById('btnCall').click();
    o.call = pet.path.length > 0 && /過來/.test(fufu.say || '') && pet.room === roomKey();
    const t = tkdState(); t.belt = TKD_BELTS.length - 1; t.coach = 1; delete t.world; G.kid.hunger = 100;
    openWorldCup();
    const ws = worldState(), opp = ws.run.opps[0].id, n = ws.n;
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    const old = JSON.parse(JSON.stringify(raw)); delete old.tkd.world.run;
    const back = normalizeSave(old);
    o.old = !!(back && back.pets.length === raw.pets.length && back.tkd.world.run == null && back.tkd.world.best === raw.tkd.world.best);
    const junk = JSON.parse(JSON.stringify(raw)); junk.tkd.world.run = { r: 99 };
    const stripped = normalizeSave(junk);
    o.bad = !!(stripped && stripped.tkd.world.run == null && stripped.tkd.world.n === n && stripped.rooms.length);
    const kept = normalizeSave(JSON.parse(JSON.stringify(raw)));
    o.kept = !!(kept && kept.tkd.world.run && kept.tkd.world.run.r === 0 && kept.tkd.world.run.opps[0].id === opp);
    saveRestCfg({ on: true, play: 20, rest: 5, pin: '' });
    forceRestNow();
    o.rest = resting === true && document.getElementById('modal').hidden === true && worldState().run.r === 0;
    const s = restState(); s.restUntil = 0; s.played = 0; s.dueAt = 0; saveRestState(s); endRest();
    saveRestCfg({ on: false, play: 60, rest: 5, pin: '' });
    saveGame();
    o.n = n; o.opp = opp;
    return o;
  });
  await p.reload(); await p.waitForTimeout(800);
  try { await p.getByText('跳過').click({ timeout: 1200 }); } catch (e) {}
  const resume = await p.evaluate(() => {
    G.guide = 'done'; document.getElementById('modal').hidden = true;
    const before = JSON.parse(localStorage.getItem(SAVE_KEY));
    openWorldCup();
    const ws = worldState();
    return ws.n === before.tkd.world.n && worldRound.test.r === before.tkd.world.run.r
      && worldRound.test.opp.id === before.tkd.world.run.opps[0].id
      && /三十二強/.test(document.querySelector('#modalCard h2').textContent);
  });
  console.log(JSON.stringify({ o, resume, errs }));
  const ok = o.once && o.call && o.old && o.bad && o.kept && o.rest && resume && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
