<script>(function(){
  /* 「我的小屋」的走查。
     它不是從 src/ 組起來的（整份是從 Artifact 搬過來的單檔），
     所以這支走查是直接開 house.html 之後插進來跑。

     最要緊的一條：備份出去再貼回來，進度要一模一樣。
     她玩的東西不見過一次了，備份如果是壞的，等於沒有備份。 */
  var fails=[], errs=[];
  window.addEventListener('error', function(e){ errs.push(String(e.message)); });

  function restore(raw){ if(raw===null) localStorage.removeItem(SAVE_KEY);
                         else localStorage.setItem(SAVE_KEY, raw); }

  try {
    // ① 這一頁該有的東西
    if (typeof SAVE_KEY !== 'string' || !SAVE_KEY) fails.push('找不到存檔的 key');
    if (typeof saveGame !== 'function' || typeof loadGame !== 'function')
      fails.push('找不到存檔／讀檔的函式');
    if (!document.querySelector('#tabs button[data-tab="save"]'))
      fails.push('左邊沒有「備份」那個分頁');
    // 搬出 Artifact 之後要變成可以加到主畫面的獨立網頁，
    // 這幾行不只是好看——iOS 只對加到主畫面的網頁 App 不回收資料
    if (!document.querySelector('link[rel="manifest"]')) fails.push('沒有 manifest（加不了主畫面）');
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]'))
      fails.push('沒有 apple-mobile-web-app-capable（加到主畫面不會全螢幕）');
    if (!document.querySelector('link[rel="apple-touch-icon"]')) fails.push('沒有主畫面圖示');
    if (!document.title) fails.push('沒有標題');
    if (document.querySelector('body > title')) fails.push('<title> 還留在 <body> 裡面');
    // 整份要自足：連出去的話離線就玩不了，而且小孩的平板常常沒網路
    ['script[src]','link[href^="http"]','img[src^="http"]'].forEach(function(sel){
      if (document.querySelector(sel)) fails.push('有連外部資源：'+sel);
    });

    // ② 備份出去再貼回來，要一模一樣
    var mark = JSON.stringify(Object.assign({}, G, { bells: 987654 }));
    localStorage.setItem(SAVE_KEY, mark);
    var code = makeBackup();
    var got = readBackup(code);
    if (!got) fails.push('自己做的備份自己讀不回來');
    else if (got.data !== mark) fails.push('備份出來的內容跟存檔對不上');

    // 整個清掉再貼回來
    localStorage.removeItem(SAVE_KEY);
    var rb = readBackup(code);
    localStorage.setItem(SAVE_KEY, rb ? rb.data : '');
    if (localStorage.getItem(SAVE_KEY) !== mark) fails.push('還原之後的存檔對不上');
    // 真的讀得回來才算數，不是只有字串一樣
    var back = loadGame();
    if (!back || back.bells !== 987654) fails.push('還原之後遊戲讀不出那份進度');

    // ③ 壞掉的備份一律擋下來，而且不可以動到現有的存檔
    var keep = localStorage.getItem(SAVE_KEY);
    ['', 'hello', '{}', '[]',
     '{"tag":"別人的遊戲","data":"{}"}',
     '{"tag":"myHouse-save","data":""}',
     '{"tag":"myHouse-save","data":"不是JSON"}',
     JSON.stringify({tag:'myHouse-save', data:JSON.stringify({隨便:1})}),
     JSON.stringify({tag:'myHouse-save', data:JSON.stringify({rooms:'不是陣列'})})
    ].forEach(function(bad){
      if (readBackup(bad)) fails.push('這種壞備份竟然收下了：'+String(bad).slice(0,32));
    });
    if (localStorage.getItem(SAVE_KEY) !== keep) fails.push('驗壞備份的時候動到了存檔');

    /* ③.5 還原寫進去的，要是備份「裡面那一份存檔」，不是貼進來的那整段字。
       只測「貼垃圾」驗不到這一條——那個 bug 發生在驗證通過之後。 */
    localStorage.setItem(SAVE_KEY, mark);
    var code2 = makeBackup();
    var prev = JSON.stringify(Object.assign({}, G, { bells: 111 }));
    localStorage.setItem(SAVE_KEY, prev);
    localStorage.removeItem(UNDO_KEY);
    if (!applyBackup(code2)) fails.push('合法的備份竟然還原失敗');
    if (localStorage.getItem(SAVE_KEY) !== mark)
      fails.push('還原寫進去的不是備份裡的那份存檔');
    if (!hasUndo()) fails.push('還原之前沒有先留一份可以反悔的');
    var u = readBackup(localStorage.getItem(UNDO_KEY));
    if (!u || u.data !== prev)
      fails.push('可以反悔的那一份不是還原前的現況');
    if (applyBackup('垃圾')) fails.push('垃圾竟然還原成功');
    localStorage.removeItem(UNDO_KEY);
    localStorage.setItem(SAVE_KEY, mark);

    // ④ 備份裡不可以包含上一份備份（會越滾越大）
    localStorage.setItem(UNDO_KEY, makeBackup());
    if (makeBackup().indexOf(UNDO_KEY) >= 0) fails.push('備份把上一份備份也包進去了');
    localStorage.removeItem(UNDO_KEY);

    // ⑤ 備份那一頁：按鈕要在、貼垃圾按還原不可以動到存檔
    openTab('save');
    var body = document.querySelector('#tabBody');
    var btns = [].slice.call(body.querySelectorAll('button')).map(function(b){ return b.textContent; });
    ['複製備份','存成檔案','還原'].forEach(function(t){
      if (!btns.some(function(x){ return x.indexOf(t) >= 0; })) fails.push('備份頁少了「'+t+'」'); });
    var ta = body.querySelector('textarea');
    if (!ta) fails.push('備份頁沒有可以貼的框');
    else {
      var before = localStorage.getItem(SAVE_KEY);
      ta.value = '隨便亂打';
      btns.forEach(function(t, i){});
      [].slice.call(body.querySelectorAll('button')).forEach(function(b){
        if (b.textContent.indexOf('還原') >= 0) b.onclick(); });
      if (localStorage.getItem(SAVE_KEY) !== before)
        fails.push('貼了垃圾按還原竟然動到了存檔');
    }

    /* ⑥ 反悔那一塊只在有東西可以反悔的時候出現。
       比的是那個標題，不能比「反悔」兩個字——上面那段說明裡也有。 */
    var undoHead = function(){
      return [].slice.call(document.querySelectorAll('#tabBody h3'))
        .some(function(h){ return h.textContent.indexOf('\u23ea') >= 0; }); };
    localStorage.removeItem(UNDO_KEY);
    openTab('save');
    if (undoHead()) fails.push('沒有東西可以反悔，卻顯示了反悔那一塊');
    localStorage.setItem(UNDO_KEY, makeBackup());
    openTab('save');
    if (!undoHead()) fails.push('有上一份可以反悔，卻沒顯示反悔那一塊');
    localStorage.removeItem(UNDO_KEY);

    // ⑦ 其他分頁沒被改壞
    ['inv','shop','dress','pets','deco','build','earn','book','talk','save'].forEach(function(t){
      try { openTab(t); if (!document.querySelector('#tabBody').children.length)
              fails.push('分頁「'+t+'」是空的'); }
      catch(e){ fails.push('分頁「'+t+'」打不開：'+e.message); }
    });
  } catch(e){ errs.push('THROW '+e.message+' | '+(e.stack||'').split('\n')[1]); }

  var pre=document.createElement('pre'); pre.id='R';
  pre.textContent=['失敗 '+fails.length, 'JS 錯誤 '+errs.length, '',
    fails.concat(errs).slice(0,15).join('\n')].join('\n');
  document.body.innerHTML=''; document.body.appendChild(pre);
})();</script>
