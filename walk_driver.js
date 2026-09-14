<script>(function(){
  var fails=[], errs=[], seenArt={}, dup=[], total=0, safe={full:0,one:0,none:0};
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });
  // 每個等級應該顯示哪一顆徽章——等級改了徽章沒跟上，這裡會直接擋下來
  var WANT={best:'完美結局', good:'只差一步', escape:'驚險結局', bad:'再試結局'};

  try {
    localStorage.clear();
    localStorage.setItem('theater-guess:p1','off');   // 走查不要被押判斷攔住

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
        var h1=document.querySelector('.result h1');
        if(!h1 || h1.textContent!==sc.endings[key].title) fails.push(tag+' 標題不符');

        var badge=document.querySelector('.badge').textContent;
        var want=WANT[sc.endings[key].grade];
        if(badge!==want) fails.push(tag+' 徽章不符：等級 '+sc.endings[key].grade+
          ' 應該顯示「'+want+'」，實際是「'+badge+'」');

        if(document.querySelector('.lesson div').textContent.indexOf('學到了什麼')<0)
          fails.push(tag+' 沒有「學到了什麼」');

        /* 安全提醒：前八個結局講完整的，之後只在驚險／再試 補一句短的。
           每一頁都放的話，她看過幾十次就會直接跳過，
           真正需要的時候反而看不進去。 */
        var sf=document.querySelector('.safeframe'), g=sc.endings[key].grade;
        if (seenTotal() <= SAFE_FULL_UNTIL) {
          if(!sf || sf.textContent.indexOf('願意幫忙')<0) fails.push(tag+' 前八個結局要有完整的安全提醒');
          safe.full++;
        } else if (g==='escape' || g==='bad') {
          if(!sf || !sf.className.match(/\bone\b/)) fails.push(tag+' 驚險／再試 要留一句短的安全提醒');
          safe.one++;
        } else {
          if(sf) fails.push(tag+' 完美／只差一步 不該再出現安全提醒（她已經看過很多次了）');
          safe.none++;
        }

        var svg=document.querySelector('.scene svg');
        if(!svg){ fails.push(tag+' 沒有插圖'); }
        else { var sig=svg.innerHTML;   // 要整段比，只比開頭會誤判成重複
               if(seenArt[sig]) dup.push(tag+' 跟 '+seenArt[sig]+' 用同一張圖');
               else seenArt[sig]=tag; }
      });
    });
  } catch(e) { errs.push('THROW '+e.message); }

  var pre=document.createElement('pre'); pre.id='R';
  pre.textContent=['走過結局 '+total,
    '安全提醒：完整 '+safe.full+'、短版 '+safe.one+'、不顯示 '+safe.none,
    '失敗 '+fails.length,
    '重複插圖 '+dup.length, 'JS 錯誤 '+errs.length, '',
    fails.concat(dup).concat(errs).slice(0,25).join('\n')].join('\n');
  document.body.innerHTML=''; document.body.appendChild(pre);
})();</script>
