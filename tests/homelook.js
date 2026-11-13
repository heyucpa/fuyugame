// 🏡 房子外觀：外觀店（買、換、錢不夠、收集獎勵）、門牌、門口裝飾、房子會長大、地圖上畫得出來（各造型、四季、晚上）、存檔驗證、換了朋友會稱讚
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); G.guide = 'done'; $('#modal').hidden = true;
    const clear = () => { document.querySelectorAll('#showcase').forEach(x => x.remove()); if (typeof SC_QUEUE !== 'undefined') SC_QUEUE.length = 0; };
    delete G.home; const h = homeState(); o.defaults = h.style === 'cottage' && h.wall === 'peach' && homeOwns('wall', 'peach');
    openTab('shop'); await wait(100); o.shopBtn = !!document.querySelector('.home-shop-btn');
    document.querySelector('.home-shop-btn').click(); await wait(200); o.win = /房子外觀/.test($('#modalCard').textContent) && !!document.querySelector('.home-prev');
    // 錢不夠買不了
    G.bells = 0; homeTab = 'wall'; openHomeLook.test.render(); [...document.querySelectorAll('.home-grid .card')].find(x => /草莓粉/.test(x.textContent)).click(); o.poor = h.wall === 'peach' && !homeOwns('wall', 'pink');
    // 買了就換上、扣錢、可以換回來
    G.bells = 100000; [...document.querySelectorAll('.home-grid .card')].find(x => /草莓粉/.test(x.textContent)).click(); o.buy = h.wall === 'pink' && homeOwns('wall', 'pink') && G.bells === 100000 - 400;
    [...document.querySelectorAll('.home-grid .card')].find(x => /蜜桃粉/.test(x.textContent)).click(); o.swap = h.wall === 'peach' && G.bells === 100000 - 400;
    // 冠軍旗：沒拿過冠軍不能用
    homeTab = 'flag'; openHomeLook.test.render(); G.dbcup = { best: 0, gold: 0 }; [...document.querySelectorAll('.home-grid .card')].find(x => /冠軍旗/.test(x.textContent)).click(); o.champLocked = h.flag !== 'champ';
    // 收集 10 種 → 金色屋頂
    homeTab = 'roof'; openHomeLook.test.render(); ['藍屋頂', '綠屋頂', '咖啡屋頂', '紫屋頂', '橘屋頂', '黑屋頂'].forEach(n => [...document.querySelectorAll('.home-grid .card')].find(x => x.textContent.includes(n)).click());
    homeTab = 'door'; openHomeLook.test.render(); ['紅門', '藍門', '黃門'].forEach(n => [...document.querySelectorAll('.home-grid .card')].find(x => x.textContent.includes(n)).click());
    await wait(100); clear(); o.gold = homeCollected() >= 10 && homeOwns('roof', 'gold');
    // 門牌
    homeTab = 'sign'; openHomeLook.test.render(); const inp = document.querySelector('.home-sign input'); inp.value = '安安的家超長超長的名字'; document.querySelector('.home-sign button').click(); o.sign = h.sign === '安安的家超長超長'.slice(0, 8) && homeLook().sign.length <= 8;
    // 門口裝飾
    homeTab = 'decoL'; openHomeLook.test.render(); [...document.querySelectorAll('.home-grid .card')].find(x => /信箱/.test(x.textContent)).click(); o.deco = h.decoL === 'mailbox';
    // 全部收集 → 彩虹城堡
    homeBuyable().forEach(k => { if (!h.owned.includes(k)) h.owned.push(k); }); homeCheckRewards(); await wait(100); clear(); o.rainbow = homeOwns('style', 'rainbowCastle');
    closeGameWindow(); $('#modal').hidden = true;
    // 房子會長大
    const keep = G.rooms.slice(); G.rooms = keep.slice(0, 1); const t0 = homeTier(); while (G.rooms.length < 5) G.rooms.push(JSON.parse(JSON.stringify(keep[0]))); o.grow = t0 === 0 && homeTier() === 2; G.rooms = keep;
    // 每種造型、四季、晚上都畫得出來
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 200; const g = cv.getContext('2d'); let drew = true;
    HOME_STYLES.forEach(([st]) => ['spring', 'summer', 'autumn', 'winter'].forEach(se => [0, 1, 2].forEach(tier => { try { drawHomeExterior(g, 80, 70, 128, 92, 128, Object.assign(homeLook(), { style: st, tier, roof: st === 'castle' ? 'rainbow' : '#ff7b7b' }), { tt: 1, season: se, night: tier === 1, glow: [], rain: true, snow: true }); } catch (e) { drew = false; } })));
    o.drew = drew;
    // 出門：朋友會稱讚、地圖上是新門牌
    h.newAt = Date.now(); h.seenAt = 0; let said = ''; const rt = toast; toast = m => { said += m; }; islMapCache = null; openIsland(); await wait(2600); toast = rt;
    o.praise = /變好漂亮/.test(said) && h.seenAt > 0; closeIsland();
    // 存檔驗證
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.home.wall === 'peach' && raw.home.owned.includes('roof:gold');
    const bad = normalizeSave(Object.assign({}, raw, { home: { wall: 'zzz', style: 'ufo', owned: ['wall:pink', 'bad', 'roof:nope', 5], sign: 'x'.repeat(30), decoL: 'rocket' } })).home;
    o.bad = bad.wall == null && bad.style == null && bad.owned.join() === 'wall:pink' && bad.sign.length === 8 && bad.decoL == null;
    o.bad2 = normalizeSave(Object.assign({}, raw, { home: 'oops' })).home == null;
    // 蜜桃粉：還沒選過牆壁 → 糖果屋用自己的顏色；自己選了蜜桃粉 → 真的畫蜜桃粉（家長：蜜桃粉的顏色怪怪的）
    { const px = (lk) => { const c = document.createElement('canvas'); c.width = 300; c.height = 190; const g = c.getContext('2d'); drawHomeExterior(g, 86, 58, 128, 92, 134, lk, { tt: 0 }); return Array.from(g.getImageData(100, 130, 1, 1).data.slice(0, 3)).join(); };
      const base = Object.assign(homeLook(), { style: 'candy', wall: '#ffd9c9', decoL: 'none', decoR: 'none', tier: 0 });
      o.peachAuto = px(Object.assign({}, base, { wallAuto: true })) === '232,183,122';
      o.peachPicked = px(Object.assign({}, base, { wallAuto: false })) === '255,217,201'; }
    o.noXmasInCollect = !homeBuyable().includes('deco:xmas');
    o.hint = /還差 \d+ 種/.test(homeRewardHint('rainbowCastle')) || /已經可以拿/.test(homeRewardHint('rainbowCastle'));
    o.pickedSaved = normalizeSave(Object.assign({}, raw, { home: { wallPicked: 1, wall: 'peach' } })).home.wallPicked === 1 && normalizeSave(Object.assign({}, raw, { home: { wallPicked: 'x' } })).home.wallPicked == null;
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
