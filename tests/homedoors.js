// 自己家也有門：兩間以上才有、用真的滑鼠點門會走過去進到隔壁、站在回來的門前面；門不存進存檔、佈置模式拿不起來、掛了畫門會換位置
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = {};
  const clean = () => p.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (/跳過/.test(b.textContent) && b.offsetParent) b.click(); }); document.getElementById('modal').hidden = true; document.querySelectorAll('#showcase,.toast,#vevScene').forEach(x => x.remove()); });
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(300); await clean(); }
  try {
    o.singleNone = await p.evaluate(() => { G.guide = 'done'; G.rooms = G.rooms.slice(0, 1); G.cur = 0; commit(); return homeDoors(curRoom()).length === 0; });
    await p.evaluate(() => { G.rooms.push({ name: '臥室', w: 8, d: 8, wall: 'wp_pink', floor: 'fl_wood', items: [], wallItems: [] }); G.rooms.push({ name: '陽台', w: 8, d: 8, wall: 'wp_pink', floor: 'fl_wood', items: [], wallItems: [] }); G.cur = 1; commit(); });
    await p.waitForTimeout(1200); await clean();
    o.twoDoors = await p.evaluate(() => homeDoors(curRoom()).length === 2);
    const pt = await p.evaluate(() => { const wi = homeDoors(curRoom()).find(w => w.to === 2), def = FURN_BY_ID[wi.id], r = canvas.getBoundingClientRect(); const mid = wi.pos + def.w / 2, z = def.z + def.h * .55, q = wi.side === 'R' ? iso(mid, 0, z) : iso(0, mid, z); return { x: r.left + view.ox + q.x * view.scale, y: r.top + view.oy + q.y * view.scale }; });
    await p.mouse.click(pt.x, pt.y);
    for (let i = 0; i < 40; i++) { await p.waitForTimeout(250); if (await p.evaluate(() => G.cur === 2)) break; }
    o.walkedIn = await p.evaluate(() => G.cur === 2);
    await p.waitForTimeout(400);
    o.nearBack = await p.evaluate(() => { const bk = homeDoors(curRoom()).find(w => w.to === 1); return !!bk && (bk.side === 'L' ? fufu.x < 2 : fufu.y < 2); });
    o.notSaved = await p.evaluate(() => !JSON.stringify(G.rooms).includes('door') && !JSON.stringify(normalizeSave(JSON.parse(JSON.stringify(G)))).includes('hdoor'));
    o.decorSkip = await p.evaluate(() => { const room = curRoom(), d = homeDoors(room)[0], def = FURN_BY_ID[d.id]; const mid = d.pos + def.w / 2, w = d.side === 'R' ? iso(mid, 0, def.z + def.h / 2) : iso(0, mid, def.z + def.h / 2); return pickWallItem(w) === d; });
    o.moves = await p.evaluate(() => { const room = curRoom(), d = homeDoors(room)[0]; room.wallItems.push({ uid: 777001, id: 'art_flower', side: d.side, pos: d.pos }); const d2 = homeDoors(room)[0]; room.wallItems.pop(); return !!d2 && !(d2.side === d.side && d2.pos === d.pos); });
    o.notInDex = await p.evaluate(() => !FURNITURE.some(f => /^(p|h)door_/.test(f.id)));
  } catch (e) { o.err = String(e.stack).slice(0, 300); }
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
