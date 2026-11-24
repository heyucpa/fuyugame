// 故事扮演小遊戲：三隻小豬只點磚頭（點錯少一塊、蓋滿 12 塊大野狼吹不倒）、神燈魔毯撿星星（沙塵暴扣一顆、集滿燈神出來）、第一次成功送衣服
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), close = () => { closeGameWindow(); document.getElementById('modal').hidden = true; };
    try {
      G.guide = 'done'; G.wardrobe = G.wardrobe.filter(id => !/^(pig_cap|genie_)/.test(id)); delete G.storyPlay;
      openPigsGame(0); await w(300); let T = openPigsGame.test;
      T.tap('brick'); T.tap('brick'); T.tap('straw'); o.pigWrong = T.bricks === 1;
      for (let i = 0; i < 11; i++) T.tap('brick'); o.pigDone = T.done && T.bricks === 12;
      T.skipFinale(); await w(400);
      o.pigWin = storyState().pigs === 1 && G.wardrobe.includes('pig_cap');
      document.querySelectorAll('#showcase').forEach(e => e.remove()); SC_QUEUE.length = 0;
      openLampGame(0); await w(300); T = openLampGame.test;
      T.addStar(); await w(150); T.addStar(); await w(150); T.addDust(); await w(150); o.lampDust = T.got === 1;
      for (let i = 0; i < 14; i++) { T.addStar(); await w(90); }
      o.lampDone = T.done;
      T.skipFinale(); await w(400);
      o.lampWin = storyState().lamp === 1 && G.wardrobe.includes('genie_turban') && G.wardrobe.includes('genie_vest');
      T.press(true); const y0 = T.y; await w(400); o.flyUp = T.y <= y0;
      document.querySelectorAll('#showcase').forEach(e => e.remove()); SC_QUEUE.length = 0;
      openStoryPlayMenu(); await w(100); o.menu5 = ['三隻小豬蓋磚頭屋', '神燈魔毯飛行'].every(t => document.getElementById('modalCard').textContent.includes(t)); document.getElementById('modal').hidden = true;
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
