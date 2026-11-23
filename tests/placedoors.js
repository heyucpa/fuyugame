// 房間之間有門：多房間的地方每間牆上都有通到上一間／下一間的門，點門會走過去進到那間、站在回來的門前面；只有一間的地方沒有門
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
      const miss = [];
      Object.entries(PLACES).forEach(([k, v]) => { if (v.inHouse || v.rooms.length < 2) return; ensurePlaceDoors(k); v.rooms.forEach((rm, i) => { const ds = rm.wallItems.filter(w => w.door), need = (i > 0) + (i < v.rooms.length - 1); if (ds.length < need) miss.push(k + i); ds.forEach(d => { if (!FURN_BY_ID[d.id] || !wallActOf(d.id)) miss.push('def:' + d.id); }); }); });
      o.allDoors = miss.length === 0 || miss.join(',');
      ensurePlaceDoors('park'); o.singleNoDoor = !PLACES.park.rooms[0].wallItems.some(w => w.door);
      travelArrive('ship', 1); await w(800);
      const wi = curRoom().wallItems.find(q => q.door && q.to === 2);
      o.hasDoor = !!wi; fufuGoWall(wi);
      for (let i = 0; i < 60 && G.away.idx !== 2; i++) await w(200);
      o.walkedIn = G.away.idx === 2; await w(300);
      const back = curRoom().wallItems.find(q => q.door && q.to === 1);
      o.nearBackDoor = !!back && (back.side === 'L' ? fufu.x < 2 && Math.abs(fufu.y - (back.pos + 1)) < 2.5 : fufu.y < 2 && Math.abs(fufu.x - (back.pos + 1)) < 2.5);
      goPlaceRoom(0); await w(400); o.tabsStillWork = G.away.idx === 0;
      o.notInDex = !FURNITURE.some(f => /^pdoor_/.test(f.id));
      o.save = !!normalizeSave(JSON.parse(JSON.stringify(G)));
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
