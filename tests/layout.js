const { chromium } = require('playwright');
const VP = [['iPad橫',1180,820,true],['iPad直',820,1180,true],['手機直',390,844,true],['手機橫',844,390,true],['超寬螢幕',3440,1440,false],['Win筆電',1366,768,false]];
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  for (const [name,w,h,touch] of VP) {
    const ctx = await b.newContext({viewport:{width:w,height:h}, hasTouch:touch, isMobile: touch && w<900, deviceScaleFactor: touch?2:1});
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
    await p.goto('file:///home/user/fuyugame/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(1200);
    const probs = await p.evaluate(async()=>{
      const out=[]; const vw=innerWidth, vh=innerHeight;
      const chk=(label)=>{ if (document.documentElement.scrollWidth>vw+2) out.push(label+'：整頁橫向會捲動 '+document.documentElement.scrollWidth+'>'+vw);
        const m=$('#modal'); if(m && !m.hidden){ const c=$('#modalCard').getBoundingClientRect(); if(c.left<-1||c.right>vw+1) out.push(label+'：視窗左右超出'); if(c.height>vh+1 && getComputedStyle($('#modalCard')).overflowY==='visible') out.push(label+'：視窗太高又不能捲 '+Math.round(c.height)+'>'+vh); const bt=[...$('#modalCard').querySelectorAll('button')].filter(x=>{const r=x.getBoundingClientRect(); return r.width>0 && (r.right>vw+1||r.left<-1)}); if(bt.length) out.push(label+'：按鈕超出畫面 '+bt.length+' 顆'); } };
      const wait=ms=>new Promise(r=>setTimeout(r,ms));
      SEASON_TODAY=[10,20]; G.openGift=true; FURNITURE.forEach(f=>{ if(!f.season&&!f.gift) G.inv[f.id]=2; }); G.hwEarned=40; commit(); await wait(400); chk('主畫面');
      for (const tab of ['inv','shop','dress','pet','dex','earn','talk','set','backup']) { try { openTab(tab); } catch(e) {} await wait(250); chk('分頁 '+tab); }
      openTab('inv'); await wait(200);
      openDecor(); await wait(200); chk('一鍵佈置選風格'); decorAsk('cute'); await wait(100); chk('一鍵佈置補上/重擺'); $('#modal').hidden=true;
      openHwPrizes(); await wait(200); chk('糖果收集'); $('#modal').hidden=true;
      return out; });
    console.log(name, w+'x'+h, probs.length? probs : '✅', errs.length?('錯誤:'+errs.slice(0,2)):'');
    if (name==='超寬螢幕'||name==='手機直'||name==='iPad橫') await p.screenshot({path:'lay_'+name+'.png'});
    await ctx.close();
  }
  await b.close();
})();
