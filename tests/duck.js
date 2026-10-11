// 英文單字：背景音樂暫時靜音、關掉視窗就恢復（不改她的設定）
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const p = await (await b.newContext({viewport:{width:1100,height:760}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    Sound.setPref('bgm', true); await wait(400);
    const bus = () => { const ac=Sound._t.getAc(); return ac ? 1 : 0; };
    out.prefBefore = Sound.prefs.bgm; out.gainBefore = +Sound._t.bgmGain().toFixed(3);
    openEnglishGame(); await wait(500); out.prefDuring = Sound.prefs.bgm; out.gainDuring = +Sound._t.bgmGain().toFixed(3);
    [...document.querySelectorAll('.lv-btn')][0].click(); await wait(300);
    out.prefPlaying = Sound.prefs.bgm; out.gainPlaying = +Sound._t.bgmGain().toFixed(3);
    closeGameWindow(); await wait(300); out.prefAfter = Sound.prefs.bgm; out.gainAfter = +Sound._t.bgmGain().toFixed(3);
    // 開關音樂按鈕在遊戲中也不會把靜音打破
    openEnglishGame(); await wait(300); Sound.setPref('bgm', true); await wait(600); out.gainPrefToggle = +Sound._t.bgmGain().toFixed(3); closeGameWindow(); await wait(600); out.gainRestored = +Sound._t.bgmGain().toFixed(3);
    out.noThrow = true; return out; });
  console.log(JSON.stringify(r), errs); await b.close();
})();
