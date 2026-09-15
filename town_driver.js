<script>(function(){
  var fails=[], errs=[], seen={}, moments={}, places={}, quiet=0, wx={}, said=0;
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });
  var TODS=['morning','day','dusk','night'], DAYS=40;
  function spot(k){ var g=document.querySelector('.spot[data-spot="'+k+'"]'); if(!g){fails.push('地圖上找不到 '+k);} return g; }
  function setDay(d){ todayStamp=function(){ return '2026-10-'+d; }; }
  function setTodStub(t){ todNow=function(){ return t; }; }
  // 藏東西是十分鐘換一輪，走查不可能真的等——把「現在幾分」換掉
  function setMin(m){ nowMin=function(){ return m; }; }
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

  function showSayNull(){ townMsg = null; }

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
      if (!document.querySelector('.saybox').hidden) fails.push('還沒點人，講話框就開著');
      var texts = {};
      for (var t=0;t<6;t++){ spot(other).onclick(); texts[document.querySelector('.says').textContent]=1; }
      said = Object.keys(texts).length;
      if (said < 3) fails.push('連點六下只出現 '+said+' 種話，沒有換句子');

      /* 講話框要浮在地圖上面、而且點一下就關。
         在地圖下面的話整頁會被推下去，她的眼睛要一路跳到畫面最底下。 */
      var sb = document.querySelector('.saybox'), tw = document.querySelector('.townwrap');
      if (!tw || !tw.contains(sb)) fails.push('講話框不在地圖那一塊裡面，會把版面推下去');
      if (getComputedStyle(sb).position !== 'absolute') fails.push('講話框不是浮在地圖上面的');
      sb.onclick();
      if (!sb.hidden) fails.push('點了講話框卻沒有關起來');
      // 關掉之後再點同一個人，要接著講下一句，不是從頭來
      spot(other).onclick();
      var again = document.querySelector('.says').textContent;
      if (texts[again] && Object.keys(texts).length > 1 && again === Object.keys(texts)[0])
        fails.push('關掉再點又從第一句開始講');

      /* 點人不可以重畫整張卡片：.card.anim 的淡入會跟著重播一次，
         畫面就閃一下。用「卡片還是不是同一個節點」來驗。 */
      view='town'; showSayNull(); render();
      var card0 = document.querySelector('.card'), svg0 = document.querySelector('.town svg');
      spot(other).onclick();
      if (document.querySelector('.card') !== card0) fails.push('點一下人整張卡片就重畫了，畫面會閃');
      if (document.querySelector('.town svg') !== svg0) fails.push('點一下人連地圖都重畫了');

      // 家裡應該輪得到三個人。家如果剛好是這個時段出事的地方，點下去會進故事，
      // 所以先換到一個「家沒有出事」的日子再測。
      var evDay = todayStamp(), evTod = todNow(), whos = {};
      for (var dd=1; dd<=60; dd++){ setDay(dd); if (periodEvent(evTod).place!=='home') break; }
      view='town'; townMsg=null; render();
      /* 點 40 下而不是 14 下：家裡的句子池本來是 15 句，但點到第 12 下
         會解鎖「變熟」的句子，池子中途變大、索引整個位移，
         14 下就有可能剛好跳過某一個人。這是走查不夠穩，不是程式的問題。 */
      for (var t2=0;t2<40;t2++){
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
          pb.onclick({ stopPropagation: function(){} });
          if (view!=='story') fails.push('按了「在這裡玩一篇」沒有進到故事');
          else if (PLACE_OF[cur.id] !== other2) fails.push('自由玩給的篇目不屬於那個地點');
          else {
            document.getElementById('go').onclick();
            var g2=0;
            while (view==='story' && g2++<40){ var b2=document.querySelectorAll('.choice'); if(!b2.length) break; b2[0].onclick(); }
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

    /* ⑨ 每十分鐘藏一個東西 */
    setDay(7); setTodStub('dusk'); setMin(9 * 60 + 3);   // 09:03，離換輪還有 7 分鐘
    view='town'; townMsg=null; curMoment=null; render();
    var h = huntNow();
    if (huntLeft() !== 7) fails.push('「還有幾分鐘換」算錯了：' + huntLeft());
    if (!document.querySelector('.hide') || !document.querySelector('.hide').innerHTML)
      fails.push('小鎮上沒有藏東西');
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
      var hcard = document.querySelector('.card');
      if (!document.querySelector('.foundbox').hidden) fails.push('還沒撿到，慶祝的框就開著');
      document.querySelector('.hide').onclick({ stopPropagation: function(){} });
      if (document.querySelector('.card') !== hcard) fails.push('撿到東西整張卡片就重畫了，畫面會閃');

      /* 撿到的那一刻要把東西放到畫面中間。
         本來只是「東西消失 + 下面那行換字」，撿到跟沒撿到幾乎沒差別。 */
      var fb = document.querySelector('.foundbox');
      if (fb.hidden) fails.push('撿到東西沒有跳出慶祝的框');
      else {
        if (getComputedStyle(fb).position !== 'absolute')
          fails.push('慶祝的框不是浮在地圖上面的，會把版面推下去');
        if (!document.querySelector('.townwrap').contains(fb))
          fails.push('慶祝的框不在地圖那一塊裡面');
        var ft = fb.textContent;
        if (ft.indexOf(treasureById(h.id).name) < 0) fails.push('慶祝的框沒有寫是什麼東西');
        if (ft.indexOf(treasureById(h.id).line) < 0) fails.push('慶祝的框沒有那一句說明');
        if (fb.querySelectorAll('.spark').length < 4) fails.push('沒有撒星星');
        if (!fb.querySelector('.femo')) fails.push('沒有把那個東西放大');
        // 普通的不該有祝福，祝福是稀有的專屬
        if (!treasureById(h.id).rare && fb.querySelector('.bless'))
          fails.push('普通的寶物也給了祝福，稀有就不特別了');
        fb.onclick();
        if (!fb.hidden) fails.push('點了慶祝的框卻關不掉');
      }
      if (view!=='town') fails.push('找到東西竟然離開了小鎮');
      if (foundNow() !== h.id) fails.push('找到的東西沒有記起來');
      if (foundCountToday() < 1) fails.push('今天找到幾個沒有加上去');
      if (Object.keys(loadTreasures()).length <= box0) fails.push('寶物盒沒有增加');
      if (document.querySelector('.hide').innerHTML) fails.push('找到了東西還留在地圖上');
      var ht = document.querySelector('.hunt');
      if (!ht) fails.push('沒有「藏了東西」那一行');
      else {
        if (ht.textContent.indexOf(treasureById(h.id).name) < 0)
          fails.push('找到之後沒有說找到的是什麼');
        if (ht.textContent.indexOf('分鐘') < 0) fails.push('沒有告訴她再幾分鐘會換新的');
      }
      // 小鎮那一行只放一顆按鈕（六十樣排不進去），細節在寶物圖鑑那一頁
      var bb = document.getElementById('tbox');
      if (!bb) fails.push('沒有進寶物圖鑑的按鈕');
      else {
        if (bb.textContent.indexOf('/ ' + TREASURES.length) < 0 || !/[1-9]\d* \//.test(bb.textContent))
          fails.push('按鈕上的收集數不對：' + bb.textContent);
        bb.onclick();
        if (view !== 'box') fails.push('按了寶物圖鑑沒有進去');
        else {
          var cells = document.querySelectorAll('.tcell');
          if (cells.length !== TREASURES.length)
            fails.push('圖鑑格子數 ' + cells.length + '，應該是 ' + TREASURES.length);
          if (document.querySelectorAll('.gal h3').length !== TREASURE_GROUPS.length)
            fails.push('圖鑑的分類數不對');
          if (document.querySelectorAll('.tcell:not(.lock)').length < 1)
            fails.push('撿到了東西，圖鑑卻一格都沒開');
          if (document.querySelectorAll('.tcell.lock').length < 1)
            fails.push('還沒撿的應該要是問號，不能先透露');
          // 沒撿過的不可以洩漏名字
          var locked = document.querySelector('.tcell.lock');
          if (locked && locked.textContent.trim() !== '❓') fails.push('沒撿過的格子透露了內容');
          if (document.body.textContent.indexOf(treasureById(h.id).name) < 0)
            fails.push('圖鑑裡找不到剛剛撿到的那一樣');
          document.getElementById('box-town').onclick();
          if (view !== 'town') fails.push('寶物圖鑑回不去小鎮');
        }
      }

      // 同一輪不會再長出來
      render();
      if (document.querySelector('.hide').innerHTML) fails.push('同一輪又冒出一個可以找');

      /* 過了十分鐘要自己換一個新的，而且不能重畫整張卡片。
         她可能一直開著這一頁，不會重新整理。 */
      var card1 = document.querySelector('.card'), svg1 = document.querySelector('.town svg');
      setMin(9 * 60 + 13);                       // 跳到下一輪
      if (!huntTimer) fails.push('沒有掛十分鐘換一輪的計時器');
      huntTimerFn();                             // 直接叫一次，不用真的等
      if (!document.querySelector('.hide').innerHTML) fails.push('過了十分鐘卻沒有換新的東西');
      if (document.querySelector('.card') !== card1) fails.push('換一輪整張卡片就重畫了，畫面會閃');
      if (document.querySelector('.town svg') !== svg1) fails.push('換一輪連地圖都重畫了');

      // 新的那一輪要是還沒找到的狀態
      if (foundNow()) fails.push('換了一輪還算成已經找到');
    }

    /* ===== 池塘釣魚、花圃挖土 =====
       跟藏的東西是兩件事：那個是「找」，這兩個是「做」。
       所以最要緊的是兩邊不能互相污染——魚不可以出現在草地上，
       釣到一條魚也不可以算成「今天藏的那一個找到了」。 */
    // 兩個池子各自獨立，草地上的袋子裡不可以有魚跟土裡挖出來的東西
    var leaked = TREASURE_BAG.filter(function(t){ return t.src; });
    if (leaked.length) fails.push('草地上會撿到 '+leaked[0].name+'（'+leaked[0].src+' 的東西跑進抽獎袋了）');
    Object.keys(ACTS).forEach(function(k){
      var bag = ACT_BAG[k];
      if (!bag || !bag.length) { fails.push(k+' 沒有東西可以拿'); return; }
      if (bag.some(function(t){ return t.src !== k; })) fails.push(k+' 的池子裡混到別類的東西');
      if (!TREASURES.some(function(t){ return t.src === k && t.rare; })) fails.push(k+' 一樣稀有的都沒有');
    });
    /* 同一個三分鐘裡算幾次都要同一樣（不然她按兩下會看到兩種答案），
       但一直換時段就要抽得夠散、稀有的也要真的稀有。 */
    setDay(7); setMin(9*60+13);
    var aFirst = actNow('fish');
    for (var ai=0; ai<10; ai++) if (actNow('fish').id !== aFirst.id) { fails.push('同一輪釣到不同的魚'); break; }
    Object.keys(ACTS).forEach(function(k){
      var got={}, rare=0, N=240;
      for (var n=0; n<N; n++){ setDay(7 + Math.floor(n/480)); setMin(n*3 % 1440);
        var t = actNow(k); got[t.id]=1; if (t.rare) rare++; }
      if (Object.keys(got).length < 8) fails.push(k+' 連 '+N+' 輪只拿到 '+Object.keys(got).length+' 種');
      if (!rare) fails.push(k+' 連 '+N+' 輪一次稀有的都沒有');
      if (rare > N * 0.15) fails.push(k+' 的稀有出現了 '+Math.round(rare/N*100)+'%，根本不稀有');
    });
    /* 點擊圈放大了就會開始搶名牌跟藏東西的點擊。
       公園的池塘本來就壓在 HIDE_SPOTS 的 [176,70] 上，那一格已經搬到 [124,64]。 */
    ACT_SPOTS.forEach(function(a){
      PLACES.forEach(function(pl){
        var dx = Math.max(pl.plate[0]-29 - a.at[0], 0, a.at[0] - (pl.plate[0]+29));
        var dy = Math.max(pl.plate[1]-10 - a.at[1], 0, a.at[1] - (pl.plate[1]+9));
        if (Math.sqrt(dx*dx + dy*dy) < ACT_R)
          fails.push(a.key+' 壓到「'+pl.name+'」的名牌了');
      });
      HIDE_SPOTS.forEach(function(p){
        if (Math.hypot(p[0]-a.at[0], p[1]-a.at[1]) < ACT_R + HIDE_R)
          fails.push(a.key+' 跟藏東西的位置 '+p.join()+' 重疊了');
      });
      if (!PLACES.some(function(pl){ return pl.key === a.place; })) fails.push(a.key+' 掛在不存在的地點');
    });

    setDay(7); setMin(9*60+13);
    view='town'; townMsg=null; render();
    if (document.querySelectorAll('.act').length !== ACT_SPOTS.length)
      fails.push('地圖上沒有畫出池塘跟花圃');
    else {
      /* 池塘與花圃畫在居民後面，蓋到誰就是誰不見。
         踩過兩次：池塘蓋掉熊伯伯的頭（變成一個沒有頭的身體）、
         花圃蓋在爸爸頭上（像戴了一頂土色的帽子）。
         人跟動物都是「有兩顆以上圓形的 <g>」——樹跟花只有一顆，不會誤判。 */
      var folk = [];
      document.querySelectorAll('.spot g[transform], #walker g[transform]').forEach(function(g){
        if (g.querySelectorAll('circle').length >= 2) folk.push(g);
      });
      if (folk.length < 6) fails.push('抓不到鎮上的人（只找到 '+folk.length+' 個），這一關等於沒驗');
      document.querySelectorAll('.act').forEach(function(ag){
        var a = ag.getBoundingClientRect();
        folk.forEach(function(g){
          var b = g.getBoundingClientRect();
          var ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          var oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox > 1 && oy > 1) fails.push(ag.dataset.act+' 蓋到鎮上的人了（重疊 '+
            Math.round(ox)+'×'+Math.round(oy)+' px）');
        });
      });
      // 一樣要打偏一點：打正中央只證明那個 emoji 點得到，證明不了放大的點擊圈
      var ael = hitAt(document.querySelector('.act[data-act="fish"]'), 0.16);
      if (!ael || !ael.closest || !ael.closest('.act'))
        fails.push('池塘點不到，被 <'+(ael?ael.tagName:'null')+'> 擋住了');
      if (ael && ael.closest && ael.closest('.spot')) fails.push('池塘壓在地點上面，點下去會變成跟居民講話');

      var acard = document.querySelector('.card'), asvg = document.querySelector('.town svg');
      var abox0 = Object.keys(loadTreasures()).length;
      var hunt0 = foundNow(), day0 = foundCountToday();
      var fishT = actNow('fish');
      document.querySelector('.act[data-act="fish"]').onclick({ stopPropagation: function(){} });

      if (document.querySelector('.card') !== acard) fails.push('釣一次魚整張卡片就重畫了，畫面會閃');
      if (document.querySelector('.town svg') !== asvg) fails.push('釣一次魚連地圖都重畫了');
      if (Object.keys(loadTreasures()).length <= abox0) fails.push('釣到的東西沒有進寶物盒');
      if (!loadTreasures()[fishT.id]) fails.push('進寶物盒的不是剛剛釣到的那一樣');
      // 這兩行是重點：釣魚不可以順手把「今天藏的那一個」算成找到了
      if (foundNow() !== hunt0) fails.push('釣魚竟然把地上藏的那一個也算成找到了');
      if (foundCountToday() !== day0) fails.push('釣魚被算進「今天找到幾個」');

      var afb = document.querySelector('.foundbox');
      if (afb.hidden) fails.push('釣到東西沒有跳出慶祝的框');
      else {
        if (afb.textContent.indexOf(fishT.name) < 0) fails.push('慶祝的框沒寫釣到什麼');
        if (!afb.querySelector('.fwhat')) fails.push('沒有寫這是釣到的還是挖到的');
        else if (afb.querySelector('.fwhat').textContent.indexOf('釣') < 0)
          fails.push('釣到的卻寫成別的：'+afb.querySelector('.fwhat').textContent);
        afb.onclick();
      }
      // 做完要看得出來，不然她會一直按同一個地方
      var fg = document.querySelector('.act[data-act="fish"]');
      if (!fg.getAttribute('opacity')) fails.push('釣過了池塘卻沒有壓暗，她會一直按');
      // 花圃是另一個冷卻，不可以被池塘連坐
      if (document.querySelector('.act[data-act="dig"]').getAttribute('opacity'))
        fails.push('釣了魚連花圃也一起冷卻了');

      // 冷卻中還是要接得到點擊，而且要講「再幾分鐘」
      var abox1 = Object.keys(loadTreasures()).length;
      var cnt1 = loadTreasures()[fishT.id];
      fg.onclick({ stopPropagation: function(){} });
      if (loadTreasures()[fishT.id] !== cnt1 || Object.keys(loadTreasures()).length !== abox1)
        fails.push('三分鐘還沒到就又釣到一條');
      var sb = document.querySelector('.saybox');
      if (sb.hidden || sb.textContent.indexOf('分鐘') < 0)
        fails.push('冷卻中按下去沒有告訴她還要等幾分鐘');

      // 三分鐘過了要自己點亮，不能等她離開小鎮再回來
      var acard2 = document.querySelector('.card');
      setMin(9*60 + 17);
      huntTimerFn();
      if (document.querySelector('.act[data-act="fish"]').getAttribute('opacity'))
        fails.push('過了三分鐘池塘還是暗的');
      if (document.querySelector('.card') !== acard2) fails.push('冷卻結束整張卡片就重畫了');
      // 點亮之後真的釣得到，而且是新的一輪、新的東西
      var abox2 = Object.keys(loadTreasures()).length;
      document.querySelector('.act[data-act="fish"]').onclick({ stopPropagation: function(){} });
      if (Object.keys(loadTreasures()).length < abox2 &&
          !loadTreasures()[actNow('fish').id]) fails.push('冷卻結束後釣不到東西');
      document.querySelector('.foundbox').onclick();
    }
    localStorage.clear();

    /* 按日期命名的 key 會一直長，而且永遠沒人刪。
       一年下來一個玩家大約七千個，兩個玩家一萬四。 */
    setDay(20);
    var junk = ['theater-hunt-2026-10-19#5:p1', 'theater-hunt-2026-10-2#7:p1',
                'theater-town-2026-10-19-dusk:p1', 'theater-huntday-2026-10-19:p1',
                'theater-act-fish-2026-10-19#182:p1', 'theater-act-dig-2026-10-19#182:p1',
                // 這一個是陷阱：今天是 2026-10-2 的話，用 indexOf 比會把它當成今天
                'theater-hunt-2026-10-200#1:p1'];
    var keepers = ['theater-hunt-2026-10-20#5:p1', 'theater-town-2026-10-20-dusk:p1',
                   'theater-huntday-2026-10-20:p1', 'theater-treasures:p1', 'theater-ends:p1',
                   'theater-act-fish-2026-10-20#182:p1'];
    junk.concat(keepers).forEach(function(k){ localStorage.setItem(k, '1'); });
    sweepOldKeys();
    junk.forEach(function(k){ if (localStorage.getItem(k)) fails.push('舊的 key 沒被掃掉：'+k); });
    keepers.forEach(function(k){ if (!localStorage.getItem(k)) fails.push('不該掃的被掃掉了：'+k); });

    /* 「清除紀錄」按鈕上寫的是「所有紀錄」，那就要真的全部——
       以前只清 progress/seen/ends，按完寶物盒跟熟悉度都還在。 */
    ['theater-ends:p1','theater-treasures:p1','theater-friend:p1',
     'theater-progress:p1','theater-town-2026-10-20-dusk:p1',
     'theater-ends:p2'].forEach(function(k){ localStorage.setItem(k, '1'); });
    // 要按真的那顆按鈕，不是直接叫 wipePlayer——不然改壞按鈕這一關也驗不出來
    var realConfirm = window.confirm;
    window.confirm = function(){ return true; };
    view='menu'; render();
    var rb = document.getElementById('reset');
    if (!rb) fails.push('選單上沒有「清除紀錄」');
    else rb.onclick();
    window.confirm = realConfirm;
    ['theater-ends:p1','theater-treasures:p1','theater-friend:p1',
     'theater-progress:p1','theater-town-2026-10-20-dusk:p1'].forEach(function(k){
      if (localStorage.getItem(k)) fails.push('清除紀錄沒有清掉 '+k);
    });
    if (!localStorage.getItem('theater-ends:p2')) fails.push('清除紀錄把別的玩家也清掉了');
    localStorage.clear();

    /* 除了家人以外，鎮上的居民都要是動物。
       家人不能換：那三個對應的是她生活裡真正的人，
       而且「妹妹被欺負了」「妹妹不見了」那兩篇裡也是同一個。 */
    var ZOO = ['兔', '貓', '熊', '獅', '企鵝'];
    Object.keys(NPC).forEach(function(k){
      NPC[k].forEach(function(p){
        var isZoo = ZOO.some(function(z){ return p.who.indexOf(z) >= 0; });
        if (k === 'home') {
          if (isZoo) fails.push('家裡的「'+p.who+'」被換成動物了，家人要維持人類');
        } else if (!isZoo) {
          fails.push('「'+k+'」的「'+p.who+'」還是人，鎮上的居民要是動物');
        }
      });
    });
    // 這兩種是指定要有的
    var whoAll = Object.keys(NPC).map(function(k){
      return NPC[k].map(function(p){ return p.who; }).join(''); }).join('');
    if (whoAll.indexOf('企鵝') < 0) fails.push('鎮上沒有企鵝');
    if (whoAll.indexOf('兔') < 0) fails.push('鎮上沒有兔子');
    // 小事的內文不能還留著舊的人類稱呼
    MOMENTS.forEach(function(m){
      var all = m.text + m.choices.map(function(c){ return c.label + c.reply; }).join('');
      if (/警衛伯伯|店員阿姨/.test(all)) fails.push(m.id+' 還留著舊的稱呼（警衛伯伯／店員阿姨）');
    });

    /* 稀有寶物要附一段家人的祝福，而且給祝福的人不能是她自己。
       八樣稀有的東西，姊姊玩應該輪到媽咪／爸比／妹妹三種。 */
    ['big', 'little', 'only'].forEach(function(role){
      savePlayers(players().map(function(p){
        return p.id === whoId() ? Object.assign({}, p, { role: role }) : p; }));
      var seen = {}, sibWord = ROLES[role].sib;
      TREASURES.filter(function(t){ return t.rare; }).forEach(function(t){
        for (var m = 0; m < 60; m++) {
          setDay(3 + Math.floor(m / 6)); setMin((m % 6) * 10 + 1);
          var b = blessingFor(t);
          seen[b.who] = 1;
          if (!b.text || !b.title) fails.push(role + '：' + t.id + ' 的祝福是空的');
          // 她自己不會祝福她自己
          if (b.title.indexOf(ROLES[role].label) === 0)
            fails.push(role + '：祝福竟然來自她自己（' + b.title + '）');
          if (role === 'only' && b.who === 'sib')
            fails.push('沒有兄弟姊妹的玩家收到了手足的祝福');
          if (b.who === 'sib' && b.title.indexOf(sibWord) < 0)
            fails.push(role + '：手足的祝福稱呼不對（' + b.title + '，應該是' + sibWord + '）');
        }
      });
      if (role === 'only') {
        if (seen.sib) fails.push('沒有兄弟姊妹卻抽到手足');
        if (!seen.mom || !seen.dad) fails.push('only：媽咪跟爸比沒有都出現');
      } else {
        ['mom','dad','sib'].forEach(function(k){
          if (!seen[k]) fails.push(role + '：祝福裡從來沒出現過 ' + k);
        });
      }
    });
    // 測完把角色還原
    savePlayers(players().map(function(p){
      return p.id === whoId() ? Object.assign({}, p, { role: 'big' }) : p; }));

    /* 點到沒有東西的地方（草地、樹、天空）也要有反應。
       這個鎮如果只有六個地方會回應，她點兩下就再也不看別的地方了。 */
    setDay(3); setTodStub('day'); setMin(9 * 60);
    view='town'; townMsg=null; curMoment=null; render();
    var svg = document.querySelector('.town svg');
    if (!svg || !svg.onclick) fails.push('點小鎮的空白處沒有任何反應');
    else {
      var idle = {};
      for (var q=0; q<8; q++){
        svg.onclick({ target: svg });
        var sy = document.querySelector('.saybox');
        if (sy.hidden) { fails.push('點空白處沒有出現任何一句話'); break; }
        idle[document.querySelector('.says').textContent] = 1;
      }
      if (Object.keys(idle).length < 4)
        fails.push('點空白處八下只有 '+Object.keys(idle).length+' 種話，太少了');
      // 閒聊不是地點，不該出現「在這裡玩一篇」
      if (document.getElementById('tplay')) fails.push('點空白處竟然出現了「在這裡玩一篇」');
      document.querySelector('.saybox').onclick();
    }

    /* ❗ 和 💭 要會動（一年級需要視覺引導），✓ 和 💬 不要動——
       六個名牌都在動會很吵，就看不出哪一個才是現在要點的。 */
    var mv2 = findKind('story');
    if (mv2) {
      view='town'; townMsg=null; curMoment=null; render();
      var mapHtml = document.querySelector('.town svg').innerHTML;
      /* 不要比對標籤的寫法：瀏覽器會把 <circle/> 吐成 <circle></circle>，
         第一版的正則就是因為這樣一直誤報。改成看記號前面那一小段。 */
      function animated(mark){
        var k = mapHtml.indexOf('>' + mark + '<');
        if (k < 0) return null;
        return mapHtml.slice(Math.max(0, k - 200), k).indexOf('class="bob"') >= 0;
      }
      if (animated('❗') === null) fails.push('這個時段有劇本，地圖上卻沒有 ❗');
      else if (!animated('❗')) fails.push('❗ 記號沒有動畫，她看不出來現在要點哪裡');
      if (animated('💬') === true) fails.push('💬 也在動，六個一起浮動會很吵');
    }

    /* 提示分三段，越找不到給越多：
         剩 10～6 分鐘　什麼都沒有
         剩 5～3 分鐘　 講出大概在哪一帶
         剩 2 分鐘以內　那個東西一閃一閃（最後一定找得到，不會白費一輪） */
    setDay(3);
    function huntAt(min){
      setMin(9 * 60 + min); view='town'; townMsg=null; render();
      return { txt: document.querySelector('.hunt').textContent,
               blink: document.querySelector('.hide').innerHTML.indexOf('twinkle') >= 0,
               stage: huntStage() };
    }
    var st0 = huntAt(1);    // 還有 9 分鐘
    if (st0.stage !== 0) fails.push('剛開始的提示階段算錯了：'+st0.stage);
    if (st0.txt.indexOf('提示') >= 0) fails.push('才剛開始就給提示，找的樂趣沒了');
    if (st0.blink) fails.push('才剛開始就在閃了');

    var st1 = huntAt(6);    // 只剩 4 分鐘
    if (st1.stage !== 1) fails.push('過了一半的提示階段算錯了：'+st1.stage);
    if (st1.txt.indexOf('提示') < 0) fails.push('過了一半還沒給範圍提示');
    else {
      var near = huntNear(huntNow()).name;
      if (st1.txt.indexOf(near) < 0) fails.push('提示給的地點不對，應該是「'+near+'」');
    }
    if (st1.blink) fails.push('才剩四分鐘就開始閃了，太早');

    var st2 = huntAt(9);    // 只剩 1 分鐘
    if (st2.stage !== 2) fails.push('最後的提示階段算錯了：'+st2.stage);
    if (!st2.blink) fails.push('最後兩分鐘那個東西沒有一閃一閃');
    if (st2.txt.indexOf('一閃') < 0) fails.push('開始閃了，但那一行沒有告訴她');

    /* 她會一直開著這一頁不重新整理，所以「開始閃」要由計時器自己接手。
       這裡直接叫計時器，不重畫整頁——不然驗到的是 render()，不是計時器。 */
    setMin(9 * 60 + 1); view='town'; townMsg=null; render();   // 先停在還沒提示的階段
    var card2 = document.querySelector('.card');
    setMin(9 * 60 + 9);                                        // 時間走到只剩 1 分鐘
    huntTimerFn();
    if (document.querySelector('.hide').innerHTML.indexOf('twinkle') < 0)
      fails.push('時間到了但畫面沒有自己開始閃，她要重新整理才看得到');
    if (document.querySelector('.hunt').textContent.indexOf('提示') < 0)
      fails.push('時間到了但那一行沒有跟著更新');
    if (document.querySelector('.card') !== card2)
      fails.push('換提示階段整張卡片就重畫了，畫面會閃');

    // 找到之後就不該再閃（東西已經不在地圖上了）
    document.querySelector('.hide').onclick({ stopPropagation: function(){} });
    if (document.querySelector('.hide').innerHTML) fails.push('找到了還留在地圖上');
    localStorage.removeItem(huntKey());

    /* 劇本選單照地點分組之後，每一篇都必須在選單上出現得到。
       漏掉一篇的話她從選單永遠點不到那一個故事。 */
    view='menu'; render();
    var onMenu = {};
    document.querySelectorAll('.pick[data-id]').forEach(function(b){ onMenu[b.dataset.id]=1; });
    SCENARIOS.forEach(function(sc){
      if (!onMenu[sc.id]) fails.push('「'+sc.title+'」沒有出現在劇本選單上');
    });
    if (document.querySelectorAll('.pick[data-id]').length !== SCENARIOS.length)
      fails.push('選單上的篇數對不上：'+document.querySelectorAll('.pick[data-id]').length+
                 ' vs '+SCENARIOS.length);

    /* 新增一篇劇本卻忘了排進 PLACE_POOL 的話，它在小鎮裡永遠不會出現，
       而且完全沒有錯誤訊息——只有從選單進去才玩得到。 */
    SCENARIOS.forEach(function(sc){
      if (!PLACE_OF[sc.id]) fails.push('「'+sc.title+'」沒有排進任何地點，小鎮裡永遠遇不到');
    });
    Object.keys(PLACE_OF).forEach(function(id){
      if (!SCENARIOS.some(function(sc){ return sc.id===id; }))
        fails.push(id+' 排進了地點池，但找不到這篇劇本');
    });

    /* 六個地點每個都要有跟妹妹一起的小事。
       妹妹本來只出現在家裡，其他五個地方她完全不在——
       但現實裡姊姊去哪都帶著妹妹。 */
    /* 手足的小事：每個地點、每個角色都要有兩件。
       妹妹玩的時候看不到「只有當姊姊才成立」的那十一則，
       所以要另外算她那一份，不能只算總數。 */
    function hasSib(m){ return /妹妹|姊姊|\{sib\}/.test(m.text); }
    MOMENTS.forEach(function(m){
      if (hasSib(m) && !m.sis) fails.push(m.id+' 內文有手足，卻沒標 sis');
      if (m.sis && !hasSib(m)) fails.push(m.id+' 標了 sis，內文卻沒有手足');
      if (m.sis && !m.sib) fails.push(m.id+' 標了 sis 卻沒說是給哪個角色看的');
      // 雙向的一定要用 {sib}，寫死稱呼的話妹妹玩起來會對不上
      if (m.sib === 'both' && m.text.indexOf('{sib}') < 0)
        fails.push(m.id+' 是雙向的，內文卻把稱呼寫死了');
    });
    ['big','little'].forEach(function(role){
      var cnt = {};
      momentsFor(role).forEach(function(m){ if (m.sis) cnt[m.place] = (cnt[m.place]||0)+1; });
      Object.keys(MOMENTS_BY_PLACE).forEach(function(k){
        if ((cnt[k]||0) < 2)
          fails.push('「'+role+'」在「'+k+'」只有 '+(cnt[k]||0)+' 件手足的小事');
      });
    });
    // 每個角色都不該看到「指定給別的角色」的小事
    ['big','little','only'].forEach(function(role){
      momentsFor(role).forEach(function(m){
        if (m.sib && m.sib !== 'both' && m.sib !== role)
          fails.push('「'+role+'」看得到只給「'+m.sib+'」的小事：'+m.id);
      });
    });
    // 沒有兄弟姊妹的玩家，手足的小事一則都不該出現
    if (momentsFor('only').some(function(m){ return m.sis; }))
      fails.push('沒有兄弟姊妹的玩家還是看得到手足的小事');

    /* 小人站的地方要看得出來是「在那個地點」。
       家本來設在 [246,186]，離名牌 88，按了「家」她會走到畫面右下角，
       看起來像跑掉不像回家。其他地點都是 45～59，所以 65 是合理的上限。 */
    PLACES.forEach(function(pl){
      var d = Math.sqrt(Math.pow(pl.stand[0]-pl.plate[0],2) + Math.pow(pl.stand[1]-pl.plate[1],2));
      if (d > 65) fails.push('「'+pl.name+'」的小人站得離名牌 '+Math.round(d)+'，看起來不像在那裡');
    });

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
    /* 六十樣東西、五類、八樣稀有。id 一旦改掉，她已經收集到的會全部歸零，
       所以連「有沒有重複的 id」都要驗。 */
    if (TREASURES.length !== 84) fails.push('寶物變成 '+TREASURES.length+' 樣了');
    var uniq = {}; TREASURES.forEach(function(t){
      if (uniq[t.id]) fails.push('寶物 id 重複：'+t.id); uniq[t.id]=1;
      if (!t.emoji || !t.name || !t.line) fails.push(t.id+' 缺了圖示／名字／說明');
    });
    var rares = TREASURES.filter(function(t){ return t.rare; }).length;
    if (rares < 4 || rares > TREASURES.length * 0.25) fails.push('稀有的有 '+rares+' 樣，太多或太少');

    var tids={}, tpos={}, rareHit=0, ROUNDS=300;
    setDay(7);
    for (var hd=0; hd<ROUNDS; hd++){
      setMin(hd*10 % 1440); setDay(7 + Math.floor(hd/144));
      var hh=huntNow(); tids[hh.id]=1; tpos[hh.at.join()]=1; if (hh.rare) rareHit++;
    }
    if (Object.keys(tids).length < 35) fails.push('連續 '+ROUNDS+' 輪只藏了 '+Object.keys(tids).length+' 種東西');
    if (Object.keys(tpos).length < 9) fails.push('連續 '+ROUNDS+' 輪只藏在 '+Object.keys(tpos).length+' 個位置');
    // 稀有的要真的比較少見，但也不能永遠抽不到
    if (rareHit === 0) fails.push('三百輪裡一次稀有的都沒出現');
    /* 門檻量過才訂的：權重正常時三百輪抽到 13 次（4.3%），
       把權重拉平變成 49 次（16.3%）。抓 8% 兩邊都離得夠遠。 */
    if (rareHit > ROUNDS * 0.08) fails.push('稀有的出現了 '+rareHit+' 次（'+
      Math.round(rareHit/ROUNDS*100)+'%），根本不稀有');

    // 連著兩輪給同一樣東西會很沒感覺
    var rep=0, prev=null;
    setDay(7);
    for (var hr=0; hr<ROUNDS; hr++){ setMin(hr*10 % 1440); setDay(7 + Math.floor(hr/144));
      var id=huntNow().id; if (id===prev) rep++; prev=id; }
    if (rep > ROUNDS/12) fails.push('有 '+rep+' 次連著兩輪都是同一樣東西');

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
