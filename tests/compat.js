const { chromium } = require('playwright');
const fs = require('fs');
const S = __dirname + '/old';
const files = fs.readdirSync(S).filter(f=>/^v_.*\.html$/.test(f));
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  for (const f of files) {
    // A) 舊版玩一下、存檔
    const c1 = await b.newContext({viewport:{width:1100,height:700}}); const p1 = await c1.newPage();
    const e1=[]; p1.on('pageerror',e=>e1.push(e.message));
    await p1.goto('file://'+S+'/'+f); await p1.waitForTimeout(2500); try{await p1.getByText('跳過').click({timeout:1200});}catch(e){} await p1.waitForTimeout(800);
    const old = await p1.evaluate(()=>{
      try {
        G.bells = 777777; G.charName='舊版小孩'; if (G.pets && G.pets[0]) G.pets[0].name='舊寵物'; else if (G.pet) G.pet.name='舊寵物';
        G.inv = G.inv || {}; G.inv.wood_bed = 5; G.inv.sofa = 2;
        const r = G.rooms[0]; r.name='我的房'; r.items = r.items || []; r.items.push({ uid: (G.uid||1000)+500, id:'wood_chair', x:1, y:1, rot:0 });
        G.uid = (G.uid||1000)+600; saveGame();
      } catch(e) { return { err: e.message }; }
      return { ok: 1 };
    });
    const ls = await p1.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k, localStorage.getItem(k)])));
    const saveKey = Object.keys(ls).find(k=>/^myHouseGame_v1(:p1)?$/.test(k));
    const oldG = saveKey ? JSON.parse(ls[saveKey]) : null;
    await c1.close();
    if (!oldG) { console.log(f, '舊版沒存出檔', old, e1.slice(0,2)); continue; }
    // B) 新版讀它
    const c2 = await b.newContext({viewport:{width:1100,height:700}}); const p2 = await c2.newPage();
    const e2=[]; p2.on('pageerror',e=>e2.push(e.message));
    await p2.addInitScript((d)=>{ if (!sessionStorage.getItem('__seeded')) { sessionStorage.setItem('__seeded','1'); Object.keys(d).forEach(k=>localStorage.setItem(k,d[k])); } }, ls);
    await p2.goto('file:///home/user/fuyugame/house.html'); await p2.waitForTimeout(2500); try{await p2.getByText('跳過').click({timeout:1200});}catch(e){} await p2.waitForTimeout(1500);
    const res = await p2.evaluate(()=>({ locked: SAVE_LOCKED != null, bells: G.bells, name: G.charName, pet: G.pets[0].name, bed: G.inv.wood_bed, sofa: G.inv.sofa, room: G.rooms[0].name, chair: G.rooms[0].items.some(i=>i.id==='wood_chair'&&i.x===1&&i.y===1), nItems: G.rooms.reduce((a,r)=>a+r.items.length,0) }));
    const oldItems = oldG.rooms.reduce((a,r)=>a+(r.items||[]).length,0);
    const oldPet = (oldG.pets&&oldG.pets[0]&&oldG.pets[0].name) || (oldG.pet&&oldG.pet.name);
    const bad = [];
    if (res.locked) bad.push('存檔被鎖住');
    if (res.bells !== oldG.bells) bad.push(`鈴錢 ${oldG.bells}→${res.bells}`);
    if (res.name !== oldG.charName) bad.push('小孩名字變了');
    if (res.pet !== oldPet) bad.push(`寵物名字 ${oldPet}→${res.pet}`);
    if (res.bed !== 5 || res.sofa !== 2) bad.push(`收納變了 ${res.bed}/${res.sofa}`);
    if (res.room !== '我的房') bad.push('房間名字變了');
    if (!res.chair) bad.push('擺好的椅子不見');
    if (res.nItems < oldItems) bad.push(`家具變少 ${oldItems}→${res.nItems}`);
    console.log(f.replace('v_','').replace('.html',''), bad.length ? '❌ '+bad.join('；') : '✅', e2.length ? '錯誤:'+e2.slice(0,2).join('|') : '');
    await c2.close();
  }
  await b.close();
})();
