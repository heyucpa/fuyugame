<script>(function(){
  var fails=[], errs=[], met={}, days=0, events=0, calms=0, grades={};
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });
  var DAYS = 120;

  function click(id){ var b=document.getElementById(id); if(!b){ fails.push('找不到按鈕 '+id); return false; } b.onclick(); return true; }

  try {
    localStorage.clear();
    for (var d=0; d<DAYS; d++){
      newDay(); render(); days++;
      // 每一天四段
      for (var s=0; s<4; s++){
        if (view!=='route'){ fails.push('第'+d+'天第'+s+'段：不在路線圖，view='+view); break; }
        var isCalm = !!day[at].calm;
        if (isCalm) calms++;
        click('next');
        if (!isCalm){
          events++;
          met[cur.id] = (met[cur.id]||0)+1;
          if (view!=='story'){ fails.push(cur.id+' 沒進到故事'); break; }
          click('go');                       // 開場白 → 第一個決策點
          var guard=0;
          while (view==='story' && guard++<40){
            var bs=document.querySelectorAll('.choice');
            if(!bs.length){ fails.push(cur.id+'/'+nodeId+' 沒有選項'); break; }
            bs[Math.floor(Math.random()*bs.length)].onclick();
          }
          if (guard>=40){ fails.push(cur.id+' 選項繞不出來（可能有循環）'); break; }
          if (view!=='end'){ fails.push(cur.id+' 沒走到結局，view='+view); break; }
          // 結局頁該有的東西
          if(!document.querySelector('.scene svg')) fails.push(cur.id+'.'+endingKey+' 結局沒有插圖');
          var badge=document.querySelector('.badge');
          if(!badge) fails.push(cur.id+'.'+endingKey+' 沒有徽章');
          else {
            var want={best:'完美結局',good:'只差一步',escape:'驚險結局',bad:'再試結局'}[ending.grade];
            if(badge.textContent!==want) fails.push(cur.id+'.'+endingKey+' 徽章不符：'+badge.textContent+' 應為 '+want);
          }
          grades[ending.grade]=(grades[ending.grade]||0)+1;
          click('next');                     // 繼續今天 / 回到家
        }
      }
      if (view!=='tally'){ fails.push('第'+d+'天沒有結算，view='+view); break; }
      if(!document.querySelector('.route')) fails.push('結算頁沒有路線圖');
    }
  } catch(e){ errs.push('THROW '+e.message+' | '+e.stack.split('\n')[1]); }

  var missing = SCENARIOS.filter(function(s){ return !met[s.id]; }).map(function(s){ return s.id; });
  if (missing.length) fails.push('這 '+DAYS+' 天裡從來沒遇到過：'+missing.join(', '));

  var pre=document.createElement('pre'); pre.id='R';
  pre.textContent=[
    '過了 '+days+' 天',
    '事件 '+events+' 次｜平順路段 '+calms+' 次（'+Math.round(calms/(events+calms)*100)+'%）',
    '等級分布 '+JSON.stringify(grades),
    '21 篇都遇到過 '+(missing.length?'否':'是'),
    '失敗 '+fails.length,
    'JS 錯誤 '+errs.length, '',
    fails.concat(errs).slice(0,12).join('\n')
  ].join('\n');
  document.body.innerHTML=''; document.body.appendChild(pre);
})();</script>
