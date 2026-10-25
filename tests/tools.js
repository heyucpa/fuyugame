// 小島道具：釣竿（海、池塘）、網子抓蝴蝶、鏟子挖洞（每天 6 樣）、搖樹的蜜蜂
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:800}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true; G.openGift=true; G.away=null; SEASON_TODAY=[6,1]; ISL_HOUR_TEST=12; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const realSC = showcase; showcase = ()=>{};
    openIsland(); await wait(150); const m = isl.m;
    out.toolBtns = [...document.querySelectorAll('.isl-tool')].map(x=>x.textContent);
    const scr=(fx,fy)=>{ isl.cam.x=isl.x; isl.cam.y=isl.y; const v=islView(), rr=isl.cv.getBoundingClientRect(); return {clientX: rr.left+v.W/2+(fx*32-v.cx)*v.s, clientY: rr.top+v.H/2+(fy*32-v.cy)*v.s}; };   // 鏡頭跟著她，每次重算
    // 🎣 點海：要先拿釣竿才會走到岸邊甩竿
    let sea=null; for (let y=0;y<m.H&&!sea;y++) for (let x=0;x<m.W&&!sea;x++) if (!m.land[y][x] && Math.abs(x-isl.x)<14 && Math.abs(y-isl.y)<10) sea=[x,y];
    // 沒拿釣竿點海：只走過去，不會釣魚（家長：經過海邊太容易觸發釣魚）
    islSetTool(null); islTap(scr(sea[0]+.5, sea[1]+.5), false); out.noRodNoFish = isl.tool !== 'rod' && !(isl.pending && isl.pending.obj); isl.path = []; isl.pending = null;
    if (typeof ISL_POND !== 'undefined') { islTap(scr(ISL_POND.x+1.5, ISL_POND.y+1), false); out.noRodNoPond = !(isl.pending && isl.pending.obj); isl.path = []; isl.pending = null; }
    // 拿著釣竿點海：走到岸邊、甩竿
    islSetTool('rod'); islTap(scr(sea[0]+.5, sea[1]+.5), false); out.toolAfterSeaTap = isl.tool; out.seaPending = isl.pending && isl.pending.obj && isl.pending.obj.kind;
    for (let i=0;i<600 && isl && !isl.act;i++) islStep(.03);
    out.fishingStarted = !!(isl.act && isl.act.kind==='fish' && isl.act.sea); out.onLand = islPass(m, Math.floor(isl.x), Math.floor(isl.y));
    const b0=G.bells, fishN=Object.keys(G.fish).length;
    islPull(); out.earlyPullKeepsAct = !!isl.act;   // 太早拉：不算
    isl.act.t0 -= 1000; isl.act.biteAt = 0; islActStep(performance.now()); out.bite = isl.act.phase==='bite';
    islPull(); out.caught = G.bells>b0 && Object.values(G.fish).reduce((a,n)=>a+n,0)>0 && !isl.act;
    // 咬鉤沒點：跑掉
    islStartFish({kind:'pond', x: ISL_POND.x+2, y: ISL_POND.y+1.5}); isl.act.t0 -= 1000; isl.act.biteAt=0; islActStep(performance.now()); isl.act.biteT -= 2000; islActStep(performance.now()); out.missEnds = !isl.act;
    // 🦋 網子：點蝴蝶 → 走過去 → 揮網 → 抓到（強迫成功）
    const bf = isl.critters.find(c=>c.fly); bf.x=isl.x+1; bf.y=isl.y; bf.tx=bf.x; bf.ty=bf.y; bf.wait=99;
    islTap(scr(bf.x, bf.y-1.3), false); out.toolAfterBfTap = isl.tool; out.netPending = isl.pending && isl.pending.type;
    for (let i=0;i<300 && isl && !isl.act;i++) islStep(.03); out.netSwing = !!(isl.act && isl.act.kind==='net');
    const realR=Math.random; Math.random=()=>.1; G.butterflies={}; isl.act.t0 -= 1000; islActStep(performance.now()); Math.random=realR;
    out.album = Object.keys(G.butterflies).length; out.bfHidden = bf.hidden > performance.now(); out.bfNewSp = !!bf.sp;
    // ⛏️ 鏟子：要先拿鏟子；挖洞；一天 6 樣
    G.islDig = null; const grass=[]; for (let y=0;y<m.H;y++) for (let x=0;x<m.W;x++) if (islPass(m,x,y)&&!m.path[y][x]&&!m.beach[y][x]&&!m.flower[y][x]&&Math.abs(x-isl.x)<6&&Math.abs(y-isl.y)<5) grass.push([x,y]);
    isl.tool=null; islTap(scr(grass[0][0]+.5, grass[0][1]+.5), false); out.noShovelNoDig = !isl.pending || isl.pending.type!=='dig';
    islSetTool('shovel'); let finds=0; const b1=G.bells, apples=G.food.apple||0;
    Math.random=()=>.1;   // 永遠挖到錢
    for (let k=0;k<8 && k<grass.length;k++) { const g=grass[k]; isl.path=[]; islTap(scr(g[0]+.5, g[1]+.5), false); for (let i=0;i<300 && isl && !isl.act;i++) islStep(.03); if(!isl.act){ out.digFail=(out.digFail||0)+1; continue; } isl.act.t0 -= 2000; islActStep(performance.now()); }
    Math.random=realR;
    out.holes = isl.holes.length; out.digState = JSON.stringify(G.islDig); out.digCapped = G.islDig.n===ISL_DIG_MAX && G.bells-b1 >= 60;
    out.sameHoleBlocked = (()=>{ const g=grass[0]; islTap(scr(g[0]+.5,g[1]+.5), false); return !isl.pending || isl.pending.type!=='dig'; })();
    out.badDig = [5,{d:1},{d:'a',n:-1}].every(v=>{ const g=JSON.parse(JSON.stringify(G)); g.islDig=v; return !normalizeSave(g).islDig; });
    // 🐝 蜜蜂
    const mood0=G.kid.mood, hun0=G.kid.hunger; G.tree.n=5; treeReadyAt=0; isl.tool=null; isl.act=null;
    Math.random=()=>.95; let tree=null; for (let y=0;y<m.H&&!tree;y++) for (let x=0;x<m.W&&!tree;x++) if (m.tree[y][x]) tree=[x,y];
    isl.x=tree[0]+1.5; isl.y=tree[1]+.5; isl.pending={type:'tree', x:tree[0], y:tree[1]}; islDoPending(); Math.random=realR;
    out.bees = !!isl.bees; out.moodDown = G.kid.mood < mood0; out.hungerDown = G.kid.hunger < hun0; out.face = fufu.faceKind; out.runsAway = isl.path.length>0;
    isl.bees.t0 -= 9999; islDrawAct(isl.cv.getContext('2d'), performance.now()); out.beesGone = !isl.bees;
    // 畫一次每種道具（不能出錯）
    for (const t of ['rod','net','shovel',null]) { islSetTool(t); islDraw(performance.now()); }
    islStartFish({kind:'sea', x: isl.x+2, y: isl.y}); islDraw(performance.now()); isl.act.phase='bite'; isl.act.biteT=performance.now(); islDraw(performance.now()); isl.act=null;
    showcase = realSC; closeIsland(); return out; });
  console.log(JSON.stringify(r), errs);
  await p.evaluate(()=>{ SEASON_TODAY=[6,1]; ISL_HOUR_TEST=12; openIsland(); const m=isl.m; let sea=null; for (let y=0;y<m.H&&!sea;y++) for (let x=0;x<m.W&&!sea;x++) if (!m.land[y][x] && m.land[y][x+1]) sea=[x,y]; isl.x=sea[0]+2.5; isl.y=sea[1]+.5; isl.cam.x=isl.x; isl.cam.y=isl.y; isl.skipDoor='x'; islStartFish({kind:'sea', x: sea[0]-.5, y: sea[1]+.5}); isl.act.phase='bite'; isl.act.biteT=performance.now()+99999; });
  await p.waitForTimeout(400); await p.screenshot({path:'/tmp/fish_map.png', clip:{x:320,y:50,width:780,height:750}});
  await p.evaluate(()=>{ isl.act=null; islSetTool('net'); const bf=isl.critters.find(c=>c.fly); bf.x=isl.x+1.5; bf.y=isl.y-.5; bf.tx=bf.x; bf.ty=bf.y; bf.wait=99; isl.act={kind:'net', c:bf, t0:performance.now()+9999}; });
  await p.waitForTimeout(300); await p.screenshot({path:'/tmp/net_map.png', clip:{x:320,y:50,width:780,height:750}});
  await b.close();
})();
