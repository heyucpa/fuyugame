// 英文單字小遊戲
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const ctx = await b.newContext({viewport:{width:1100,height:760}}); const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  const r = await p.evaluate(async()=>{
    const out={bad:[]}; G.guide='done'; $('#modal').hidden=true; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    EN_WEEKS.forEach(wk=>{ if(wk.words.length<9) out.bad.push('week'+wk.id+'字太少'); wk.words.forEach(([w,zh,pic])=>{ if(!/^[a-z]+$/.test(w)) out.bad.push('字不對 '+w); if(!zh) out.bad.push('沒中文 '+w); }); });
    out.pool=[enPool('all',false).length, enPool('all',true).length, enPool(2,true).length];
    EN_WEEKS.forEach(wk=>{ if (enPool(wk.id,true).length<4) out.bad.push('week'+wk.id+'有圖的字不到 4 個'); });
    out.dedupe = enPool('all',false).map(x=>x.w).length===new Set(enPool('all',false).map(x=>x.w)).size;
    // 聽音選圖：全對
    G.gameBonusDay=today(); let b0=G.bells; openEnglishGame(); await wait(100);
    document.querySelectorAll('.en-week')[2].click(); await wait(50);
    [...document.querySelectorAll('.lv-btn')][0].click(); await wait(100);
    for (let i=0;i<5;i++){ playEnglish.test.answer(); await wait(1250); }
    out.listenAllRight = [G.bells-b0, /全對/.test(document.querySelector('.en-q').textContent)];
    // 聽音選圖：全錯也不當掉
    closeGameWindow(); openEnglishGame(); await wait(50); [...document.querySelectorAll('.lv-btn')][0].click(); await wait(100);
    for (let i=0;i<5;i++){ playEnglish.test.wrong(); await wait(1250); } out.listenWrong = G.bells-b0;
    // 拼字
    closeGameWindow(); b0=G.bells; openEnglishGame(); await wait(50); [...document.querySelectorAll('.lv-btn')][1].click(); await wait(100);
    for (let i=0;i<5;i++){ playEnglish.test.solve(); await wait(1500); } out.spellAllRight=[G.bells-b0];
    closeGameWindow(); b0=G.bells; openEnglishGame(); await wait(50); [...document.querySelectorAll('.lv-btn')][2].click(); await wait(100);
    out.extraTiles = document.querySelectorAll('.en-tile').length - document.querySelectorAll('.en-slot').length;
    playEnglish.test.wrongTile(); await wait(50); out.wrongTileOk = true;
    for (let i=0;i<5;i++){ playEnglish.test.solve(); await wait(1500); } out.hardRight=[G.bells-b0];
    closeGameWindow();
    return out; });
  console.log(JSON.stringify(r), errs); await p.screenshot({path:'/tmp/en.png'}); await b.close();
})();
