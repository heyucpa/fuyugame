// 🚓 警察局（被抓關 3 分鐘、寵物會來救）：大地圖有房子、進得去、警官選單；抓小偷三關過了送警車＋制服；演習被抓關 1 分鐘（叫爸媽、找小貓可以提早出來、重開還在關）；
//    小偷鼠來家裡偷東西：抓到放回去、沒抓到進失物招領可以領回；存檔驗證；🚑 小醫生 3 次送救護車；商店不賣這兩台
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true; G.guide = 'done'; document.querySelectorAll('#showcase').forEach(x => x.remove());
    // 大地圖上的房子、門口走得到
    const m = islMap(0), bd = m.blds.find(x => x.id === 'police'); o.building = !!bd && islPass(m, bd.door[0], bd.door[1]);
    // 進警察局
    travelArrive('police'); for (let k = 0; k < 40 && (!G.away || G.away.place !== 'police'); k++) await w(100);
    await w(800); document.querySelectorAll('#tripLayer').forEach(x => x.remove()); document.getElementById('modal').hidden = true;
    o.inside = G.away && G.away.place === 'police' && curRoom().w === 12;
    o.furnUsable = ['police_desk', 'jail_cell', 'lost_box'].every(id => curRoom().items.some(it => it.id === id && canUse(it)));
    for (let k = 0; k < 30 && !host.n; k++) await w(100);
    o.hostMenu = !!host.n && host.n.id === 'police' && hostMenuEntries().some(e => /抓小偷/.test(e[0])) && hostMenuEntries().some(e => /演習/.test(e[0])) && hostMenuEntries().some(e => /失物/.test(e[0]));
    // 🚔 小房間裡的犯人：兩位、理由好笑、點小房間可以問
    { const pr = prisonersHere(); o.prisoners = pr.length === 2 && pr.every(x => x.n && PRISON_CRIMES.includes(x.crime)) && prisonerOccupants().length === 2;
      const cell = jailCellHere(); showItemMenu(cell, { clientX: 600, clientY: 400 }); o.askMenu = (document.getElementById('itemMenu').textContent.match(/為什麼被關/g) || []).length === 2; hideItemMenu();
      prisonerTalk(pr[0]); o.prisonerSays = pr[0].say.includes(pr[0].crime[1]) && performance.now() < pr[0].sayUntil;
      o.sameAllDay = prisonersToday()[0].n === pr[0].n && prisonersToday()[0].crime === pr[0].crime; }
    // 抓小偷：選關、第一關會跑
    openCopChase(); o.levelPick = document.querySelectorAll('#modalCard .lv-btn').length === 3;
    openCopChase(1); await w(500); const t0 = openCopChase.test; const x0 = t0.thieves[0].x, y0 = t0.thieves[0].y; await w(800); o.thiefMoves = Math.hypot(t0.thieves[0].x - x0, t0.thieves[0].y - y0) > 3;
    // 真的追得到：小可愛直直往小偷走，45 秒內要抓到（模擬按住方向）
    { let caughtAt = 0; const st = performance.now(); const me = t0.me; const iv = setInterval(() => { const q = t0.thieves[0]; if (q.caught) { caughtAt = performance.now() - st; clearInterval(iv); return; } const dx = q.x - me.x, dy = q.y - me.y, L = Math.hypot(dx, dy) || 1; me.x += dx / L * 96 * .05; me.y += dy / L * 96 * .05; }, 50);
      for (let k = 0; k < 300 && !caughtAt; k++) await w(100); clearInterval(iv); o.catchable = caughtAt > 0 && caughtAt < 30000; o.info = Math.round(caughtAt) + 'ms'; }
    await w(300); o.lv1 = copState().lv >= 1;
    openCopChase(2); await w(200); openCopChase.test.win(); await w(300);
    openCopChase(3); await w(200); openCopChase.test.win(); await w(500);
    o.policeCar = (G.vehicles || []).includes('police') && ['cop_cap', 'cop_jacket', 'cop_pants'].every(id => G.wardrobe.includes(id));
    o.capDraws = (() => { try { const c = document.createElement('canvas').getContext('2d'); drawGirl(c, { t: 0, outfit: Object.assign({}, currentOutfit(), { head: CLOTHES_BY_ID.cop_cap, top: CLOTHES_BY_ID.cop_jacket, bottom: CLOTHES_BY_ID.cop_pants }), hair: G.hair }); return true; } catch (e) { return e.message; } })() === true;
    o.carDraws = (() => { try { vehicleCanvas('police', 120, 70); vehicleCanvas('ambulance', 120, 70); return true; } catch (e) { return false; } })();
    closeGameWindow();
    // 演習：拿到寶石走到出口＝成功；被照到＝關起來
    openThiefDrill(); await w(400); openThiefDrill.test.win(); await w(400); o.drillWin = (copState().drill || 0) >= 1 && !G.jail;
    openThiefDrill(); await w(1200); openThiefDrill.test.caught(); await w(1600);
    o.jailed = !!G.jail && jailLeft() > 170000 && jailLeft() <= 180000 && /被抓到/.test(document.querySelector('#modalCard h2').textContent);
    openJail.test.call(); await w(1500); o.parentsDrive = !!G.jail && !!G.jail.parentsAt;   // 爸爸媽媽開車要 30 秒
    G.jail.parentsAt = Date.now() - 31000; for (let k = 0; k < 80 && G.jail; k++) await w(100); o.parentsFree = !G.jail;
    document.querySelectorAll('#showcase').forEach(x => x.remove());
    // 🐾 寵物們來救：40 秒推、80 秒挖、2 分鐘找到鑰匙
    if (G.pet.stage === 'egg') G.pet.stage = 'kid';
    startJail(); await w(300); o.petsComing = openJail.test.pets.length >= 1 && openJail.test.stage() === -1;
    G.jail.until = Date.now() + JAIL_MS - 41000; await w(400); o.petPush = openJail.test.stage() === 0;
    G.jail.until = Date.now() + JAIL_MS - 81000; await w(400); o.petDig = openJail.test.stage() === 1;
    G.jail.until = Date.now() + JAIL_MS - 121000; await w(400); o.petKey = openJail.test.stage() === 2 && [...document.querySelectorAll('#modalCard button')].some(x => /鑰匙/.test(x.textContent));
    openJail.test.key(); await w(300); o.petsFree = !G.jail;
    document.querySelectorAll('#showcase').forEach(x => x.remove());
    startJail(); await w(300); openJail.test.kitten(); await w(100); const at = jailKitten.test.at; document.querySelectorAll('#modalCard .tkd-move')[at].click(); await w(1600); o.kittenFree = !G.jail;
    document.querySelectorAll('#showcase').forEach(x => x.remove());
    startJail(); return o;
  });
  // 關到一半重開網頁：還在關
  await p.reload(); await p.waitForTimeout(4000);
  Object.assign(o, await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    o.jailPersists = !!G.jail && !document.getElementById('modal').hidden && /被抓到/.test(document.querySelector('#modalCard h2').textContent);
    G.jail.until = Date.now() - 1; await w(1500); o.timeFree = !G.jail;
    document.getElementById('modal').hidden = true; document.querySelectorAll('#showcase').forEach(x => x.remove()); G.guide = 'done';
    // 小偷鼠來家裡：偷桌上的東西 → 抓到 → 放回去
    goHome(); for (let k = 0; k < 40 && G.away; k++) await w(100); document.querySelectorAll('#tripLayer').forEach(x => x.remove()); document.getElementById('modal').hidden = true;
    const room = curRoom(); room.items = [{ uid: 8801, id: 'dining_table', x: 2, y: 2, rot: 0, top: 'flower_vase' }, { uid: 8802, id: 'plant_s' in FURN_BY_ID ? 'plant_s' : 'flower_vase', x: 6, y: 1, rot: 0 }]; fufu.x = .5; fufu.y = room.d - .5; fufu.path = []; fufu.idleUntil = performance.now() + 1e7;
    thiefState().day = ''; o.started = thiefStart(); o.oncePerDay = !thiefCanCome(performance.now() + 1e9);
    thiefAct.uid = 8801; thiefAct.top = true;
    for (let k = 0; k < 100 && thiefAct.state === 'sneak'; k++) await w(100);
    o.stole = !room.items.find(x => x.uid === 8801).top && thiefBag().some(b => b.id === 'flower_vase') && JSON.parse(localStorage.getItem(SAVE_KEY)).thief.bag.length === 1;
    o.drawn = thiefDrawEntries().length === 1;
    const pt = iso(thiefAct.x, thiefAct.y, 20); o.tapHits = thiefHit(pt);
    thiefCatch(); await w(200); o.caughtBack = room.items.find(x => x.uid === 8801).top === 'flower_vase' && thiefBag().length === 0 && !thiefAct.on;
    document.querySelectorAll('#showcase').forEach(x => x.remove());
    // 沒抓到：跑掉 → 失物招領 → 領回
    thiefState().day = ''; thiefStart(); thiefAct.uid = 8801; thiefAct.top = true; for (let k = 0; k < 100 && thiefAct.state === 'sneak'; k++) await w(100);
    thiefAct.fleeUntil = 0; thiefAct.path = []; for (let k = 0; k < 150 && thiefAct.on; k++) { if (thiefAct.state === 'exit' && thiefAct.path.length) { thiefAct.x = thiefAct.path[thiefAct.path.length - 1][0] + .5; thiefAct.y = thiefAct.path[thiefAct.path.length - 1][1] + .5; thiefAct.path = []; } await w(100); }
    o.escaped = !thiefAct.on && thiefBag().length === 1;
    const inv0 = G.inv.flower_vase || 0; o.claimN = claimLostFound() === 1; o.claimed = (G.inv.flower_vase || 0) === inv0 + 1 && thiefBag().length === 0;
    // 換房間：小偷趁機溜走，東西還在失物招領
    room.items.find(x => x.uid === 8801).top = 'flower_vase'; thiefState().day = ''; o.restart = thiefStart(); thiefAct.uid = 8801; thiefAct.top = true; for (let k = 0; k < 100 && thiefAct.state === 'sneak'; k++) await w(100); thiefAct.room = 'other'; await w(300);
    o.leaveSafe = !thiefAct.on && thiefBag().length === 1; if (!o.leaveSafe) o.leaveDbg = JSON.stringify({ on: thiefAct.on, st: thiefAct.state, bag: thiefBag(), item: thiefAct.item }); claimLostFound();
    // 桌上的東西先被拿走了：小偷不會改偷整張桌子
    room.items.find(x => x.uid === 8801).top = 'flower_vase'; thiefState().day = ''; thiefStart(); thiefAct.uid = 8801; thiefAct.top = true; room.items.find(x => x.uid === 8801).top = null;
    for (let k = 0; k < 100 && thiefAct.state === 'sneak'; k++) await w(100); o.tableSafe = !!room.items.find(x => x.uid === 8801) && thiefBag().length === 0; thiefLeave('quiet');
    // 家長關掉
    G.noThief = 1; thiefState().day = ''; o.parentOff = !thiefCanCome(performance.now() + 1e9); delete G.noThief;
    // 存檔驗證
    const bad = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { cop: { lv: 99, x: 1 }, jail: { until: 'x' }, thief: { day: 5, bag: [{ id: 'nope' }, { id: 'flower_vase' }, 7], n: -1 }, vehicles: ['police', 'ambulance', 'ufo'], noThief: 2 }));
    o.saveSafe = bad.cop.lv === 3 && !('x' in bad.cop) && !bad.jail && bad.thief.bag.length === 1 && !('day' in bad.thief) && !('n' in bad.thief) && bad.vehicles.join() === 'police,ambulance' && !('noThief' in bad);
    const far = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { jail: { until: Date.now() + 1e9 } })); o.jailCapped = far.jail.until <= Date.now() + 181000;
    // 🚑 救護車：小醫生 3 次
    G.vehicles = (G.vehicles || []).filter(v => v !== 'ambulance'); townState().docN = 0;
    for (let i = 0; i < 3; i++) { openDoctorGame(); for (let n = 0; n < 4; n++) { const st = openDoctorGame.test.steps(); st.forEach(s => openDoctorGame.test.use(s)); } await w(100); }
    o.ambulance = (G.vehicles || []).includes('ambulance') && townState().docN === 3;
    closeGameWindow();
    // 商店不賣
    o.notInShop = !shopCatalog().some(([k]) => k === 'v:police' || k === 'v:ambulance');
    return o;
  }));
  const info = o.info + (o.leaveDbg || ''); delete o.info; delete o.leaveDbg;
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), info, errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
