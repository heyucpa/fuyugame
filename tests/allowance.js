// 零用錢：預設每天 10,000（也可改每週）、不累積、可關、壞存檔修好、爸媽真的會來
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
    G.allow={on:true,day:dow,amt:3000,paid:''}; G.away=null; giftReset(); for(let i=0;i<400 && giftVisit.state==='none';i++){ $('#modal').hidden=true; giftTick(performance.now()+i*20); await wait(0); }
    out.spec = giftVisit.spec && giftVisit.spec.id; out.state = giftVisit.state; out.dbg = JSON.stringify({wanted:allowanceWanted(), canStart:giftCanStart(), modal:$('#modal').hidden, hold:!!hold, startAt:giftVisit.startAt, intro:introPlaying, resting:resting});
    giftReset(); G.allow.paid=allowPeriod(dow);
    // 設定畫面
    openTab('save'); out.btn=[...document.querySelectorAll('#tabBody button')].some(x=>/調整零用錢/.test(x.textContent)); openAllowanceSettings(); out.settingsOpen=!$('#modal').hidden; $('#modal').hidden=true;
    // 預設 10,000：新存檔是 10,000；舊存檔還是舊預設 3,000 的換成 10,000（只換一次）；家長改過的照家長的
    out.newAmt = allowDefault().amt;
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    out.oldUp = normalizeSave(Object.assign({}, raw, { allow: { on: true, day: 0, amt: 3000, paid: 'x' } })).allow.amt;
    out.parentKept = normalizeSave(Object.assign({}, raw, { allow: { on: true, day: 0, amt: 3000, paid: 'x', v2: 1, v3: 1 } })).allow.amt;
    out.parent5000 = normalizeSave(Object.assign({}, raw, { allow: { on: true, day: 0, amt: 5000, paid: 'x', v2: 1, v3: 1 } })).allow.amt;
    // 改成每天送：新存檔每天、舊存檔（沒 v3）換成每天 10,000 一次；家長改回每週會留著
    out.newDaily = allowDefault().daily === true;
    const mig = normalizeSave(Object.assign({}, raw, { allow: { on: true, day: 3, amt: 5000, paid: '2026-1-4', v2: 1 } })).allow; out.migDaily = mig.daily === true && mig.amt === 10000 && mig.v3 === 1;
    const kept = normalizeSave(Object.assign({}, raw, { allow: { on: true, day: 3, amt: 5000, paid: 'x', daily: false, v2: 1, v3: 1 } })).allow; out.weeklyKept = kept.daily === false && kept.amt === 5000;
    // 每天送：今天領過就不再送，明天（paid 是昨天）又會來
    G.allow = { on: true, day: 0, amt: 10000, paid: today(), daily: true, v2: 1, v3: 1 }; out.dailyPaidToday = !allowanceWanted();
    const y = new Date(); y.setDate(y.getDate() - 1); G.allow.paid = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`; out.dailyDue = allowanceWanted();
    const b1 = G.bells; openAllowanceBox(); [...document.querySelectorAll('#modalCard button')].find(x => /打開/.test(x.textContent)).click(); out.dailyGot = G.bells - b1 === 10000 && G.allow.paid === today() && !allowanceWanted(); $('#modal').hidden = true;
    // 設定畫面可以選每天／每週
    openAllowanceSettings(); const sels = document.querySelectorAll('#modalCard select'); out.freqSel = sels.length === 4 && sels[2].hidden; sels[1].value = '0'; sels[1].onchange(); out.dayShown = !sels[2].hidden;
    [...document.querySelectorAll('#modalCard button')].find(x => /儲存/.test(x.textContent)).click(); out.savedWeekly = G.allow.daily === false && !allowanceWanted();
    return out; });
  console.log(JSON.stringify(r), errs);
  console.log(r.newAmt === 10000 && r.oldUp === 10000 && r.parentKept === 3000 && r.parent5000 === 5000 ? '✅ 預設 10,000 正確' : '❌ 預設零用錢不對');
  const d = ['newDaily', 'migDaily', 'weeklyKept', 'dailyPaidToday', 'dailyDue', 'dailyGot', 'freqSel', 'dayShown', 'savedWeekly'];
  console.log(d.every(k => r[k]) && !errs.length ? '✅ 每天送零用錢正確' : '❌ 每天送零用錢不對 ' + d.filter(k => !r[k]).join(','));
  await b.close();
})();
