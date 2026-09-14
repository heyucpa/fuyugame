<script>(function(){
  var fails=[], errs=[], seenArt={}, dup=[], total=0;
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

        var svg=document.querySelector('.scene svg');
        if(!svg){ fails.push(tag+' 沒有插圖'); }
        else { var sig=svg.innerHTML;   // 要整段比，只比開頭會誤判成重複
               if(seenArt[sig]) dup.push(tag+' 跟 '+seenArt[sig]+' 用同一張圖');
               else seenArt[sig]=tag; }
      });
    });
  } catch(e) { errs.push('THROW '+e.message); }

  var pre=document.createElement('pre'); pre.id='R';
  pre.textContent=['走過結局 '+total, '失敗 '+fails.length,
    '重複插圖 '+dup.length, 'JS 錯誤 '+errs.length, '',
    fails.concat(dup).concat(errs).slice(0,25).join('\n')].join('\n');
  document.body.innerHTML=''; document.body.appendChild(pre);
})();</script>
