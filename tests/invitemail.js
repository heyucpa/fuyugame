// 邀請卡：Email 寄出的內容、iPad 在 Safari 打開連結時提醒「回小屋 App 貼上」、已經在 App 裡就不提醒
const { chromium } = require('playwright');
const HOUSE = 'file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html';
const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const ctx = await b.newContext({viewport:{width:1100,height:760}}); const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(HOUSE); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true; G.inviteFrom='妹妹';
    const m = mailtoLink('主旨 測試', '內容\n第二行', 'https://x.test/house.html#visit=abc_DEF-123'); out.mailto = m.length<2000 && m.startsWith('mailto:?subject=') && decodeURIComponent(m).includes('#visit=abc_DEF-123');
    openInviteMaker(); await new Promise(r=>setTimeout(r,300));
    const btns=[...document.querySelectorAll('#modalCard button')].map(x=>x.textContent); out.btns=btns.filter(t=>/Email|複製連結|傳送/.test(t));
    const clicks=[]; document.addEventListener('click', e=>{ const a=e.target.closest&&e.target.closest('a[href^="mailto:"]'); if(a){ clicks.push(a.href); e.preventDefault(); } }, true);
    [...document.querySelectorAll('#modalCard button')].find(x=>/Email/.test(x.textContent)).click(); await new Promise(r=>setTimeout(r,100));
    out.mailClick = clicks.length===1 && /^mailto:\?subject=/.test(clicks[0]) && decodeURIComponent(clicks[0]).includes('#visit=');
    out.link = document.querySelector('#modalCard textarea').value;
    return out; });
  console.log(JSON.stringify(r));
  const link = r.link;
  // iPad、Safari（不是主畫面 App）：先問
  const c2 = await b.newContext({viewport:{width:1100,height:760}, userAgent: IPAD}); const q = await c2.newPage(); const e2=[]; q.on('pageerror',e=>e2.push(e.message));
  await q.goto('about:blank'); await q.goto(link); await q.waitForTimeout(3500);
  const a = await q.evaluate(()=>({ asked: !$('#modal').hidden && /小屋」App/.test($('#modalCard').innerText), btns:[...document.querySelectorAll('#modalCard button')].map(x=>x.textContent) }));
  await q.getByText('就在這裡').click(); await q.waitForTimeout(800);
  const a2 = await q.evaluate(()=>({ welcome: !$('#modal').hidden && /邀請卡/.test($('#modalCard').innerText), saved: (JSON.parse(localStorage.getItem('myHouse_invites')||'[]')).length }));
  console.log('iPad Safari', JSON.stringify(a), '→ 就在這裡', JSON.stringify(a2), e2);
  // iPad 主畫面 App（standalone）：直接收下
  const c3 = await b.newContext({viewport:{width:1100,height:760}, userAgent: IPAD}); await c3.addInitScript(()=>{ Object.defineProperty(navigator,'standalone',{value:true}); });
  const s = await c3.newPage(); await s.goto(HOUSE + '?a=1', {waitUntil:'domcontentloaded'}); await s.waitForTimeout(800); await s.goto(link, {waitUntil:'domcontentloaded'}); await s.waitForTimeout(3500);
  console.log('iPad App', JSON.stringify(await s.evaluate(()=>({ direct: !$('#modal').hidden && /邀請卡/.test($('#modalCard').innerText) && !/小屋」App/.test($('#modalCard').innerText) }))));
  // 電腦：照舊直接收下
  const c4 = await b.newContext({viewport:{width:1100,height:760}}); const d = await c4.newPage(); await d.goto(HOUSE + '?a=1', {waitUntil:'domcontentloaded'}); await d.waitForTimeout(800); await d.goto(link, {waitUntil:'domcontentloaded'}); await d.waitForTimeout(3500);
  console.log('電腦', JSON.stringify(await d.evaluate(()=>({ direct: !$('#modal').hidden && /邀請卡/.test($('#modalCard').innerText) && !/小屋」App/.test($('#modalCard').innerText) }))), errs);
  await b.close();
})();
