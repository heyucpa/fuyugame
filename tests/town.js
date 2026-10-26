// 🏘️ 小鎮島：島和木橋走得到；🍽️ 點餐（扣錢、吃飽）、👩‍🍳 疊漢堡打工；🏥 小醫生、寵物健檢（一天一次）、小可愛健檢（視力表）、勇敢貼紙（集滿有獎）；主人選單、快速選單；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {}, st = () => document.querySelector('.game-status').textContent;
    G.guide = 'done'; $('#modal').hidden = true; G.town = {}; G.bells = 5000;
    islMapCache = null; const m = islMap(0), home = m.blds.find(x => x.id === 'home');
    o.walk = ['restaurant', 'hospital'].every(id => { const bd = m.blds.find(x => x.id === id), pth = islFindPath(m, home.door[0], home.door[1], (x, y) => x === bd.door[0] && y === bd.door[1]); return bd && pth && pth.length > 5; });
    // 🍽️ 點餐
    G.kid.hunger = 20; openRestaurantOrder(); const b0 = G.bells; [...document.querySelectorAll('.menu-item')][0].click(); await wait(50); o.order = G.bells === b0 - MENU[0][3] && G.kid.hunger >= 55 && /來囉/.test($('#modalCard').innerText); $('#modal').hidden = true;
    // 👩‍🍳 疊漢堡
    openChefGame(); await wait(50); const C = openChefGame.test; C.add('top'); o.chefWrong = C.i() === 0; for (let k = 0; k < 5; k++) { C.want().forEach(x => C.add(x)); } await wait(50); o.chef = /做了 5 個漢堡/.test(st()); closeGameWindow();
    // 💓 小醫生
    openDoctorGame(); await wait(50); const D = openDoctorGame.test; for (let k = 0; k < 4; k++) D.steps().forEach(x => D.use(x)); await wait(700); o.doctor = /照顧好 4 位病人/.test(st()) && Object.keys(townState().stk).length >= 1; closeGameWindow();
    // 🐾 寵物健檢
    if (!G.pet || G.pet.stage === 'egg') { G.pet = G.pets[0]; G.pet.stage = 'baby'; }
    G.pet.mood = 40; openPetCheckup(); await wait(50); const P = openPetCheckup.test; P.next(); P.next(); P.next(); P.hold(true); await wait(1900); o.pet = townState().petDay === today() && G.pet.mood >= 65; closeGameWindow();
    openPetCheckup(); await wait(50); o.petOnce = /檢查過了/.test(st()); closeGameWindow();
    // 👧 小可愛健檢：視力表
    openKidCheckup(); await wait(50); o.height = /身高 \d+ 公分/.test($('#modalCard').innerText); const K = openKidCheckup.test; K.start(); for (let k = 0; k < 4; k++) { document.querySelectorAll('.tkd-move')[K.dir()].click(); await wait(20); } await wait(700); o.eye = /看對 4 \/ 4/.test(st()) && townState().kidDay === today(); closeGameWindow();
    // 🏅 集滿貼紙
    const t = townState(); t.stk = { lion: 1, star: 1, rainbow: 1, bear: 1, heart: 1, amb: 1, sun: 1 }; const b1 = G.bells; for (let k = 0; k < 6 && !t.allDone; k++) giveBraveSticker('t'); o.allStk = t.allDone === 1 && G.bells >= b1 + 3000;
    openStickerBook(); o.book = document.querySelectorAll('.stk').length === 8 && !document.querySelector('.stk.no'); $('#modal').hidden = true;
    // 主人選單、快速選單
    travelArrive('restaurant'); await wait(300); $('#modal').hidden = true; o.hostR = host.n && host.n.id === 'restaurant' && hostMenuEntries().some(e => /打工/.test(e[0])); o.usableR = curRoom().items.every(it => canUse(it));
    travelArrive('hospital'); await wait(300); $('#modal').hidden = true; o.hostH = host.n && host.n.id === 'hospital' && hostMenuEntries().some(e => /小醫生/.test(e[0])) && hostMenuEntries().some(e => /貼紙簿/.test(e[0]));
    o.quick = allQuickGames().some(g => g.name === '餐廳打工' && g.where === 'restaurant') && allQuickGames().some(g => g.name === '小醫生' && g.where === 'hospital');
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.town && raw.town.allDone === 1;
    const bad = normalizeSave(Object.assign({}, raw, { town: { stk: { lion: 2, ghost: 1, star: -1 }, petDay: 5, allDone: 7 } })).town; o.bad = bad.stk.lion === 2 && bad.stk.ghost == null && bad.stk.star == null && bad.petDay == null && bad.allDone == null;
    o.bad2 = normalizeSave(Object.assign({}, raw, { town: 'x' })).town == null;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
