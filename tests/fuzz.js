// 亂按測試：隨機點畫面、按鍵、開分頁、開關小島、玩小遊戲，不能有 JS 錯誤、不能卡死、存檔還讀得回來
const { chromium } = require('playwright');
const seeds = (process.env.SEEDS || '1 2 3').split(/\s+/).map(Number), STEPS = +(process.env.STEPS || 250);
function rng(seed){ let s=seed>>>0||1; return ()=>{ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  let bad = 0;
  for (const seed of seeds) {
    const R = rng(seed*7919);
    for (const [name,w,h,touch] of [['pc',1100,740,false],['phone',390,800,true]]) {
      const ctx = await b.newContext({viewport:{width:w,height:h}, hasTouch:touch, isMobile:touch, deviceScaleFactor:1});
      const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
      p.on('dialog', d=>d.dismiss().catch(()=>{}));   // 確認視窗一律「取消」（不然會亂按到重新開始、換存檔）
      await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1200); try{await p.getByText('跳過').click({timeout:1000});}catch(e){} await p.waitForTimeout(500);
      await p.evaluate(()=>{ G.guide='done'; SEASON_TODAY=[10,20]; G.bells=50000; FURNITURE.forEach(f=>{ if(!f.season&&!f.gift&&Math.random()<.3) G.inv[f.id]=1; }); });
      let lastAct=''; const hist=[]; p.on('framenavigated', f=>{ if (f===p.mainFrame() && lastAct && !/強制更新|新存檔|換成這個|版本與更新/.test(hist.slice(-4).join())) errs.push('頁面重新載入，最近的動作：'+hist.slice(-10).join(' ; ')); });
      const keys=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' ','Escape','Enter','r','1'];
      for (let i=0;i<STEPS;i++) {
        const t=R();
        try {
          lastAct='step'+i+' t='+t.toFixed(2); if (t<.55) { const x=R()*w, y=R()*h; hist.push(lastAct); lastAct+=' click '+Math.round(x)+','+Math.round(y)+' → '+await p.evaluate(([x,y])=>{ const e=document.elementFromPoint(x,y); return e?((e.id||e.className||e.tagName)+':'+(e.textContent||'').slice(0,20)):''; },[x,y]).catch(()=>''); hist.push(lastAct); await p.mouse.click(x, y); }
          else if (t<.7) await p.keyboard.press(keys[Math.floor(R()*keys.length)]);
          else if (t<.78) hist.push('btn:'+await p.evaluate(()=>{ const bs=[...document.querySelectorAll('button')].filter(x=>x.offsetParent&&!x.disabled); if(!bs.length) return ''; const b=bs[Math.floor(Math.random()*bs.length)]; const t=(b.textContent||'').slice(0,16); b.click(); return t; }));
          else if (t<.84) await p.evaluate(()=>{ try{ isl ? closeIsland() : openIsland(); }catch(e){ throw e; } });
          else if (t<.88) await p.evaluate(()=>{ const tabs=[...document.querySelectorAll('#tabs button')].map(x=>x.dataset.tab).filter(Boolean); openTab(tabs[Math.floor(Math.random()*tabs.length)]); });
          else if (t<.91) await p.evaluate(()=>{ try{ openEnglishGame(); }catch(e){ throw e; } });
          else if (t<.94) await p.evaluate(()=>{ try{ openDecor(); }catch(e){ throw e; } });
          else if (t<.96) await p.evaluate(()=>{ try{ startGhostHunt(); }catch(e){ throw e; } });
          else await p.mouse.move(R()*w, R()*h);
          if (R()<.08) await p.waitForTimeout(80);
        } catch(e) { if (!/Execution context|Target closed|detached/.test(e.message)) errs.push('fuzz-step: '+e.message.slice(0,120)); }
      }
      if (await p.evaluate(()=>typeof openIsland!=='function').catch(()=>true)) { errs.push('頁面被重新載入或載入不完整'); }
      const alive = await p.evaluate(()=>{ try { saveGame(); const k=Object.keys(localStorage).find(k=>/^myHouseGame_v1(:p1)?$/.test(k)); return !!normalizeSave(JSON.parse(localStorage.getItem(k))) && SAVE_LOCKED==null; } catch(e){ return 'ERR '+e.message; } });
      if (errs.length || alive!==true) bad++;
      console.log('seed', seed, name, errs.length ? '❌ '+[...new Set(errs)].slice(0,4).join(' | ') : '✅', alive===true?'':'存檔:'+alive);
      await ctx.close();
    }
  }
  console.log(bad ? '有問題 '+bad : '全部通過'); await b.close();
})();
