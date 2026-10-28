// 🀄 小一國字＋🐣 小一英文：三種玩法都能答、答錯提示、第一次答對才記字、英文算進英文小達人、徽章、每日目標、圖鑑、存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; G.openGift = true; $('#modal').hidden = true; G.hanzi = {}; G.enLearn = {};
    G.daily = { d: today(), ids: ['hanzi', 'feed', 'bath'], n: {}, paid: {}, seen: today() };
    const play = async (open, lv) => {
      open(); document.querySelectorAll('.lv-btn')[lv].click(); await wait(100); const T = playPick.test;
      T.wrong(); await wait(50); T.wrong(); await wait(50); const hint = !!document.querySelector('.zy-card.hint');
      T.answer(); await wait(1700); const firstNoCount = T.right() === 0;
      while (T.n() < 8) { T.answer(); await wait(1700); }
      await wait(100); const st = document.querySelector('.game-status').textContent;
      return { hint, firstNoCount, right: T.right(), st, mode: T.mode };
    };
    const r0 = await play(openHanziGame, 0); o.h0 = r0.hint && r0.firstNoCount && r0.right === 7 && /答對 7/.test(r0.st);
    o.learned = hanziCount() === 7 && G.daily.n.hanzi === 1; closeGameWindow();
    const r2 = await play(openHanziGame, 2); o.h2 = r2.mode === 'txt2pic' && r2.right === 7; closeGameWindow();
    o.badge = hanziCount() >= 10; document.querySelectorAll('#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0;
    const e0 = await play(openKidEnGame, 0); o.e0 = e0.right === 7 && Object.keys(G.enLearn).length === 7; closeGameWindow();
    const e1 = await play(openKidEnGame, 1); o.e1 = e1.mode === 'pic2txt' && e1.right === 7; closeGameWindow();
    document.querySelectorAll('#showcase').forEach(x => x.remove()); SC_QUEUE.length = 0;
    openTab('book'); await wait(200); o.book = !!document.getElementById('dexHanzi') && document.querySelectorAll('.en-word.hz').length === HANZI.length; openTab('inv');
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); o.saved = Object.keys(raw.hanzi).length >= 10;
    const bad = normalizeSave(Object.assign({}, raw, { hanzi: { 山: 1, ab: 1, 水: 3, '<': 1 } })); o.bad = Object.keys(bad.hanzi).join() === '山';
    const bad2 = normalizeSave(Object.assign({}, raw, { hanzi: 'x' })); o.bad2 = bad2.hanzi == null;
    const emo = [...HANZI, ...KID_EN].map(h => h.pic).join(''); o.emoji = ![...emo].some(c => { const cp = c.codePointAt(0); return cp >= 0x1FA70 && cp <= 0x1FAFF; });
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
