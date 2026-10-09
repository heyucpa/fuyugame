const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:700}})).newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/user/fuyugame/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(1000);
  const r = await p.evaluate(async()=>{
    const out = { crashes: [], tried: 0, accepted: 0 };
    G.bells = 4242; G.inv.wood_bed = 3; saveGame();
    const parts=()=>({rooms:JSON.stringify(G.rooms),inv:JSON.stringify(G.inv),bells:G.bells,pets:JSON.stringify(G.pets.map(p=>p.name)),wardrobe:JSON.stringify(G.wardrobe)}); const g0=parts();
    const junk = [null, undefined, 0, -1, 1e99, NaN, '', 'x', '<img src=x onerror=alert(1)>', [], {}, [[]], { a: 1 }, true, '__proto__', 9007199254740993];
    const rnd = (a)=>a[Math.floor(Math.random()*a.length)];
    const base = makeInvite();
    const mutate = (o, depth)=>{ if (o && typeof o==='object') { const keys=Object.keys(o); if (!keys.length) return; const k=rnd(keys); if (Math.random()<.5 && depth<4) mutate(o[k], depth+1); else o[k]=rnd(junk); } };
    for (let i=0;i<400;i++) {
      const inv = JSON.parse(JSON.stringify(base)); const n = 1+Math.floor(Math.random()*4); for (let j=0;j<n;j++) mutate(inv,0);
      if (Math.random()<.2) { inv.__proto__ = { polluted: 1 }; inv.constructor = { prototype: { polluted2: 1 } }; }
      out.tried++;
      try {
        const c = cleanInvite(inv);
        if (c) { out.accepted++; visitFriend(c); await new Promise(r=>setTimeout(r,30)); }
      } catch(e) { out.crashes.push(e.message.slice(0,80)); }
    }
    // 壞掉的連結字串
    for (const s of ['', 'zzzz', 'j', 'jAAAA', 'z@@@', 'x'.repeat(5000), 'j'+btoa('{"v":1}').replace(/=/g,''), 'j'+btoa('[1,2,3]').replace(/=/g,'')]) { try { const r = await decodeInvite(s); } catch(e) { out.crashes.push('decode:'+e.message.slice(0,60)); } }
    out.polluted = ({}).polluted || ({}).polluted2 || null;
    G.away = null;
    const g1=parts(); out.changed=Object.keys(g0).filter(k=>g0[k]!==g1[k]).map(k=>k+': '+String(g0[k]).slice(0,150)+' => '+String(g1[k]).slice(0,150));
    return out;
  });
  console.log(JSON.stringify(r).slice(0,800)); console.log('頁面錯誤', errs.slice(0,5));
  await b.close();
})();
