const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const ctx = await b.newContext({viewport:{width:1100,height:700}});
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/user/fuyugame/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:2000});}catch(e){} await p.waitForTimeout(1200);
  // 1) 做一個「寄件人」的邀請碼（用另一個存檔的樣子）
  const code = await p.evaluate(async()=>{
    const inv = makeInvite(); inv.n='姊姊'; inv.f='姊姊'; inv.id='abc123xyz9';
    return await encodeInvite(inv);
  });
  // 2) 收件人（現在這個存檔）設成有特色的進度
  await p.evaluate(()=>{ G.bells=12345; G.charName='妹妹本人'; G.pets[0].name='我的寵物'; G.inv.wood_bed=3; G.stickers={'⭐':1}; G.guestbook=[]; saveGame(); });
  const snap = ()=>p.evaluate(()=>({ G: JSON.parse(JSON.stringify(G)), ls: Object.fromEntries(Object.keys(localStorage).map(k=>[k, localStorage.getItem(k)])) }));
  const before = await snap();
  // 3) 用連結打開（跟真的一樣：hash）
  await p.goto('about:blank'); await p.goto('file:///home/user/fuyugame/house.html#visit='+code); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){}
  await p.waitForTimeout(4500);
  const afterOpen = await snap();
  const modal = await p.evaluate(()=>!$('#modal').hidden && $('#modalCard').innerText.slice(0,80));
  console.log('收到邀請卡視窗:', modal);
  // 4) 去玩
  await p.getByText('現在去').click({timeout:3000}).catch(()=>{});
  await p.waitForTimeout(9000);
  const away = await p.evaluate(()=>G.away && G.away.place);
  console.log('現在在:', away);
  // 隨便點一些東西
  for (let i=0;i<40;i++){ await p.mouse.click(400+ (i*37)%650, 150+ (i*53)%450); await p.waitForTimeout(150); }
  await p.waitForTimeout(1500);
  const during = await snap();
  await p.evaluate(()=>{ goHome(); }); await p.waitForTimeout(6000);
  const after = await snap();
  const diff = (a,c,path='')=>{ const out=[]; const keys=new Set([...Object.keys(a||{}),...Object.keys(c||{})]); keys.forEach(k=>{ const x=a?.[k], y=c?.[k]; if (JSON.stringify(x)!==JSON.stringify(y)) { if (x&&y&&typeof x==='object'&&typeof y==='object'&&path.split('.').length<2) out.push(...diff(x,y,path+'.'+k)); else out.push(path+'.'+k); } }); return out; };
  const show=(label,a,c)=>{ console.log('\n==',label); console.log('G 改變的欄位:', diff(a.G,c.G).filter(k=>!/lastTick|savedAt|\.t$|tick/i.test(k)).slice(0,40)); const ka=Object.keys(a.ls), kc=Object.keys(c.ls); console.log('localStorage 新增:', kc.filter(k=>!ka.includes(k)), '刪除:', ka.filter(k=>!kc.includes(k)), '內容變了:', ka.filter(k=>kc.includes(k)&&a.ls[k]!==c.ls[k])); };
  show('收到邀請卡後（還沒去）', before, afterOpen);
  show('在朋友家玩完回到家', before, after);
  console.log('bells', before.G.bells, '→', after.G.bells, ' earned', before.G.earned, '→', after.G.earned, ' hostMem.friend', JSON.stringify(after.G.hostMem&&after.G.hostMem.friend), ' guestbook', JSON.stringify(after.G.guestbook));
  console.log('錯誤:', errs);
  await b.close();
})();
