// ⌨️ 鍵盤：方向鍵／WASD 在房間走路（照畫面方向、會沿著牆滑）、空白鍵跟最近的家具互動（一件事直接做、好幾件開選單用上下選）、
//    大地圖空白鍵跟最近的朋友／門／樹互動；打字、開視窗時不觸發
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = {};
  const pos = () => p.evaluate(() => [fufu.x, fufu.y]);
  await p.evaluate(() => { document.getElementById('modal').hidden = true; G.guide = 'done'; G.kid.hunger = 90; const r = curRoom(); r.items = []; r.wallItems = []; fufu.pose = null; fufu.act = null; fufu.task = null; fufu.path = []; fufu.x = 3.5; fufu.y = 3.5; });
  const hold = async (key, ms) => { await p.keyboard.down(key); await p.waitForTimeout(ms); await p.keyboard.up(key); await p.waitForTimeout(700); };
  let a = await pos(); await hold('ArrowRight', 900); let c = await pos();
  o.right = c[0] - a[0] >= 1 && c[1] - a[1] <= -1;   // 右＝x+、y-
  await p.evaluate(() => { fufu.x = 1.5; fufu.y = 1.5; fufu.path = []; }); a = await pos(); await hold('ArrowDown', 900); c = await pos(); o.down = c[0] - a[0] >= 1 && c[1] - a[1] >= 1;
  await p.evaluate(() => { fufu.x = 3.5; fufu.y = 1.5; fufu.path = []; }); a = await pos(); await hold('a', 700); c = await pos(); o.wasdLeft = c[0] < a[0] && c[1] > a[1];
  await p.evaluate(() => { fufu.x = 3.5; fufu.y = 4.5; fufu.path = []; }); a = await pos(); await p.keyboard.down('ArrowUp'); await p.keyboard.down('ArrowRight'); await p.waitForTimeout(700); await p.keyboard.up('ArrowUp'); await p.keyboard.up('ArrowRight'); await p.waitForTimeout(700); c = await pos();
  o.twoKeys = Math.abs(c[0] - a[0]) < .01 && c[1] < a[1] - .9;   // 上＋右＝沿著 y 直直走
  await hold('ArrowUp', 4000); c = await pos(); const room = await p.evaluate(() => [curRoom().w, curRoom().d]);
  o.staysInside = c[0] >= .4 && c[1] >= .4 && c[0] <= room[0] && c[1] <= room[1];
  o.stopsWhenReleased = await p.evaluate(() => fufu.path.length === 0);
  // 空白鍵：只有一件事的家具（椅子）→ 直接坐
  await p.evaluate(() => { window.__one = Object.keys(FURNITURE_USE).find(k => FURN_BY_ID[k] && !FURNITURE_ACT[k] && !PET_BEDS[k] && FURNITURE_USE[k].use === 'sit' && FURN_BY_ID[k].w === 1 && FURN_BY_ID[k].d === 1); const r = curRoom(); r.items = [{ uid: 7001, id: window.__one, x: 3, y: 1, rot: 0 }]; fufu.x = 3.5; fufu.y = 3.5; fufu.path = []; fufu.pose = null; });
  o.chairUsable = await p.evaluate(() => !!window.__one);
  await p.keyboard.press('Space'); await p.waitForTimeout(2500);
  o.spaceSits = await p.evaluate(() => !!(fufu.pose && fufu.pose.uid === 7001) || !!(fufu.task && fufu.task.uid === 7001));
  await p.waitForTimeout(1500); await p.keyboard.press('Space'); await p.waitForTimeout(400);
  o.spaceStands = await p.evaluate(() => !fufu.pose);
  // 好幾件事 → 開選單，上下選、空白決定
  const multi = await p.evaluate(() => { const id = Object.keys(FURNITURE_USE).find(k => FURNITURE_ACT[k] && FURN_BY_ID[k]); const r = curRoom(); r.items = [{ uid: 7002, id, x: 3, y: 1, rot: 0 }]; fufu.x = 3.5; fufu.y = 3.5; fufu.path = []; fufu.pose = null; fufu.task = null; fufu.act = null; return id; });
  if (multi) { await p.keyboard.press('Space'); await p.waitForTimeout(200);
    o.menuOpens = await p.evaluate(() => !document.getElementById('itemMenu').hidden && document.querySelectorAll('#itemMenu button').length >= 2 && document.querySelectorAll('#itemMenu button')[0].classList.contains('kbd'));
    await p.keyboard.press('ArrowDown'); o.menuDown = await p.evaluate(() => document.querySelectorAll('#itemMenu button')[1].classList.contains('kbd') && fufu.path.length === 0);
    await p.keyboard.press('Space'); await p.waitForTimeout(300); o.menuPick = await p.evaluate(() => document.getElementById('itemMenu').hidden && !!(fufu.task || fufu.act || fufu.pose)); }
  // 遠遠的沒反應
  await p.evaluate(() => { const r = curRoom(); r.items = [{ uid: 7003, id: window.__one, x: 0, y: 0, rot: 0 }]; fufu.x = 5.5; fufu.y = 5.5; fufu.path = []; fufu.pose = null; fufu.task = null; fufu.act = null; hideItemMenu(); });
  await p.keyboard.press('Space'); await p.waitForTimeout(200); o.farNothing = await p.evaluate(() => !fufu.task && !fufu.pose && document.getElementById('itemMenu').hidden);
  // 打字、開視窗時不動
  await p.evaluate(() => { const i = document.createElement('input'); i.id = 'tIn'; document.body.appendChild(i); i.focus(); fufu.path = []; fufu.task = null; fufu.idleUntil = performance.now() + 1e6; }); await p.waitForTimeout(300); a = await pos(); await hold('ArrowRight', 500); c = await pos(); o.typingSafe = a[0] === c[0] && a[1] === c[1] && await p.evaluate(() => { const v = document.getElementById('tIn'); v.remove(); return true; });
  await p.evaluate(() => { document.getElementById('modal').hidden = false; fufu.path = []; fufu.task = null; fufu.idleUntil = performance.now() + 1e6; }); await p.waitForTimeout(300); a = await pos(); await hold('ArrowRight', 500); c = await pos(); o.modalSafe = a[0] === c[0] && a[1] === c[1]; await p.evaluate(() => { document.getElementById('modal').hidden = true; });
  // 大地圖：空白鍵跟旁邊的朋友說話
  await p.evaluate(() => { curRoom().items = []; openIsland(); }); await p.waitForTimeout(1200);
  await p.evaluate(() => { const q = isl.npcs[0]; isl.x = q.x + .8; isl.y = q.y; isl.path = []; q.path = []; q.wait = 9; });
  await p.keyboard.press('Space'); await p.waitForTimeout(600);
  o.islandTalk = await p.evaluate(() => !!(isl && (isl.talk || isl.pending || isl.act || Object.keys(isl.shake || {}).length)) || !document.getElementById('modal').hidden);   // 跟最近的東西互動了（朋友說話；剛好樹比較近就搖樹）
  if (!o.islandTalk) console.log('island dbg', await p.evaluate(() => JSON.stringify({ isl: !!isl, act: isl && isl.act, path: isl && isl.path.length, tool: isl && isl.tool, fly: isl && isl.fly, away: G.away, toast: (document.querySelector('.toast') || {}).textContent, npc0: isl && [isl.npcs[0].x, isl.npcs[0].y, isl.x, isl.y] })));
  await p.evaluate(() => { try { islTalkClose(); } catch (e) {} document.getElementById('modal').hidden = true; if (!isl) openIsland(); }); await p.waitForTimeout(900);
  await p.evaluate(() => { isl.pending = null; isl.path = []; isl.act = null; });
  { const x0 = await p.evaluate(() => isl.x); await hold('ArrowRight', 600); const x1 = await p.evaluate(() => isl ? isl.x : null); const x2 = await (async () => { await hold('ArrowLeft', 600); return p.evaluate(() => isl ? isl.x : null); })(); o.islandArrows = x1 !== x0 || x2 !== x1; }
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 2)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
