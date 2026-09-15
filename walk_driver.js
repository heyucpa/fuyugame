<script>(function(){
  var fails=[], errs=[], seenArt={}, dup=[], total=0, safe={full:0,one:0,none:0};
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
  pre.textContent=['走過結局 '+total,
    '結局頁出現安全提醒 '+safe.none+' 次（應該是 0，那一段只放開始畫面）',
    '失敗 '+fails.length,
    '重複插圖 '+dup.length, 'JS 錯誤 '+errs.length, '',
    fails.concat(dup).concat(errs).slice(0,25).join('\n')].join('\n');
  document.body.innerHTML=''; document.body.appendChild(pre);
})();</script>
