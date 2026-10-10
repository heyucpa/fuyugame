// 每天第一場小遊戲雙倍、獎盃可以賣
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:700}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    G.gameBonusDay=null; const b0=G.bells; const a=payReward({}, 100); out.first=[a,G.bells-b0];
    const b1=G.bells; const c=payReward({}, 100); out.second=[c,G.bells-b1];
    G.gameBonusDay=null; const z=payReward({}, 0); out.zeroKeeps=(G.gameBonusDay===null);
    out.bad=normalizeSave(JSON.parse(JSON.stringify(Object.assign({},G,{gameBonusDay:5})))).gameBonusDay;
    // 獎盃
    G.inv.trophy_furn20=1; G.inv.trophy_furn=1; G.inv.trophy_pet=1; G.trophies=Object.assign(G.trophies||{},{furn20:true,furn:true,pet:true});
    out.blocks=[furnSellBlock('trophy_furn20'),furnSellBlock('trophy_furn'),furnSellBlock('trophy_pet')];
    const b2=G.bells; const card=trophySellCard(FURN_BY_ID.trophy_furn20,'trophy_furn20'); card.click(); await wait(100);
    out.askShown=!$('#modal').hidden && /獎盃/.test($('#modalCard').innerText); out.stillHave=G.inv.trophy_furn20;
    [...$('#modalCard').querySelectorAll('button')].find(x=>/賣掉/.test(x.textContent)).click(); await wait(100);
    out.sold=[G.bells-b2, G.inv.trophy_furn20||0, G.trophies.furn20];
    const b3=G.bells; sellFurniture('trophy_furn'); sellFurniture('trophy_pet'); out.price=G.bells-b3; checkTrophies(); out.noRegrant=!G.inv.trophy_furn20;
    const sc=totalScore(); out.score=sc;
    G.inv.trophy_pet=1; G.rooms[0].items.push({uid:G.uid++,id:'trophy_pet',x:0,y:0,rot:0}); G.inv.trophy_pet=0; delete G.inv.trophy_pet; out.inRoomBlock=furnSellBlock('trophy_pet');
    return out; });
  console.log(JSON.stringify(r), errs); await b.close();
})();
