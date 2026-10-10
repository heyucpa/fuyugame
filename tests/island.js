// 小島地圖：地形、房子位置、路通不通、走路、進出房子
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const ctx = await b.newContext({viewport:{width:1100,height:700}, deviceScaleFactor:1});
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(1000);
  const geo = await p.evaluate(()=>{
    const out=[]; const m=islMap(4);
    m.blds.forEach(bd=>{ for(let y=bd.y-1;y<=bd.y+bd.h;y++) for(let x=bd.x-1;x<bd.x+bd.w+1;x++){ if(!m.land[y]||!m.land[y][x]||m.beach[y][x]) out.push(bd.id+' 在水邊或水裡 '+x+','+y); } if(!islPass(m,bd.door[0],bd.door[1])) out.push(bd.id+' 門口不能站'); });
    for(let i=0;i<m.blds.length;i++) for(let j=i+1;j<m.blds.length;j++){ const a=m.blds[i],c=m.blds[j]; if(a.x<c.x+c.w+1&&c.x<a.x+a.w+1&&a.y<c.y+c.h+1&&c.y<a.y+a.h+1) out.push('房子太近 '+a.id+'/'+c.id); }
    const home=m.blds[0]; const reach=new Set(); const q=[[home.door[0],home.door[1]]]; reach.add(q[0].join());
    for(let qi=0;qi<q.length;qi++){ const [x,y]=q[qi]; [[1,0],[-1,0],[0,1],[0,-1]].forEach(([a,c])=>{ const nx=x+a,ny=y+c; if(islPass(m,nx,ny)&&!reach.has(nx+','+ny)){ reach.add(nx+','+ny); q.push([nx,ny]); } }); }
    m.blds.forEach(bd=>{ if(!reach.has(bd.door.join())) out.push(bd.id+' 走不到'); });
    let trees=0, flowers=0, land=0; for(let y=0;y<m.H;y++) for(let x=0;x<m.W;x++){ if(m.tree[y][x]){trees++; if(m.path[y][x]) out.push('樹在路上'); } if(m.flower[y][x]) flowers++; if(m.land[y][x]&&!m.beach[y][x]) land++; }
    return { out, trees, flowers, land, nb: m.blds.length };
  });
  console.log('地形', JSON.stringify(geo));
  const flow = await p.evaluate(async()=>{
    const res={}; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    G.openGift=true; G.away=null; G.bells=1000; saveGame();
    openIsland(); await wait(300); res.open=!!isl && !!document.getElementById('islandLayer') && document.querySelector('.stage').classList.contains('island-on');
    res.startHome = Math.floor(isl.x)===isl.m.blds[0].door[0] && Math.floor(isl.y)===isl.m.blds[0].door[1];
    // 點學校：自動走過去、進去
    const sc=isl.m.blds.find(b=>b.id==='school'); const v=islView(); const r=isl.cv.getBoundingClientRect();
    islTap({clientX:r.left+v.W/2+(sc.x*32+40-v.cx)*v.s, clientY:r.top+v.H/2+(sc.y*32+40-v.cy)*v.s}, false);
    res.pending = isl.pending && isl.pending.id;
    for (let i=0;i<400 && isl;i++) await wait(50);
    res.closed=!isl; res.away=G.away && G.away.place;
    // 在學校再開地圖：從學校門口出發；按回去不出門
    openIsland(); await wait(200); const st=isl.m.blds.find(b=>b.id==='school'); res.startSchool = Math.floor(isl.x)===st.door[0] && Math.floor(isl.y)===st.door[1];
    closeIsland(); res.stillSchool = G.away && G.away.place==='school';
    // 鍵盤：往下走一段再放開
    openIsland(); await wait(100); const y0=isl.y; isl.keys['arrowdown']=true; await wait(400); delete isl.keys['arrowdown']; res.keyMoved = isl.y>y0+.3 || !isl;
    if (isl) { closeIsland(); }
    // 走到家：回家
    openIsland(); await wait(100); const hm=isl.m.blds[0]; const r2=isl.cv.getBoundingClientRect(), v2=islView();
    islTap({clientX:r2.left+v2.W/2+(hm.x*32+40-v2.cx)*v2.s, clientY:r2.top+v2.H/2+(hm.y*32+40-v2.cy)*v2.s}, false);
    for (let i=0;i<400 && isl;i++) await wait(50);
    res.home = G.away===null;
    // 搖樹
    openIsland(); await wait(100); let tr=null; const m=isl.m; for(let y=0;y<m.H&&!tr;y++) for(let x=0;x<m.W&&!tr;x++) if(m.tree[y][x]&&Math.abs(x-isl.x)<12&&Math.abs(y-isl.y)<8) tr=[x,y];
    const n0=G.tree.n; const r3=isl.cv.getBoundingClientRect(), v3=islView();
    islTap({clientX:r3.left+v3.W/2+((tr[0]+.5)*32-v3.cx)*v3.s, clientY:r3.top+v3.H/2+((tr[1]+.5)*32-v3.cy)*v3.s}, false);
    for (let i=0;i<200 && isl && isl.pending;i++) await wait(50);
    res.shook = G.tree.n < n0 || G.tree.n===0;
    closeIsland();
    // 島上的動物朋友：點牠，第一次認識
    openIsland(); await wait(100); G.friends={}; saveGame(); const q=isl.npcs[0]; res.npcCount=isl.npcs.length;
    isl.x=q.x-1; isl.y=q.y; const r4=isl.cv.getBoundingClientRect(), v4=islView();
    islTap({clientX:r4.left+v4.W/2+(q.x*32-v4.cx)*v4.s, clientY:r4.top+v4.H/2+((q.y-.5)*32-v4.cy)*v4.s}, false); await wait(100);
    res.met = !!G.friends[q.n.id]; closeIsland();
    // 快速出門清單
    openIsland(); await wait(100); document.querySelector('.isl-fast').click(); await wait(100); res.menu=!$('#modal').hidden; $('#modal').hidden=true; closeIsland();
    return res; });
  console.log('流程', JSON.stringify(flow));
  await p.evaluate(()=>{ openIsland(); }); await p.waitForTimeout(1200); await p.screenshot({path: (process.env.OUT || '/tmp') + '/island1.png'});
  console.log('頁面錯誤', errs.slice(0,5));
  await b.close();
})();
