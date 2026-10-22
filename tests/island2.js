// 小島第二階段：日夜、金幣、池塘釣魚、小動物與腳踏車、圓角海岸
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:800}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true; G.openGift=true; G.away=null; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    // 日夜：四種時段都畫得出來
    out.phases = {}; for (const [h,exp] of [[3,'night'],[7,'morning'],[12,'day'],[18,'evening'],[22,'night']]) { ISL_HOUR_TEST=h; out.phases[h]=islPhase(); if (islPhase()!==exp) out.phaseBad=(out.phaseBad||[]).concat(h); }
    ISL_HOUR_TEST=22; openIsland(); await wait(300); out.nightGlow = (isl.glow||[]).length; closeIsland();
    ISL_HOUR_TEST=12; openIsland(); await wait(300); out.dayGlow = (isl.glow||[]).length; closeIsland(); ISL_HOUR_TEST=null;
    // 金幣：每天 5 枚、走過去自動撿、上限、同一天位置一樣、隔天重來、壞存檔
    G.islCoin=null; openIsland(); await wait(100); const spots = isl.coins.map(c=>c.x+','+c.y); out.coinCount = isl.coins.length;
    closeIsland(); openIsland(); await wait(100); out.sameSpots = JSON.stringify(isl.coins.map(c=>c.x+','+c.y))===JSON.stringify(spots);
    const b0=G.bells; let picked=0; while (isl.coins.length) { const c=isl.coins[0]; isl.x=c.x+.5; isl.y=c.y+.5; islStep(.016); picked++; if(picked>20) break; }
    out.picked = picked; out.gain = G.bells-b0; out.state = JSON.stringify(G.islCoin); out.capped = G.islCoin.n <= ISL_COIN_MAX;
    closeIsland(); openIsland(); await wait(100); out.noneAfter = isl.coins.length; closeIsland();
    G.islCoin={d:'2000-1-1',n:5,got:['1,1']}; openIsland(); await wait(100); out.nextDay = isl.coins.length; closeIsland();
    out.badFixed = [5,{d:1},{d:'a',n:'x'},{d:'a',n:1,got:'x'}].every(v=>{ const g=JSON.parse(JSON.stringify(G)); g.islCoin=v; return !normalizeSave(g).islCoin; });
    out.okKept = (()=>{ const g=JSON.parse(JSON.stringify(G)); g.islCoin={d:'2026-1-1',n:2,got:['3,4',7]}; const n=normalizeSave(g).islCoin; return n && n.n===2 && n.got.length===1; })();
    // 池塘 → 釣魚
    openIsland(); await wait(100); const pd=ISL_POND; const o=islFunAt({x:pd.x+1,y:pd.y+1,fx:pd.x+1,fy:pd.y+1}); isl.x=pd.x-1; isl.y=pd.y+1; islFun(o); await wait(800);
    out.fishing = !$('#modal').hidden && /釣魚/.test($('#modalCard').innerText); out.islandStillOpen = !!isl;
    openFishing.test.setPos(openFishing.test.zone()[0]+1); openFishing.test.pull(); out.fishResult = $('#modalCard').innerText.includes('釣到') || $('#modalCard').innerText.includes('跑掉');
    [...document.querySelectorAll('#modalCard button')].find(x=>/回家|離開/.test(x.textContent)).click(); await wait(100); out.backOnIsland = !!isl && $('#modal').hidden;
    // 小動物、腳踏車
    out.critters = isl.critters.map(c=>c.e).join(''); out.bike = !!(isl.bike && isl.bike.n);
    const cr=isl.critters[0]; islTap({clientX: 0, clientY: 0}, false);   // 隨便點一下不會壞
    const v=islView(), rr=isl.cv.getBoundingClientRect(); islTap({clientX: rr.left+v.W/2+(cr.x*32-v.cx)*v.s, clientY: rr.top+v.H/2+((cr.y-.4)*32-v.cy)*v.s}, false); out.critterHop = cr.hop>0;
    isl.path=[]; isl.pending=null; isl.skipDoor='x';   // 剛才亂點的那一下會讓她走去某個地方，清掉
    for (let i=0;i<300 && isl;i++) islStep(.03); out.bikeMoved = isl.bike.path.length>0 || Math.hypot(isl.bike.x-(ISL_HUB[0]+.5), isl.bike.y-(ISL_HUB[1]+2.5))>.5;
    out.crittersOnLand = isl.critters.every(c=>islPass(isl.m, Math.floor(c.x), Math.floor(c.y)));
    closeIsland();
    return out; });
  console.log(JSON.stringify(r), errs);
  for (const [h,name] of [[22,'night'],[18,'evening'],[7,'morning']]) { await p.evaluate((h)=>{ ISL_HOUR_TEST=h; SEASON_TODAY=[6,1]; openIsland(); isl.cam.x=26; isl.cam.y=19; }, h); await p.waitForTimeout(600); await p.screenshot({path:'/tmp/isl_'+name+'.png', clip:{x:320,y:50,width:780,height:750}}); await p.evaluate(()=>closeIsland()); }
  await b.close();
})();
