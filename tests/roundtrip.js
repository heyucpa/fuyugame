const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:700}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/user/fuyugame/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(1000);
  await p.evaluate(()=>{ SEASON_TODAY=[10,20]; G.openGift=true; G.bells=98765; ['clown_butler','skeleton_count','candy_jar'].forEach(id=>addItem(id)); G.rooms[0].items.push({uid:G.uid++,id:'clown_butler',x:2,y:2,rot:0}); G.hwEarned=70; G.hwPrize=['ghost_hat','candy_jar','ghost_dress']; G.wardrobe.push('ghost_hat','ghost_dress'); G.outfit.top='ghost_dress'; G.outfit.head='ghost_hat'; G.clownDay=today(); G.partyDay=today(); ensureGhost(); G.ghost.found=true; G.rooms[0].name='我的家'; G.pets[0].name='小圓'; G.hair={style:'bob',color:'black'}; saveGame(); });
  const read = ()=>p.evaluate(()=>{ const k=Object.keys(localStorage).find(k=>/^myHouseGame_v1(:p1)?$/.test(k)); return JSON.parse(localStorage.getItem(k)); });
  const a = await read();
  const diffs=[];
  for (let i=1;i<=3;i++) {
    await p.goto('about:blank'); await p.goto('file:///home/user/fuyugame/house.html'); await p.waitForTimeout(2000); try{await p.getByText('跳過').click({timeout:800});}catch(e){} await p.waitForTimeout(800);
    const c = await read();
    const strip = o=>{ const x=JSON.parse(JSON.stringify(o)); delete x.savedAt; return x; };
    const ka=Object.keys(a), kc=Object.keys(c);
    const ch=kc.filter(k=>JSON.stringify(strip(a)[k])!==JSON.stringify(strip(c)[k]));
    diffs.push({ reload:i, 改變:ch, 新欄位:kc.filter(k=>!ka.includes(k)), 少了:ka.filter(k=>!kc.includes(k)) });
  }
  console.log(JSON.stringify(diffs,null,0)); console.log('重點', await p.evaluate(()=>({bells:G.bells, hw:G.hwEarned, prize:G.hwPrize, name:G.pets[0].name, room:G.rooms[0].name, clown:G.rooms[0].items.some(i=>i.id==='clown_butler'), inv:G.inv.candy_jar, outfit:G.outfit.top+'/'+G.outfit.head, locked:SAVE_LOCKED!=null})), errs);
  await b.close();
})();
