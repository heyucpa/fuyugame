const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:800}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/user/fuyugame/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  await p.evaluate(()=>{ G.guide='done'; $('#modal').hidden=true; openDrawPad('🏳️ 畫校旗', d=>{}); });
  const cv = await p.locator('canvas.draw-pad').boundingBox();
  // 從畫布按下去，拖到旁邊的標題、按鈕、卡片外面
  await p.mouse.move(cv.x+50, cv.y+50); await p.mouse.down();
  await p.mouse.move(cv.x+200, cv.y+120, {steps:5}); await p.mouse.move(cv.x+200, cv.y-60, {steps:5}); await p.mouse.move(cv.x+100, cv.y+cv.height+80, {steps:8}); await p.mouse.move(cv.x-200, cv.y+cv.height+120, {steps:8});
  const during = await p.evaluate(()=>String(getSelection()).length); await p.mouse.up();
  // 連點兩下旁邊的字
  const h2 = await p.locator('#modalCard h2').boundingBox(); await p.mouse.dblclick(h2.x+h2.width/2, h2.y+h2.height/2); await p.mouse.click(h2.x+20,h2.y+10,{clickCount:3});
  const after = await p.evaluate(()=>String(getSelection()).length);
  // 關掉畫板後，別的視窗還是能選字（備份框要能貼上）
  const ok = await p.evaluate(()=>{ $('#modal').hidden=true; openTab('backup'); const ta=document.querySelector('#tabBody textarea'); return getComputedStyle(ta).userSelect; });
  console.log('拖曳中被選到的字數', during, '點兩下三下之後', after, '備份框 user-select', ok, errs); await b.close();
})();
