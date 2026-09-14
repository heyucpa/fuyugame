<script>(function(){
  var fails=[], errs=[], met={}, days=0, events=0, calms=0, guessed=0;
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });
  var DAYS = 100;
  function hit(id){ var b=document.getElementById(id); if(!b){ fails.push('找不到按鈕 '+id); return false; } b.onclick(); return true; }

  try {
    localStorage.clear();
    var before = seenTotal();                 // 圖鑑起點
    if (before !== 0) fails.push('清空後圖鑑不是 0，是 '+before);

    for (var d=0; d<DAYS; d++){
      startDay(); days++;
      for (var s=0; s<4; s++){
        if (view!=='route'){ fails.push('第'+d+'天第'+s+'段不在路線圖，view='+view); break; }
        var isCalm = !!dayRun[dayAt].calm;
        var want = dayRun[dayAt].scenarioId;
        isCalm ? calms++ : events++;
        hit('dnext');
        if (isCalm) continue;

        met[want] = (met[want]||0)+1;
        if (view!=='story' || cur.id!==want){ fails.push(want+' 沒進到對的故事'); break; }
        hit('go');
        var guard=0;
        while (view==='story' && guard++<40){
          var bs=document.querySelectorAll('.choice');
          if(!bs.length){ fails.push(cur.id+'/'+nodeId+' 沒有選項'); break; }
          bs[Math.floor(Math.random()*bs.length)].onclick();
        }
        if (view!=='end'){ fails.push(cur.id+' 沒走到結局，view='+view); break; }
        // 第一次走到的結局會先問她押哪一邊，要答完才會展開
        if (predicting){
          guessed++;
          var g=document.getElementById('g-good')||document.getElementById('g-idk');
          if(!g){ fails.push(cur.id+' 押判斷畫面沒有按鈕'); break; }
          g.onclick();
        }
        if(!document.querySelector('.scene svg')) fails.push(cur.id+' 結局沒有插圖');
        var badge=document.querySelector('.badge');
        var WANT={best:'完美結局',good:'只差一步',escape:'驚險結局',bad:'再試結局'};
        if(!badge || badge.textContent!==WANT[ending.grade])
          fails.push(cur.id+' 徽章不符：'+(badge?badge.textContent:'無'));
        // 一天模式下不該出現「再走一次／隨機下一個」
        if(document.getElementById('again')||document.getElementById('rand'))
          fails.push(cur.id+' 一天模式下還出現劇場的按鈕');
        if(!dayRun[dayAt].result) fails.push(cur.id+' 結果沒有記進今天的路線');
        hit('dgo');
      }
      if (view!=='tally'){ fails.push('第'+d+'天沒有結算，view='+view); break; }
      if(!document.querySelector('.route')) fails.push('結算頁沒有路線圖');
      if (d===0){
        var after = seenTotal();
        if (after <= before) fails.push('過完一天，結局圖鑑沒有增加（'+before+' → '+after+'）');
      }
    }
    var gal = seenTotal();
    if (gal < 20) fails.push('過了 '+DAYS+' 天，圖鑑才 '+gal+' 格，太少了');
  } catch(e){ errs.push('THROW '+e.message+' | '+(e.stack||'').split('\n')[1]); }

  var missing = SCENARIOS.filter(function(s){ return !met[s.id]; }).map(function(s){ return s.id; });
  if (missing.length) fails.push('這 '+DAYS+' 天從來沒遇到過：'+missing.join(', '));

  var pre=document.createElement('pre'); pre.id='R';
  pre.textContent=[
    '過了 '+days+' 天',
    '事件 '+events+' 次｜平順路段 '+calms+' 次（'+Math.round(calms/(events+calms)*100)+'%）',
    '押判斷攔截 '+guessed+' 次',
    '結局圖鑑 '+seenTotal()+' / '+totalEnds(),
    '21 篇都遇到過 '+(missing.length?'否':'是'),
    '失敗 '+fails.length, 'JS 錯誤 '+errs.length, '',
    fails.concat(errs).slice(0,12).join('\n')
  ].join('\n');
  document.body.innerHTML=''; document.body.appendChild(pre);
})();</script>
