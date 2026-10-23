// 存檔、備份、自動讀取的壓力測試（最重要的：進度不能不見）
const { chromium } = require('playwright');
const HOUSE = 'file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html';
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };
async function fresh(b, seedLs) {
  const ctx = await b.newContext({viewport:{width:1100,height:760}}); const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('dialog', d=>d.accept().catch(()=>{}));
  if (seedLs) await p.addInitScript((d)=>{ if (!sessionStorage.getItem('__seeded')) { sessionStorage.setItem('__seeded','1'); localStorage.clear(); Object.keys(d).forEach(k=>localStorage.setItem(k,d[k])); } }, seedLs);
  await p.goto(HOUSE); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:800});}catch(e){} await p.waitForTimeout(600);
  return { ctx, p, errs };
}
const dump = p => p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k, localStorage.getItem(k)])));
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  // 準備一份有料的存檔
  let { ctx, p, errs } = await fresh(b);
  await p.evaluate(()=>{ G.guide='done'; G.openGift=true; G.bells=123456; G.charName='壓力測試'; G.pets[0].name='壓壓'; G.inv.wood_bed=7; G.rooms[0].items.push({uid:G.uid++,id:'wood_chair',x:1,y:1,rot:0}); G.hwEarned=33; G.islCoin={d:today(),n:2,got:['1,1']}; saveGame(); });
  const base = await dump(p); const saveKey = Object.keys(base).find(k=>/^myHouseGame_v1:p\d+$/.test(k)); const raw0 = base[saveKey];
  ok(saveKey && raw0, '找不到存檔 key');
  const G0 = JSON.parse(raw0);

  // ① normalizeSave 亂改 400 次：不能丟錯；回傳的東西再 normalize 一次要一樣（穩定）
  const fz = await p.evaluate((raw)=>{
    const out={throws:0, nulls:0, unstable:0, total:0, examples:[]}; const junk=[null, undefined, 0, -1, 1e99, NaN, '', 'x', [], {}, [[]], {a:1}, true, 9007199254740993, '2026-13-99', -5.5];
    let seed=7; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }; const pick=a=>a[Math.floor(rnd()*a.length)];
    const mutate=(o,depth)=>{ if(!o||typeof o!=='object') return; const ks=Object.keys(o); if(!ks.length) return; const k=pick(ks); if(rnd()<.45 && depth<3 && o[k]&&typeof o[k]==='object') mutate(o[k],depth+1); else if (rnd()<.2) delete o[k]; else o[k]=pick(junk); };
    const strip=g=>{ const c=JSON.parse(JSON.stringify(g)); delete c.savedAt; return JSON.stringify(c); };
    for (let i=0;i<400;i++){ const g=JSON.parse(raw); const n=1+Math.floor(rnd()*4); for(let j=0;j<n;j++) mutate(g,0); out.total++;
      let a; try { a=normalizeSave(JSON.parse(JSON.stringify(g))); } catch(e){ out.throws++; if(out.examples.length<4) out.examples.push('THROW '+e.message.slice(0,60)); continue; }
      if (!a) { out.nulls++; continue; }
      try { const b2=normalizeSave(JSON.parse(JSON.stringify(a))); if (!b2) { out.unstable++; if(out.examples.length<4) out.examples.push('second null'); } else if (strip(a)!==strip(b2)) { out.unstable++; if(out.examples.length<4){ const A=JSON.parse(strip(a)),B=JSON.parse(strip(b2)); const diff=Object.keys(A).filter(k=>JSON.stringify(A[k])!==JSON.stringify(B[k])); out.examples.push('unstable:'+diff.join(',')); } } } catch(e){ out.throws++; }
    }
    return out; }, raw0);
  console.log('① normalize 亂改', JSON.stringify(fz));
  ok(fz.throws===0, '① normalizeSave 會丟錯：'+fz.examples.join(' | '));
  ok(fz.unstable===0, '① normalizeSave 不穩定：'+fz.examples.join(' | '));

  // ② 存檔重新載入 3 次都一樣（錢、名字、家具）
  for (let i=0;i<3;i++){ await p.reload(); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:500});}catch(e){} }
  const r2 = await p.evaluate(()=>({bells:G.bells, name:G.charName, pet:G.pets[0].name, bed:G.inv.wood_bed, locked:SAVE_LOCKED!=null}));
  ok(r2.bells===123456 && r2.name==='壓力測試' && r2.pet==='壓壓' && r2.bed===7 && !r2.locked, '② 重新載入後進度變了 '+JSON.stringify(r2));

  // ③ 空間不夠：存檔寫不進去 → 要有警告、舊的存檔不能被刪、不能當掉
  const q = await p.evaluate(()=>{
    const real = Storage.prototype.setItem; const before = localStorage.getItem(SAVE_KEY);
    Storage.prototype.setItem = function(k,v){ if (k===SAVE_KEY || /snaps/.test(k)) { const e=new Error('QuotaExceededError'); e.name='QuotaExceededError'; throw e; } return real.call(this,k,v); };
    let r; try { G.bells=1; r = saveGame(); } finally { Storage.prototype.setItem = real; }
    const warn = document.getElementById('saveWarn'); const out = { saved:r, warnShown: !!warn && !warn.hidden, oldIntact: localStorage.getItem(SAVE_KEY)===before, snapsStill: readSnaps().length>=0 };
    G.bells=123456; saveGame(); showSaveWarn(null); return out; });
  console.log('③ 空間不夠', JSON.stringify(q));
  ok(q.saved===false && q.warnShown && q.oldIntact, '③ 空間不夠時處理不對 '+JSON.stringify(q));

  // ④ 存檔紀錄：自動存、同內容不重複、手動最多 5、自動不能擠掉手動（空間不夠時）、回到這份
  const sn = await p.evaluate(()=>{
    localStorage.removeItem(SNAP_KEY); const out={};
    out.auto1 = autoSnap(); out.auto2 = autoSnap(); out.n1 = readSnaps().length;
    for (let i=0;i<7;i++){ G.bells=1000+i; saveGame(); addSnap('manual', localStorage.getItem(SAVE_KEY)); } out.manual = readSnaps().filter(x=>x.kind==='manual').length;
    for (let i=0;i<7;i++){ G.bells=2000+i; saveGame(); addSnap('auto', localStorage.getItem(SAVE_KEY)); } out.autoN = readSnaps().filter(x=>x.kind==='auto').length;
    // 空間不夠（只能放 3 份）：新的自動存檔只能擠掉舊的自動存檔，手動的都要在
    const real = Storage.prototype.setItem; let manualBefore = readSnaps().filter(x=>x.kind==='manual').map(x=>x.raw);
    Storage.prototype.setItem = function(k,v){ if (k===SNAP_KEY && JSON.parse(v).length>6) { const e=new Error('Quota'); e.name='QuotaExceededError'; throw e; } return real.call(this,k,v); };
    try { G.bells=3333; saveGame(); out.autoUnderQuota = addSnap('auto', localStorage.getItem(SAVE_KEY)); } finally { Storage.prototype.setItem = real; }
    const after = readSnaps(); out.manualKept = manualBefore.every(r=>after.some(x=>x.raw===r)); out.total = after.length;
    // 回到某一份：現在的要先留著（reset）＋反悔
    const target = after.find(x=>x.kind==='manual'); G.bells=99999; saveGame(); const cur=localStorage.getItem(SAVE_KEY);
    out.restored = restoreSnap(target.raw); out.saveIsTarget = localStorage.getItem(SAVE_KEY)===target.raw; out.resetKept = readSnaps().some(x=>x.kind==='reset' && x.raw===cur); out.undoHasCur = (readBackup(localStorage.getItem(UNDO_KEY))||{}).data===cur;
    out.badRestore = restoreSnap('{"rooms":"x"}')===false && localStorage.getItem(SAVE_KEY)===target.raw;
    localStorage.setItem(SAVE_KEY, cur); return out; });
  console.log('④ 存檔紀錄', JSON.stringify(sn));
  ok(sn.auto1 && !sn.auto2 && sn.n1===1, '④ 自動存檔重複/不存');
  ok(sn.manual===5 && sn.autoN===5, '④ 上限不對');
  ok(sn.manualKept, '④ 空間不夠時自動存檔擠掉了手動存檔');
  ok(sn.restored && sn.saveIsTarget && sn.resetKept && sn.undoHasCur && sn.badRestore, '④ 回到這份/反悔不對 '+JSON.stringify(sn));

  // ⑤ 備份：做出來 → 讀得回來 → 蓋回去 → 重新載入後是備份的進度；壞的備份一律擋掉、不動存檔
  const bk = await p.evaluate(()=>{
    G.bells=123456; saveGame(); const txt=freshBackup(); const s=readBackup(txt); const out={ made: !!txt, read: !!s && JSON.parse(s.data).bells===123456 };
    const cur=localStorage.getItem(SAVE_KEY);
    const bad=[ '', 'abc', '{"tag":"x","data":"{}"}', '{"tag":"myHouse-save","v":1,"data":"{\\"rooms\\":5}"}', txt.slice(0, txt.length-30), '{"rooms":"x"}', JSON.stringify({tag:'myHouse-save',v:1,data:'null'}), '[]' ];
    out.badRejected = bad.every(t=>readBackup(t)===null && applyBackup(t)===false);
    out.intact = localStorage.getItem(SAVE_KEY)===cur;
    // 「讀不出來」畫面下載的原始資料（存檔本身）也能當備份放回去
    out.rawAccepted = !!readBackup(cur);
    G.bells=5; saveGame(); out.applied = applyBackup(txt); out.undo = (readBackup(localStorage.getItem(UNDO_KEY))||{}).data && JSON.parse(readBackup(localStorage.getItem(UNDO_KEY)).data).bells===5;
    return out; });
  await p.reload(); await p.waitForTimeout(1500);
  bk.afterReload = await p.evaluate(()=>G.bells);
  console.log('⑤ 備份', JSON.stringify(bk));
  ok(bk.made && bk.read && bk.badRejected && bk.intact && bk.rawAccepted && bk.applied && bk.undo && bk.afterReload===123456, '⑤ 備份流程不對 '+JSON.stringify(bk));

  // ⑥ 還原連結：合法的會問→還原；亂碼的不動存檔也不當掉
  const link = await p.evaluate(()=>{ const g=JSON.parse(JSON.stringify(G)); g.bells=777; g.charName='連結還原'; const b64=btoa(unescape(encodeURIComponent(JSON.stringify(g)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); return location.href.split('#')[0]+'?r=1#restore='+b64; });   // 加 ?r=1 才會真的重新載入（只改 # 不會）
  await p.goto(link); await p.waitForTimeout(1800);
  const lr = await p.evaluate(()=>({ bells:G.bells, name:G.charName, resetSnap: readSnaps().some(x=>x.kind==='reset'), undo: hasUndo() }));
  ok(lr.bells===777 && lr.name==='連結還原' && lr.resetSnap && lr.undo, '⑥ 還原連結沒有還原/沒有留下之前的 '+JSON.stringify(lr));
  await p.goto(HOUSE.split('#')[0]+'?r=2#restore=@@@not-base64@@@'); await p.waitForTimeout(1500);
  const lr2 = await p.evaluate(()=>({ bells:G.bells, locked:SAVE_LOCKED!=null, fail: restoredByLink && restoredByLink.fail }));
  ok(lr2.bells===777 && !lr2.locked, '⑥ 亂碼還原連結動到存檔 '+JSON.stringify(lr2));
  // 把進度改回去
  await p.evaluate(()=>{ G.bells=123456; G.charName='壓力測試'; saveGame(); });

  // ⑦ 存檔壞掉 → 鎖住、留原文、不覆蓋、可以從備份頁看到處理
  const cur = await dump(p); const broken = Object.assign({}, cur); broken[saveKey] = '{"rooms":"broken","bells":1}';
  let s7 = await fresh(b, broken);
  const rs = await s7.p.evaluate(()=>({ locked: SAVE_LOCKED!=null, rawKept: localStorage.getItem(SAVE_KEY)==='{"rooms":"broken","bells":1}', rescueSaved: localStorage.getItem(rescueKey())==='{"rooms":"broken","bells":1}', snapRescue: readSnaps().some(x=>x.kind==='rescue'), saveRefused: saveGame()===false, stillRaw: localStorage.getItem(SAVE_KEY)==='{"rooms":"broken","bells":1}', modal: !$('#modal').hidden && /讀不出來/.test($('#modalCard').innerText) }));
  console.log('⑦ 壞存檔', JSON.stringify(rs), s7.errs);
  ok(rs.locked && rs.rawKept && rs.rescueSaved && rs.saveRefused && rs.stillRaw && rs.modal, '⑦ 壞存檔處理不對 '+JSON.stringify(rs));
  ok(s7.errs.length===0, '⑦ 壞存檔時有 JS 錯誤 '+s7.errs.slice(0,2));
  // 壞掉的 JSON（不是物件）
  const broken2 = Object.assign({}, cur); broken2[saveKey] = '{{{';
  let s7b = await fresh(b, broken2); const rs2 = await s7b.p.evaluate(()=>({ locked: SAVE_LOCKED!=null, rawKept: localStorage.getItem(SAVE_KEY)==='{{{' })); ok(rs2.locked && rs2.rawKept, '⑦ 非 JSON 存檔沒鎖住/被改掉 '+JSON.stringify(rs2)); ok(s7b.errs.length===0, '⑦b JS 錯誤'); await s7b.ctx.close();
  // 鎖住時的備份：不給拿舊的充數；下載原始資料
  const rb = await s7.p.evaluate(()=>({ fresh: freshBackup()===null, rescue: !!rescueCopy() || true })); ok(rb.fresh, '⑦ 鎖住時 freshBackup 應該是 null'); await s7.ctx.close();

  // ⑧ 兩個分頁：另一邊寫了 → 這邊不再存檔（不覆蓋）；自己寫的不會誤判
  const selfOk = await p.evaluate(()=>{ G.bells=123457; saveGame(); G.bells=123456; saveGame(); return !SAVE_STALE; });   // 自己寫的不會誤判
  const p2 = await ctx.newPage(); await p2.goto(HOUSE); await p2.waitForTimeout(1500);   // 另一個分頁一打開就會存一次 → 這邊要變 stale
  await p2.evaluate(()=>{ G.bells=55; saveGame(); }); await p.waitForTimeout(400);
  const stale = await p.evaluate(()=>({ stale: SAVE_STALE, refused: saveGame()===false, warn: !!document.getElementById('saveWarn') && !document.getElementById('saveWarn').hidden, lsBells: JSON.parse(localStorage.getItem(SAVE_KEY)).bells }));
  console.log('⑧ 兩個分頁', selfOk, JSON.stringify(stale));
  ok(selfOk && stale.stale && stale.refused && stale.warn && stale.lsBells===55, '⑧ 兩個分頁的保護不對 '+JSON.stringify(stale));
  await p2.close();

  // ⑨ 存檔格：開新格、換格、刪格（有回收桶、最後一格不能刪）、舊格資料不動
  await p.reload(); await p.waitForTimeout(1500);
  const sl = await p.evaluate(()=>{ G.bells=123456; saveGame(); const out={}; const id=addSlot('第二個'); out.added=!!id && slots().some(s=>s.id===id); out.p1Intact = JSON.parse(localStorage.getItem(SAVE_KEY)).bells===123456; out.cantRemoveToOne = (()=>{ const ids=slots().map(s=>s.id); let n=0; ids.forEach(i=>{ if (i!==curSlotId() && removeSlot(i)) n++; }); return n===1 && removeSlot(curSlotId())===false && slots().length===1; })(); out.trash = (JSON.parse(localStorage.getItem(TRASH_KEY)||'[]')).length; return out; });
  console.log('⑨ 存檔格', JSON.stringify(sl));
  ok(sl.added && sl.p1Intact && sl.cantRemoveToOne, '⑨ 存檔格不對 '+JSON.stringify(sl));
  // 換格：寫 CUR_KEY 並重新載入，換過去的是新格、原本那格還在
  const nid = await p.evaluate(()=>addSlot('換格測試'));
  await p.evaluate((id)=>{ switchSlot(id); }, nid); await p.waitForTimeout(1800);
  const sw = await p.evaluate((id)=>({ cur: curSlotId()===id, newIsFresh: G.bells!==123456, p1: JSON.parse(localStorage.getItem('myHouseGame_v1:p1')).bells===123456 }), nid);
  ok(sw.cur && sw.newIsFresh && sw.p1, '⑨ 換格不對 '+JSON.stringify(sw));
  await p.evaluate(()=>{ localStorage.setItem(CUR_KEY,'p1'); }); await p.reload(); await p.waitForTimeout(1200);

  // ⑩ 舊版（沒有存檔格）的存檔自動搬進 p1
  const legacy = { 'myHouseGame_v1': raw0 };
  let s10 = await fresh(b, legacy); const lg = await s10.p.evaluate(()=>({ bells:G.bells, p1: !!localStorage.getItem('myHouseGame_v1:p1'), locked:SAVE_LOCKED!=null })); ok(lg.bells===123456 && lg.p1 && !lg.locked, '⑩ 舊版存檔沒搬進來 '+JSON.stringify(lg)); ok(s10.errs.length===0, '⑩ JS 錯誤'); await s10.ctx.close();

  // ⑪ 6 份亂改過的存檔真的拿去開遊戲：要嘛正常載入、要嘛鎖住（原文保留），不能有 JS 錯誤、不能偷偷變新遊戲
  const muts = await p.evaluate((raw)=>{ const outs=[]; const junk=[null,'x',5,[],{}]; let seed=99; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; }; for (let i=0;i<6;i++){ const g=JSON.parse(raw); const ks=Object.keys(g); for(let j=0;j<3;j++){ const k=ks[Math.floor(rnd()*ks.length)]; g[k]=junk[Math.floor(rnd()*junk.length)]; } outs.push(JSON.stringify(g)); } return outs; }, raw0);
  for (const m of muts) { const seed = Object.assign({}, cur); seed[saveKey]=m; const s = await fresh(b, seed); const r = await s.p.evaluate((m)=>({ locked:SAVE_LOCKED!=null, raw: localStorage.getItem(SAVE_KEY), bells:G.bells, open:G.openGift }), m);
    const silentlyNew = !r.locked && r.bells!==123456 && JSON.parse(m).bells===123456; ok(s.errs.length===0, '⑪ 亂改存檔開遊戲有 JS 錯誤：'+s.errs.slice(0,1)+' ← '+m.slice(0,80)); ok(!r.locked || r.raw===m, '⑪ 鎖住但原文被改'); ok(!silentlyNew, '⑪ 存檔偷偷變成新遊戲 ← '+m.slice(0,100)); await s.ctx.close(); }

  // ⑫ 檢查者找到的：刪存檔格時回收桶寫不進去 → 不能刪；pets/guestbook 有 null 不會鎖；uid 壞掉會接著現有最大的；鎖住時不蓋掉反悔那份；舊格刪了不會再搬舊版存檔進來
  await p.reload(); await p.waitForTimeout(1200);
  const au = await p.evaluate(()=>{
    const out={}; G.bells=123456; saveGame();
    const id=addSlot('要刪的'); localStorage.setItem(slotSave(id), localStorage.getItem(SAVE_KEY));
    const real=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k===TRASH_KEY){ const e=new Error('Q'); e.name='QuotaExceededError'; throw e; } return real.call(this,k,v); };
    let r; try { r=removeSlot(id); } finally { Storage.prototype.setItem=real; }
    out.trashFailKeeps = r===false && !!localStorage.getItem(slotSave(id)) && slots().some(s=>s.id===id);
    out.removeOk = removeSlot(id)===true && !localStorage.getItem(slotSave(id)) && (JSON.parse(localStorage.getItem(TRASH_KEY))||[]).length>=1;
    const g=JSON.parse(localStorage.getItem(SAVE_KEY)); g.pets=[null, g.pets[0]]; g.guestbook=[null,null,null,null,null,null,null,null,null,null,null,null,null,{id:'a',at:1,g:'cookie',m:0,n:'x',d:{s:[]}}]; g.uid=NaN; g.rooms[0].items.push({uid:500,id:'wood_chair',x:2,y:2,rot:0});
    let n=null, threw=false; try { n=normalizeSave(JSON.parse(JSON.stringify(g))); } catch(e){ threw=true; }
    out.nullPetOk = !threw && !!n && n.pets.length===1; out.uidAbove = !!n && n.uid>500;
    // 鎖住時 applyBackup 不動 UNDO
    const undo0 = localStorage.getItem(UNDO_KEY); const keepLocked=SAVE_LOCKED; SAVE_LOCKED='{bad'; try { applyBackup(makeBackup(JSON.stringify(G))); } finally { SAVE_LOCKED=keepLocked; }
    out.undoKeptWhenLocked = localStorage.getItem(UNDO_KEY)===undo0; localStorage.setItem(SAVE_KEY, JSON.stringify(G));
    return out; });
  console.log('⑫ 檢查者的修正', JSON.stringify(au));
  ok(au.trashFailKeeps && au.removeOk && au.nullPetOk && au.uidAbove && au.undoKeptWhenLocked, '⑫ 不對 '+JSON.stringify(au));
  // 舊版存檔 + 已經有存檔格（第 1 格刪掉了）→ 不要再搬進來
  let s12 = await fresh(b, { 'myHouseGame_v1': raw0, 'myHouseGame_slots': JSON.stringify([{id:'p2',name:'二'}]), 'myHouseGame_v1:p2': raw0 });
  const mg = await s12.p.evaluate(()=>({ p1: !!localStorage.getItem('myHouseGame_v1:p1'), cur: curSlotId() })); ok(!mg.p1 && mg.cur==='p2', '⑫ 刪掉第 1 格後舊版存檔又被搬進來 '+JSON.stringify(mg)); await s12.ctx.close();
  console.log(fails.length ? '❌ 失敗 '+fails.length+'\n- '+fails.join('\n- ') : '✅ 存檔、備份、自動讀取 全部通過', errs.length?('主分頁 JS 錯誤:'+errs.slice(0,3)):'');
  await b.close();
})();
