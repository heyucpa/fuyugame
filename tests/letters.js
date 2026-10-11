// 字母找找看（b d p q）：認識→描寫→找找看→複習，整套走完、獎金、記錄練了幾次
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:900}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  await p.evaluate(()=>{ G.guide='done'; $('#modal').hidden=true; G.gameBonusDay=today(); window.__b0=G.bells; openLetterGame(); });
  await p.waitForTimeout(300);
  const first = await p.evaluate(()=>[...document.querySelectorAll('.ltr-set')].map(x=>x.textContent));
  console.log('選單', JSON.stringify(first));
  await p.locator('.ltr-set').first().click(); await p.waitForTimeout(400);
  const clickNext = async (re) => { await p.waitForTimeout(300); await p.locator('.ltr-body button.big', {hasText: re}).first().click(); await p.waitForTimeout(250); };
  // ① 認識：兩個字母
  console.log('認識', await p.evaluate(()=>document.querySelector('.ltr-big').textContent + '|' + document.querySelector('.ltr-say').textContent));
  await clickNext(/下一個字母/); console.log('認識2', await p.evaluate(()=>document.querySelector('.ltr-big').textContent));
  await clickNext(/下一步/);
  // ② 描：沿著筆畫路徑畫
  for (let k=0;k<2;k++) {
    const info = await p.evaluate(()=>{ const q=document.querySelector('.ltr-say').textContent; const ch=q.match(/把 (.) 描出來/)[1]; const c=document.querySelector('.ltr-body canvas'); const r=c.getBoundingClientRect(); return { ch, r:{x:r.x,y:r.y,w:r.width,h:r.height}, parts: LTR[ch].parts.map(pt=>pt.l?{l:pt.l}:{c:pt.c}) }; });
    const toS=(x,y)=>[info.r.x+(60+x*1.4)/240*info.r.w, info.r.y+(25+y*1.4)/240*info.r.h];
    // 先亂畫在外面：不該過關
    await p.mouse.move(info.r.x+5, info.r.y+5); await p.mouse.down(); await p.mouse.move(info.r.x+30, info.r.y+8, {steps:4}); await p.mouse.up();
    const early = await p.evaluate(()=>!!document.querySelector('.ltr-body button.big'));
    for (const pt of info.parts) {
      const pts=[]; if (pt.l) { for(let i=0;i<=12;i++) pts.push(toS(pt.l[0]+(pt.l[2]-pt.l[0])*i/12, pt.l[1]+(pt.l[3]-pt.l[1])*i/12)); }
      else { const [cx,cy,r,a0,a1]=pt.c; for(let i=0;i<=24;i++){ const a=a0+(a1-a0)*i/24; pts.push(toS(cx+Math.cos(a)*r, cy+Math.sin(a)*r)); } }
      await p.mouse.move(...pts[0]); await p.mouse.down(); for (const q of pts) await p.mouse.move(...q); await p.mouse.up();
    }
    await p.waitForTimeout(300);
    const ok = await p.evaluate(()=>/描好了/.test(document.querySelector('.ltr-hint').textContent));
    console.log('描', info.ch, '亂畫就過關?', early, '描好了?', ok);
    await clickNext(k===0 ? /下一個字母/ : /下一步/);
  }
  // ③ 找找看：3 回合
  for (let r=0;r<3;r++) {
    const tgt = await p.evaluate(()=>document.querySelector('.ltr-q').textContent.match(/所有的\s+(.)/)[1]);
    // 先點一個錯的
    await p.evaluate((t)=>{ const w=[...document.querySelectorAll('.ltr-cell')].find(x=>x.textContent!==t); if(w) w.click(); }, tgt);
    await p.evaluate((t)=>{ [...document.querySelectorAll('.ltr-cell')].filter(x=>x.textContent===t).forEach(x=>x.click()); }, tgt);
    await p.waitForTimeout(700);
    await clickNext(r<2 ? /下一回合/ : /下一步/);
  }
  // ④ 複習 6 題
  for (let i=0;i<6;i++) { await p.waitForTimeout(300); await p.evaluate(()=>{ const ch=playLetters.test.ch; [...document.querySelectorAll('.ltr-opt')].find(x=>x.textContent===ch).click(); }); await p.waitForTimeout(1000); }
  await p.waitForTimeout(500);
  const end = await p.evaluate(()=>({ q:document.querySelector('.ltr-q').textContent, gain:G.bells-window.__b0, abc:JSON.stringify(G.abc), sets:0 }));
  console.log('結束', JSON.stringify(end), errs);
  await p.screenshot({path:'/tmp/ltr_end.png'}); await b.close();
})();
