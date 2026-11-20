// 🎄 聖誕節活動：12 月才有「🎅 送禮物」；送到門口拿星星、一天 3 份；星星到了送獎品；聖誕襪每天一份；平安夜聖誕熊每年一次；新家具畫得出來；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.xmas = {}; document.querySelectorAll('#showcase').forEach(x => x.remove());
    SEASON_TODAY = [11, 20]; openIsland(); await w(800); islRideBtn(); o.hiddenNotDec = document.getElementById('islXmas').hidden === true; closeIsland();
    SEASON_TODAY = [12, 10]; openIsland(); await w(800); islRideBtn(); o.shownInDec = document.getElementById('islXmas').hidden === false;
    o.inSeasonShop = ['xmas_stocking', 'xmas_wreath'].every(id => SEASON_FURNITURE.some(d => d.id === id && d.season === 'christmas'));
    xmasStartRun(); o.runStarted = !!xmasRun && xmasRun.total === 3;
    const b0 = G.bells;
    for (let i = 0; i < 3; i++) { const bd = isl.m.blds.find(q => q.id === xmasRun.left[0]); isl.path = []; isl.x = bd.door[0] + .5; isl.y = bd.door[1] + .3; await w(400); }
    o.delivered = !xmasRun && xmasState().stars === 3 && xmasState().n === 3 && G.bells === b0 + 240;
    o.prize1 = G.wardrobe.includes('santa_suit');
    xmasStartRun(); o.dailyCap = !xmasRun; document.getElementById('modal').hidden = true;
    o.arrowDraws = (() => { try { xmasStartRun.x = 1; xmasRun = { left: ['grandma'], done: 0, total: 1 }; xmasDraw(isl.cv.getContext('2d'), performance.now()); xmasRun = null; return true; } catch (e) { return e.message; } })() === true;
    xmasStar(5); o.prize2 = (G.inv.reindeer_sleigh || 0) >= 1; xmasStar(7); o.prize3 = G.wardrobe.includes('xmas_star_clip');
    closeIsland();
    // 聖誕襪
    const k0 = G.kidFood.xmas_cookie || 0; openStocking(); o.sockGift = (G.kidFood.xmas_cookie || 0) === k0 + 2; const k1 = G.kidFood.xmas_cookie; openStocking(); o.sockOncePerDay = G.kidFood.xmas_cookie === k1;
    // 平安夜
    SEASON_TODAY = [12, 24]; const t0 = G.inv.xmas_teddy || 0; o.eve = xmasEveGift() && (G.inv.xmas_teddy || 0) === t0 + 1 && !xmasEveGift();
    SEASON_TODAY = [12, 10]; o.notEveEarly = (() => { G.xmas.eve = 0; return !xmasEveGift(); })();
    // 家具畫得出來
    o.furnDraw = (() => { try { ['xmas_stocking', 'xmas_wreath', 'reindeer_sleigh', 'xmas_teddy'].forEach(id => renderThumb(FURN_BY_ID[id], 64)); const c = document.createElement('canvas').getContext('2d'); drawGirl(c, { t: 0, outfit: Object.assign({}, currentOutfit(), { top: CLOTHES_BY_ID.santa_suit, clip: CLOTHES_BY_ID.xmas_star_clip }), hair: G.hair }); return true; } catch (e) { return e.message; } })() === true;
    o.actsOk = ['xmas_stocking', 'xmas_wreath', 'reindeer_sleigh', 'xmas_teddy'].every(id => ACTIVITIES[FURNITURE_ACT[id]]);
    // 存檔
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { xmas: { stars: -3, n: 'x', got: ['santa_suit', 'nope'], eve: 5, junk: 1 } }));
    o.saveSafe = !('stars' in n.xmas) && !('n' in n.xmas) && n.xmas.got.join() === 'santa_suit' && !('eve' in n.xmas) && !('junk' in n.xmas);
    const n2 = normalizeSave(JSON.parse(JSON.stringify(G))); o.saveKeeps = n2.xmas.stars === G.xmas.stars && n2.inv.reindeer_sleigh === G.inv.reindeer_sleigh;
    SEASON_TODAY = null;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
