<script>(function(){
  var fails=[], errs=[], seen={}, places={}, npcSaid=0, gal0=0;
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });
  var DAYS = 60;
  function spot(k){ var g=document.querySelector('.spot[data-spot="'+k+'"]'); if(!g){fails.push('地圖上找不到 '+k); return null;} return g; }

  try {
    localStorage.clear();
    gal0 = seenTotal();

    // ① 同一天重算多次，拿到的必須是同一件事
    todayStamp = function(){ return '2026-9-14'; };
    var a = todayEvent();
    for (var i=0;i<20;i++){
      var b = todayEvent();
      if (b.place!==a.place || b.id!==a.id){ fails.push('同一天算出不同的事：'+a.place+'/'+a.id+' vs '+b.place+'/'+b.id); break; }
    }

    // ② 不同日期要會換（60 天裡至少要出現多種）
    for (var d=1; d<=DAYS; d++){
      todayStamp = (function(dd){ return function(){ return '2026-10-'+dd; }; })(d);
      var e = todayEvent();
      seen[e.id]=(seen[e.id]||0)+1; places[e.place]=(places[e.place]||0)+1;
      if (PLACE_POOL[e.place].indexOf(e.id)<0) fails.push(e.id+' 不屬於 '+e.place);
    }
    if (Object.keys(seen).length < 8) fails.push(DAYS+' 天裡只出現 '+Object.keys(seen).length+' 種事，變化太少');
    // 每一篇被抽到的機會要接近——不能因為某個地點故事少就一直重複那一篇
    var counts = Object.keys(seen).map(function(k){ return seen[k]; });
    var mx = Math.max.apply(null, counts);
    if (mx > DAYS/DAY_IDS.length*3) fails.push('有一篇在 '+DAYS+' 天裡出現 '+mx+' 次，偏太多');
    if (Object.keys(places).length < 5) fails.push('只用到 '+Object.keys(places).length+' 個地點');

    // ③ 走一次完整流程：開小鎮 → 點今天的事 → 走到結局 → 回小鎮
    todayStamp = function(){ return '2026-9-14'; };
    var ev = todayEvent();
    view='town'; render();
    if(!document.querySelector('.town svg')) fails.push('小鎮沒有畫出來');
    if (isTodayDone()) fails.push('還沒做就已經標記完成');

    // 點鎮上的人
    var other = Object.keys(PLACE_POOL).filter(function(k){ return k!==ev.place && NPC[k]; })[0];
    spot(other) && spot(other).onclick();
    if(!document.querySelector('.says')) fails.push('點了鎮上的人卻沒有講話');
    else npcSaid++;

    // 點今天的事
    view='town'; townMsg=null; render();
    spot(ev.place) && spot(ev.place).onclick();
    if (view!=='story' || cur.id!==ev.id) fails.push('點今天的事沒有進到對的故事，view='+view);
    document.getElementById('go').onclick();
    var guard=0;
    while (view==='story' && guard++<40){
      var bs=document.querySelectorAll('.choice');
      if(!bs.length){ fails.push('沒有選項'); break; }
      bs[0].onclick();
    }
    if (predicting){ var g=document.getElementById('g-idk'); g && g.onclick(); }
    if (view!=='end') fails.push('沒走到結局，view='+view);
    if(!isTodayDone()) fails.push('走完今天的事，卻沒有標記完成');
    if(document.getElementById('dgo')) fails.push('從小鎮來的結局跑出「繼續今天」的按鈕');
    var back=document.getElementById('tgo');
    if(!back) fails.push('結局頁沒有「回小鎮」');
    else {
      back.onclick();
      if (view!=='town') fails.push('按了回小鎮卻沒回到小鎮');
      if (fromTown) fails.push('回到小鎮後旗標沒有清掉');
    }
    if (seenTotal() <= gal0) fails.push('小鎮玩完一篇，結局圖鑑沒有增加');

    // ④ 做完之後，今天的那個地點要變成 ✓ 而且點下去是講話不是重玩
    render();
    spot(ev.place) && spot(ev.place).onclick();
    if (view!=='town') fails.push('今天做完後再點，竟然又進了故事');

    // ⑤ 換一天，應該又有新的事
    todayStamp = function(){ return '2026-9-15'; };
    if (isTodayDone()) fails.push('換了一天卻還是顯示已完成');
  } catch(e){ errs.push('THROW '+e.message+' | '+(e.stack||'').split('\n')[1]); }

  var pre=document.createElement('pre'); pre.id='R';
  pre.textContent=[
    DAYS+' 天裡出現 '+Object.keys(seen).length+' 種事、用到 '+Object.keys(places).length+' 個地點',
    '地點分布 '+JSON.stringify(places),
    '同一天重算 20 次都一樣 '+(fails.some(function(f){return f.indexOf('同一天')>=0;})?'否':'是'),
    '鎮上的人會講話 '+(npcSaid?'是':'否'),
    '失敗 '+fails.length, 'JS 錯誤 '+errs.length, '',
    fails.concat(errs).slice(0,12).join('\n')
  ].join('\n');
  document.body.innerHTML=''; document.body.appendChild(pre);
})();</script>
