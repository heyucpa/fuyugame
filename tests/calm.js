// 😴 沒在動、沒在碰：一秒畫 10 次；一碰或走路就恢復。玩了幾秒 10 秒才寫一次儲存區，重要的變化馬上寫
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)); document.getElementById('modal').hidden = true; G.guide = 'done';
    const fps = async ms => { const f0 = roomLayerStats.frames + roomLayerStats.full; await w(ms); return (roomLayerStats.frames + roomLayerStats.full - f0) / (ms / 1000); };
    idleLastInput = performance.now() - 10000; fufu.path = []; fufu.act = null; fufu.task = null; fufu.idleUntil = performance.now() + 1e7; vis.who = null; await w(300);   // 不要讓她自己走來走去（走路時本來就是全速）
    const calm = await fps(2000); o.calm10 = calm > 7 && calm < 12.5;
    idleLastInput = performance.now() + 1e7; const act = await fps(1500); o.activeFast = act > 20;   // 自動測試預設一般模式 30 格
    idleLastInput = performance.now() - 10000; fufu.path = [[3, 3], [4, 3], [5, 3], [5, 4], [5, 5]]; const walk = await fps(700); o.walkFast = walk > 18;
    // 儲存區：一直玩只寫一次；休息開始馬上寫
    saveRestCfg(Object.assign(restCfg(), { on: true, play: 20, rest: 5 })); localStorage.removeItem(REST_STATE_KEY);
    let writes = 0; const orig = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === REST_STATE_KEY) writes++; return orig.call(this, k, v); };
    const t0 = Date.now(); for (let i = 0; i < 8; i++) restTick(t0 + i * 1000, true);
    o.fewWrites = writes <= 2; o.timeCounted = Math.abs(restState().played - 7) < .01;
    const before = writes; const s = restState(); s.restUntil = Date.now() + 60000; saveRestState(s); o.bigNow = writes === before + 1;
    s.restUntil = 0; saveRestState(s); localStorage.removeItem(REST_STATE_KEY); o.resetSeen = restState().played === 0;
    Storage.prototype.setItem = orig; localStorage.removeItem(REST_STATE_KEY); localStorage.removeItem(REST_CFG_KEY);
    // 一格 0.11 秒（一秒 10 格）連跑很多格：家裡、每個地點、寵物屋、大地圖都不能出錯、寵物不能彈壞
    let bad = 0; const step = n => { for (let i = 0; i < n; i++) { const t1 = performance.now(); try { fufuUpdate(.11, t1); petUpdate(.11, t1); visitorTick(.11, t1); draw(); } catch (e) { bad++; } } };
    pet.squishV = -8; step(60); o.petSane = pet.squish > -.7 && pet.squish < .9;
    for (const pl of Object.keys(PLACES)) { G.away = { place: pl, idx: 0 }; pet.squishV = -8; step(25); }
    G.away = null; openIsland(); await w(600); for (let i = 0; i < 60; i++) { try { islStep(.11); islDraw(performance.now()); } catch (e) { bad++; } } closeIsland();
    o.noErrAtLowFps = bad === 0;
    o.info = [calm, act, walk].map(x => x.toFixed(1)).join('/');
    return o;
  });
  const info = o.info; delete o.info;
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), info, errs.slice(0, 2)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
