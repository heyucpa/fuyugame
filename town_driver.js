<script>(function(){
  var fails=[], errs=[], seen={}, moments={}, places={}, quiet=0, wx={}, said=0;
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });
  var TODS=['morning','day','dusk','night'], DAYS=40;
  function spot(k){ var g=document.querySelector('.spot[data-spot="'+k+'"]'); if(!g){fails.push('地圖上找不到 '+k);} return g; }
  function setDay(d){ todayStamp=function(){ return '2026-10-'+d; }; }
  function setTodStub(t){ todNow=function(){ return t; }; }
  // 找一個「這個時段剛好是 kind」的日子，回傳那一天的事件
  function findKind(kind){
    for (var d=1; d<=60; d++){
      setDay(d);
      for (var i=0;i<4;i++){
        setTodStub(TODS[i]);
        var e = periodEvent(TODS[i]);
        if (e.kind===kind) return e;
      }
    }
    return null;
  }

  try {
    localStorage.clear();
    walkMs = 0;              // 關掉走路動畫，讓點擊維持同步
    var gal0 = seenTotal();

    // ① 同一天同一個時段，算幾次都要一樣
    setDay(1); setTodStub('day');
    var a = periodEvent('day');
    for (var i=0;i<20;i++){
      var b = periodEvent('day');
      if (b.place!==a.place || b.id!==a.id || b.kind!==a.kind){ fails.push('同一個時段算出不同的事'); break; }
    }
    // ② 同一天不同時段，要是不同的事（至少不會四段全同）
    var ids = TODS.map(function(t){ return periodEvent(t).id; });
    if (ids.filter(function(x){return x;}).length && new Set(ids).size===1)
      fails.push('同一天四個時段給的是同一件事');

    // ③ 40 天 × 4 時段：三種都要出現、變化夠、分布合理
    for (var d=1; d<=DAYS; d++){
      setDay(d);
      wx[weatherToday()] = (wx[weatherToday()]||0)+1;
      TODS.forEach(function(t){
        var e = periodEvent(t);
        if (!e.kind){ quiet++; return; }
        if (e.kind==='moment'){
          moments[e.id]=(moments[e.id]||0)+1;
          var m = momentById(e.id);
          if (!m) fails.push('找不到小事 '+e.id);
          else if (m.place!==e.place) fails.push(e.id+' 的地點對不上');
        } else {
          seen[e.id]=(seen[e.id]||0)+1;
          if (PLACE_OF[e.id]!==e.place) fails.push(e.id+' 的地點對不上');
        }
        places[e.place]=(places[e.place]||0)+1;
      });
    }
    if (Object.keys(seen).length < 12) fails.push('只出現 '+Object.keys(seen).length+' 種劇本，變化太少');
    if (Object.keys(moments).length < 12) fails.push('只出現 '+Object.keys(moments).length+' 種小事，變化太少');
    // 小事要比劇本多：這個遊戲不想讓她覺得每個時段都在出事
    if (Object.keys(moments).reduce(function(s,k){return s+moments[k];},0)
        <= Object.keys(seen).reduce(function(s,k){return s+seen[k];},0))
      fails.push('小事比劇本還少，日子變得太危險了');
    if (quiet < 5) fails.push('安靜的時段只有 '+quiet+' 個，太少了');
    if (Object.keys(wx).length < 3) fails.push('天氣只有 '+Object.keys(wx).length+' 種');

    /* ③.5 四個時段、晴天跟雨天都要真的點得到。
       其他檢查都是直接呼叫 .onclick()，不會經過瀏覽器的命中測試，
       所以天色遮罩把整張地圖的點擊吃掉這種事完全驗不出來——
       真的發生過：早上、傍晚、晚上地圖全部點不動，只有白天玩得了。 */
    /* elementFromPoint 只認得「看得到的那一塊」，元素捲出畫面外就回傳 null。
       所以每次打點前都要先捲到中間，不然驗的是視窗大小，不是遮罩。 */
    function hitAt(el, fx){
      el.scrollIntoView({ block: 'center' });
      var r = el.getBoundingClientRect();
      return document.elementFromPoint(r.left + r.width * (fx === undefined ? 0.5 : fx),
                                       r.top + r.height/2);
    }
    function hitTest(label){
      view='town'; townMsg=null; curMoment=null; render();
      var g = document.querySelector('.spot[data-spot="home"]');
      if (!g) { fails.push(label+'：地圖沒畫出來'); return; }
      var el = hitAt(g);
      if (!el || !el.closest || !el.closest('.spot'))
        fails.push(label+' 點不到地點，被 <'+(el?el.tagName:'null')+'> 擋住了');
    }
    for (var wd=1; wd<=60 && weatherToday()!=='sun'; wd++) setDay(wd);
    TODS.forEach(function(t){ setTodStub(t); hitTest('晴天 '+t); });
    for (var wr=1; wr<=60 && weatherToday()!=='rain'; wr++) setDay(wr);
    setTodStub('night'); hitTest('雨天 night');

    // ④ 完整流程：開小鎮 → 點這個時段的劇本 → 走到結局 → 回小鎮
    var ev = findKind('story');
    if (!ev){ fails.push('六十天內找不到劇本時段可以測'); }
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
      var evDay = todayStamp(), evTod = todNow(), whos = {};
      for (var dd=1; dd<=60; dd++){ setDay(dd); if (periodEvent(evTod).place!=='home') break; }
      view='town'; townMsg=null; render();
      for (var t2=0;t2<14;t2++){
        spot('home').onclick();
        var nm = document.querySelector('.says b');
        if (!nm){ fails.push('點家裡沒有人講話'); break; }
        whos[nm.textContent]=1;
      }
      ['媽媽','爸爸','妹妹'].forEach(function(w){ if(!whos[w]) fails.push('點家裡輪不到「'+w+'」'); });
      todayStamp=function(){ return evDay; };   // 回到剛才那個有劇本的日子

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

        // ⑥ 做完之後還是可以繼續玩：點別的地方要有「在這裡玩一篇」
        townMsg=null; render();
        var other2 = Object.keys(PLACE_POOL).filter(function(k){ return k!==ev.place; })[0];
        spot(other2).onclick();
        var pb = document.getElementById('tplay');
        if (!pb) fails.push('做完之後沒有「在這裡玩一篇」的按鈕，她就沒得玩了');
        else {
          var before = seenTotal();
          pb.onclick();
          if (view!=='story') fails.push('按了「在這裡玩一篇」沒有進到故事');
          else if (PLACE_OF[cur.id] !== other2) fails.push('自由玩給的篇目不屬於那個地點');
          else {
            document.getElementById('go').onclick();
            var g2=0;
            while (view==='story' && g2++<40){ var b2=document.querySelectorAll('.choice'); if(!b2.length) break; b2[0].onclick(); }
            if (predicting){ var gg=document.getElementById('g-idk'); gg && gg.onclick(); }
            if (seenTotal() <= before) fails.push('自由玩玩完，圖鑑沒有增加');
            var bk=document.getElementById('tgo'); bk && bk.onclick();
          }
        }

        // ⑦ 換一個時段要重置
        setTodStub(TODS[(TODS.indexOf(evTod)+1)%4]);
        if (isPeriodDone()) fails.push('換了時段卻還顯示已完成');
      }
    }

    // ⑧ 小事的完整流程
    var mv = findKind('moment');
    if (!mv){ fails.push('六十天內找不到小事時段可以測'); }
    else {
      var galM = seenTotal();
      view='town'; townMsg=null; curMoment=null; render();
      if (document.querySelector('.town svg').innerHTML.indexOf('💭') < 0)
        fails.push('地圖上沒有 💭 記號，她不知道那裡有小事');
      spot(mv.place).onclick();
      if (view!=='moment') fails.push('點了小事沒有進到小事頁（view='+view+'）');
      else {
        if (curMoment.id !== mv.id) fails.push('進到的不是這個時段的小事');
        if (curMoment.place !== mv.place) fails.push('小事的地點跟地圖上點的不一樣');
        if (!document.querySelector('.scene svg')) fails.push('小事沒有定場圖');
        if (isPeriodDone()) fails.push('還沒選就標記完成');
        var opts = document.querySelectorAll('.choice');
        if (opts.length < 1 || opts.length > 2) fails.push('小事的選項有 '+opts.length+' 個，應該是 1～2 個');
        else {
          opts[0].onclick();
          var stages = document.querySelectorAll('.stage');
          if (stages.length < 2) fails.push('選完沒有出現回應');
          else if (!stages[1].textContent.trim()) fails.push('回應是空的');
          if (document.querySelectorAll('.choice').length) fails.push('選完了還留著選項');
          if (!isPeriodDone()) fails.push('小事做完卻沒有標記這個時段完成');
          // 小事不評分：不能進圖鑑，也不能有結局徽章
          if (seenTotal() !== galM) fails.push('小事竟然算進了結局圖鑑');
          if (document.querySelector('.badge, .lesson, .talkbox')) fails.push('小事頁出現了結局的評分區塊');
          var mb = document.getElementById('mback');
          if (!mb) fails.push('小事沒有「回小鎮」');
          else { mb.onclick(); if (view!=='town') fails.push('小事結束沒回到小鎮'); }
        }
      }
      // 做完之後那個地點的記號要變成 ✓，再點不會又進小事
      townMsg=null; render();
      spot(mv.place).onclick();
      if (view!=='town') fails.push('小事做完再點竟然又進了一次');
    }

    /* ⑨ 每天藏一個東西 */
    setDay(7); setTodStub('dusk');
    view='town'; townMsg=null; curMoment=null; render();
    var h = huntToday();
    if (!document.querySelector('.hide')) fails.push('小鎮上沒有藏東西');
    else {
      // 要真的點得到——它比名牌小很多，透明的點擊圈是唯一的保障
      /* 刻意不打正中央：正中央是那個 emoji 字本身，打得到不代表什麼。
         要打偏一點，才驗得到那顆放大的透明點擊圈——
         小孩的手指不會準準戳在 11 大的字上面。 */
      var hel = hitAt(document.querySelector('.hide'), 0.16);
      if (!hel || !hel.closest || !hel.closest('.hide'))
        fails.push('藏的東西點不到，被 <'+(hel?hel.tagName:'null')+'> 擋住了');
      // 不能跟地點搶點擊
      if (hel && hel.closest && hel.closest('.spot')) fails.push('藏的東西壓在地點上面');

      var box0 = Object.keys(loadTreasures()).length;
      document.querySelector('.hide').onclick({ stopPropagation: function(){} });
      if (view!=='town') fails.push('找到東西竟然離開了小鎮');
      if (foundToday() !== h.id) fails.push('找到的東西沒有記起來');
      if (Object.keys(loadTreasures()).length <= box0) fails.push('寶物盒沒有增加');
      if (document.querySelector('.hide')) fails.push('找到了東西還留在地圖上');
      var ht = document.querySelector('.hunt');
      if (!ht) fails.push('沒有「今天藏了東西」那一行');
      else if (ht.textContent.indexOf(treasureById(h.id).name) < 0)
        fails.push('找到之後沒有說找到的是什麼');
      if (document.querySelectorAll('.box span.on').length < 1) fails.push('寶物盒裡沒有亮起來的格子');

      // 同一天不會再長出來，換一天要有新的
      render();
      if (document.querySelector('.hide')) fails.push('同一天又冒出一個可以找');
      setDay(8); render();
      if (!document.querySelector('.hide')) fails.push('換了一天卻沒有新的東西可以找');
    }
    /* 藏的位置不能壓到名牌。那顆透明的點擊圈畫在名牌上面，
       壓到的話她想點地點會變成撿到東西——這種事眼睛看不出來，
       因為圈是透明的，只能用座標算。 */
    HIDE_SPOTS.forEach(function(p){
      PLACES.forEach(function(pl){
        var dx = Math.max(pl.plate[0]-29 - p[0], 0, p[0] - (pl.plate[0]+29));
        var dy = Math.max(pl.plate[1]-10 - p[1], 0, p[1] - (pl.plate[1]+9));
        if (Math.sqrt(dx*dx + dy*dy) < HIDE_R)
          fails.push('藏東西的位置 '+p.join()+' 壓到「'+pl.name+'」的名牌了');
      });
    });
    // 三十天要換得夠勤，位置也要會動，不然找一次就記住了
    var tids={}, tpos={};
    for (var hd=1; hd<=30; hd++){ setDay(hd); var hh=huntToday(); tids[hh.id]=1; tpos[hh.at.join()]=1; }
    if (Object.keys(tids).length < 8) fails.push('三十天只藏了 '+Object.keys(tids).length+' 種東西');
    if (Object.keys(tpos).length < 6) fails.push('三十天只藏在 '+Object.keys(tpos).length+' 個位置');

    // ⑩ 小鎮會跟著圖鑑長大
    var st0 = townStage();
    var all={}; SCENARIOS.forEach(function(s){ all[s.id]={}; Object.keys(s.endings).forEach(function(k){ all[s.id][k]=1; }); });
    localStorage.setItem(pKey('ends'), JSON.stringify(all));
    if (townStage() <= st0) fails.push('圖鑑蒐集滿了，小鎮階段卻沒有變（'+st0+' → '+townStage()+'）');
  } catch(e){ errs.push('THROW '+e.message+' | '+(e.stack||'').split('\n')[1]); }

  var pre=document.createElement('pre'); pre.id='R';
  pre.textContent=[
    DAYS+' 天 × 4 時段：劇本 '+Object.keys(seen).length+' 種、小事 '+Object.keys(moments).length+' 種、'+quiet+' 個時段沒事',
    '地點分布 '+JSON.stringify(places),
    '天氣分布 '+JSON.stringify(wx),
    '連點六下出現 '+said+' 種話',
    '小鎮階段 0 → '+townStage(),
    '失敗 '+fails.length, 'JS 錯誤 '+errs.length, '',
    fails.concat(errs).slice(0,12).join('\n')
  ].join('\n');
  document.body.innerHTML=''; document.body.appendChild(pre);
})();</script>
