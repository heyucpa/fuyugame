// 小島上的小趣味：南瓜燈（每天最多吐 3 顆糖）、噴水池、池塘、海鷗、貝殼
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:800}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true; G.openGift=true; SEASON_TODAY=[10,20]; G.kidFood.hw_candy=0; G.hwEarned=0; G.pumpDay=null; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    openIsland(); await wait(200);
    // 全部種類都點一次（含每種效果）
    const real=Math.random; let seq=[.1,.1,.1,.1,.1,.6,.8,.95,.2,.5];
    Math.random=()=>seq.length?seq.shift():real();
    const t = (fx,fy)=>({x:Math.floor(fx),y:Math.floor(fy),fx,fy});
    for (let i=0;i<10;i++) { const o=islFunAt(t(ISL_PUMPKINS[i%5][0]+.5, ISL_PUMPKINS[i%5][1]+.5)); if(!o||o.kind!=='pumpkin'){ out.noPumpkin=(out.noPumpkin||0)+1; continue; } islFun(o); }
    Math.random=real;
    out.candy=G.kidFood.hw_candy; out.pumpDay=G.pumpDay&&G.pumpDay.n; out.earned=G.hwEarned;
    const f=islFunAt(t(ISL_HUB[0]+.5,ISL_HUB[1]+.5)); out.fountain=f&&f.kind; islFun(f);
    const pd=ISL_POND; const po=islFunAt(t(pd.x+1,pd.y+1)); out.pond=po&&po.kind; islFun(po);
    const sh=isl.m.shells[0]; if(sh){ const so=islFunAt(t(sh.x+.5,sh.y+.6)); out.shell=so&&so.kind; islFun(so); out.shellGone=!islFunAt(t(sh.x+.5,sh.y+.6)); } out.shells=isl.m.shells.length;
    const g=isl.gulls[0]; const go=islFunAt(t(g.x,g.y)); out.gull=go&&go.kind; islFun(go);
    await wait(2800); out.fxLeft=isl.fx.length;   // 動畫都會自己結束
    // 非萬聖節沒有南瓜
    SEASON_TODAY=[6,1]; out.noPumpkinInJune = !islFunAt(t(ISL_PUMPKINS[0][0]+.5, ISL_PUMPKINS[0][1]+.5));
    // 隔天重新算
    G.pumpDay={d:'2000-1-1',n:3}; SEASON_TODAY=[10,20]; Math.random=()=>.1; islFun(islFunAt(t(ISL_PUMPKINS[0][0]+.5, ISL_PUMPKINS[0][1]+.5))); Math.random=real; out.nextDay=G.pumpDay.n;
    // 壞存檔
    out.badFixed = [null,5,{d:1,n:'x'},{d:'a',n:-2}].every(v=>{ const g2=JSON.parse(JSON.stringify(G)); g2.pumpDay=v; const n=normalizeSave(g2); return v===null ? true : !n.pumpDay; });
    closeIsland(); return out; });
  await p.evaluate(()=>{ SEASON_TODAY=[10,20]; openIsland(); }); await p.waitForTimeout(200);
  await p.evaluate(()=>{ const o=islFunAt({x:0,y:0,fx:ISL_PUMPKINS[0][0]+.5,fy:ISL_PUMPKINS[0][1]+.5}); isl.x=o.ox; isl.y=o.oy+1.5; isl.cam.x=isl.x; isl.cam.y=isl.y; isl.skipDoor='x'; islAddFx('ghost',o.ox,o.oy-.6,1800); islAddFx('say',o.ox,o.oy-2.2,1800,{text:'嘿！被你發現了～'}); islAddFx('pop',o.ox,o.oy,900,{id:0}); for(let i=0;i<4;i++) islAddFx('bat',o.ox,o.oy-1,2400,{dx:(i%2?1:-1)*(3+i),dy:-2-i*.6,delay:i*150}); }); await p.waitForTimeout(500);
  await p.screenshot({path:'/tmp/islfun.png', clip:{x:320,y:50,width:780,height:750}});
  console.log(JSON.stringify(r), errs); await b.close();
})();
