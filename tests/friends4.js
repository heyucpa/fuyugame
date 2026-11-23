// 新朋友（烏龜、小鳥、老鷹、飛龍）畫得出來、有印章和招式；主人第一次說話自我介紹、換主人不留上一位的話；甲板泳池變大；外面牆上的東西都能點
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
      const ids = ['manman', 'jiujiu', 'axiang', 'pupu'];
      o.newFriends = ids.every(id => NEIGHBOR_BY_ID[id] && SIG_MOVES[id] && WORLD_EMO[id] && ANIMAL_STAMPS[id]);
      o.draws = ids.every(id => { try { return !!renderNeighborPortrait(NEIGHBOR_BY_ID[id], 80, 80, false); } catch (e) { return false; } });
      o.uniqueIds = new Set(NEIGHBORS.map(n => n.id)).size === NEIGHBORS.length;
      travelArrive('ship', 0); await w(600);
      host.introduced = null; o.intro = /企鵝船長/.test(hostChatLine());
      let introN = 0; for (let i = 0; i < 200; i++) if (/我是企鵝船長/.test(hostChatLine())) introN++;
      o.introSometimes = introN > 10 && introN < 90;
      hostSay('我是企鵝船長', 60000); travelArrive('park', 0); await w(600);
      o.noStaleBubble = !host.say || !/企鵝船長/.test(host.say);
      const pool = FURN_BY_ID.ship_pool; o.bigPool = pool.w * pool.d >= 20;
      travelArrive('ship', 0); await w(400); o.poolPlaced = curRoom().items.some(q => q.id === 'ship_pool');
      const deadWall = []; Object.values(PLACES).forEach(pl => (pl.rooms || []).forEach(rm => (rm.wallItems || []).forEach(wi => { if (!wallActOf(wi.id)) deadWall.push(wi.id); })));
      o.wallAll = deadWall.length === 0 || deadWall.join(',');
      o.wallActs = Object.values(WALL_ACT).every(k => !!ACTIVITIES[k]);
      o.homeToys = FURNITURE_ACT.comic_book === 'read' && FURNITURE_ACT.robot_toy === 'toys';
      o.save = !!normalizeSave(JSON.parse(JSON.stringify(G)));
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
