// 桌上的東西：點桌子會問要做什麼（收起來／拿起來換位置／搬桌子）；音樂選單：開關一顆、每首歌直接選
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:800}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(600);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true; G.away=null; G.cur=0; const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const room=curRoom(); room.items=[{uid:G.uid++, id:'wood_table', x:3, y:3, rot:0, top:'flower_vase'}, {uid:G.uid++, id:'cute_table', x:0, y:4, rot:0}]; G.inv.flower_vase=0; commit();
    const t=room.items[0];
    // 點桌子（有東西）→ 跳選單，不是把桌子拿起來
    const p0=iso(3.6,3.6,8); const w={x:p0.x, y:p0.y};
    const picked=pickItem(w); out.pickedTable = picked && picked.id;
    const ev={clientX: 500, clientY: 400};
    if (canUse(picked) || picked.top) showItemMenu(picked, ev); out.menu = [...document.querySelectorAll('#itemMenu button')].map(x=>x.textContent);
    out.notHolding = !hold;
    // 收起來
    [...document.querySelectorAll('#itemMenu button')].find(x=>/收起來/.test(x.textContent) && /花瓶/.test(x.textContent)).click();
    out.topped = t.top; out.inv = G.inv.flower_vase;
    // 再放回去 → 拿起來換到別張桌子
    G.inv.flower_vase--; if(!G.inv.flower_vase) delete G.inv.flower_vase; t.top='flower_vase';
    showItemMenu(t, ev); [...document.querySelectorAll('#itemMenu button')].find(x=>/拿起來/.test(x.textContent)).click();
    out.holdingVase = hold && hold.def.id; out.tableEmpty = !t.top;
    const t2=room.items[1]; hold.table=t2.uid; hold.ok=true; placeHold(); out.movedToT2 = t2.top==='flower_vase' && !(G.inv.flower_vase>0);
    // 沒東西的桌子：點了照舊直接拿起來搬
    out.emptyTableNoMenu = !(canUse(t) || t.top);
    // 🎵 音樂選單
    Sound.setPref('bgm', false); refreshSoundButtons();
    $('#btnBgm').click(); await wait(50); const mm=document.getElementById('musicMenu'); out.menuOpen=!!mm; out.items=[...mm.querySelectorAll('button')].map(x=>x.textContent);
    mm.querySelectorAll('button')[3].click(); await wait(50); out.song=Sound.songName(); out.bgmOn=Sound.prefs.bgm; out.closed=!document.getElementById('musicMenu');
    $('#btnBgm').click(); await wait(50); out.curMark=[...document.querySelectorAll('#musicMenu .music-song.on')].map(x=>x.textContent);
    document.querySelector('#musicMenu .music-tog').click(); await wait(50); out.off=!Sound.prefs.bgm;
    $('#btnBgm').click(); await wait(50); document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); await wait(50); out.outsideCloses=!document.getElementById('musicMenu');
    return out; });
  console.log(JSON.stringify(r), errs); await b.close();
})();
