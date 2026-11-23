// 出門的地方每一樣東西點了都有反應（大樹、路燈要穿過去點後面的；地毯、行李箱被擋住，不算）：賽車場、消防局、郵輪等原本沒反應的東西有動作或小遊戲；萬一還有漏的，至少有「走過去看一看」
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
      const dead = [], badAct = [];
      Object.entries(PLACES).forEach(([pid, pl]) => (pl.rooms || []).forEach(rm => (rm.items || []).forEach(it => {
        if (!(FURNITURE_USE[it.id] || FURNITURE_ACT[it.id] || PET_BEDS[it.id]) && !['shade_tree', 'street_lamp', 'story_rug', 'luggage'].includes(it.id)) dead.push(pid + ':' + it.id);
        const k = FURNITURE_ACT[it.id]; if (k && !ACTIVITIES[k]) badAct.push(k);
      })));
      o.noDead = dead.length === 0 || dead.join(',');
      o.actsOk = badAct.length === 0 || badAct.join(',');
      travelArrive('raceway', 0); await w(800);
      const pod = curRoom().items.find(q => q.id === 'race_podium');
      fufuStartAct('podium', performance.now(), pod, false); o.podium = fufu.act && fufu.act.key === 'podium';
      const kart = curRoom().items.find(q => q.id === 'race_kart');
      fufuStartAct('kart_go', performance.now(), kart, false); await w(2500);
      o.kartOpens = !document.getElementById('modal').hidden; close(); await w(200);
      travelArrive('firestation', 0); await w(800);
      const pole = curRoom().items.find(q => q.id === 'fire_pole');
      fufuStartAct('fire_slide', performance.now(), pole, false); o.pole = fufu.act && fufu.act.key === 'fire_slide';
      travelArrive('ship', 0); await w(800);
      const ch = curRoom().items.find(q => q.id === 'deck_chair'); fufuGoUse(ch, false); await w(4000);
      o.deckSit = !!(fufu.pose && fufu.pose.type === 'sit');
      o.opensExist = [openKart, openFireFight, openWaterFight, openMoviePicker].every(f => typeof f === 'function');
      o.fallback = !!ACTIVITIES.look_any;
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
