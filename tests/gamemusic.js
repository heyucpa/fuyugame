// 🎮 小遊戲音樂：打開小遊戲 → 家裡的背景音樂停、換成搭配的音樂（抓小偷＝運動、演習＝躡手躡腳、恐龍島＝恐龍探險、病房＝輕鬆）；
//    關掉 → 換回家裡那首；家裡音樂關著也能聽小遊戲音樂；小遊戲音樂可以關；闖關照舊用闖關冒險曲
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.addInitScript(() => { window.__osc = 0; const A = window.AudioContext; const co = A.prototype.createOscillator; A.prototype.createOscillator = function () { window.__osc++; return co.apply(this, arguments); }; });
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  await p.mouse.click(5, 5);   // 讓瀏覽器准許出聲
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), cnt = async ms => { const a = window.__osc; await w(ms); return window.__osc - a; };
    document.getElementById('modal').hidden = true; G.guide = 'done';
    Sound.setPref('bgm', false); Sound.setPref('sfx', false); delete Sound.prefs.gm;
    o.homeSilent = (await cnt(1500)) === 0;
    openCopChase(1); await w(200); o.chaseMusic = Sound.special() === 'action' && (await cnt(1500)) > 0;
    closeGameWindow(); await w(200); o.backHomeSilent = Sound.special() === null && (await cnt(1500)) === 0;
    openThiefDrill(); o.drillSneak = Sound.special() === 'sneak'; closeGameWindow();
    dinoPlay(0); o.dinoAdventure = Sound.special() === 'adventure'; closeGameWindow();
    openWard(1); o.wardCalm = Sound.special() === 'calm'; closeGameWindow();
    playQuest('1-1'); await w(300); o.questKeeps = Sound.special() === 'quest'; closeGameWindow();
    Sound.setPref('gm', false); openCopChase(1); await w(200); o.gmOff = (await cnt(1500)) === 0; closeGameWindow(); Sound.setPref('gm', true);
    Sound.setPref('bgm', true); Sound.pickSong(1); await w(300); o.homeSong = Sound.special() === null && Sound.songName() === Sound.songNames()[1];
    openWard(1); await w(200); o.homePausedInGame = Sound.special() === 'calm'; closeGameWindow(); await w(100); o.homeBack = Sound.songName() === Sound.songNames()[1] && Sound.special() === null;
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
