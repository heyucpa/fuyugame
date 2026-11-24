// 故事扮演回合制對打：招式卡、蓄力時防禦是完美防禦、必殺技要集滿力氣、幫手有冷卻、打贏第一次送衣服、輸了可以再試、入口（電影院、童話書架、看完電影）、存檔檢查
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
      G.guide = 'done'; G.wardrobe = G.wardrobe.filter(id => !/^(hero_|redhood_|snow_)/.test(id)); delete G.storyPlay;
      o.costumes = ['hero_crown', 'hero_armor', 'redhood_hood', 'redhood_dress', 'snow_dress', 'snow_bow'].every(id => !!CLOTHES_BY_ID[id]);
      openStoryBattle('hero', 1); await w(300); let T = openStoryBattle.test;
      o.ultLocked = (() => { const r0 = T.round; T.act(3); return !T.busy && T.round === r0; })();
      T.act(0); for (let i = 0; i < 20 && T.busy; i++) await w(150);
      o.atkHits = T.foe.hp < T.foe.max && T.me.en === 25;
      T.act(2); for (let i = 0; i < 20 && T.busy; i++) await w(150);
      o.helpCd = T.me.helpCd > 0 && (() => { const r0 = T.round; T.act(2); return T.round === r0 && !T.busy; })();
      for (let k = 0; k < 6 && !T.foe.charging && !T.over; k++) { T.act(0); for (let i = 0; i < 20 && T.busy; i++) await w(150); }
      o.charges = T.foe.charging;
      const hp0 = T.me.hp, en0 = T.me.en; T.act(1); for (let i = 0; i < 25 && T.busy; i++) await w(150);
      o.perfectBlock = T.me.hp === hp0 && T.me.en >= Math.min(100, en0 + 55);
      T.me.en = 100; T.foe.hp = 30; T.act(3); for (let i = 0; i < 30 && !T.over; i++) await w(150);
      o.winCostume = T.over && T.foe.hp === 0 && G.wardrobe.includes('hero_crown') && G.wardrobe.includes('hero_armor') && storyState().hero === 1;
      document.querySelectorAll('#showcase').forEach(e => e.remove()); SC_QUEUE.length = 0;
      openStoryBattle('redhood', 0); await w(300); T = openStoryBattle.test; T.me.hp = 1; T.foe.charging = true; T.act(0); for (let i = 0; i < 30 && !T.over; i++) await w(150);
      o.loseRetry = T.over && T.me.hp === 0 && [...document.querySelectorAll('button')].some(b => /再玩|再試|再一次/.test(b.textContent)) && !G.wardrobe.includes('redhood_hood');
      close(); travelArrive('cinema', 0); await w(600); o.cinemaMenu = hostMenuEntries().some(e => /故事扮演/.test(e[0]));
      openFairyShelf(); await w(100); o.shelfBtn = /故事扮演/.test(document.getElementById('modalCard').textContent); document.getElementById('modal').hidden = true;
      openStoryPlayMenu(); await w(100); o.menuList = ['勇者打魔王', '小紅帽對大野狼', '公主對壞巫婆'].every(t => document.getElementById('modalCard').textContent.includes(t)); document.getElementById('modal').hidden = true;
      const bad = JSON.parse(JSON.stringify(G)); bad.storyPlay = { hero: 'x', redhood: 2 }; const nn = normalizeSave(bad); o.saveClean = !('hero' in nn.storyPlay) && nn.storyPlay.redhood === 2;
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
