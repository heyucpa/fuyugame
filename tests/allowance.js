// 零用錢：每週一次、不累積、可關、壞存檔修好、爸媽真的會來
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:760}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true; G.openGift=true; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    out.default = JSON.stringify(G.allow); out.newNotNow = !allowanceWanted();   // 新存檔不會一開始就送
    const dow = new Date().getDay();
    G.allow = { on:true, day:dow, amt:3000, paid:'' }; out.todayDue = allowanceWanted();
    const b0=G.bells, e0=G.earned; openAllowanceBox(); [...document.querySelectorAll('#modalCard button')].find(x=>/打開/.test(x.textContent)).click();
    out.paid=[G.bells-b0, G.earned-e0, G.allow.paid===allowPeriod(dow)]; $('#modal').hidden=true;
    out.noTwice = !allowanceWanted(); openAllowanceBox(); out.noTwiceBox = $('#modal').hidden;
    G.allow.paid=''; G.allow.day=(dow+3)%7; out.beforeDay = allowanceWanted();   // 這個禮拜的送錢日還沒到：看上一個送錢日，沒領過就補
    G.allow.paid = allowPeriod(G.allow.day); out.claimedThisPeriod = !allowanceWanted();
    G.allow.on=false; G.allow.paid=''; out.off=!allowanceWanted(); G.allow.on=true; G.allow.amt=0; out.zero=!allowanceWanted();
    G.allow={on:true,day:dow,amt:3000,paid:''}; G.openGift=false; out.needOpenGift=!allowanceWanted(); G.openGift=true;
    // 壞存檔
    [null, 'x', 5, {on:'y',day:9,amt:-1,paid:3}, {on:false,day:2,amt:99999,paid:'a'}].forEach((v,i)=>{ const g=JSON.parse(JSON.stringify(G)); g.allow=v; const n=normalizeSave(g).allow; if(!n||typeof n.on!=='boolean'||!(n.day>=0&&n.day<=6)||!(n.amt>=0&&n.amt<=10000)||typeof n.paid!=='string') (out.bad=out.bad||[]).push(i); });
    // 爸媽真的會來（走進房間、放信封）
    G.allow={on:true,day:dow,amt:3000,paid:''}; G.away=null; giftReset(); for(let i=0;i<400 && giftVisit.state==='none';i++){ giftTick(performance.now()+i*20); await wait(0); }
    out.spec = giftVisit.spec && giftVisit.spec.id; out.state = giftVisit.state;
    giftReset(); G.allow.paid=allowPeriod(dow);
    // 設定畫面
    openTab('save'); out.btn=[...document.querySelectorAll('#tabBody button')].some(x=>/調整零用錢/.test(x.textContent)); openAllowanceSettings(); out.settingsOpen=!$('#modal').hidden; $('#modal').hidden=true;
    return out; });
  console.log(JSON.stringify(r), errs); await b.close();
})();
