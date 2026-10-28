// 🌟 星光線索：教學做完送星星蛋（擺在房間、以前破過的大魔王關補線索）；線索關開場台詞；第一次過大魔王關給線索、重複不給；6 個孵出星光小精靈；買的蛋抽不到；圖鑑、每日目標、存檔、重讀
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {}, fakeW = () => ({ stage: document.createElement('div'), btns: document.createElement('div'), status: {}, card: document.createElement('div') });
    G.guide = 'done'; G.openGift = true; $('#modal').hidden = true; G.star = {}; G.daily = { d: today(), ids: ['feed', 'bath', 'kidEat'], n: {}, paid: {}, seen: today() };
    questState().clear['1-3'] = 1;   // 更新前就破過世界 1
    document.querySelector('.stage').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    for (let i = 0; i < 40 && !G.star.egg; i++) { if (!$('#modal').hidden) $('#modal').hidden = true; await wait(200); }
    o.egg = G.star.egg === 1 && (G.rooms[0].items.some(it => it.id === 'star_egg') || G.inv.star_egg === 1); o.retro = G.star.got.join() === '1';
    await wait(300); o.eggShow = !!document.getElementById('showcase') || SC_QUEUE.length > 0; const sc = document.getElementById('showcase'); if (sc) sc.remove(); SC_QUEUE.length = 0;
    o.intro = /草原|沙灘/.test(starIntroLine('2-3')) && starIntroLine('2-1') === '' && starIntroLine('1-3') === '';
    // 第一次過 2-3 給線索、再過不給
    questDone(fakeW(), '2-3', { coins: 0, stars: 1 }); o.clue2 = G.star.got.join() === '1,2';
    questDone(fakeW(), '2-3', { coins: 0, stars: 1 }); o.noDup = G.star.got.length === 2;
    // 每日目標：找下一個線索
    o.dailyClue = dailyTask('clue').avail(G) === !!questUnlocked(starNextW() + '-3');
    // 6 個 → 孵化
    G.star.got = [1, 2, 3, 4, 5]; const nPets = G.pets.length; questDone(fakeW(), '6-3', { coins: 0, stars: 1 }); await wait(2800);
    o.hatch = G.star.hatched === 1 && G.pets.length === nPets + 1 && G.pets.some(pt => pt.species === 'starling' && pt.stage === 'baby');
    document.querySelectorAll('#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0; $('#modal').hidden = true;
    // 買的蛋抽不到
    const saved = G.pets.slice(); let got = new Set(); for (let k = 0; k < 120; k++) { G.pets = saved.slice(); const i = addEgg(); got.add(G.pets[i].species); } G.pets = saved; o.noStoryEgg = !got.has('starling');
    // 點星星蛋
    openStarEgg(); o.eggCard = document.querySelectorAll('.star-slot.on').length === 6; $('#modal').hidden = true;
    // 圖鑑
    openTab('book'); await wait(200); o.book = !!document.getElementById('dexStar') && /星光線索 6 \/ 6/.test($('#tabBody').innerText); openTab('inv');
    // 存檔
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.star && raw.star.hatched === 1 && raw.star.got.length === 6;
    const bad = normalizeSave(Object.assign({}, raw, { star: { got: [1, 1, 9, 'x', 3], egg: 2, hatched: 1 } })).star; o.bad = bad.got.join() === '1,3' && bad.egg == null && bad.hatched === 1;
    return o;
  });
  console.log(JSON.stringify(out));
  // 重新整理：星星蛋還在房間、星光小精靈還在
  await p.reload(); await p.waitForTimeout(1500);
  const after = await p.evaluate(() => ({ locked: SAVE_LOCKED != null, egg: G.rooms[0].items.some(it => it.id === 'star_egg') || G.inv.star_egg > 0, pet: G.pets.some(x => x.species === 'starling') }));
  console.log(JSON.stringify(after));
  const ok = Object.values(out).every(Boolean) && !after.locked && after.egg && after.pet && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
