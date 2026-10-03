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

    /* ⑥.5 補償金幣
       重點是「已經存在的存檔也要拿得到」——
       只改 newGame() 的話，她那台有存檔就一毛都拿不到。
       而且只能補一次，不能每次開都補。 */
    if (newGame().bells !== START_BELLS)
      fails.push('開局金幣不是 ' + START_BELLS);
    var old = normalizeSave(Object.assign(JSON.parse(mark), { bells: 3000, topup100k: undefined }));
    if (!old) fails.push('舊存檔讀不回來');
    else {
      if (old.bells !== START_BELLS)
        fails.push('舊存檔沒有補到 ' + START_BELLS + '（現在是 ' + old.bells + '）');
      if (!old.topup100k) fails.push('補完沒有記起來（下次開會再補一次）');
    }
    // 補過了就不再補，不管她花到剩多少
    var spent = normalizeSave(Object.assign(JSON.parse(mark), { bells: 500, topup100k: true }));
    if (spent && spent.bells !== 500)
      fails.push('補過了還再補一次（花到 500 被推回 ' + spent.bells + '）');
    // 比 10 萬多的不要被打下來
    var rich = normalizeSave(Object.assign(JSON.parse(mark), { bells: 300000, topup100k: undefined }));
    if (rich && rich.bells !== 300000)
      fails.push('本來就比 10 萬多的被改成 ' + rich.bells);

    /* ⑥.9 「重新開始」要可以反悔一次。
       走真的那個流程（確認兩次、打四個字），
       不是直接叫 newGame()——改壞按鈕這一關才驗得出來。 */
    var keepSave = JSON.stringify(Object.assign({}, G, { bells: 55555, topup100k: true }));
    localStorage.setItem(SAVE_KEY, keepSave);
    G = loadGame();
    localStorage.removeItem(UNDO_KEY);
    confirmReset();
    var card = document.querySelector('#modalCard');
    var step1 = [].slice.call(card.querySelectorAll('button'))
      .filter(function(b){ return b.textContent.indexOf('\u6211\u78ba\u5b9a') >= 0; })[0];
    if (!step1) fails.push('\u91cd\u65b0\u958b\u59cb\u627e\u4e0d\u5230\u300c\u6211\u78ba\u5b9a\u300d');
    else {
      step1.onclick();
      var inp = card.querySelector('input.textin');
      var go = [].slice.call(card.querySelectorAll('button'))
        .filter(function(b){ return b.textContent.indexOf('\u6e05\u9664\u6240\u6709\u9032\u5ea6') >= 0; })[0];
      if (!inp || !go) fails.push('\u91cd\u65b0\u958b\u59cb\u7684\u7b2c\u4e8c\u6b65\u4e0d\u898b\u4e86');
      else {
        // 打錯字不該清得掉
        inp.value = '\u96a8\u4fbf'; inp.oninput(); go.onclick();
        if (loadGame().bells !== 55555) fails.push('\u6253\u932f\u5b57\u7adf\u7136\u4e5f\u6e05\u6389\u4e86');
        inp.value = '\u91cd\u65b0\u958b\u59cb'; inp.oninput(); go.onclick();
        if (G.bells === 55555) fails.push('\u6309\u4e86\u91cd\u65b0\u958b\u59cb\u537b\u6c92\u6709\u6e05\u6389');
        if (!hasUndo()) fails.push('\u91cd\u65b0\u958b\u59cb\u4e4b\u524d\u6c92\u6709\u7559\u4e00\u4efd\u53ef\u4ee5\u53cd\u6094\u7684');
        var u2 = readBackup(localStorage.getItem(UNDO_KEY));
        if (!u2 || u2.data !== keepSave)
          fails.push('\u53ef\u4ee5\u53cd\u6094\u7684\u90a3\u4e00\u4efd\u4e0d\u662f\u6e05\u6389\u524d\u7684\u9032\u5ea6');
      }
    }
    document.querySelector('#modal').hidden = true;
    localStorage.removeItem(UNDO_KEY);
    localStorage.setItem(SAVE_KEY, mark);
    G = loadGame();

    /* ⑧ 存檔格：兩個小孩各玩各的，互不影響 */
    if (slots().length < 1) fails.push('一格都沒有');
    if (SAVE_KEY.indexOf(curSlotId()) < 0) fails.push('存檔的 key 沒有跟著存檔格走');
    if (UNDO_KEY.indexOf(curSlotId()) < 0) fails.push('反悔的 key 沒有跟著存檔格走');
    if (slotSave('p1') === slotSave('p2')) fails.push('不同格的 key 竟然一樣');
    // 各自獨立：寫一格不可以動到另一格
    localStorage.setItem(slotSave('p1'), JSON.stringify(Object.assign({}, G, {bells: 111, topup100k: true})));
    localStorage.setItem(slotSave('p2'), JSON.stringify(Object.assign({}, G, {bells: 222, topup100k: true})));
    var i1 = slotInfo('p1'), i2 = slotInfo('p2');
    if (!i1 || i1.bells !== 111) fails.push('第一格的概況讀錯了');
    if (!i2 || i2.bells !== 222) fails.push('第二格的概況讀錯了');
    if (slotInfo('沒這格')) fails.push('不存在的格竟然讀得出東西');
    // 最後一格不給刪，刪了就沒有任何一格可以玩
    saveSlots([{id:'p1', name:'只剩一格'}]);
    if (removeSlot('p1')) fails.push('最後一格竟然刪得掉');
    // 刪掉一格要連它的存檔一起清，不然會越積越多
    saveSlots([{id:'p1',name:'a'},{id:'p2',name:'b'}]);
    if (!removeSlot('p2')) fails.push('刪不掉第二格');
    if (localStorage.getItem(slotSave('p2'))) fails.push('格刪了，它的存檔還在');
    if (slots().length !== 1) fails.push('刪完之後格數不對');
    // 新開一格不可以跟舊的撞 id
    var nid = addSlot('新的');
    if (nid === 'p1') fails.push('新開的格跟舊的撞 id 了');
    if (!slots().some(function(x){ return x.id === nid; })) fails.push('新開的格沒有存進清單');
    renameSlot(nid, '妹妹');
    if (!slots().some(function(x){ return x.name === '妹妹'; })) fails.push('改名字沒有生效');
    saveSlots([{id:'p1', name:'第 1 間'}]);

    /* ⑨ 買蛋跟「送回寵物店」
       收齊之後還是可以買（她可能想養兩隻一樣的），
       但買錯了要有後路。最要緊的是送走之後索引不能亂——
       activePet / companions 都是用索引指著 G.pets。 */
    var save0 = JSON.stringify(G);
    G.bells = 999999;
    G.pets = PET_SPECIES.map(function(sp){ return newPet(sp.id, 'kid', sp.name); });
    G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
    var n0 = G.pets.length;
    // 收齊了還是買得到
    if (buyEgg() === null) fails.push('收齊了就完全買不到蛋了');
    if (G.pets.length !== n0 + 1) fails.push('買了蛋卻沒有多一隻');
    // 還沒收齊的時候，孵出來一定是新的種類
    G.pets = [newPet('mochi', 'kid', 'a')]; G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
    var got = buyEgg();
    if (got === null) fails.push('還沒收齊卻買不到蛋');
    else if (G.pets[got].species === 'mochi') fails.push('還有沒收集的，竟然孵出重複的');
    // 錢不夠不可以買到
    G.bells = 10;
    var poor = buyEgg();
    if (poor !== null) fails.push('錢不夠竟然也買得到蛋');
    if (G.bells !== 10) fails.push('錢不夠買不到，錢卻被扣了');

    /* 送回寵物店：索引要跟著移，不然她會變成在照顧另一隻 */
    G.bells = 0;
    /* 照顧中的那隻要放在「中間」。放最後一隻的話，就算索引完全不處理，
       releasePet 最後那行夾緊（clamp）也會剛好夾到對的位置，等於沒驗到。
       踩過一次：這一關本來放最後一隻，突變測試照樣全過。 */
    // 房間數決定可以同時帶幾隻出來。只有一間的話 fixCompanions 會把
    // 同伴清空（那是對的行為），同伴那一條就驗不到了，所以先給三間
    G.rooms = [G.rooms[0], JSON.parse(JSON.stringify(G.rooms[0])),
               JSON.parse(JSON.stringify(G.rooms[0]))];
    G.pets = [newPet('mochi','kid','A'), newPet('bunny','kid','B'),
              newPet('bear','kid','C'), newPet('cat','kid','D')];
    G.activePet = 1; G.pet = G.pets[1]; G.companions = [2];
    if (!releasePet(0)) fails.push('送不走第一隻');
    if (G.pets.length !== 3) fails.push('送走了卻沒少一隻');
    if (petNameOf(G.pets[G.activePet]) !== 'B')
      fails.push('送走一隻之後，照顧中的變成「' + petNameOf(G.pets[G.activePet]) + '」了');
    if (G.pet !== G.pets[G.activePet]) fails.push('G.pet 沒有指回照顧中的那隻');
    if (G.companions.length !== 1 || petNameOf(G.pets[G.companions[0]]) !== 'C')
      fails.push('一起逛的變成別隻寵物了');
    if (G.companions.some(function(x){ return !G.pets[x]; }))
      fails.push('一起逛的名單指到不存在的寵物');
    if (G.bells !== sellValue(EGG_PRICE)) fails.push('送回寵物店沒有拿回一半的蛋錢');
    // 最後一隻不能送，不然她會一隻寵物都沒有
    G.pets = [newPet('mochi','kid','唯一')]; G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
    if (releasePet(0)) fails.push('最後一隻竟然送得走');
    G = JSON.parse(save0); G.pet = G.pets[G.activePet];

    // ⑦ 其他分頁沒被改壞
    ['inv','shop','dress','pets','deco','build','earn','book','talk','save'].forEach(function(t){
      try { openTab(t); if (!document.querySelector('#tabBody').children.length)
              fails.push('分頁「'+t+'」是空的'); }
      catch(e){ fails.push('分頁「'+t+'」打不開：'+e.message); }
    });
  } catch(e){ errs.push('THROW '+e.message+' | '+(e.stack||'').split('\n')[1]); }

  function report(){
    var pre=document.createElement('pre'); pre.id='R';
    pre.textContent=['失敗 '+fails.length, 'JS 錯誤 '+errs.length, '',
      fails.concat(errs).slice(0,15).join('\n')].join('\n');
    document.body.innerHTML=''; document.body.appendChild(pre);
  }

  /* 選檔案匯入。FileReader 是非同步的，所以放在最後，
     跟完了再印結果。用真的 File 丟進去，
     不是只檢查「標籤在不在」——「存成檔案」存得出來卻匯不回來的話，
     那個檔案等於白存。 */
  try {
    openTab('save');
    var fb = document.querySelector('#tabBody input[type="file"]');
    var tb = document.querySelector('#tabBody textarea');
    if (!fb) { fails.push('備份頁沒有「選檔案」'); return report(); }
    if (typeof fb.onchange !== 'function') { fails.push('選檔案沒有掛事件'); return report(); }
    var feed = function(text, name){
      var dt = new DataTransfer();
      dt.items.add(new File([text], name, { type: 'application/json' }));
      fb.files = dt.files;
      fb.onchange();
    };
    var good = makeBackup();
    tb.value = '';
    feed(good, 'ok.json');
    setTimeout(function(){
      if (tb.value !== good) fails.push('選了備份檔，內容沒有被讀進來');
      tb.value = '';
      feed('這不是備份', 'bad.json');
      setTimeout(function(){
        if (tb.value) fails.push('選了不是備份的檔案，竟然還填進框裡');
        report();
      }, 80);
    }, 80);
  } catch(e){ errs.push('THROW(file) '+e.message); report(); }
})();</script>
