// 🎖️ 升級考試（游泳、小廚師、球類、運動會）：考試畫面、考過給獎金＋衣服＋招數、考不過越考越簡單、不考的時候玩遊戲不算、存檔驗證、獎品畫得出來
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
    o.tracks = EXAM_ORDER.length === 4 && EXAM_ORDER.every(id => EXAM_TRACKS[id].ranks.length === 4 && EXAM_TRACKS[id].ranks.every(r => CLOTHES_BY_ID[r.item] && CLOTHES_BY_ID[r.item].prize));
    // 考試畫面
    G.exams = {}; openExam('swim'); await wait(100);
    o.ladder = document.querySelectorAll('.exam-step').length === 4 && document.querySelectorAll('.exam-step.next').length === 1 && /開始考「小鴨級」/.test(document.querySelector('#modalCard').textContent);
    // 開始考：真的開打水比賽
    [...document.querySelectorAll('#modalCard button')].find(x => /開始考/.test(x.textContent)).click(); await wait(200);
    o.started = !!EXAM && EXAM.id === 'swim' && EXAM.need === 3 && !!document.querySelector('#modalCard .run-go');
    // 考不過（第 4 名）→ 再考目標變簡單
    const w = EXAM.w; examHook('swimRace', { place: 4 }, w); clear();
    o.failEase = examRank('swim') === 0 && examNeed('swim', 0) === 4 && /再考一次/.test(w.btns.textContent);
    // 考過（第 4 名也算前 4 名）
    examStart(w, 'swim', 0); const b0 = G.bells; examHook('swimRace', { place: 4 }, w); clear();
    o.pass = examRank('swim') === 1 && ownsClothes('cap_duck') && G.bells === b0 + 300 && /看下一級/.test(w.btns.textContent);
    o.perk = examMul('swim') > 1;
    closeGameWindow(); $('#modal').hidden = true;
    // 不是考試的時候玩遊戲：不會被算成考試
    o.noExam = EXAM === null;
    // 小廚師：開廚房、二星以上下一層會發亮
    G.exams.chef = 2; openChefGame(); await wait(100); o.chefGlow = !!document.querySelector('#modalCard .tkd-move.glow'); closeGameWindow(); $('#modal').hidden = true;
    G.exams.chef = 0; openExam('chef'); await wait(50); [...document.querySelectorAll('#modalCard button')].find(x => /開始考/.test(x.textContent)).click(); await wait(200);
    o.chefExam = !!EXAM && EXAM.id === 'chef' && /漢堡/.test(document.querySelector('#modalCard').textContent);
    const T = openChefGame.test; for (let k = 0; k < 5; k++) { let guard = 0; while (T.i() === k && guard++ < 10) T.add(T.want()[0] === undefined ? 'bun' : T.want()[T.want().length && (document.querySelectorAll('.burger.got .bp').length)] ); }
    await wait(100); clear();
    o.chefPass = examRank('chef') === 1 && ownsClothes('chef_hat');
    closeGameWindow(); $('#modal').hidden = true;
    // 球類、運動會：考試畫面打得開
    openExam('ball'); o.ball = /新手球員/.test($('#modalCard').textContent); closeGameWindow();
    openExam('track'); o.track = /銅牌小跑手/.test($('#modalCard').textContent) && /障礙賽跑/.test($('#modalCard').textContent); closeGameWindow(); $('#modal').hidden = true;
    // 全部考過
    G.exams.ball = 4; openExam('ball'); o.allDone = /MVP/.test(w.status ? $('#modalCard').textContent : '') && !document.querySelector('.exam-step.next'); closeGameWindow(); $('#modal').hidden = true;
    // 存檔驗證
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = raw.exams.swim === 1 && raw.exams.ball === 4;
    const bad = normalizeSave(Object.assign({}, raw, { exams: { swim: 9, chef: 'x', foo: 2, track: 3 } })).exams; o.bad = bad.swim == null && bad.chef == null && bad.foo == null && bad.track === 3;
    const bad2 = normalizeSave(Object.assign({}, raw, { exams: 'oops' })); o.bad2 = bad2.exams == null;
    // 獎品都畫得出來
    let drew = true; EXAM_ORDER.forEach(id => EXAM_TRACKS[id].ranks.forEach(r => { try { const it = CLOTHES_BY_ID[r.item]; renderGirl(previewOutfit(it.slot, it.id), 60, 74, { hair: G.hair }); } catch (e) { drew = false; } })); o.drew = drew;
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
