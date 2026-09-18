<script>(function(){
  var fails=[], errs=[], seenArt={}, dup=[], total=0, safe={full:0,one:0,none:0};
  var lead2=[];                       // 第一眼看到幾個字
  var page=[];                        // 折完之後整頁第一眼看得到幾個字
  var strip=function(t){ return String(t||'').replace(/\s+/g,''); };
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });
  // 每個等級應該顯示哪一顆徽章——等級改了徽章沒跟上，這裡會直接擋下來
  var WANT={best:'完美結局', good:'只差一步', escape:'驚險結局', bad:'再試結局'};

  try {
    localStorage.clear();

    SCENARIOS.forEach(function(sc){
      Object.keys(sc.endings).forEach(function(key){
        var tag = sc.id+'.'+key, route=null;
        // 找一條到得了這個結局的路
        (function walk(k, seen, picks){
          if(route) return;
          if(k===key){ route=picks; return; }
          if(sc.endings[k] || seen.indexOf(k)>=0) return;
          sc.nodes[k].choices.forEach(function(c,i){
            walk(c.to, seen.concat([k]), picks.concat([i]));
          });
        })(sc.start, [], []);
        if(!route){ fails.push(tag+' 走不到'); return; }

        startScenario(sc.id); nodeId=sc.start; render();
        route.forEach(function(i){ choose(i); });
        total++;

        if(view!=='end'){ fails.push(tag+' 沒走到結局'); return; }
        // 每一個結局都是第一次走到（開頭清空過），要直接看到答案，不能被攔下來
        if(document.querySelector('.guess')) fails.push(tag+' 被「先猜再看」攔住了');
        var h1=document.querySelector('.result h1');
        if(!h1 || h1.textContent!==sc.endings[key].title) fails.push(tag+' 標題不符');

        var badge=document.querySelector('.badge').textContent;
        var want=WANT[sc.endings[key].grade];
        if(badge!==want) fails.push(tag+' 徽章不符：等級 '+sc.endings[key].grade+
          ' 應該顯示「'+want+'」，實際是「'+badge+'」');

        if(document.querySelector('.lesson div').textContent.indexOf('學到了什麼')<0)
          fails.push(tag+' 沒有「學到了什麼」');

        /* 「大部分的人都是安全、願意幫忙的」只留在開始畫面。
           那是一句進來之前先知道的話，不是每走完一篇都要再講一次的話——
           她一次玩很多篇，同一段字看過幾十次只會變成要跳過的東西。 */
        if (document.querySelector('.safeframe')) { safe.none++;
          fails.push(tag+' 結局頁又出現安全提醒了，那一段只放在開始畫面'); }
        // 要看 #app 不能看 body：整支程式就內嵌在 body 的 <script> 裡，
        // 用 body.textContent 比的話連註解都算進去，148 篇全部誤報
        if (/大部分的人都是安全/.test(app.textContent)) { safe.none++;
          fails.push(tag+' 結局頁還留著「大部分的人都是安全」那一段'); }

        /* 結局頁的說明預設只給第一段（重點句），其餘收起來。
           姊姊的反應是「文字一堆，她沒在看」——量過之後長的就是這一塊。
           這裡最要緊的一條是：收起來不等於弄丟。 */
        var lead = document.querySelector('.lesson .lead');
        var lbody = document.getElementById('lmore-body');
        if (!lead) fails.push(tag+' 結局頁沒有那句重點');
        else {
          var leadN = strip(lead.textContent).length;
          lead2.push(leadN);
          if (leadN > 90) fails.push(tag+' 第一眼就 '+leadN+' 個字，還是一堆');
          if (lbody && !lbody.hidden) fails.push(tag+' 其餘那幾段預設就攤開了');
          // 收起來 ≠ 弄丟：第一段 + 收起來的那幾段要拼得回原文
          var whole = strip(lead.textContent) + (lbody ? strip(lbody.textContent) : '');
          if (whole !== strip(plain(sc.endings[key].lesson)))
            fails.push(tag+' 折起來之後內容對不上原文（有東西掉了）');
          var lb = document.getElementById('lmore');
          if (lbody && !lb) fails.push(tag+' 有收起來的段落卻沒有可以打開的按鈕');
          // 要先確認按鈕真的掛了事件：直接叫 null 會整支走查當掉，
          // 變成「失敗 0 但其實什麼都沒驗」
          if (lb && typeof lb.onclick !== 'function') fails.push(tag+' 「還有幾段」沒有掛事件');
          else if (lb) { lb.onclick(); if (lbody.hidden) fails.push(tag+' 按了「還有幾段」卻打不開'); }
        }
        // 「跟爸媽討論」是寫給大人看的，整塊也收起來
        var tbody = document.getElementById('talkmore-body');
        if (!tbody) fails.push(tag+' 沒有「跟爸爸媽媽討論」');
        else {
          if (!tbody.hidden) fails.push(tag+' 「跟爸媽討論」預設就攤開了');
          if (sc.talk && strip(tbody.textContent) !== strip(plain(sc.talk)))
            fails.push(tag+' 「跟爸媽討論」的內容對不上');
        }
        /* 回顧也是收起來的，但一樣不能弄丟：
           裡面的步數要跟她這一輪真的走過的步數一樣。 */
        var rbody = document.getElementById('repmore-body');
        if (!rbody) fails.push(tag+' 沒有「回顧你的選擇」');
        else {
          if (!rbody.hidden) fails.push(tag+' 「回顧」預設就攤開了');
          var steps = rbody.querySelectorAll('.step-row').length;
          if (steps !== route.length)
            fails.push(tag+' 回顧裡是 '+steps+' 步，實際走了 '+route.length+' 步');
          var rb = document.getElementById('repmore');
          if (!rb) fails.push(tag+' 回顧沒有可以打開的按鈕');
          else if (typeof rb.onclick !== 'function') fails.push(tag+' 回顧的按鈕沒有掛事件');
          else { rb.onclick(); if (rbody.hidden) fails.push(tag+' 按了回顧卻打不開'); }
        }
        // 折完之後，第一眼整頁看得到的字（含爸爸那句、不含收起來的）
        var vis = strip(app.textContent);
        ['lmore-body','talkmore-body','repmore-body'].forEach(function(bid){
          var b=document.getElementById(bid); if(b) vis = vis.replace(strip(b.textContent), ''); });
        page.push(vis.length);

        var svg=document.querySelector('.scene svg');
        if(!svg){ fails.push(tag+' 沒有插圖'); }
        else { var sig=svg.innerHTML;   // 要整段比，只比開頭會誤判成重複
               if(seenArt[sig]) dup.push(tag+' 跟 '+seenArt[sig]+' 用同一張圖');
               else seenArt[sig]=tag; }
      });
    });
    /* 反過來也要驗：拿掉結局頁的那一段之後，
       開始畫面那一段就是唯一還在講這件事的地方，不能連它也不見。 */
    view='menu'; render();
    var mf = document.querySelector('.safeframe');
    if (!mf) fails.push('開始畫面沒有安全提醒了');
    else {
      if (mf.textContent.indexOf('願意幫忙') < 0) fails.push('開始畫面的安全提醒不完整');
      if (mf.textContent.indexOf('保護自己') < 0) fails.push('開始畫面的安全提醒少了後半句');
    }
  } catch(e) { errs.push('THROW '+e.message); }

  var pre=document.createElement('pre'); pre.id='R';
  lead2.sort(function(a,b){return a-b;});
  page.sort(function(a,b){return a-b;});
  pre.textContent=['走過結局 '+total,
    '結局頁出現安全提醒 '+safe.none+' 次（應該是 0，那一段只放開始畫面）',
    '結局頁第一眼看到的字數：中位 '+lead2[Math.floor(lead2.length/2)]+'、最長 '+lead2[lead2.length-1],
    '　　　整頁第一眼看得到：中位 '+page[Math.floor(page.length/2)]+'、最長 '+page[page.length-1]+' 字',
    '失敗 '+fails.length,
    '重複插圖 '+dup.length, 'JS 錯誤 '+errs.length, '',
    fails.concat(dup).concat(errs).slice(0,25).join('\n')].join('\n');
  document.body.innerHTML=''; document.body.appendChild(pre);
})();</script>
