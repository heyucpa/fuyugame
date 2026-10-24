// 跆拳道館、游泳池：地點、換衣服、腰帶考試、四個小遊戲、小島上的房子
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:820}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(600);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true; G.openGift=true; G.gameBonusDay=today(); const wait=ms=>new Promise(r=>setTimeout(r,ms)); const realSC=showcase; showcase=()=>{};
    out.places = ['dojo','pool'].every(k=>PLACES[k] && HOSTS[PLACES[k].host]);
    out.furnOK = ['dojo','pool'].every(k=>PLACES[k].rooms[0].items.every(it=>FURN_BY_ID[it.id]) && PLACES[k].rooms[0].wallItems.every(it=>FURN_BY_ID[it.id]));
    G.wardrobe = G.wardrobe.filter(id=>!PLACE_CLOTHES.some(c=>c.id===id));
    const keepOutfit = JSON.stringify(G.outfit);
    // 進道館：道服＋腰帶顏色、出來換回
    travelArrive('dojo'); await wait(100); let o=currentOutfit(); out.dojoOutfit=[o.top.id,o.bottom.id,o.shoes.id,JSON.stringify(o.top.belt)];
    out.ownOutfitUntouched = JSON.stringify(G.outfit)===keepOutfit; out.gotDobok = ['dobok','dobok_pants','barefoot'].every(id=>G.wardrobe.includes(id)); out.coaches = [HOSTS.tkd.name, HOSTS.swim.name];
    // 主人選單
    host.n = HOSTS.tkd; out.menu = hostMenuEntries().map(x=>x[0]).filter(t=>/踢板|動作|腰帶/.test(t));
    // 考腰帶：沒練習不能考
    G.tkd={belt:0,prac:0}; openBeltExam(); out.needPractice = /再練習 3 次/.test(document.querySelector('.game-status').textContent);
    // 踢板：5 塊全中
    closeGameWindow(); openKickGame(); for (let i=0;i<5;i++){ await wait(60); const z=meterRound.test.zone(); meterRound.test.setPos(z[0]+z[1]/2); meterRound.test.hit(); await wait(1350); }
    out.kick = document.querySelector('.game-status').textContent; out.prac1 = G.tkd.prac;
    // 跟著做動作：3 套全對
    closeGameWindow(); openFormsGame(); for (let k=0;k<3;k++){ for (let i=0;i<80 && !playForms.test.ready();i++) await wait(100); playForms.test.seq().forEach(m=>playForms.test.press(m)); await wait(1300); }
    out.forms = document.querySelector('.game-status').textContent; out.prac2 = G.tkd.prac;
    // 再練一次 → 可以考；考試：動作全對＋踢 3 塊
    G.tkd.prac=3; closeGameWindow(); openBeltExam(); out.canExam = /可以考「黃帶」/.test(document.querySelector('.game-status').textContent);
    [...document.querySelectorAll('.game-btns button')].find(x=>/開始考試/.test(x.textContent)).click();
    for (let i=0;i<100 && !playForms.test.ready();i++) await wait(100); playForms.test.seq().forEach(m=>playForms.test.press(m)); await wait(1300);
    for (let i=0;i<3;i++){ await wait(60); const z=meterRound.test.zone(); meterRound.test.setPos(z[0]+z[1]/2); meterRound.test.hit(); await wait(1350); }
    await wait(300); out.afterExam = [G.tkd.belt, tkdBeltName(), document.querySelector('.game-status').textContent.slice(0,20)];
    o=currentOutfit(); out.newBeltColor = JSON.stringify(o.top.belt);
    // 考試失敗：動作按錯
    closeGameWindow(); G.tkd.prac=3; openBeltExam(); [...document.querySelectorAll('.game-btns button')].find(x=>/開始考試/.test(x.textContent)).click();
    for (let i=0;i<100 && !playForms.test.ready();i++) await wait(100); const sq=playForms.test.seq(); playForms.test.press((sq[0]+1)%4); await wait(1900);
    out.failKeepsBelt = G.tkd.belt===1 && G.tkd.prac===TKD_PRAC_NEED-1;
    // 藍紅帶的顏色、黑帶最高
    G.tkd.belt=3; out.blueRed = JSON.stringify(tkdBeltColors()); G.tkd.belt=5; closeGameWindow(); openBeltExam(); out.black = /黑帶/.test(document.querySelector('.game-status').textContent);
    // 壞存檔
    out.badFixed = [5,{belt:9,prac:-1},{belt:'x'}].every(v=>{ const g=JSON.parse(JSON.stringify(G)); g.tkd=v; const n=normalizeSave(g); return !n.tkd || (n.tkd.belt>=0&&n.tkd.belt<=5&&n.tkd.prac>=0); });
    closeGameWindow(); G.tkd={belt:0,prac:0};
    // 游泳池：泳衣、在水裡、三個遊戲
    travelArrive('pool'); await wait(100); o=currentOutfit(); out.poolOutfit=[o.head.id,o.top.id,o.bottom.id];
    const sp = curRoom().items.find(i=>i.id==='swim_pool'); out.inWater = poolWaterAt(sp.x+2, sp.y+2) && !poolWaterAt(0.5,0.5);
    host.n = HOSTS.swim; out.poolMenu = hostMenuEntries().map(x=>x[0]).filter(t=>/打水|潛水|跳水/.test(t));
    openSwimRace(); [...document.querySelectorAll('.lv-btn')][0].click(); await wait(50); playSwim.test.start(); for (let i=0;i<40 && !playSwim.test.ended();i++){ playSwim.test.stroke(); await wait(60); } await wait(200);
    out.swim = document.querySelector('.game-status').textContent;
    closeGameWindow(); openDiveGame(); await wait(1500); const its=playDive.test.items().filter(q=>!q.got); const c=document.querySelector('.game-canvas'), rr=c.getBoundingClientRect();
    its.forEach(q=>playDive.test.tapAt(rr.left+q.x/320*rr.width, rr.top+q.y/240*rr.height)); out.diveGot = playDive.test.items().filter(q=>q.got).length; playDive.test.finish(); await wait(100); out.dive = document.querySelector('.game-status').textContent;
    closeGameWindow(); openJumpDive(); for (let i=0;i<3;i++){ await wait(60); const z=meterRound.test.zone(); meterRound.test.setPos(z[0]+z[1]/2); meterRound.test.hit(); await wait(3450); } out.jump = document.querySelector('.game-status').textContent;
    closeGameWindow(); draw();
    // 回家：衣服換回
    out.gotSwim = ['swimsuit','swim_bottom','swim_cap'].every(id=>G.wardrobe.includes(id));
    homeArrive(); G.outfit.top='dobok'; G.tkd={belt:2,prac:0}; out.homeDobokBelt = JSON.stringify(currentOutfit().top.belt); openTab('dress'); out.dressTab = /道服/.test($('#tabBody').innerText) && /泳衣/.test($('#tabBody').innerText); G.outfit=JSON.parse(keepOutfit);
    out.backHome = JSON.stringify(currentOutfit().top.id)===JSON.stringify(CLOTHES_BY_ID[G.outfit.top].id);
    // 小島上有兩棟新房子
    islMapCache=null; const m=islMap(0); out.islBld = m.blds.filter(b=>b.id==='dojo'||b.id==='pool').map(b=>b.id+'@'+b.door.join(',')); const hd=m.blds[0].door, pd=m.blds.find(b=>b.id==='pool').door; out.walkToPool = !!islFindPath(m, hd[0], hd[1], (x,y)=>x===pd[0]&&y===pd[1]); out.bridgeTiles = m.bridge.flat().filter(Boolean).length;
    showcase=realSC; return out; });
  console.log(JSON.stringify(r,null,0), errs);
  // 截圖
  await p.evaluate(()=>{ $('#modal').hidden=true; travelArrive('dojo'); G.tkd={belt:3,prac:0}; fufu.x=4.5; fufu.y=5.5; }); await p.waitForTimeout(900); await p.screenshot({path:'/tmp/dojo.png', clip:{x:320,y:50,width:780,height:760}});
  await p.evaluate(()=>{ $('#modal').hidden=true; travelArrive('pool'); }); await p.waitForTimeout(500); await p.evaluate(()=>{ const sp=curRoom().items.find(i=>i.id==='swim_pool'); fufu.x=sp.x+2.5; fufu.y=sp.y+2.5; fufu.path=[]; }); await p.waitForTimeout(500); await p.screenshot({path:'/tmp/pool.png', clip:{x:320,y:50,width:780,height:760}});
  await p.evaluate(()=>{ homeArrive(); $('#modal').hidden=true; SEASON_TODAY=[6,1]; ISL_HOUR_TEST=12; openIsland(); isl.x=41.5; isl.y=30.5; isl.cam.x=42; isl.cam.y=30; isl.skipDoor='x'; }); await p.waitForTimeout(700); await p.screenshot({path:'/tmp/isl_new.png', clip:{x:320,y:50,width:780,height:760}});
  await b.close();
})();
