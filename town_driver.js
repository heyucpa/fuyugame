<script>(function(){
  var fails=[], errs=[], seen={}, places={}, quiet=0, wx={}, said=0;
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });
  var TODS=['morning','day','dusk','night'], DAYS=40;
  function spot(k){ var g=document.querySelector('.spot[data-spot="'+k+'"]'); if(!g){fails.push('地圖上找不到 '+k);} return g; }
  function setDay(d){ todayStamp=function(){ return '2026-10-'+d; }; }
  function setTodStub(t){ todNow=function(){ return t; }; }

  try {
    localStorage.clear();
    var gal0 = seenTotal();

    // ① 同一天同一個時段，算幾次都要一樣
    setDay(1); setTodStub('day');
    var a = periodEvent('day');
    for (var i=0;i<20;i++){
      var b = periodEvent('day');
      if (b.place!==a.place || b.id!==a.id){ fails.push('同一個時段算出不同的事'); break; }
    }
    // ② 同一天不同時段，要是不同的事（至少不會四段全同）
    var ids = TODS.map(function(t){ return periodEvent(t).id; });
    if (ids.filter(function(x){return x;}).length && new Set(ids).size===1)
      fails.push('同一天四個時段給的是同一件事');

    // ③ 40 天 × 4 時段：變化夠、分布合理、有安靜的時段
    for (var d=1; d<=DAYS; d++){
      setDay(d);
      wx[weatherToday()] = (wx[weatherToday()]||0)+1;
      TODS.forEach(function(t){
        var e = periodEvent(t);
        if (!e.id){ quiet++; return; }
        seen[e.id]=(seen[e.id]||0)+1; places[e.place]=(places[e.place]||0)+1;
        if (PLACE_OF[e.id]!==e.place) fails.push(e.id+' 的地點對不上');
      });
    }
    if (Object.keys(seen).length < 18) fails.push('只出現 '+Object.keys(seen).length+' 種事，變化太少');
    if (quiet < 10) fails.push('安靜的時段只有 '+quiet+' 個，太少了');
    if (Object.keys(wx).length < 3) fails.push('天氣只有 '+Object.keys(wx).length+' 種');

    // ④ 完整流程：開小鎮 → 點這個時段的事 → 走到結局 → 回小鎮
    setDay(1); setTodStub('day');
    var ev = periodEvent('day');
    if (!ev.id){ setTodStub('morning'); ev = periodEvent('morning'); }
    if (!ev.id){ fails.push('找不到有事的時段可以測'); }
    else {
      view='town'; render();
      if(!document.querySelector('.town svg')) fails.push('小鎮沒有畫出來');
      if (isPeriodDone()) fails.push('還沒做就標記完成');

      // 點鎮上的人，而且要能一直點下去換句子
      var other = Object.keys(PLACE_POOL).filter(function(k){ return k!==ev.place; })[0];
      var texts = {};
      for (var t=0;t<6;t++){ spot(other).onclick(); texts[document.querySelector('.says').textContent]=1; }
      said = Object.keys(texts).length;
      if (said < 3) fails.push('連點六下只出現 '+said+' 種話，沒有換句子');

      // 家裡應該輪得到三個人。家如果剛好是這個時段出事的地方，點下去會進故事，
      // 所以先換到一個「家沒有出事」的日子再測。
      var whos = {};
      for (var dd=1; dd<=40 && (periodEvent('day').place==='home' || !periodEvent('day').id); dd++) setDay(dd);
      view='town'; townMsg=null; render();
      for (var t2=0;t2<14;t2++){
        spot('home').onclick();
        var nm = document.querySelector('.says b');
        if (!nm){ fails.push('點家裡沒有人講話'); break; }
        whos[nm.textContent]=1;
      }
      ['媽媽','爸爸','妹妹'].forEach(function(w){ if(!whos[w]) fails.push('點家裡輪不到「'+w+'」'); });
      setDay(1);

      // 走這個時段的事
      view='town'; townMsg=null; render();
      spot(ev.place).onclick();
      if (view!=='story' || cur.id!==ev.id) fails.push('點了沒進到對的故事');
      else {
        document.getElementById('go').onclick();
        var guard=0;
        while (view==='story' && guard++<40){
          var bs=document.querySelectorAll('.choice');
          if(!bs.length){ fails.push('沒有選項'); break; }
          bs[0].onclick();
        }
        if (predicting){ var g=document.getElementById('g-idk'); g && g.onclick(); }
        if (view!=='end') fails.push('沒走到結局');
        if(!isPeriodDone()) fails.push('走完卻沒有標記這個時段完成');
        var back=document.getElementById('tgo');
        if(!back) fails.push('結局頁沒有「回小鎮」');
        else { back.onclick(); if (view!=='town') fails.push('沒回到小鎮'); }
        if (seenTotal() <= gal0) fails.push('玩完一篇，結局圖鑑沒有增加');

        // ⑤ 做完之後，那個人要講「剛才那件事」
        townMsg=null; render();
        spot(ev.place).onclick();
        if (view!=='town') fails.push('做完後再點竟然又進了故事');

        // ⑥ 換一個時段要重置
        var nxt = TODS[(TODS.indexOf('day')+1)%4];
        setTodStub(nxt);
        if (isPeriodDone()) fails.push('換了時段卻還顯示已完成');
      }
    }

    // ⑦ 小鎮會跟著圖鑑長大
    var st0 = townStage();
    var all={}; SCENARIOS.forEach(function(s){ all[s.id]={}; Object.keys(s.endings).forEach(function(k){ all[s.id][k]=1; }); });
    localStorage.setItem(pKey('ends'), JSON.stringify(all));
    if (townStage() <= st0) fails.push('圖鑑蒐集滿了，小鎮階段卻沒有變（'+st0+' → '+townStage()+'）');
  } catch(e){ errs.push('THROW '+e.message+' | '+(e.stack||'').split('\n')[1]); }

  var pre=document.createElement('pre'); pre.id='R';
  pre.textContent=[
    DAYS+' 天 × 4 時段：出現 '+Object.keys(seen).length+' 種事、'+quiet+' 個時段沒事',
    '地點分布 '+JSON.stringify(places),
    '天氣分布 '+JSON.stringify(wx),
    '連點六下出現 '+said+' 種話',
    '小鎮階段 0 → '+townStage(),
    '失敗 '+fails.length, 'JS 錯誤 '+errs.length, '',
    fails.concat(errs).slice(0,12).join('\n')
  ].join('\n');
  document.body.innerHTML=''; document.body.appendChild(pre);
})();</script>
