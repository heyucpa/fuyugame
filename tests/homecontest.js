// 🏡 房子外觀第四批：最美房子比賽（每週一次、分數給星、3 星送星光紫）、阿婆家叔叔家越拜訪越漂亮、邀請卡帶著房子外觀（舊卡沒有也沒關係、亂寫的會被擋掉）、存檔驗證
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
    delete G.home; const h = homeState();
    o.plain = homeScore().stars === 1 && homeScore().tips.length >= 5;
    const b0 = G.bells; o.first = homeContestTick() === true && G.bells === b0 + 100 && h.contest.stars === 1; clear();
    o.weekly = homeContestTick() === false;
    Object.assign(h, { style: 'castle', wall: 'pink', roof: 'blue', door: 'red', decoL: 'mailbox', decoR: 'lamp', sign: '安安家', flag: 'star' });
    h.contest = { wk: homeWeek() - 1, stars: 1 }; const b1 = G.bells; homeContestTick(); clear();
    o.three = h.contest.stars === 3 && G.bells === b1 + 800 && homeOwns('wall', 'starry');
    // 阿婆家：拜訪越多越漂亮
    G.famVisit = {}; o.fam0 = famLv('grandma') === 0; G.famVisit.grandma = 10; o.fam3 = famLv('grandma') === 3;
    let said = ''; const rt = toast; toast = m => { said += m; }; G.famVisit.uncle = 2; travelArrive('uncle'); await wait(2800); toast = rt; o.famUp = famVisits('uncle') === 3 && /更漂亮/.test(said);
    if (typeof goHome === 'function') goHome(); $('#modal').hidden = true;
    // 邀請卡帶房子外觀
    const inv = cleanInvite(makeInvite()); o.inv = inv && inv.hl && inv.hl.st === 'castle' && inv.hl.wa === 'pink' && inv.hl.fl === 'star';
    const raw = makeInvite(); delete raw.hl; o.oldInv = !!cleanInvite(raw) && cleanInvite(raw).hl === undefined;
    const bad = makeInvite(); bad.hl = { st: 'ufo', wa: 123, ro: 'blue', dl: 'bomb', ti: 9 }; const cb = cleanInvite(bad).hl; o.badInv = cb.st === 'cottage' && cb.wa === 'peach' && cb.ro === 'blue' && cb.dl === 'none' && cb.ti === 0;
    // 朋友家照外觀畫（不出錯）
    const cv = document.createElement('canvas').getContext('2d'); try { islMapCache = null; openIsland(); await wait(200); isl.invites = [inv]; islDrawBuilding(cv, { id: 'friend0', x: 2, y: 2, w: 3, h: 2, door: [3, 4] }, 1); o.friendDraw = true; } catch (e) { o.friendDraw = false; } closeIsland();
    // 存檔
    saveGame(); const r2 = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = r2.home.contest.stars === 3 && r2.famVisit.grandma === 10;
    const n2 = normalizeSave(Object.assign({}, r2, { famVisit: { grandma: -3, zoo: 4, uncle: 5 }, home: Object.assign({}, r2.home, { contest: { wk: 'x', stars: 9 } }) }));
    o.bad = n2.famVisit.grandma == null && n2.famVisit.zoo == null && n2.famVisit.uncle === 5 && n2.home.contest == null;
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
