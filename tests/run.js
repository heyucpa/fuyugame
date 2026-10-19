// 跑步：小卡上的切換、走得比較快、記在這台機器、小島上也一樣、Shift 暫時跑
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const ctx = await b.newContext({viewport:{width:1100,height:800}}); const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true; G.away=null; G.cur=0; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    out.default = runOn(); out.btn0 = $('#btnRun').textContent;
    const room=curRoom(); const frames = ()=>{ fufu.x=.5; fufu.y=.5; fufu.pose=null; fufu.act=null; fufu.task=null; fufu.path=[[1,0],[2,0],[3,0],[4,0],[5,0]]; let n=0; while(fufu.path.length && n<2000){ fufuUpdate(1/60, performance.now()); n++; } return n; };
    G.kid.hunger=100; const walk=frames(); $('#btnRun').click(); const run=frames();
    out.walkFrames=walk; out.runFrames=run; out.ratio=+(walk/run).toFixed(2); out.btn1=$('#btnRun').textContent; out.stored=localStorage.getItem('myHouse_run');
    // 小島
    openIsland(); await wait(150); out.islBtn=$('#islRun').textContent;
    const x0=isl.x; isl.path=[[Math.floor(isl.x)+1,Math.floor(isl.y)],[Math.floor(isl.x)+2,Math.floor(isl.y)],[Math.floor(isl.x)+3,Math.floor(isl.y)]]; const t0=performance.now(); islStep(.1); out.islRunStep=+(isl.x-x0).toFixed(3); // run 0.1s 走的距離
    $('#islRun').click(); out.islWalkMode=!runOn(); isl.path=[[Math.floor(isl.x)+1,Math.floor(isl.y)]]; const x1=isl.x; islStep(.1); out.islWalkStep=+(isl.x-x1).toFixed(3);
    isl.shift=true; isl.path=[[Math.floor(isl.x)+1,Math.floor(isl.y)]]; const x2=isl.x; islStep(.1); out.shiftStep=+(isl.x-x2).toFixed(3); isl.shift=false;
    closeIsland();
    runMode=null; out.reload = runOn();   // 重新讀 localStorage
    setRun(false); out.off = [runOn(), localStorage.getItem('myHouse_run')];
    return out; });
  console.log(JSON.stringify(r), errs); await b.close();
})();
