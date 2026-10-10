const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const ctx = await b.newContext({viewport:{width:1180,height:820}, hasTouch:true, isMobile:true, deviceScaleFactor:2}); const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/user/fuyugame/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  await p.evaluate(()=>{ G.guide='done'; $('#modal').hidden=true; openDrawPad('🎨 美勞課：畫一張圖', d=>{}); });
  const cv = await p.locator('canvas.draw-pad').boundingBox(); const cdp = await ctx.newCDPSession(p);
  const pt=(x,y)=>[{x,y,id:1}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt(cv.x+40,cv.y+40)});
  for (let i=1;i<=12;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(cv.x+40+i*12,cv.y+40+i*5)});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pt(cv.x+60,cv.y-80)});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const r = await p.evaluate(()=>({ strokes: openDrawPad.test.strokes.length, pts: openDrawPad.test.strokes[0] ? openDrawPad.test.strokes[0].length : 0, sel: String(getSelection()).length }));
  console.log(JSON.stringify(r), errs); await b.close();
})();
