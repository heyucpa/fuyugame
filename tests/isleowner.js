// 🏝️ 島主：點大東西打開島主選單；每天收成一次；花藝店、糖果工廠、挖化石能玩完；做家具帶回家；恐龍骨頭拼完送模型；取名字；等級和擺飾；家具擺在房間裡存檔讀得回來；壞存檔清掉
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {}, txt = () => $('#modalCard').innerText, btn = re => [...document.querySelectorAll('#modalCard button')].find(x => re.test(x.textContent));
    G.guide = 'done'; $('#modal').hidden = true; G.isle = {}; G.qIsleDay = null;
    ['1-3', '2-3', '3-3'].forEach(k => questState().clear[k] = 1); islMapCache = null;
    openIsland(); await wait(300); const m = isl.m;
    const sp = m.specials.find(x => x.id === 'flower'); islFun(islFunAt({ fx: sp.x + .5, fy: sp.y + .3 })); await wait(900); o.menu = /島主/.test(txt()) && /花花島/.test(txt());
    // 🌷 收成：一天一次
    const b0 = G.bells; btn(/摘今天的花/).click(); await wait(100); o.harvest = G.bells === b0 + 150 && flowerTotal() === 6; $('#modal').hidden = true;
    openIsleMenu('flower'); o.onceDay = btn(/摘今天的花/).disabled;
    // 💐 花藝店：照著配
    btn(/花藝店/).click(); await wait(100); const F = openFlowerShop.test;
    for (let k = 0; k < 4; k++) { F.want().forEach(f => F.add(f)); F.submit(); await wait(50); }
    o.flowerShop = /賣出 4 束花/.test(document.querySelector('.game-status').textContent); closeGameWindow();
    // 🌱 做花花盆栽（5 朵花）
    openIsleMenu('flower'); btn(/做花花盆栽/).click(); await wait(100); o.craft = G.inv.isle_flowerpot === 1 && flowerTotal() === 1; $('#modal').hidden = true;
    // 🍬 糖果工廠
    openCandyFactory(); await wait(50); const C = openCandyFactory.test;
    for (let k = 0; k < 40 && C.moves() > 0; k++) { const g = C.grid(); let done = false; for (let y = 0; y < 6 && !done; y++) for (let x = 0; x < 6 && !done; x++) if (C.group(x, y).length >= 2) { C.tapAt(x, y); done = true; } if (!done) break; }
    o.candy = C.moves() === 0 && isleState('candy').stock >= 1 && /做了/.test(document.querySelector('.game-status').textContent); closeGameWindow();
    openIsleMenu('candy'); const s0 = isleState('candy').stock; btn(/吃一顆糖果/).click(); await wait(50); o.eat = isleState('candy').stock === s0 - 1; $('#modal').hidden = true;
    // ⛏️ 挖化石：挖到骨頭
    openDigGame(); await wait(50); const D = openDigGame.test; D.cells.forEach((c, i) => { if (c.k === 'bone') D.dig(i); }); o.dig = D.found() === 2 && /找到 2 塊骨頭/.test(document.querySelector('.game-status').textContent); closeGameWindow();
    // 🦖 拼完一隻送模型
    isleState('dino').bones = { rex: [0, 1, 2] }; isleGiveBone(['rex', 3]); o.model = G.inv.dino_rex === 1;
    openDinoBook(); o.book = /暴龍/.test(txt()) && /拼好了/.test(txt()); $('#modal').hidden = true;
    // 🏷️ 取名字
    openIsleRename('candy'); document.querySelector('#modalCard input').value = '甜甜島'; btn(/好了/).click(); await wait(50); o.rename = isleName('candy') === '甜甜島' && /甜甜島/.test(txt()); $('#modal').hidden = true;
    openTravelMenu(); o.quickName = /甜甜島/.test(txt()); $('#modal').hidden = true;
    // ⭐ 等級
    isleState('flower').xp = 130; o.lv = isleLv('flower') === 5;
    closeIsland();
    // 家具擺在房間裡：存檔、重讀都沒問題
    G.rooms[0].items.push({ uid: G.uid++, id: 'dino_rex', x: 1, y: 1, rot: 0 }, { uid: G.uid++, id: 'isle_candyhouse', x: 4, y: 4, rot: 0 }); saveGame();
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saveOk = !!normalizeSave(JSON.parse(JSON.stringify(raw)));
    const bad = normalizeSave(Object.assign({}, raw, { isle: { flower: { name: 123, xp: -5, stock: { rose: 2, weed: 5, sun: 'x' } }, dino: { bones: { rex: [0, 0, 9, 'a'], bad: [1] } }, moon: {} } })).isle;
    o.bad = bad.flower.name == null && bad.flower.xp == null && bad.flower.stock.rose === 2 && bad.flower.stock.weed == null && bad.flower.stock.sun == null && JSON.stringify(bad.dino.bones) === '{"rex":[0]}' && !bad.moon;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  // 重新整理之後存檔還在（家具找得到）
  await p.reload(); await p.waitForTimeout(1500);
  const after = await p.evaluate(() => ({ locked: SAVE_LOCKED != null, rex: G.rooms[0].items.some(it => it.id === 'dino_rex'), inv: G.inv.isle_flowerpot }));
  console.log(JSON.stringify(after), after.locked || !after.rex ? '❌ 重讀後存檔有問題' : '✅ 重讀後存檔正常');
  await b.close();
})();
