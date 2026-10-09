const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:700}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/user/fuyugame/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(1000);
  const r = await p.evaluate(async()=>{ SEASON_TODAY=[10,20]; G.openGift=true; G.cur=0; G.away=null; G.ghost=null; G.hwEarned=0; G.kidFood.hw_candy=0; showcase=function(){}; const out={log:[]}; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    let g=ensureGhost(); g.ri=0; out.n1=g.n; findGhost(); out.c1=G.kidFood.hw_candy; out.foundNow=ghostHere()===null;
    await wait(5000); out.n2=G.ghost.n; out.found2=G.ghost.found; out.sameObj=G.ghost===g; out.menu2=!G.ghost.found; G.ghost.ri=0; findGhost(); out.c2=G.kidFood.hw_candy; await wait(5000); out.after=JSON.stringify([G.ghost.n,G.ghost.found]); const again=ensureGhost(); out.noThird=again.found&&again.n===2; 
    // 關掉再開：第一隻找到後直接叫 ensureGhost
    G.ghost=null; g=ensureGhost(); g.ri=0; findGhost(); G.ghost.foundAt-=5000; const e=ensureGhost(); out.reopen=[e.n,e.found];
    G.ghost.d='2000-1-1'; out.nextDay=ensureGhost().n;
    out.norm=normalizeSave(JSON.parse(JSON.stringify(Object.assign({},G,{ghost:Object.assign({},G.ghost,{n:'x',foundAt:'y'})})))).ghost.n;
    return out; });
  console.log(JSON.stringify(r), errs); await b.close();
})();
