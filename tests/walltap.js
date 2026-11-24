// 出門的地方用「真的滑鼠點」牆上的東西：門會走過去進到隔壁、海報黑板這些會走過去做事；不能用的牆上東西點了不會擋住走路（家長：點門沒辦法進去）
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
  const spot = (pred) => p.evaluate(pred => { const room = curRoom(), wi = room.wallItems.find(new Function('w', 'return ' + pred)), def = FURN_BY_ID[wi.id], r = canvas.getBoundingClientRect();
    const mid = wi.pos + def.w / 2, z = def.z + def.h * .55, q = wi.side === 'R' ? iso(mid, 0, z) : iso(0, mid, z);
    return { x: r.left + view.ox + q.x * view.scale, y: r.top + view.oy + q.y * view.scale, uid: wi.uid, to: wi.to }; }, pred);
  try {
    await p.evaluate(() => { G.guide = 'done'; travelArrive('dept', 0); }); await p.waitForTimeout(2000); await clean();
    let s = await spot('w.door && w.to === 1'); await p.mouse.click(s.x, s.y); await p.waitForTimeout(200);
    o.doorTask = await p.evaluate(uid => !!(fufu.task && fufu.task.wall === uid), s.uid);
    for (let i = 0; i < 40; i++) { await p.waitForTimeout(250); if (await p.evaluate(() => G.away.idx === 1)) break; }
    o.doorWalkIn = await p.evaluate(() => G.away.idx === 1);
    await p.evaluate(() => { travelArrive('school', 0); }); await p.waitForTimeout(2000); await clean();
    const has = await p.evaluate(() => curRoom().wallItems.some(w => w.id === 'blackboard'));
    if (has) { s = await spot("w.id === 'blackboard'"); await p.mouse.click(s.x, s.y); await p.waitForTimeout(200); o.blackboardTask = await p.evaluate(uid => !!(fufu.task && fufu.task.wall === uid), s.uid); } else o.blackboardTask = 'no blackboard in room 0';
  } catch (e) { o.err = String(e.stack).slice(0, 300); }
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
