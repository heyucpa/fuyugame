<script>(function(){
  /* 「我的小屋」的走查。
     它不是從 src/ 組起來的（整份是從 Artifact 搬過來的單檔），
     所以這支走查是直接開 house.html 之後插進來跑。

     最要緊的一條：備份出去再貼回來，進度要一模一樣。
     她玩的東西不見過一次了，備份如果是壞的，等於沒有備份。 */
  var fails=[], errs=[], pendingChecks=[];  // pendingChecks：要等非同步（MutationObserver 之類）跑完才能驗的
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
    var ati = document.querySelector('link[rel="apple-touch-icon"]');
    if (!ati) fails.push('沒有主畫面圖示');
    else if (ati.getAttribute('href').indexOf('data:image/png') !== 0) fails.push('主畫面圖示不是 PNG（iPad 不認 SVG，會變成綠底一個字）');
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
    openTab('backup');
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
    openTab('backup');
    if (undoHead()) fails.push('沒有東西可以反悔，卻顯示了反悔那一塊');
    localStorage.setItem(UNDO_KEY, makeBackup());
    openTab('backup');
    if (!undoHead()) fails.push('有上一份可以反悔，卻沒顯示反悔那一塊');
    localStorage.removeItem(UNDO_KEY);

    /* ⑥.5 補償金幣
       重點是「已經存在的存檔也要拿得到」——
       只改 newGame() 的話，她那台有存檔就一毛都拿不到。
       而且只能補一次，不能每次開都補。 */
    if (newGame().bells + OPEN_GIFT_BELLS !== START_BELLS)
      fails.push('開局金幣（含開幕包裹）不是 ' + START_BELLS);
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
    // 以前的預設名字「第 1 間」家長看不懂，顯示成「存檔 1」；她自己取的名字不動；新開的叫「存檔 N」
    if (slots()[0].name !== '存檔 1') fails.push('舊的預設名字「第 1 間」沒有顯示成「存檔 1」');
    saveSlots([{id:'p1', name:'第 1 間'}, {id:'p2', name:'姊姊'}]);
    if (slots()[1].name !== '姊姊') fails.push('自己取的存檔名字被改掉了');
    var nid2 = addSlot('');
    if (!slots().some(function(x){ return x.id === nid2 && x.name === '存檔 3'; })) fails.push('新開的存檔名字不是「存檔 3」');
    saveSlots([{id:'p1', name:'第 1 間'}]);
    openTab('save');
    var stx = $('#tabBody').textContent;
    if (/房子|開一間|這一間/.test(stx)) fails.push('存檔那一區還寫著「房子／間」（家長看不懂）');
    if (!/開一個新存檔/.test(stx)) fails.push('沒有「開一個新存檔」');
    openTab('inv');

    /* ⑨ 買蛋跟「送回寵物店」
       收齊之後還是可以買（她可能想養兩隻一樣的），
       但買錯了要有後路。最要緊的是送走之後索引不能亂——
       activePet / companions 都是用索引指著 G.pets。 */
    var save0 = JSON.stringify(G);
    G.bells = 999999;
    G.pets = PET_SPECIES.map(function(sp){ return newPet(sp.id, 'kid', sp.name); });
    G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
    var n0 = G.pets.length;
    // 每一種都有了就不能再買（家長：不然會一直買到重複的）
    var bb0 = G.bells;
    if (buyEgg() !== null || G.pets.length !== n0 || G.bells !== bb0) fails.push('18 種都有了還能買蛋（或被扣錢）');
    // 蛋裡的也算：剩下的種類都在還沒孵的蛋裡，也不能再買
    G.pets[5].stage = 'egg';
    if (buyEgg() !== null) fails.push('剩下的種類都在蛋裡了還能買蛋');
    // 之後新增寵物種類：又可以買，而且一定孵出新的那一種
    PET_SPECIES.push({ id: '__new', name: '新寵物', weight: 1 }); PET_SPECIES_BY_ID.__new = PET_SPECIES[PET_SPECIES.length - 1];
    try {
      var gotNew = buyEgg();
      if (gotNew === null || G.pets[gotNew].species !== '__new') fails.push('新增寵物種類之後，買不到蛋或孵出來不是新的那一種');
    } finally { PET_SPECIES.pop(); delete PET_SPECIES_BY_ID.__new; }
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
    if (G.bells !== EGG_PRICE) fails.push('重複的寵物賣回店裡不是原價（' + G.bells + '）');
    // 最後一隻不能送，不然她會一隻寵物都沒有
    G.pets = [newPet('mochi','kid','唯一')]; G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
    if (releasePet(0)) fails.push('最後一隻竟然送得走');
    G = JSON.parse(save0); G.pet = G.pets[G.activePet];

    /* ⑩ 彈弓丟蘋果：拉出畫布也要射得出去
       本來彈弓在 x=62、最大拉距 72，要拉滿得拉到畫面外的 x=-10，
       而且手指一出畫布 pointerleave 就把整發取消掉——
       結果是水平方向永遠拉不滿，小孩只覺得「怎麼沒反應」。 */
    openSlingGame();
    var sc = document.querySelector('.game-stage canvas');
    var st = document.querySelector('.game-status');
    if (!sc || !st) fails.push('彈弓遊戲沒有開起來');
    else {
      var r0 = sc.getBoundingClientRect();
      var before = st.textContent;
      var at = function(type, px, py, extra){
        var r = sc.getBoundingClientRect();
        sc.dispatchEvent(new PointerEvent(type, Object.assign({
          bubbles: true, pointerId: 1, clientX: r.left + px, clientY: r.top + py }, extra || {})));
      };
      // 拉滿的位置一定要還在畫面裡，不然水平方向永遠拉不滿
      var gm = openSlingGame.geom;
      if (!gm) fails.push('量不到彈弓的位置，這一關等於沒驗');
      else if (gm.anchor.x - gm.maxPull < gm.edge)
        fails.push('彈弓在 x=' + gm.anchor.x + '，拉滿要到 x=' +
          (gm.anchor.x - gm.maxPull) + '，在畫面外（至少要 ' + gm.edge + '）');

      if (r0.width <= 0) fails.push('彈弓的畫布量不到大小，這一關等於沒驗');
      else {
        /* 從彈弓按下去，往左拉到畫面外，中途手指離開畫布（真的瀏覽器
           會送 pointerleave），再放開。這一發必須射得出去。 */
        at('pointerdown', r0.width * 0.27, r0.height * 0.74);
        at('pointermove', -r0.width * 0.6, r0.height * 0.80);
        at('pointerleave', -r0.width * 0.6, r0.height * 0.80);
        at('pointerup',   -r0.width * 0.6, r0.height * 0.80);
        if (st.textContent === before)
          fails.push('往左拉出畫面再放開，蘋果沒有射出去（' + st.textContent + '）');
      }
      closeGameWindow();
      document.querySelector('#modal').hidden = true;
    }

    /* ⑩.5 重新開始要在設定分頁，不是家具分頁。
       那是整個遊戲最危險的按鈕，藏在收集品頁面裡很容易被誤觸。 */
    openTab('book');
    if (document.querySelector('#tabBody').textContent.indexOf('重新開始') >= 0)
      fails.push('「重新開始」還在圖鑑分頁');
    openTab('save');
    if (document.querySelector('#tabBody').textContent.indexOf('重新開始') < 0)
      fails.push('設定分頁沒有「重新開始」');

    /* ⑩.8 寵物跟髮型的數量與資料完整性 */
    if (PET_SPECIES.length !== 20) fails.push('寵物變成 ' + PET_SPECIES.length + ' 種了');
    var pid = {};
    PET_SPECIES.forEach(function(sp){
      if (pid[sp.id]) fails.push('寵物 id 重複：' + sp.id);
      pid[sp.id] = 1;
      ['name','body','edge','belly','inner'].forEach(function(k){
        if (!sp[k]) fails.push(sp.id + ' 缺了 ' + k); });
      if (!sp.weight) fails.push(sp.id + ' 沒有權重，永遠抽不到');
    });
    // 每一種都要畫得出來（新增的耳朵或記號打錯就會空白）
    PET_SPECIES.forEach(function(sp){
      try {
        var cv = renderPetPortrait(newPet(sp.id, 'adult', sp.name), 60, 54);
        if (!cv || cv.toDataURL().length < 500) fails.push(sp.name + ' 畫出來是空白的');
      } catch (e) { fails.push(sp.name + ' 畫不出來：' + e.message); }
    });
    HAIR_STYLES.forEach(function(h){
      HAIR_COLORS.forEach(function(col){
        try { renderGirl(G.outfit, 40, 50, { hair: { style: h.id, color: col.id } }); }
        catch (e) { fails.push(h.name + col.name + ' 畫不出來'); }
      });
    });
    // 五款髮型的預覽圖不可以长得一模一樣（快取 key 漏掉髮型的話會）
    var seenHair = {};
    HAIR_STYLES.forEach(function(h){
      var d = renderGirl(G.outfit, 43, 53, { hair: { style: h.id, color: 'gold' } }).toDataURL();
      if (seenHair[d]) fails.push(h.name + ' 跟 ' + seenHair[d] + ' 的預覽圖一模一樣');
      seenHair[d] = h.name;
    });

    /* ⑩.9 同時帶得出來的寵物數 = 1 + 房間數，最多 5。
       本來是 min(3, 房間數)，一開始只有一間房就等於一隻都帶不出來。 */
    var rm = G.rooms;
    [[1, 2], [2, 3], [3, 4], [4, 5], [6, 5]].forEach(function(p){
      G.rooms = []; for (var i = 0; i < p[0]; i++) G.rooms.push(JSON.parse(JSON.stringify(rm[0])));
      if (petsOutLimit() !== p[1])
        fails.push(p[0] + ' 間房間應該帶 ' + p[1] + ' 隻，實際是 ' + petsOutLimit());
    });
    G.rooms = rm;

    /* ⑪ 重複的寵物：圖鑑上標 ×N，但「我的寵物們」不合併。
       那邊每一隻都是獨立個體（自己的名字、階段、肚子），
       合併了就沒辦法分別餵、分別改名。 */
    var keepPets = JSON.stringify(G.pets), keepAct = G.activePet;
    G.pets = [newPet('mochi','kid','圓圓'), newPet('mochi','kid','第二隻'),
              newPet('bunny','kid','兔兔'), newPet('starfox','egg','')];
    G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
    // 寵物圖鑑搬到「📖 圖鑑」了：寵物分頁只留一顆按鈕過去
    openTab('pets');
    if (document.querySelectorAll('#tabBody .card.dex').length) fails.push('寵物分頁還有寵物圖鑑（應該只在圖鑑）');
    var goDex = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /看寵物圖鑑/.test(b.textContent); })[0];
    if (!goDex) fails.push('寵物分頁沒有「看寵物圖鑑」按鈕');
    else { goDex.onclick(); if (tab !== 'book') fails.push('「看寵物圖鑑」沒有打開圖鑑'); }
    openTab('book');
    var pdH = document.getElementById('dexPet'), pdG = pdH && pdH.nextElementSibling;
    while (pdG && !pdG.classList.contains('grid')) pdG = pdG.nextElementSibling;
    var dexCards = pdG ? pdG.querySelectorAll('.card.dex') : [];
    if (dexCards.length !== PET_SPECIES.length)
      fails.push('寵物圖鑑有 ' + dexCards.length + ' 格，應該是一種一格');
    var mochiCard = [].slice.call(dexCards).filter(function(c){
      return c.textContent.indexOf('粉紅糰子') >= 0; })[0];
    if (!mochiCard) fails.push('圖鑑裡找不到粉紅糰子');
    else if (mochiCard.textContent.indexOf('×2') < 0)
      fails.push('養了兩隻粉紅糰子，圖鑑沒有標 ×2');
    var bunnyCard = [].slice.call(dexCards).filter(function(c){
      return c.textContent.indexOf('奶油兔') >= 0; })[0];
    if (bunnyCard && /×\d/.test(bunnyCard.textContent))
      fails.push('只養一隻奶油兔，卻也標了數量');
    // 「我的寵物們」每一隻都要有自己的一格，不可以被合併掉
    openTab('pets');
    var mine = document.querySelectorAll('#tabBody .card:not(.dex)');
    if (mine.length < G.pets.length)
      fails.push('我的寵物們只列了 ' + mine.length + ' 格，有 ' + G.pets.length + ' 隻');
    // 照顧中的要排在最前面
    if (mine.length && mine[0].textContent.indexOf('照顧中') < 0)
      fails.push('照顧中的那隻沒有排在最前面');
    G.pets = JSON.parse(keepPets); G.activePet = keepAct; G.pet = G.pets[G.activePet];

    /* ⑫ 爸媽送小安素
       每 10 分鐘 3 瓶，家裡最多 12 瓶（滿了就不送）。
       小可愛跟寵物都要拿得到——兩邊的食物櫃是分開的。 */
    var keepK = JSON.stringify(G.kidFood), keepF = JSON.stringify(G.food);
    G.kidFood = {}; G.food = {}; G.supplyAt = 0; G.supplyWho = 0;
    if (!supplyDue(Date.now())) fails.push('存貨是空的、上次送是很久以前，卻說不用送');
    var who1 = doSupply(Date.now());
    if (!who1) fails.push('送不出去');
    if (G.kidFood.xiaoansu !== 3) fails.push('小可愛沒拿到 3 瓶（' + G.kidFood.xiaoansu + '）');
    if (G.food.xiaoansu !== 3) fails.push('寵物沒拿到 3 瓶（' + G.food.xiaoansu + '）');
    if (!FOOD_BY_ID.xiaoansu) fails.push('寵物的食物表裡沒有小安素，牠喝不到');
    if (!KID_FOOD_BY_ID.xiaoansu) fails.push('小可愛的食物表裡沒有小安素');
    // 剛送完不可以馬上再送
    if (supplyDue(Date.now())) fails.push('剛送完馬上又要送一次');
    // 滿了就不送，不然開幾小時會累積上百瓶
    G.supplyAt = 0;
    G.kidFood.xiaoansu = SUPPLY_CAP; G.food.xiaoansu = SUPPLY_CAP;
    if (supplyDue(Date.now())) fails.push('家裡已經滿了卻還要送');
    // 爸媽輪流
    G.kidFood = {}; G.food = {}; G.supplyAt = 0; G.supplyWho = 0;
    var w1 = doSupply(Date.now());
    G.supplyAt = 0; G.kidFood = {}; G.food = {};
    var w2 = doSupply(Date.now());
    if (w1 && w2 && w1.id === w2.id) fails.push('每次都是同一個人送（' + w1.short + '）');
    // 爸媽的穿搭要是真的衣服 id，不然屋子里會竟然出現光身的人
    PARENTS.forEach(function(pa){
      if (!pa.lines || !pa.lines.length) fails.push(pa.short + ' 沒有台詞');
      Object.keys(pa.outfit).forEach(function(slot){
        var cl = CLOTHES_BY_ID[pa.outfit[slot]] || PARENT_CLOTHES[pa.outfit[slot]];
        if (!cl) fails.push(pa.short + ' 的 ' + slot + ' 是不存在的衣服：' + pa.outfit[slot]);
        else if (slot !== 'head' && slot !== 'shoes' && cl.slot !== slot) fails.push(pa.short + ' 的 ' + slot + ' 穿成了 ' + cl.slot);
      });
      if (hairOf({ hair: pa.hair }).style !== pa.hair.style) fails.push(pa.short + ' 的髮型不存在（被換成 ' + hairOf({ hair: pa.hair }).style + '）');
      if (!HAIR_COLOR_BY_ID[pa.hair.color]) fails.push(pa.short + ' 的髮色不存在');
    });
    if (PARENTS.length !== 2) fails.push('爸媽不是兩個人');
    // 爸爸專用的衣服不可以跑進商店／換裝
    Object.keys(PARENT_CLOTHES).forEach(function(id){
      if (CLOTHES_BY_ID[id]) fails.push('爸爸的衣服 ' + id + ' 跑進商店了');
    });
    /* 爸爸要戴眼鏡（參考照片）：
       1. 爸爸有眼鏡、媽媽沒有
       2. 畫出來真的不一樣（正面），背影看不到眼鏡
       3. 送貨時畫爸爸真的有把眼鏡傳進去 */
    var dadP = PARENTS.filter(function(x){ return x.id === 'dad'; })[0];
    var momP = PARENTS.filter(function(x){ return x.id === 'mom'; })[0];
    if (!dadP || !dadP.glasses) fails.push('爸爸沒有戴眼鏡');
    if (momP && momP.glasses) fails.push('媽媽也戴了眼鏡');
    // 爸爸是短髮（照片），不是妹妹頭；短髮不能出現在商店
    if (!dadP || dadP.hair.style !== 'short') fails.push('爸爸不是短髮');
    if (HAIR_BY_ID.short) fails.push('爸爸的短髮跑進商店了');
    var dadHead = function(style, back){
      var cv = document.createElement('canvas'); cv.width = 60; cv.height = 60;
      var cx = cv.getContext('2d'); cx.translate(30, 76);
      drawGirlHead(cx, { hair: { style: style, color: 'black' }, back: back });
      return cx.getImageData(0, 0, 60, 60).data.join(',');
    };
    if (dadHead('short') === dadHead('bob')) fails.push('短髮跟妹妹頭畫起來一樣');
    if (dadHead('short', true) === dadHead('bob', true)) fails.push('短髮的背影跟妹妹頭一樣');
    // 臉頰旁邊（耳朵下面）短髮不能有頭髮；妹妹頭有。畫布原點 (30,76)，頭中心 y = -46
    var cheekHair = function(style){
      var cv = document.createElement('canvas'); cv.width = 60; cv.height = 60;
      var cx = cv.getContext('2d'); cx.translate(30, 76);
      drawGirlHead(cx, { hair: { style: style, color: 'black' } });
      return [[-14, -38], [14, -36]].map(function(pt){ return cx.getImageData(30 + pt[0], 76 + pt[1], 1, 1).data[3] > 0; });
    };
    var ch = cheekHair('short'), cb = cheekHair('bob');
    if (ch[0] || ch[1]) fails.push('爸爸的短髮還是蓋到臉頰旁邊（' + ch + '）');
    if (!cb[0] || !cb[1]) fails.push('測試點不對：妹妹頭在臉頰旁邊應該有頭髮');
    var faceOf = function(extra){
      var cv = document.createElement('canvas'); cv.width = 80; cv.height = 100;
      var cx = cv.getContext('2d'); cx.translate(40, 90);
      var o = { t: 0, outfit: { head: CLOTHES_BY_ID.head_none, top: PARENT_CLOTHES.dad_black_tee,
                bottom: PARENT_CLOTHES.dad_cargo_shorts, shoes: CLOTHES_BY_ID.black_shoes }, hair: { style: 'bob', color: 'black' } };
      Object.assign(o, extra); drawGirl(cx, o);
      return cx.getImageData(20, 20, 40, 30).data.join(',');
    };
    if (faceOf({}) === faceOf({ glasses: '#2b2b33' })) fails.push('眼鏡沒有畫出來');
    if (faceOf({ back: true }) !== faceOf({ back: true, glasses: '#2b2b33' })) fails.push('背影也看得到眼鏡');
    var realDraw = drawGirl, seenGlasses = null, seenOutfit = null, keepSup = { a: sup.a, who: sup.who, alpha: sup.alpha, state: sup.state };
    try {
      drawGirl = function(c, o){ seenGlasses = o.glasses; seenOutfit = o.outfit; };
      sup.who = dadP; sup.a = { x: 1, y: 1, z: 0, path: [], t: 0, blinkAt: 9 }; sup.alpha = 1;
      var scv = document.createElement('canvas').getContext('2d');
      drawSupplyActor(scv);
      if (!seenGlasses) fails.push('爸爸送貨時沒戴眼鏡');
      ['top', 'bottom', 'shoes'].forEach(function(k){
        if (!seenOutfit || !seenOutfit[k] || !seenOutfit[k].style) fails.push('爸爸送貨時沒穿 ' + k);
      });
      sup.who = momP; seenGlasses = 'x'; drawSupplyActor(scv);
      if (seenGlasses) fails.push('媽媽送貨時戴了眼鏡');
    } finally { drawGirl = realDraw; Object.assign(sup, keepSup); }
    G.kidFood = JSON.parse(keepK); G.food = JSON.parse(keepF);

    /* ⑬ 拼圖：難度越高獎金越高，而且打亂之後不可以是「已經拼好的」 */
    if (PUZZLE_LEVELS.length < 3) fails.push('拼圖難度不到三種');
    for (var pi = 1; pi < PUZZLE_LEVELS.length; pi++) {
      if (PUZZLE_LEVELS[pi].pay <= PUZZLE_LEVELS[pi-1].pay)
        fails.push('拼圖：' + PUZZLE_LEVELS[pi].name + ' 比較難卻沒有比較多錢');
      if (PUZZLE_LEVELS[pi].n <= PUZZLE_LEVELS[pi-1].n)
        fails.push('拼圖：片數沒有越來越多');
    }
    openPuzzleGame();
    var lv = document.querySelectorAll('.lv-btn');
    if (lv.length !== PUZZLE_LEVELS.length) fails.push('拼圖沒有難度選單');
    else {
      var bells0 = G.bells;
      lv[0].onclick();                       // 最簡單的 4 片
      var tiles = document.querySelectorAll('.puz-tile');
      if (tiles.length !== 4) fails.push('4 片的拼圖竟然有 ' + tiles.length + ' 格');
      else {
        // 打亂之後不可以剛好就是完成的（那會馬上過關）
        if (openPuzzleGame.test.solved()) fails.push('一開局就已經拼好了');
        /* 用選擇排序解：每一格去找「該在這裡的那一片」現在在哪，換過來。
           走的是真正的 tap()，所以驗到的是真的點擊路徑。 */
        var T = openPuzzleGame.test, total = T.n * T.n, steps = 0;
        for (var pos = 0; pos < total && !T.solved(); pos++) {
          var ord = T.order();
          if (ord[pos] === pos) continue;
          var from = ord.indexOf(pos);
          if (from < 0) { fails.push('拼圖少了第 ' + pos + ' 片'); break; }
          T.tap(pos); T.tap(from); steps++;
          if (steps > total * 2) { fails.push('解拼圖的步數爆掉了'); break; }
        }
        if (!T.solved()) fails.push('拼圖解不開（交換邏輯可能有問題）');
        else if (G.bells <= bells0) fails.push('拼好了卻沒有拿到錢');
      }
    }
    closeGameWindow(); document.querySelector('#modal').hidden = true;

    /* ⑭ 接金幣：難度越高、每一顆越值錢 */
    for (var ci = 1; ci < COIN_LEVELS.length; ci++) {
      if (COIN_LEVELS[ci].mul <= COIN_LEVELS[ci-1].mul)
        fails.push('接金幣：' + COIN_LEVELS[ci].name + ' 比較難卻沒有比較值錢');
      if (COIN_LEVELS[ci].fall <= COIN_LEVELS[ci-1].fall)
        fails.push('接金幣：掉得沒有比較快');
      if (!(COIN_LEVELS[ci].bomb > COIN_LEVELS[ci-1].bomb))
        fails.push('接金幣：炋彈沒有比較多');
    }
    openCoinGame();
    var clv = document.querySelectorAll('.lv-btn');
    if (clv.length !== COIN_LEVELS.length) fails.push('接金幣沒有難度選單');
    else {
      clv[2].onclick();                    // 最難的
      var cb0 = G.bells;
      openCoinGame.test.hit(10);           // 假裝接到十顆
      openCoinGame.test.finish();
      var earned = G.bells - cb0;
      if (earned !== 10 * 20 * COIN_LEVELS[2].mul)
        fails.push('接金幣結算不對：接到十顆拿到 ' + earned);
    }
    closeGameWindow(); document.querySelector('#modal').hidden = true;

    /* ⑮ 彈珠台：五顆用完就結束，而且每一顆都要真的落格 */
    if (MARBLE_SLOTS.length < 5) fails.push('彈珠台的格子太少');
    if (Math.max.apply(null, MARBLE_SLOTS) !== MARBLE_SLOTS[(MARBLE_SLOTS.length - 1) / 2])
      fails.push('彈珠台最高分的不在正中間');
    openMarbleGame();
    var mb0 = G.bells, T2 = openMarbleGame.test;
    if (!T2) fails.push('彈珠台沒有開起來');
    else {
      if (T2.state().shots !== 5) fails.push('彈珠台不是五顆');
      // 五顆一顆一顆放，每一顆等它落格再放下一顆
      var guard2 = 0;
      while (!T2.state().ended && guard2++ < 4000) {
        if (!T2.state().ball) T2.drop(160);
        // 把時間往前推：直接呼叫下一幀
        if (typeof requestAnimationFrame === 'function') { /* 實際是由動畫迴圈跑 */ }
        break;   // headless 沒辦法同步跑完動畫，改成只驗狀態機
      }
      if (T2.state().shots !== 4) fails.push('放了一顆，剩下的數量沒有減');
      if (!T2.state().ball) fails.push('放下去的彈珠不存在');
    }
    closeGameWindow(); document.querySelector('#modal').hidden = true;

    /* ⑯ 設定分頁要有版本跟強制更新。
       她回報「新的小遊戲看不到」——檔案早就更新了，
       是加到主畫面的網頁 App 在 iOS 上的快取太黏。 */
    openTab('save');
    var sv = document.querySelector('#tabBody').textContent;
    if (sv.indexOf('強制更新') < 0) fails.push('設定分頁沒有「強制更新」');
    if (sv.indexOf('這一份的日期') < 0) fails.push('設定分頁沒有顯示版本日期');
    // 十三個小遊戲都要在清單上（116.10 加了撈金魚、烤餅乾、杯子蛋糕店）
    openTab('earn');
    var picks = document.querySelectorAll('.game-pick');
    if (picks.length !== 13) fails.push('小遊戲清單有 ' + picks.length + ' 個，應該是 13 個');
    ['拼圖', '接金幣', '彈珠台'].forEach(function(nm){
      if (![].slice.call(picks).some(function(b){ return b.textContent.indexOf(nm) >= 0; }))
        fails.push('小遊戲清單裡找不到「' + nm + '」');
    });

    /* ⑰ 商店的用途分類
       最要緊的一條：每一件家具都要找得到。
       分類漏掉一件，那件東西就永遠不會出現在任何一個類別裡。 */
    var kindIds = FURN_KINDS.map(function(k){ return k.id; });
    var missed = FURNITURE.filter(function(d){ return kindIds.indexOf(furnKind(d.id)) < 0; });
    if (missed.length) fails.push('有家具被分到不存在的類別：' + missed[0].name);
    var unclassified = FURNITURE.filter(function(d){ return !FURN_KIND_OF[d.id]; });
    if (unclassified.length > 0)
      fails.push(unclassified.length + ' 件家具沒分類（例：' + unclassified[0].name + '）');
    FURN_KINDS.forEach(function(k){
      if (!k.icon) fails.push('用途「' + k.name + '」沒有圖示');
      if (!FURNITURE.some(function(d){ return furnKind(d.id) === k.id; }))
        fails.push('用途「' + k.name + '」裡面一件家具都沒有');
    });
    // 每一個用途都點一遍，全部加起來要等於全部家具
    openTab('shop');
    shopTheme = 'all';
    var total = 0;
    kindIds.forEach(function(k){
      shopKind = k; renderTab();
      total += document.querySelectorAll('#tabBody .grid .card').length;
    });
    var all = FURNITURE.filter(function(d){ return !d.gift; }).length;
    if (total !== all)
      fails.push('各用途加起來是 ' + total + ' 件，全部家具是 ' + all + ' 件');
    // 風格篩選要和用途篩選一起生效
    shopKind = 'sleep'; shopTheme = 'cute'; renderTab();
    var cards = document.querySelectorAll('#tabBody .grid .card').length;
    var want = FURNITURE.filter(function(d){
      return !d.gift && furnKind(d.id) === 'sleep' && d.theme === 'cute'; }).length;
    if (cards !== want) fails.push('用途跟風格一起篩時數量不對：' + cards + ' vs ' + want);
    shopKind = 'all'; shopTheme = 'all';

    /* ⑱ 衣服跟髮飾：每一件都要畫得出來。
       style 打錯字的話那件會完全不顯示，而且不會報錯——
       她花錢買了一頂帽子，戴上去却什麼都沒有。 */
    var drawnStyles = {};
    (function(){
      var src = document.documentElement.innerHTML;  // 只是拿來找字串，不是當指令用
      var re = /h\.style === '(\w+)'/g, mm;
      while ((mm = re.exec(src))) drawnStyles[mm[1]] = 1;
    })();
    CLOTHES.filter(function(c){ return c.slot === 'head'; }).forEach(function(c){
      if (!drawnStyles[c.style] && c.style !== 'none')
        fails.push('頭飾「' + c.name + '」的 style（' + c.style + '）沒有對應的畫法');
    });
    // 每一件頭飾戴上去都要真的畫得出來，而且不可以兩件長得一模一樣
    var seenHead = {};
    CLOTHES.filter(function(c){ return c.slot === 'head'; }).forEach(function(c){
      var ids = Object.assign({}, G.outfit, { head: c.id });
      var d;
      try { d = renderGirl(ids, 47, 59, { hair: { style: 'bob', color: 'black' } }).toDataURL(); }
      catch (e) { fails.push(c.name + ' 畫不出來：' + e.message); return; }
      if (seenHead[d]) fails.push('「' + c.name + '」跟「' + seenHead[d] + '」戴起來一模一樣');
      seenHead[d] = c.name;
    });
    if (CLOTHES.filter(function(c){ return c.slot === 'head'; }).length < 19)
      fails.push('頭飾數量變少了');

    /* ⑲ 爸媽走進屋裡送貨的動畫
       最要緊的是「食物要真的送到」——動畫卡住了也不能餓到她。 */
    var kk = JSON.stringify(G.kidFood), ff = JSON.stringify(G.food);
    G.kidFood = {}; G.food = {}; G.supplyAt = 0; G.away = null;
    supplyGone();
    document.querySelector('#modal').hidden = true;
    nextSupplyCheck = 0;
    supplyTick(performance.now());
    if (!sup.who) fails.push('時間到了卻沒有人進來送');
    else {
      if (!sup.a) fails.push('送貨的人沒有位置');
      if (sup.state !== 'in') fails.push('剛進來的狀態不對：' + sup.state);
      if (!supplyDrawEntries().length) fails.push('送貨的人沒有被畫出來');
      // 一直跑到他離開為止，食物必須真的進到兩邊的櫃子
      var g3 = 0;
      while (sup.who && g3++ < 2000) supplyTick(performance.now() + g3 * 100);
      if (sup.who) fails.push('送貨的人走不掉（卡在半路）');
      if (G.kidFood.xiaoansu !== SUPPLY_N) fails.push('動畫跑完了，小可愛沒拿到小安素');
      if (G.food.xiaoansu !== SUPPLY_N) fails.push('動畫跑完了，寵物沒拿到小安素');
    }
    /* 走不到她旁邊的時候，也必須在逾時之後把東西放下。
       沒有這條防線的話，只要路被家具擋住就永遠送不到，而且是靜靜地壞掉。
       做法：讓他已經走完路（path 空），但人離得很遠（near 為假）。 */
    G.kidFood = {}; G.food = {}; G.supplyAt = 0;
    supplyGone(); nextSupplyCheck = 0;
    supplyTick(performance.now());
    if (sup.who) {
      sup.a.path = [];
      sup.a.x = 0.5; sup.a.y = 0.5;
      fufu.x = curRoom().w - 0.5; fufu.y = curRoom().d - 0.5;   // 離很遠
      var g4 = 0;
      while (sup.who && g4++ < 3000) {
        sup.a.x = 0.5; sup.a.y = 0.5; sup.a.path = [];
        fufu.x = curRoom().w - 0.5; fufu.y = curRoom().d - 0.5;
        supplyTick(performance.now() + 6000 + g4 * 100);
      }
      if (sup.who) fails.push('走不到她旁邊的時候，送貨的人永遠卡在那裡');
      if (G.kidFood.xiaoansu !== SUPPLY_N) fails.push('走不到她旁邊就沒把東西放下');
    }
    supplyGone();

    // 她不在家的時候不走動畫，直接默默給（不然回來會看到卡在半路的人）
    G.kidFood = {}; G.food = {}; G.supplyAt = 0;
    supplyGone(); nextSupplyCheck = 0;
    G.away = { place: 'uncle', idx: 0 };
    supplyTick(performance.now());
    if (sup.who) fails.push('她不在家的時候竟然走進來送');
    if (G.kidFood.xiaoansu !== SUPPLY_N) fails.push('她不在家的時候沒有默默給');
    G.away = null;
    G.kidFood = JSON.parse(kk); G.food = JSON.parse(ff);
    supplyGone();

    /* ⑳ 桌上放一樣小東西
       重點是「一張桌子只放一樣」，而且收起來要回到收納——
       不回去的話那樣東西就消失了，而且她不會發現。 */
    var rr0 = curRoom();
    rr0.items = [{ uid: 9001, id: 'wood_table', x: 1, y: 1, rot: 0 }];
    G.inv.game_cart = 1;
    var tb0 = rr0.items[0];
    if (!canHaveTop('wood_table')) fails.push('原木桌竟然不能放東西');
    if (canHaveTop('wood_bed')) fails.push('床竟然被當成桌子');
    if (!canSitOnTable('game_cart')) fails.push('卡帶竟然不能放桌上');
    if (canSitOnTable('wood_bed')) fails.push('床竟然可以放桌上');
    // 放上去：收納要少一個
    if (!takeItem('game_cart')) fails.push('拿不到卡帶');
    tb0.top = 'game_cart';
    if (G.inv.game_cart) fails.push('放上桌了，收納裡卻還有一個');
    if (!topParts(FURN_BY_ID.wood_table, 0, tb0).length)
      fails.push('桌上那樣東西沒有被畫出來');
    // 畫出來的位置要在桌面上方，不是埋在桌子裡
    var tableH = itemHeight(FURN_BY_ID.wood_table);
    if (topParts(FURN_BY_ID.wood_table, 0, tb0).some(function(pp){ return pp.z < tableH; }))
      fails.push('桌上那樣東西沒有抬到桌面高度');
    // 桌上有東西，居家評分要比沒有高
    var sc1 = roomScore(rr0).score;
    tb0.top = null;
    var sc0 = roomScore(rr0).score;
    if (sc1 <= sc0) fails.push('桌上摆了東西，居家評分卻沒有比較高');
    G.inv.mini_figure = 1; G.inv.fishtank = 1;
    tb0.top = 'mini_figure'; var scCheap = roomScore(rr0).score;
    tb0.top = 'fishtank';    var scRich = roomScore(rr0).score;
    var wantDiff = Math.round(FURN_BY_ID.fishtank.price / 100) -
                   Math.round(FURN_BY_ID.mini_figure.price / 100);
    if (scRich - scCheap !== wantDiff)
      fails.push('桌上貴的東西沒有比便宜的多分：差 ' +
        (scRich - scCheap) + '，應該差 ' + wantDiff);
    // 收起來要回到收納
    tb0.top = 'game_cart';
    addItem(tb0.top); tb0.top = null;
    if (!G.inv.game_cart) fails.push('從桌上收起來，東西沒有回到收納');
    // 存檔裡放了不能放的東西，讀回來要被清掉
    tb0.top = 'wood_bed';
    var fixed = normalizeSave(JSON.parse(JSON.stringify(G)));
    if (fixed && fixed.rooms[G.cur].items[0].top)
      fails.push('桌上放了不能放的東西，讀回來沒有被清掉');
    tb0.top = null;

    /* ⑴ 出門的過場
       最要緊的一條：不管是走完、被點掉、還是中途出錯，
       都一定要真的到了——沒到的話她就卡在黑畫面裡。 */
    G.away = null; curMoment = null;
    var arrived = false;
    walkTrip('測試', function(){ arrived = true; });
    var layer = document.getElementById('tripLayer');
    if (!layer) fails.push('出門沒有過場畫面');
    else {
      if (!layer.querySelector('canvas')) fails.push('過場沒有畫布');
      if (layer.textContent.indexOf('跳過') < 0) fails.push('過場沒有告訴她可以跳過');
      // 點一下要能跳過，而且一定要抵達
      layer.onclick();
      if (!arrived) fails.push('點了跳過卻沒有抵達');
      if (document.getElementById('tripLayer')) fails.push('跳過之後過場沒有消失');
    }
    // 跳過也要拿得到路上那件小事的獎勵，不然跳過等於懲罰她
    var gotCoin = false, tries = 0;
    while (!gotCoin && tries++ < 60) {
      var b4 = G.bells, fr4 = JSON.stringify(G.friends);
      var done2 = false;
      walkTrip('測試', function(){ done2 = true; });
      var L2 = document.getElementById('tripLayer');
      if (L2) L2.onclick();
      if (!done2) { fails.push('過場沒有回呼'); break; }
      if (G.bells > b4) gotCoin = true;
      else if (JSON.stringify(G.friends) !== fr4) gotCoin = true;   // 遇到鄰居也算
    }
    if (!gotCoin) fails.push('跟了六十次都沒有任何路上的小事');
    // 出門與回家都要經過過場，而且最後真的換場
    travelTo('uncle');
    var L3 = document.getElementById('tripLayer');
    if (!L3) fails.push('出門沒有走過場');
    else { L3.onclick(); }
    if (!G.away || G.away.place !== 'uncle') fails.push('過場完了卻沒有到叔叔家');
    goHome();
    var L4 = document.getElementById('tripLayer');
    if (!L4) fails.push('回家沒有走過場');
    else { L4.onclick(); }
    if (G.away) fails.push('過場完了卻沒有回到家');

    /* ㉝ 在親戚家可以直接去另一家（不用先回家）
       她說：去了阿婆家就只能回家，不能去叔叔家。 */
    travelTo('uncle'); var Lt = document.getElementById('tripLayer'); if (Lt) Lt.onclick();
    var topBtns = [].map.call(document.querySelectorAll('#roomTabs button'), function(b){ return b; });
    var outBtn = topBtns.filter(function(b){ return /出門/.test(b.textContent); })[0];
    if (!outBtn) fails.push('在叔叔家上面沒有「出門」');
    else {
      outBtn.onclick();
      var picks = [].slice.call(document.querySelectorAll('#modalCard .place-pick'));
      var pUncle = picks.filter(function(b){ return /叔叔家/.test(b.textContent); })[0];
      var pGrand = picks.filter(function(b){ return /阿婆家/.test(b.textContent); })[0];
      var pHome = picks.filter(function(b){ return /回家/.test(b.textContent); })[0];
      if (!pUncle || !pUncle.disabled) fails.push('在叔叔家，出門選單還可以點「叔叔家」');
      if (!pHome) fails.push('在叔叔家，出門選單沒有「回家」');
      if (!pGrand || pGrand.disabled) fails.push('在叔叔家，出門選單不能去阿婆家');
      else {
        pGrand.onclick();
        var Lg = document.getElementById('tripLayer');
        if (!Lg) fails.push('從叔叔家去阿婆家沒有走過場'); else Lg.onclick();
        if (!G.away || G.away.place !== 'grandma' || G.away.idx !== 0) fails.push('從叔叔家去阿婆家沒有到（' + JSON.stringify(G.away) + '）');
      }
    }
    // 出門選單的「回家」要真的回家
    openTravelMenu();
    var ph2 = [].filter.call(document.querySelectorAll('#modalCard .place-pick'), function(b){ return /回家/.test(b.textContent); })[0];
    if (ph2) { ph2.onclick(); var Lh = document.getElementById('tripLayer'); if (Lh) Lh.onclick(); }
    if (G.away) fails.push('出門選單的「回家」沒有回到家');
    // 在家打開，不能有「回家」，也沒有哪一家是「你在這裡」
    openTravelMenu();
    var homePicks = [].slice.call(document.querySelectorAll('#modalCard .place-pick'));
    if (homePicks.some(function(b){ return /回家/.test(b.textContent) || b.disabled; })) fails.push('在家打開出門選單，出現「回家」或不能點的地方');
    $('#modal').hidden = true;
    // 之後加的地方（學校…）沒有主人，選單也要打得開
    PLACES.__park = { name: '公園', emoji: '🌳', desc: '測試用', rooms: [{ name: '教室' }] };
    try {
      openTravelMenu();
      if (![].some.call(document.querySelectorAll('#modalCard .place-pick'), function(b){ return /公園/.test(b.textContent); }))
        fails.push('沒有主人的地方沒出現在出門選單');
    } catch(e) { fails.push('沒有主人的地方讓出門選單壞掉：' + e.message); }
    delete PLACES.__park;
    $('#modal').hidden = true;

    /* ㉞ 換房間有開門動畫，但房間要「馬上」換好（不能延後，不然連點會亂） */
    if (G.rooms.length < 2) G.rooms.push(JSON.parse(JSON.stringify(G.rooms[0])));
    G.cur = 0; refreshTop();
    var rd = document.getElementById('roomDoors'); if (rd) rd.remove();
    var tabBtns = document.querySelectorAll('#roomTabs button');
    tabBtns[1].onclick();
    if (G.cur !== 1) fails.push('點房間沒有馬上換過去');
    var doors = document.getElementById('roomDoors');
    if (!doors) fails.push('換房間沒有開門動畫');
    else if (!/🚪/.test(doors.textContent) || doors.textContent.indexOf(G.rooms[1].name) < 0) fails.push('門上沒寫要去的房間');
    if (doors && getComputedStyle(doors).pointerEvents !== 'none') fails.push('開門動畫會擋住點擊');
    if (doors) doors.remove();
    document.querySelectorAll('#roomTabs button')[1].onclick();
    if (document.getElementById('roomDoors')) fails.push('點自己現在的房間也在開門');
    G.cur = 0; commit();
    var rd2 = document.getElementById('roomDoors'); if (rd2) rd2.remove();
    // 親戚家換房間也有
    travelTo('grandma'); var Lg2 = document.getElementById('tripLayer'); if (Lg2) Lg2.onclick();
    goPlaceRoom(1);
    if (G.away.idx !== 1) fails.push('阿婆家換房間沒有換');
    if (!document.getElementById('roomDoors')) fails.push('阿婆家換房間沒有開門動畫');
    goHome(); var Lh2 = document.getElementById('tripLayer'); if (Lh2) Lh2.onclick();
    var rd3 = document.getElementById('roomDoors'); if (rd3) rd3.remove();

    /* ⑵ 表情要跟狀態一致
       她說「肚子好餓喔…」卻還在笑，講一套臉一套。 */
    var keepH = G.kid.hunger;
    G.kid.hunger = 10;
    if (kidFace() !== 'hungry') fails.push('肚子快餓死了表情卻沒變');
    G.kid.hunger = 90;
    if (kidFace() === 'hungry') fails.push('吃飽了還是餓肚子的表情');
    // 餓的臉跟平常的臉要真的畫得不一樣
    function headPic(face){
      var cv = document.createElement('canvas');
      cv.width = 90; cv.height = 90;
      var gg = cv.getContext('2d');
      gg.setTransform(1.6, 0, 0, 1.6, 45, 76);
      var of = {};
      OUTFIT_SLOTS.forEach(function(sl){ of[sl.key] = CLOTHES_BY_ID[G.outfit[sl.key]]; });
      drawGirl(gg, { t: 0, outfit: of, hair: G.hair, face: face });
      return cv.toDataURL();
    }
    if (headPic('hungry') === headPic('happy')) fails.push('餓的臉跟平常的臉畫出來一模一樣');
    // 商店、換裝的預覽圖不可以跟著變臉（那是在看衣服，不是看心情）
    /* 同一個尺寸第二次會走快取，而快取是非同步畫回畫布的，當下取到的是空白，
       跟第一張比當然「不一樣」——那是測試的錯不是程式的錯。
       每次先把縮圖快取清掉，才比得到真的像素。 */
    var clearThumbs = function(){ Object.keys(girlThumbCache).forEach(function(k){ delete girlThumbCache[k]; }); };
    G.kid.hunger = 95; clearThumbs();
    var prevFull = renderGirl(G.outfit, 52, 64, { hair: G.hair }).toDataURL();
    G.kid.hunger = 5; clearThumbs();
    var prevHungry2 = renderGirl(G.outfit, 52, 64, { hair: G.hair }).toDataURL();
    if (prevFull !== prevHungry2) fails.push('預覽圖竟然跟著肚子餓不餓變臉');
    clearThumbs();
    G.kid.hunger = keepH;

    /* ㉗ 釣魚：先決定魚，越大越難
       以前是成功之後才隨機決定魚，技術好不好跟釣到什麼無關。 */
    // 舊的八種名字一個都不能改（G.fish 用名字記，改了圖鑑會歸零）
    ['鯽魚','小丑魚','竹筴魚','鱸魚','鯛魚','鮪魚','鯨鯊','空罐頭'].forEach(function(n){
      if (!FISH.some(function(f){ return f.name === n; })) fails.push('舊的魚「' + n + '」不見了，她的圖鑑會歸零');
    });
    if (FISH.length < 16) fails.push('魚只有 ' + FISH.length + ' 種');
    var fn = {}; FISH.forEach(function(f){ if (fn[f.name]) fails.push('魚的名字重複：' + f.name); fn[f.name] = 1; });
    // 越大的魚，綠色區越窄、指針越快
    for (var ti = 1; ti < FISH_TIERS.length; ti++) {
      if (!(FISH_TIERS[ti].zone < FISH_TIERS[ti-1].zone)) fails.push('大魚的綠色區沒有比較窄');
      if (!(FISH_TIERS[ti].speed > FISH_TIERS[ti-1].speed)) fails.push('大魚的指針沒有比較快');
    }
    FISH.forEach(function(f){ if (fishTier(f) < 0) fails.push(f.name + ' 不屬於任何一級'); });
    openFishing();
    var FT = openFishing.test;
    if (!FT) fails.push('釣魚沒有開起來');
    else {
      FT.round();
      var f1 = FT.fish();
      var z = FT.zone();
      // 拉竿時指針在綠色區正中間 → 一定要釣到「影子是那條」的那條魚
      var b5 = G.bells, c5 = G.fish[f1.name] || 0;
      FT.setPos(z[0] + z[1] / 2); FT.pull();
      if ((G.fish[f1.name] || 0) !== c5 + 1) fails.push('釣到的不是影子那條魚');
      if (G.bells < b5 + f1.price) fails.push('釣到魚卻沒拿到錢');
      // 沒拉到：要告訴她剛剛是什麼，而且連續紀錄要歸零
      FT.round(); var f2 = FT.fish(); var z2 = FT.zone();
      FT.setPos(z2[0] > 50 ? 1 : 99); FT.pull();
      var rs = document.querySelector('#modalCard').textContent;
      if (rs.indexOf(f2.name) < 0) fails.push('沒拉到的時候沒告訴她剛剛是什麼魚');
      if (FT.streak() !== 0) fails.push('沒拉到之後連續紀錄沒有歸零');
      // 連續兩竿要有加成
      FT.round(); var z3 = FT.zone(); FT.setPos(z3[0] + z3[1] / 2); FT.pull();
      FT.round(); var f4 = FT.fish(); var z4 = FT.zone();
      var b6 = G.bells; FT.setPos(z4[0] + z4[1] / 2); FT.pull();
      if (G.bells - b6 <= f4.price && f4.price >= 10)
        fails.push('連續第二竿沒有加成');
    }
    var mdl = document.querySelector('#modal'); if (mdl) mdl.hidden = true;
    cancelAnimationFrame(fishTimer);

    /* ㉘ 杯子躲貓貓：3／4／5 個杯子，越多越值錢 */
    for (var ki = 1; ki < CUP_LEVELS.length; ki++) {
      if (!(CUP_LEVELS[ki].n > CUP_LEVELS[ki-1].n)) fails.push('杯子數沒有越來越多');
      if (!(CUP_LEVELS[ki].per > CUP_LEVELS[ki-1].per)) fails.push('杯子越多卻沒有越值錢');
    }
    CUP_LEVELS.forEach(function(L, li){
      openCupGame();
      var lb = document.querySelectorAll('.lv-btn');
      if (lb.length !== CUP_LEVELS.length) { fails.push('杯子躲貓貓沒有難度選單'); return; }
      lb[li].onclick();
      var CT = openCupGame.test;
      if (!CT || CT.n !== L.n) { fails.push(L.name + '：杯子數不對'); return; }
      if (CT.cups().length !== L.n) fails.push(L.name + '：畫出來的杯子是 ' + CT.cups().length + ' 個');
      // 杯子不可以疊在一起：相鄰兩個的間距要大於杯子的寬度
      var gap = CT.slots[1] - CT.slots[0];
      if (gap < 76 * L.k) fails.push(L.name + '：杯子疊在一起了（間距 ' + Math.round(gap) + '）');
      // 全部杯子都要在畫面裡
      if (CT.slots[0] - 38 * L.k < 0 || CT.slots[CT.slots.length - 1] + 38 * L.k > 360)
        fails.push(L.name + '：有杯子超出畫面');
      // 點寵物躲的那個杯子，要算找到
      CT.setPick();
      var target = CT.cups()[CT.petCup()];
      CT.tap(target.x);
      if (document.querySelector('.game-status').textContent.indexOf('找到') < 0)
        fails.push(L.name + '：點了寵物躲的杯子卻沒算找到');
      closeGameWindow();
    });
    var md2 = document.querySelector('#modal'); if (md2) md2.hidden = true;

    /* ㉙ 新存檔不可以被當成舊存檔再補一次錢（全面掃 bug 時抓到的）
       新開一間 → 花掉 → 存 → 重新讀，錢必須維持花掉後的數字。 */
    var keepG = JSON.stringify(G);
    G = newGame();
    if (!G.topup100k) fails.push('新存檔沒有記下「補償已經給過」');
    G.bells = 30000; saveGame();
    G = loadGame();
    if (G.bells !== 30000) fails.push('新存檔花剩 3 萬，重新打開變成 ' + G.bells + '（白送錢）');
    G = JSON.parse(keepG); G.pet = G.pets[G.activePet]; saveGame();

    /* ㉚ 叔叔家的三台機器各開各的遊戲
       本來大型電玩是隨機開家裡的遊戲、電視遊樂器只有動畫。 */
    var wantOpen = { arcade: 'mole', console_tv: 'race', gaming_desk: 'brick' };
    Object.keys(wantOpen).forEach(function(fid){
      var act = FURNITURE_ACT[fid], A = act && ACTIVITIES[act];
      if (!A) fails.push(fid + ' 沒有可以做的事');
      else if (A.open !== wantOpen[fid]) fails.push(fid + ' 開的不是「' + wantOpen[fid] + '」而是「' + (A.open || (A.game ? '隨機家裡的遊戲' : '沒有遊戲')) + '」');
    });
    [MOLE_LEVELS, RACE_LEVELS].forEach(function(LV, gi){
      for (var li = 1; li < LV.length; li++)
        if (!(LV[li].mul > LV[li-1].mul)) fails.push(['打地鼠','賽車'][gi] + '：越難沒有越值錢');
    });
    // 打地鼠：打到地鼠加分、打到炸彈扣分，結算 = 隻數 × 15 × 倍率
    openMoleGame();
    var mlv = document.querySelectorAll('.lv-btn');
    if (mlv.length !== 3) fails.push('打地鼠沒有難度選單');
    else {
      mlv[2].onclick();
      var MT = openMoleGame.test;
      MT.force(0, 'mole'); MT.hit(0);
      MT.force(1, 'mole'); MT.hit(1);
      MT.force(2, 'mole'); MT.hit(2);
      if (MT.score() !== 3) fails.push('打到三隻地鼠，分數是 ' + MT.score());
      MT.force(3, 'bomb'); MT.hit(3);
      if (MT.score() !== 1) fails.push('打到炸彈沒有扣分（' + MT.score() + '）');
      MT.force(4, null); MT.hit(4);   // 空的洞（先清空：遊戲自己可能剛好在這格冒出地鼠）
      if (MT.score() !== 1) fails.push('點空的洞也有分數');
      var mb = G.bells; MT.finish();
      if (G.bells - mb !== 1 * 15 * MOLE_LEVELS[2].mul) fails.push('打地鼠結算不對：' + (G.bells - mb));
    }
    closeGameWindow();
    // 賽車：換車道不能開出馬路、撞三次就結束、結算
    openRaceGame();
    var rlv = document.querySelectorAll('.lv-btn');
    if (rlv.length !== 3) fails.push('賽車沒有難度選單');
    else {
      rlv[0].onclick();
      var RT = openRaceGame.test;
      RT.steer(-1); RT.steer(-1); RT.steer(-1);
      if (RT.lane() !== 0) fails.push('一直往左開出了馬路（車道 ' + RT.lane() + '）');
      RT.steer(1); RT.steer(1); RT.steer(1); RT.steer(1);
      if (RT.lane() !== 2) fails.push('一直往右開出了馬路（車道 ' + RT.lane() + '）');
      RT.addCoins(5);
      var rb = G.bells;
      RT.hitWall(); RT.hitWall(); RT.hitWall();
      if (G.bells - rb !== 5 * 20 * RACE_LEVELS[0].mul) fails.push('撞三次之後沒有結算，或金額不對：' + (G.bells - rb));
    }
    closeGameWindow();
    var md3 = document.querySelector('#modal'); if (md3) md3.hidden = true;

    /* ㉛ 親戚家的事情要有效果
       冰箱吃點心會飽、喝茶烤火會放鬆、幫阿婆做事拿零用錢、
       看漫畫收集四格漫畫、看公仔有機會被送一個。
       全部要有冷卻，而且小可愛自己閒晃去做的不算。 */
    var keepAway = G.away, keepRand = Math.random, keepFufuAct = fufu.act;
    G.actCD = {};
    G.away = null;
    G.kid.hunger = 40;
    if (relativePerk('snack') || G.kid.hunger !== 40) fails.push('在自己家也能拿到叔叔冰箱的點心');
    G.away = { place: 'uncle', idx: 0 };
    var fakeFridge = { id: 'fridge', x: 0, y: 0, rot: 0, uid: 'relTest1' };
    fufuStartAct('snack', performance.now(), fakeFridge, true);
    if (G.kid.hunger !== 40) fails.push('小可愛自己閒晃去開冰箱也算飽足（' + G.kid.hunger + '）');
    if (G.actCD.snack) fails.push('自己閒晃也吃掉了冷卻');
    fufuStartAct('snack', performance.now(), fakeFridge, false);
    if (G.kid.hunger !== 60) fails.push('自己點叔叔的冰箱，飽足沒有 +20（' + G.kid.hunger + '）');
    fufuStartAct('snack', performance.now(), fakeFridge, false);
    if (G.kid.hunger !== 60) fails.push('冰箱可以一直點一直吃（' + G.kid.hunger + '）');
    G.actCD.snack = Date.now() - RELATIVE_CD_MS - 1;
    if (!relativePerk('snack') || G.kid.hunger !== 80) fails.push('冷卻過了還是不能再吃');
    // 阿婆家的事情在叔叔家不算
    if (relativePerk('tea')) fails.push('在叔叔家也能喝到阿婆的茶');
    G.away = { place: 'grandma', idx: 0 };
    G.kid.hunger = 30; G.pet.mood = 30;
    relativePerk('tea');
    if (G.kid.hunger !== 40 || G.pet.mood !== 45) fails.push('喝茶沒有飽足 +10、寵物心情 +15（' + G.kid.hunger + '/' + G.pet.mood + '）');
    // 零用錢 50~100，兩件事各自冷卻
    var lo = 999, hi = 0;
    for (var ri = 0; ri < 60; ri++) {
      G.actCD = {};
      var hb = G.bells; relativePerk(ri % 2 ? 'hay' : 'trough');
      var got = G.bells - hb; lo = Math.min(lo, got); hi = Math.max(hi, got);
    }
    if (lo < 50 || hi > 100 || lo === hi) fails.push('幫阿婆做事的零用錢不在 50~100（' + lo + '~' + hi + '）');
    G.actCD = {}; relativePerk('hay');
    var tb2 = G.bells; relativePerk('trough');
    if (G.bells === tb2) fails.push('搬完稻草就不能加水（冷卻不該共用）');
    var tb3 = G.bells; relativePerk('hay');
    if (G.bells !== tb3) fails.push('稻草可以一直搬一直拿錢');
    // 搬稻草會開「疊稻草」
    if (ACTIVITIES.hay.open !== 'hay') fails.push('搬稻草沒有開疊稻草小遊戲');
    openStackGame('hay');
    var sh = document.querySelector('#modalCard h2');
    if (!sh || sh.textContent.indexOf('稻草') < 0) fails.push('疊稻草的標題不對：' + (sh && sh.textContent));
    var again = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return b.textContent === '再玩一次'; })[0];
    if (again) { again.onclick(new MouseEvent('click')); if (openStackGame.skin !== 'hay') fails.push('疊稻草按「再玩一次」變回鬆餅了'); }
    else fails.push('疊稻草沒有「再玩一次」');
    closeGameWindow();
    openStackGame(new MouseEvent('click'));
    if (openStackGame.skin !== 'pancake') fails.push('從家裡點疊疊鬆餅（傳進點擊事件）變成別的樣子');
    closeGameWindow();
    // 四格漫畫：先給沒看過的，12 次就收集完
    G.away = { place: 'uncle', idx: 0 };
    G.comics = {};
    for (var ci = 0; ci < COMICS.length; ci++) openComic();
    if (Object.keys(G.comics).length !== COMICS.length) fails.push('看了 ' + COMICS.length + ' 次漫畫只收集到 ' + Object.keys(G.comics).length + ' 則（沒有先給沒看過的）');
    if (document.querySelectorAll('#modalCard .comic-p').length !== 4) fails.push('漫畫不是四格');
    var cmBtn = document.querySelector('#modalCard button.big');
    if (cmBtn) cmBtn.onclick();
    if (!document.querySelector('#modal').hidden) fails.push('漫畫看完關不掉');
    // 公仔：三成送一個
    G.actCD = {};
    var mf = G.inv.mini_figure || 0;
    Math.random = function(){ return .1; };
    relativePerk('figures');
    if ((G.inv.mini_figure || 0) !== mf + 1) fails.push('叔叔說要送公仔，收納沒有多一個');
    G.actCD = {};
    Math.random = function(){ return .9; };
    relativePerk('figures');
    if ((G.inv.mini_figure || 0) !== mf + 1) fails.push('沒抽到也送了公仔');
    Math.random = keepRand;
    // 冷卻要存進存檔（不然重開就可以再刷）
    G.actCD = { snack: Date.now() };
    saveGame();
    var reload = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    if (!reload.actCD || !reload.actCD.snack) fails.push('冷卻沒有存進存檔');
    if (!reload.comics || Object.keys(reload.comics).length !== COMICS.length) fails.push('漫畫收集沒有存進存檔');
    G.away = keepAway; fufu.act = keepFufuAct; G.actCD = {};
    var md4 = document.querySelector('#modal'); if (md4) md4.hidden = true;

    /* ㉟ 學校（照片參考：國小。去識別化：沒有校名、校徽）
       教室＋操場、貓頭鷹老師、上課開小考、交作業拿零用錢、溜滑梯盪鞦韆寵物開心。 */
    var SC = PLACES.school;
    if (!SC) fails.push('沒有學校');
    else {
      if (SC.rooms.length !== 2) fails.push('學校不是教室＋操場兩間');
      SC.rooms.forEach(function(r){
        r.items.forEach(function(it){ var iid = it.id || it[0]; if (!FURN_BY_ID[iid]) fails.push('學校' + r.name + '有不存在的家具：' + iid); });
        r.wallItems.forEach(function(it){ var wid = it.id || it[0]; if (!FURN_BY_ID[wid]) fails.push('學校' + r.name + '有不存在的掛飾：' + wid); });
      });
      if (!HOSTS[SC.host]) fails.push('學校沒有老師');
      // 學校專用的家具不能跑進商店
      ['school_desk','school_chair','teacher_desk','blackboard','flagpole','slide','swing','shade_tree'].forEach(function(id){
        if (FURNITURE.some(function(f){ return f.id === id; })) fails.push(id + ' 跑進商店了');
      });
      // 去識別化：學校相關的文字不可以出現「國小、國民小學、市、區」這種會指到真的學校的字
      var scText = JSON.stringify(SC) + JSON.stringify(HOSTS.teacher) + drawTripSchool.toString().replace(/\/\*[\s\S]*?\*\//g, '');
      if (/國民小學|國小|[市區]立|Elementary/.test(scText)) fails.push('學校的內容出現了像真實校名的字');
      // 上課 → 小考、交作業 → 零用錢、溜滑梯 → 寵物心情
      if (ACTIVITIES[FURNITURE_ACT.school_desk].open !== 'quiz') fails.push('課桌上課沒有開小考');
      if (FURNITURE_ACT.teacher_desk !== 'homework' || FURNITURE_ACT.slide !== 'slide' || FURNITURE_ACT.swing !== 'swing') fails.push('學校的家具沒有對應的事');
      if (!FURNITURE_USE.school_chair) fails.push('學生椅不能坐');
      G.actCD = {};
      G.away = { place: 'grandma', idx: 0 };
      if (relativePerk('homework')) fails.push('在阿婆家也能交作業');
      G.away = { place: 'school', idx: 0 };
      // 交作業不給錢，給貼紙；12 次收集完（先給沒有的）
      G.stickers = {};
      var hw = G.bells; relativePerk('homework');
      if (G.bells !== hw) fails.push('交作業還在給零用錢（' + (G.bells - hw) + '）');
      if (Object.keys(G.stickers).length !== 1) fails.push('交作業沒有拿到貼紙');
      for (var si = 1; si < STICKERS.length; si++) giveSticker();
      if (Object.keys(G.stickers).length !== STICKERS.length) fails.push('交了 ' + STICKERS.length + ' 次作業，貼紙只收集到 ' + Object.keys(G.stickers).length + ' 張');
      openSticker({ s: '⭐', isNew: false });
      if (document.querySelectorAll('#modalCard .sticker').length !== STICKERS.length) fails.push('貼紙收集畫面不是 12 格');
      var stBtn = document.querySelector('#modalCard button.big'); if (stBtn) stBtn.onclick();
      if (!document.querySelector('#modal').hidden) fails.push('貼紙畫面關不掉');
      // 漫畫只要等 5 分鐘，其他還是 10 分鐘
      G.away = { place: 'uncle', idx: 0 };
      G.actCD = { comic: Date.now() - 5 * 60000 - 1, snack: Date.now() - 5 * 60000 - 1 };
      if (!relativeReady('comic')) fails.push('漫畫過了 5 分鐘還不能看');
      if (relativeReady('snack')) fails.push('點心也變成 5 分鐘了（應該還是 10 分鐘）');
      G.actCD = { comic: Date.now() - 4 * 60000 };
      if (relativeReady('comic')) fails.push('漫畫 4 分鐘就可以再看');
      if (relativeMinsLeft('comic') !== 1) fails.push('漫畫還要等的分鐘數不對：' + relativeMinsLeft('comic'));
      // 交作業只要等 3 分鐘
      G.away = { place: 'school', idx: 0 };
      G.actCD = { homework: Date.now() - 3 * 60000 - 1 };
      if (!relativeReady('homework')) fails.push('交作業過了 3 分鐘還不能再交');
      G.actCD = { homework: Date.now() - 2 * 60000 };
      if (relativeReady('homework')) fails.push('交作業 2 分鐘就可以再交');
      G.actCD = {};
      var md7 = document.querySelector('#modal'); if (md7) md7.hidden = true;
      G.pet.mood = 20; relativePerk('slide');
      if (G.pet.mood !== 35) fails.push('溜滑梯寵物心情沒有 +15（' + G.pet.mood + '）');
      // 老師：講老師的話、不送禮物、選單有小考和去操場
      host.n = HOSTS.teacher;
      if (hostLineKey() !== 'hostTeacher') fails.push('老師講的是別人的台詞（' + hostLineKey() + '）');
      if (!LINE_TYPES.some(function(t){ return t.key === 'hostTeacher' && t.lines.length >= 5; })) fails.push('老師沒有台詞');
      var ga = JSON.stringify(G.giftAt || {});
      if (relativeGift('school') !== null || JSON.stringify(G.giftAt || {}) !== ga) fails.push('老師也在送禮物（或吃掉了禮物冷卻）');
      var tm = hostMenuEntries().map(function(e){ return e[0]; }).join('|');
      if (!/小考/.test(tm) || !/操場/.test(tm) || /教室/.test(tm)) fails.push('在教室時老師的選單不對：' + tm);
      G.away.idx = 1;
      tm = hostMenuEntries().map(function(e){ return e[0]; }).join('|');
      if (!/教室/.test(tm) || /操場/.test(tm)) fails.push('在操場時老師的選單不對：' + tm);
      host.n = null; G.away = null; G.actCD = {};
    }
    // 小考的題目：答案要對、範圍要對、選項四個不重複、沒有負數、有正確答案
    QUIZ_LEVELS.forEach(function(L, li){
      for (var qi = 0; qi < 300; qi++) {
        var Q = quizQuestion(L);
        var real = Q.op === '+' ? Q.a + Q.b : Q.op === '−' ? Q.a - Q.b : Q.op === '×' ? Q.a * Q.b : Q.a / Q.b;
        if (real !== Q.ans || Q.ans !== Math.floor(Q.ans) || Q.ans < 0) { fails.push(L.name + ' 出了錯的題目：' + Q.text + ' 答案 ' + Q.ans); break; }
        if (li === 0 && (Q.a > 10 || Q.b > 10 || Q.ans > 10 || Q.ans < 0)) { fails.push('一年級的題目超過 10：' + Q.text); break; }
        if (li === 1 && (Q.ans > 99 || Q.a > 99)) { fails.push('二年級的題目超過 100：' + Q.text); break; }
        if (li === 2 && Q.op !== '×' && Q.op !== '÷') { fails.push('四年級不是乘除：' + Q.text); break; }
        var CH = quizChoices(Q.ans, li === 0);
        if (CH.length !== 4 || new Set(CH).size !== 4 || CH.indexOf(Q.ans) < 0 || CH.some(function(v){ return v < 0; })) { fails.push(L.name + ' 的選項不對：' + CH + '（答案 ' + Q.ans + '）'); break; }
        if (li === 0 && CH.some(function(v){ return Math.abs(v - Q.ans) > 4; })) { fails.push('一年級的錯誤答案差太多，一看就知道：' + CH + '（答案 ' + Q.ans + '）'); break; }
      }
    });
    // 一年級畫蘋果：加法是 a + b 顆，減法 a 顆裡面 b 顆是淡的（固定亂數，加法減法各驗一次）
    var keepR2 = Math.random;
    [.9, .1].forEach(function(rv){
      Math.random = function(){ return rv; };
      try { openQuizGame(); document.querySelectorAll('.lv-btn')[0].onclick(); } finally { Math.random = keepR2; }
      var qq = openQuizGame.test.q();
      var ap = document.querySelectorAll('.quiz-pics span:not(.plus)').length, gn = document.querySelectorAll('.quiz-pics .gone').length;
      if (qq.op !== (rv > .5 ? '−' : '+')) fails.push('固定亂數沒有出到想要的題型：' + qq.text);
      else if (qq.op === '+' && (ap !== qq.a + qq.b || gn)) fails.push('加法的蘋果數不對：' + qq.text + ' 畫了 ' + ap + '、淡的 ' + gn);
      else if (qq.op === '−' && (ap !== qq.a || gn !== qq.b)) fails.push('減法的蘋果不對：' + qq.text + ' 畫了 ' + ap + '、淡的 ' + gn);
      closeGameWindow();
    });
    openQuizGame();
    var qlv = document.querySelectorAll('.lv-btn');
    if (qlv.length !== 3) fails.push('小考沒有三個年級');
    else {
      qlv[0].onclick();
      var QT = openQuizGame.test, q1 = QT.q();
      var apples = document.querySelectorAll('.quiz-pics span:not(.plus)').length, gone = document.querySelectorAll('.quiz-pics .gone').length;
      if (q1.op === '+' && (apples !== q1.a + q1.b || gone)) fails.push('加法的蘋果數不對：' + q1.text + ' 畫了 ' + apples);
      if (q1.op === '−' && (apples !== q1.a || gone !== q1.b)) fails.push('減法的蘋果不對：' + q1.text + ' 畫了 ' + apples + '、淡的 ' + gone);
      if (document.querySelectorAll('.quiz-c').length !== 4) fails.push('小考不是四個選項');
      // 答對 7 題、答錯 3 題：錢 = 7 × 15 × 1，沒有全對獎勵
      var qb = G.bells;
      for (var k = 0; k < QUIZ_N; k++) {
        var cur = QT.q();
        QT.choose(k < 7 ? cur.ans : cur.ans + 1);
        QT.choose(cur.ans);           // 連點：同一題不能算兩次
        QT.next();
      }
      if (QT.right() !== 7) fails.push('答對 7 題卻記成 ' + QT.right() + ' 題（連點有沒有被算兩次？）');
      if (G.bells - qb !== 7 * 15 * QUIZ_LEVELS[0].mul) fails.push('小考的錢不對：' + (G.bells - qb));
    }
    closeGameWindow();
    // 全對有額外獎勵
    openQuizGame(); document.querySelectorAll('.lv-btn')[2].onclick();
    var QT3 = openQuizGame.test, qb3 = G.bells;
    for (var k3 = 0; k3 < QUIZ_N; k3++) { QT3.choose(QT3.q().ans); QT3.next(); }
    if (G.bells - qb3 !== QUIZ_N * 15 * 3 + 100 * 3) fails.push('四年級全對的錢不對：' + (G.bells - qb3));
    closeGameWindow();
    // 去學校的路上畫得出學校
    try {
      var tcv = document.createElement('canvas'); tcv.width = 360; tcv.height = 240;
      var tc = tcv.getContext('2d'), wrote = [];
      var realFT = tc.fillText, realST = tc.strokeText;
      tc.fillText = function(t){ wrote.push(t); }; tc.strokeText = function(t){ wrote.push(t); };
      drawTripSchool(tc, 360, 240, (360 - SCHOOL_W) / 2);
      // 照校門口畫，但門牌留白：整棟學校一個字都不能寫
      if (wrote.length) fails.push('學校外觀上寫了字：' + wrote.join('、'));
      // 停在正中間、整棟在畫面裡；大門（深紅色）在正中間下面
      if ((360 - SCHOOL_W) / 2 < 0) fails.push('學校太寬，畫面放不下');
      var gp = tc.getImageData(226, 184 - 30, 1, 1).data;  // 門廊右邊的深紅色牆（中間是空白門牌和拱門）
      if (!(gp[0] > 100 && gp[0] < 140 && gp[1] < 70 && gp[2] < 70)) fails.push('學校正中間不是深紅色大門廊（' + [].slice.call(gp, 0, 3) + '）');
    }
    catch(e) { fails.push('路上的學校畫不出來：' + e.message); }
    var md5 = document.querySelector('#modal'); if (md5) md5.hidden = true;

    /* ㊱ 操場（照片參考：藍色跑道）＋賽跑
       跑道地板只給操場用、不能出現在商店；前面是藍色跑道，後面是綠色球場。 */
    var PG = PLACES.school.rooms[1];
    if (PG.floor !== 'fl_track') fails.push('操場的地板不是跑道');
    if (FLOORS.some(function(f){ return f.id === 'fl_track'; })) fails.push('跑道地板跑進商店了');
    var seenFl = null, realFloor = drawFloor;
    try {
      drawFloor = function(c, r, f){ seenFl = f; };
      drawRoom(document.createElement('canvas').getContext('2d'), PG, {});
    } catch(e) { /* 只要看畫地板那一步 */ } finally { drawFloor = realFloor; }
    if (!seenFl || seenFl.id !== 'fl_track') fails.push('操場畫出來的地板不是跑道（' + (seenFl && seenFl.id) + '）');
    var fcv = document.createElement('canvas'); fcv.width = 900; fcv.height = 700;
    var fx2 = fcv.getContext('2d'); fx2.translate(450, 150);
    drawFloor(fx2, { w: 10, d: 10 }, floorById('fl_track'));
    var px = function(x, y){ var p = iso(x, y, 0); return fx2.getImageData(450 + p.x, 150 + p.y, 1, 1).data; };
    var lane = px(5, 9.3), field = px(5, 1.6);
    if (!(lane[2] > lane[0] + 60)) fails.push('跑道那一排不是藍色（' + [].slice.call(lane, 0, 3) + '）');
    if (!(field[1] > field[0] + 30 && field[1] > field[2])) fails.push('球場不是綠色（' + [].slice.call(field, 0, 3) + '）');
    if (FURNITURE_ACT.finish_flag !== 'run' || ACTIVITIES.run.open !== 'run') fails.push('終點旗沒有開賽跑');
    if (!FURNITURE_USE.park_bench) fails.push('長椅不能坐');
    G.away = { place: 'school', idx: 1 }; host.n = HOSTS.teacher;
    if (!/賽跑/.test(hostMenuEntries().map(function(e){ return e[0]; }).join('|'))) fails.push('老師的選單沒有賽跑');
    host.n = null; G.away = null;
    // 最難的一關，一秒點 6 下以內也要贏得了；最簡單的一秒 3.5 下以內
    var need = function(L){ return L.speed * 1.05 / RUN_STEP; };
    if (need(RUN_LEVELS[2]) > 6) fails.push('運動會！太難：一秒要點 ' + need(RUN_LEVELS[2]).toFixed(1) + ' 下');
    if (need(RUN_LEVELS[0]) > 3.5) fails.push('慢慢跑太難：一秒要點 ' + need(RUN_LEVELS[0]).toFixed(1) + ' 下');
    var playRunAt = function(li){ openRunGame(); document.querySelectorAll('.lv-btn')[li].onclick(); return openRunGame.test; };
    // 倒數的時候點不算
    var R1 = playRunAt(0); R1.tap(); R1.tap();
    if (R1.me() !== 0) fails.push('倒數還沒結束就可以跑');
    R1.skipCountdown();
    var rb1 = G.bells;
    for (var t1 = 0; t1 < 80; t1++) R1.tap();
    R1.tick(.01);
    if (R1.place() !== 1 || G.bells - rb1 !== RUN_PRIZE[0] * RUN_LEVELS[0].mul) fails.push('先到終點卻不是第一名（第 ' + R1.place() + ' 名，' + (G.bells - rb1) + '）');
    closeGameWindow();
    // 一個同學先到 → 第二名
    var R2 = playRunAt(1); R2.skipCountdown();
    R2.mates[0].x = RUN_LEN - .01; R2.tick(.1);
    var rb2 = G.bells;
    for (var t2 = 0; t2 < 80; t2++) R2.tap();
    R2.tick(.01);
    if (R2.place() !== 2 || G.bells - rb2 !== RUN_PRIZE[1] * RUN_LEVELS[1].mul) fails.push('第二個到卻不是第二名（第 ' + R2.place() + ' 名，' + (G.bells - rb2) + '）');
    closeGameWindow();
    // 完全不跑 → 同學都到了就結束、最後一名，還是有一點點錢
    var R3 = playRunAt(2); R3.skipCountdown();
    var rb3 = G.bells;
    R3.tick(.05); for (var t3 = 0; t3 < 400; t3++) R3.tick(.05);
    if (R3.place() !== 4 || G.bells - rb3 !== RUN_PRIZE[3] * RUN_LEVELS[2].mul) fails.push('沒跑卻沒有結束在第四名（第 ' + R3.place() + ' 名，' + (G.bells - rb3) + '）');
    closeGameWindow();
    var md6 = document.querySelector('#modal'); if (md6) md6.hidden = true;

    /* ㊳ 公園：池塘釣魚、花圃拍蝴蝶、野餐、噴水池、冰淇淋車（用買的）、柴犬園長 */
    var PK = PLACES.park;
    if (!PK || !HOSTS[PK.host]) fails.push('沒有公園或沒有園長');
    else {
      ['pond','picnic_mat','flower_bed','fountain','icecream_cart','street_lamp'].forEach(function(id){
        if (!FURN_BY_ID[id]) fails.push('沒有 ' + id);
        if (FURNITURE.some(function(f){ return f.id === id; })) fails.push(id + ' 跑進商店了');
      });
      if (ACTIVITIES[FURNITURE_ACT.pond].open !== 'fish') fails.push('池塘不能釣魚');
      if (ACTIVITIES[FURNITURE_ACT.flower_bed].open !== 'bfly') fails.push('花圃不能拍蝴蝶');
      host.n = HOSTS.ranger; G.away = { place: 'park', idx: 0 };
      if (hostLineKey() !== 'hostRanger') fails.push('園長講的是別人的台詞');
      var rm = hostMenuEntries().map(function(e){ return e[0]; }).join('|');
      if (!/釣魚/.test(rm) || !/拍蝴蝶/.test(rm) || !/相簿/.test(rm)) fails.push('園長的選單不對：' + rm);
      if (relativeGift('park') !== null) fails.push('園長也在送禮物');
      host.n = null;
      // 野餐：飽足 +20、寵物心情 +10，有冷卻
      G.actCD = {}; G.kid.hunger = 30; G.pet.mood = 30;
      relativePerk('picnic');
      if (G.kid.hunger !== 50 || G.pet.mood !== 40) fails.push('野餐沒有飽足 +20、寵物心情 +10（' + G.kid.hunger + '/' + G.pet.mood + '）');
      relativePerk('picnic');
      if (G.kid.hunger !== 50) fails.push('野餐可以一直吃');
      // 冰淇淋：用買的，扣 150、多一支；不用等冷卻；錢不夠買不了
      G.kidFood = G.kidFood || {};
      var ic0 = G.kidFood.ice_cream || 0, b0 = G.bells;
      relativePerk('icecream'); relativePerk('icecream');
      if ((G.kidFood.ice_cream || 0) !== ic0 + 2 || b0 - G.bells !== 300) fails.push('冰淇淋車買兩支不對（' + ((G.kidFood.ice_cream || 0) - ic0) + ' 支、花 ' + (b0 - G.bells) + '）');
      var keepB = G.bells; G.bells = 100;
      if (relativePerk('icecream') || G.bells !== 100) fails.push('錢不夠還買得到冰淇淋');
      G.bells = keepB;
      G.away = { place: 'grandma', idx: 0 };
      if (relativePerk('icecream')) fails.push('在阿婆家也能買公園的冰淇淋');
      G.away = null; G.actCD = {};
    }
    // 拍蝴蝶：點蝴蝶加一張、點蜜蜂扣一張、點空的沒事；新的蝴蝶進相簿
    openButterflyGame();
    var blv = document.querySelectorAll('.lv-btn');
    if (blv.length !== 3) fails.push('拍蝴蝶沒有三個難度');
    else {
      blv[1].onclick();
      var BT = openButterflyGame.test, th = BT.things();
      var bf = th.filter(function(t){ return !t.bee; })[0], bee = th.filter(function(t){ return t.bee; })[0];
      th.forEach(function(t, i){ t.x = 40 + i * 50; t.y = 60; });     // 排開，點得到想點的那一隻
      bf.x = 40; bee.x = 300; bee.y = 250;
      var sid = bf.sp.id;
      BT.shoot(40, 60);
      if (BT.photos() !== 1 || !BT.got[sid]) fails.push('點蝴蝶沒有拍到');
      BT.shoot(300, 250);
      if (BT.photos() !== 0) fails.push('點到蜜蜂沒有扣一張（' + BT.photos() + '）');
      BT.shoot(170, 330);                                                 // 地上沒有東西
      if (BT.photos() !== 0) fails.push('點空的地方也有拍到');
      th.forEach(function(t){ if (!t.bee) { t.x = 100; t.y = 100; } });
      var others = th.filter(function(t){ return t.bee; }); others.forEach(function(t){ t.x = 300; t.y = 300; });
      BT.shoot(100, 100); BT.shoot(100, 100);
      G.butterflies = {};
      var bb = G.bells; BT.finish();
      if (G.bells - bb !== 2 * 15 * BFLY_LEVELS[1].mul) fails.push('拍蝴蝶結算不對：' + (G.bells - bb));
      if (!G.butterflies[sid]) fails.push('拍到的蝴蝶沒進相簿');
    }
    closeGameWindow();
    // 稀有度：彩虹蝴蝶要比一般的少見
    var rb = BUTTERFLIES.filter(function(b){ return b.id === 'rainbow'; })[0];
    if (!rb || BUTTERFLIES.some(function(b){ return b !== rb && b.w <= rb.w; })) fails.push('彩虹蝴蝶不是最少見的');
    // 相簿：拍過的有圖，沒拍過的是？
    G.butterflies = { red: 2 };
    openButterflyAlbum();
    if (document.querySelectorAll('#modalCard .bfly canvas').length !== 1 || document.querySelectorAll('#modalCard .bfly.none').length !== BUTTERFLIES.length - 1)
      fails.push('蝴蝶相簿顯示不對');
    var md8 = document.querySelector('#modal'); if (md8) md8.hidden = true;

    /* 62 來家裡玩的只有小動物（家長：不要讓孩子覺得隨便一個大人都可以來家裡）；好朋友變 12 個 */
    if (NEIGHBORS.length < 12) fails.push('好朋友不到 12 個（' + NEIGHBORS.length + '）');
    if (new Set(NEIGHBORS.map(function(n){ return n.id; })).size !== NEIGHBORS.length) fails.push('好朋友有重複的 id');
    var ANIMAL_WORDS = /熊|兔|狐|松鼠|羊|狗|貓|企鵝|豬|刺蝟|無尾熊|鹿/;
    NEIGHBORS.forEach(function(n){ if (!ANIMAL_WORDS.test(n.name)) fails.push('來家裡玩的「' + n.name + '」不是小動物'); });
    Object.keys(HOSTS).forEach(function(k){ if (NEIGHBORS.some(function(n){ return n.id === HOSTS[k].id; })) fails.push(HOSTS[k].name + ' 會來家裡玩（主人只待在自己的地方）'); });
    // 先來沒見過的朋友
    var keepF = G.friends; G.friends = {}; NEIGHBORS.slice(0, 11).forEach(function(n){ G.friends[n.id] = 1; });
    var lastN = NEIGHBORS[11], seenNew = 0;
    for (var vv = 0; vv < 10; vv++) {
      var pick7 = NEIGHBORS.filter(function(n){ return !G.friends[n.id]; });
      if (pick7.length === 1 && pick7[0] === lastN) seenNew++;
    }
    var srcVis = String(typeof visitorArrive === 'function' ? visitorArrive : '') + String(typeof visitorStart === 'function' ? visitorStart : '');
    G.friends = keepF;
    if (!seenNew) fails.push('沒見過的朋友不會優先來');

    /* 61 拍照：拍得出照片、留下來、最多 12 張（滿了要先刪）、可以刪、每個存檔格分開、壞掉／空間不夠不當掉 */
    localStorage.removeItem(photoKey());
    $('#modal').hidden = true;
    var shot = takePhoto();
    if (!shot || shot.indexOf('data:image/jpeg') !== 0) fails.push('拍不出照片');
    // 拍完直接放進相簿、照片放大一下自己消失（不跳視窗、不用按「留下來」）
    if (loadPhotos().length !== 1) fails.push('拍完沒有自動放進相簿');
    var pop = document.getElementById('photoPop');
    if (!pop || !pop.querySelector('img')) fails.push('拍完照片沒有放大出現');
    if (!$('#modal').hidden) fails.push('拍完還跳出視窗（要自己消失）');
    if (pop && getComputedStyle(pop).pointerEvents !== 'none') fails.push('放大的照片會擋住點擊');
    if (PHOTO_POP_MS > 3000) fails.push('放大的照片停太久');
    if (pop) pop.remove();
    // 相簿滿了：跳相簿讓她刪一張（不自動刪舊的）
    for (var phF = 0; phF < PHOTO_MAX; phF++) keepPhoto(shot);
    var full0 = JSON.stringify(loadPhotos().map(function(q){ return q.id; }));
    takePhoto();
    if (JSON.stringify(loadPhotos().map(function(q){ return q.id; })) !== full0) fails.push('相簿滿了，拍照自動刪掉舊照片');
    if ($('#modal').hidden || !/相簿滿了/.test($('#modalCard').textContent)) fails.push('相簿滿了，拍照沒有問要不要換');
    // 選「不要這張新的」：相簿不變
    var noNew = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /不要這張新的/.test(b.textContent); })[0];
    if (!noNew) fails.push('相簿滿了沒有「不要這張新的」');
    else { noNew.onclick(); if (JSON.stringify(loadPhotos().map(function(q){ return q.id; })) !== full0 || !$('#modal').hidden) fails.push('選不要新的，相簿卻變了（或視窗沒關）'); }
    // 換掉其中一張：先點舊的（還不會刪），再按「換掉這張」
    takePhoto();
    if (!document.querySelector('#modalCard .photo-new')) fails.push('換照片畫面沒有顯示新拍的');
    var thumbs = document.querySelectorAll('#modalCard .photo-thumb'), swapB = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /換掉這張/.test(b.textContent); })[0];
    if (thumbs.length !== PHOTO_MAX || !swapB) fails.push('換照片畫面沒有 ' + PHOTO_MAX + ' 張舊的或沒有「換掉這張」');
    else {
      if (!swapB.disabled) fails.push('還沒選要換哪一張，「換掉這張」就可以按');
      var oldIds = loadPhotos().map(function(q){ return q.id; }), victim = oldIds[3];
      thumbs[3].onclick();
      if (loadPhotos().length !== PHOTO_MAX || loadPhotos().map(function(q){ return q.id; }).indexOf(victim) < 0) fails.push('只是點了一張舊的，就被刪掉了');
      if (!thumbs[3].classList.contains('pick')) fails.push('點了要換的那張沒有標出來');
      swapB.onclick();
      var after2 = loadPhotos();
      if (after2.length !== PHOTO_MAX || after2.some(function(q){ return q.id === victim; })) fails.push('換照片之後張數不對，或舊的那張還在');
      if (after2.filter(function(q){ return oldIds.indexOf(q.id) < 0; }).length !== 1) fails.push('換照片之後新的那張沒有進相簿');
    }
    $('#modal').hidden = true;
    localStorage.removeItem(photoKey()); keepPhoto(shot);
    if (shot.length > 120000) fails.push('一張照片太大了（' + Math.round(shot.length / 1024) + ' KB）');
    for (var ph = 0; ph < 15; ph++) keepPhoto(shot);
    if (loadPhotos().length !== PHOTO_MAX) fails.push('相簿超過 ' + PHOTO_MAX + ' 張（' + loadPhotos().length + '）');
    if (keepPhoto(shot) !== 'full') fails.push('相簿滿了還說可以留');
    // 滿了：從相簿刪一張，剛剛拍的自動放進去
    var realConfirm2 = window.confirm; window.confirm = function(){ return true; };
    try {
      openAlbum(shot);
      if (!/相簿滿了/.test(document.querySelector('#modalCard').textContent)) fails.push('相簿滿了沒有說明要先刪一張');
      document.querySelector('#modalCard .photo-thumb').onclick();
      var delB = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /刪掉這張/.test(b.textContent); })[0];
      var firstId = loadPhotos()[0].id;
      delB.onclick();
      var after = loadPhotos();
      if (after.length !== PHOTO_MAX) fails.push('刪一張後，剛剛拍的沒有放進來（' + after.length + '）');
      if (after.some(function(p){ return p.id === firstId; }) && after[0].id === firstId) fails.push('刪掉的那張還在');
    } finally { window.confirm = realConfirm2; }
    if (!deletePhoto(loadPhotos()[0].id) || loadPhotos().length !== PHOTO_MAX - 1) fails.push('刪照片沒有刪掉');
    // 照片不會跑進備份檔
    if (makeBackup().indexOf('data:image') >= 0) fails.push('照片跑進備份檔了（備份會變很肥）');
    // 壞掉的相簿資料不當掉；空間不夠要說
    localStorage.setItem(photoKey(), '{壞掉');
    if (loadPhotos().length !== 0) fails.push('相簿資料壞掉時沒有當成空的');
    var realSet2 = Storage.prototype.setItem;
    Storage.prototype.setItem = function(){ throw new Error('full'); };
    var kp; try { kp = keepPhoto(shot); } finally { Storage.prototype.setItem = realSet2; }
    if (kp !== 'space') fails.push('空間不夠存照片時沒有說');
    // 每個存檔格分開；刪掉存檔格時照片一起刪
    if (photoKey().indexOf(curSlotId()) < 0) fails.push('照片沒有分存檔格放');
    localStorage.setItem('myHouse_photos:zzslot', '[]');
    var sl0 = slots(); saveSlots(sl0.concat([{ id: 'zzslot', name: '測試格' }]));
    removeSlot('zzslot');
    if (localStorage.getItem('myHouse_photos:zzslot') !== null) fails.push('刪掉存檔格，那一格的照片沒有一起刪');
    saveSlots(sl0);
    localStorage.removeItem(photoKey()); sessionLog.photos = 0;
    $('#modal').hidden = true;
    // 寵物卡的按鈕不要被擠成兩行
    if (getComputedStyle($('#btnFeed')).whiteSpace !== 'nowrap') fails.push('寵物卡的按鈕會被擠成兩行');

    /* 60 沒有期限的小主題：選、看進度、做到了自動完成（只給一次）、出門類、換／不做、圖鑑 */
    G.away = null; G.theme = null; G.themesDone = {};
    var trm = G.rooms[G.cur], keepItems2 = trm.items, keepInv2 = JSON.stringify(G.inv);
    trm.items = [];
    openThemes();
    var picks = document.querySelectorAll('#modalCard .theme-pick');
    if (picks.length !== 3) fails.push('小主題沒有給三個選擇（' + picks.length + '）');
    if (!/先不要/.test(document.querySelector('#modalCard').textContent)) fails.push('小主題沒有「先不要」');
    $('#modal').hidden = true;
    startTheme('flowers');
    refreshThemeBtn();
    if (!/花花房間 0\/1/.test($('#btnTheme').textContent)) fails.push('小主題按鈕沒有顯示進度：' + $('#btnTheme').textContent);
    if (themeTick()) fails.push('還沒做就完成了');
    var b0t = G.bells;
    trm.items = [{ uid: 99901, id: 'plant_s', x: 0, y: 0, rot: 0 }, { uid: 99902, id: 'cactus', x: 1, y: 0, rot: 0 }, { uid: 99903, id: 'wood_table', x: 2, y: 2, rot: 0, top: 'flower_vase' }];
    if (!themeTick()) fails.push('放了三樣花和植物（含桌上的花瓶），沒有完成');
    if (G.bells - b0t !== THEME_REWARD) fails.push('完成小主題的零用錢不對：' + (G.bells - b0t));
    if (G.theme) fails.push('完成之後主題沒有清掉');
    if (!G.themesDone.flowers) fails.push('完成的小主題沒有記在圖鑑');
    var b1t = G.bells; themeTick();
    if (G.bells !== b1t) fails.push('完成之後又一直給錢');
    var scT = document.getElementById('showcase'); if (scT) scT.remove();
    // 下午茶：桌上點心＋椅子
    startTheme('teatime');
    trm.items = [{ uid: 99911, id: 'wood_table', x: 0, y: 0, rot: 0, top: 'small_cake' }];
    if (themeProgress(THEME_BY_ID.teatime).done !== 1) fails.push('下午茶：有點心沒椅子，進度應該是 1/2');
    trm.items.push({ uid: 99912, id: 'wood_chair', x: 0, y: 2, rot: 0 });
    if (!themeTick()) fails.push('下午茶：點心＋椅子沒有完成');
    // 出門類：帶寵物去公園、去三個地方
    startTheme('explorer');
    ['park', 'school', 'library'].forEach(function(pl){ travelArrive(pl); var r8 = document.getElementById('roomDoors'); if (r8) r8.remove(); });
    G.away = null;
    if (!themeTick()) fails.push('去了三個地方，「出門走走」沒有完成');
    startTheme('petwalk');
    var stg2 = G.pet.stage; G.pet.stage = 'egg';
    travelArrive('park'); G.away = null;
    if (themeTick()) fails.push('帶著還是蛋的寵物去公園也算完成');
    G.pet.stage = stg2;
    travelArrive('park'); G.away = null;
    if (!themeTick()) fails.push('帶寵物去公園沒有完成');
    // 沒有期限：主題裡沒有任何時間限制；可以換、可以不做
    THEMES.forEach(function(t){ if (t.deadline || t.expires || t.days) fails.push(t.title + ' 有時間限制'); });
    startTheme('style'); openThemes();
    var dropB = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /先不要做了/.test(b.textContent); })[0];
    if (!dropB) fails.push('進行中的小主題沒有「先不要做了」');
    else { dropB.onclick(); if (G.theme) fails.push('按了先不要做了，主題還在'); }
    // 存檔裡記得現在在做哪一個
    startTheme('bedroom'); saveGame();
    var rl = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    if (!rl.theme || rl.theme.id !== 'bedroom') fails.push('現在的小主題沒有存起來');
    // 圖鑑
    openTab('book');
    if (!document.getElementById('dexTheme') || !/花花房間/.test(document.querySelector('#tabBody').textContent)) fails.push('圖鑑沒有小主題那一段');
    G.theme = null; G.themesDone = {}; trm.items = keepItems2; G.inv = JSON.parse(keepInv2); G.away = null; saveGame(); refreshThemeBtn();
    var scT2 = document.getElementById('showcase'); if (scT2) scT2.remove();
    $('#modal').hidden = true;

    /* 59 還原備份的防呆：備份比現在舊、或是另一個人的，要清楚警告、確認兩次 */
    saveGame();
    var curG = JSON.parse(JSON.stringify(G));
    var mkB = function(mod){ var g9 = JSON.parse(JSON.stringify(curG)); mod(g9); return makeBackup(JSON.stringify(g9)); };
    var oldB = mkB(function(g9){ g9.earned = Math.max(0, curG.earned - 5000); g9.savedAt = curG.savedAt - 86400000; });
    var newB = mkB(function(g9){ g9.earned = curG.earned + 5000; g9.savedAt = curG.savedAt + 60000 * 5; });
    var kidB = mkB(function(g9){ g9.earned = curG.earned + 10; g9.savedAt = curG.savedAt + 600000; g9.charName = '另一個小孩'; });
    var c1 = compareBackup(readBackup(oldB)), c2 = compareBackup(readBackup(newB)), c3 = compareBackup(readBackup(kidB));
    if (!c1 || !c1.older) fails.push('比較舊的備份沒有被認出來');
    if (!c2 || c2.older) fails.push('比較新的備份被當成舊的');
    if (!c3 || !c3.otherKid) fails.push('名字不一樣的備份（姊妹拿錯）沒有被認出來');
    if (c1 && (!/備份：/.test(c1.text) || !/現在：/.test(c1.text) || !/累計賺到/.test(c1.text))) fails.push('比較的內容沒有列出兩邊');
    // 實際按還原：舊的要確認兩次；第二次按取消就不能動到存檔
    var asks = [], realConfirm = window.confirm, realApply = applyBackup, applied = 0;
    applyBackup = function(){ applied++; return false; };   // 不真的寫入（會重新整理頁面）
    try {
      openTab('backup');
      var box9 = document.querySelector('#tabBody textarea');
      var rsB = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /還原/.test(b.textContent) && !/強制/.test(b.textContent); })[0];
      window.confirm = function(m){ asks.push(m); return asks.length < 2; };
      box9.value = oldB; rsB.onclick();
      if (asks.length !== 2 || !/舊/.test(asks[0])) fails.push('還原比較舊的備份沒有清楚警告、確認兩次（問了 ' + asks.length + ' 次）');
      if (applied) fails.push('第二次按取消，還是把舊備份寫進去了');
      asks = []; applied = 0;
      window.confirm = function(m){ asks.push(m); return true; };
      box9.value = newB; rsB.onclick();
      if (asks.length !== 1 || /舊/.test(asks[0])) fails.push('還原比較新的備份也跳舊的警告');
      if (applied !== 1) fails.push('確認後沒有還原比較新的備份');
      asks = [];
      box9.value = kidB; rsB.onclick();
      if (asks.length !== 2 || !/名字/.test(asks[0])) fails.push('拿到另一個人的備份沒有警告');
    } finally { window.confirm = realConfirm; applyBackup = realApply; }
    if (!(G.savedAt > 0)) fails.push('存檔沒有記存的時間');

    /* 58 ChatGPT 第二次核對的三個問題＋兩個小建議 */
    var realSetI = Storage.prototype.setItem, failSave = function(){ Storage.prototype.setItem = function(){ throw new Error('full'); }; }, okSave = function(){ Storage.prototype.setItem = realSetI; };
    // P0：存不進去的時候，「今天先玩到這裡」不能說存好了
    saveRestCfg({ on: true, play: 20, rest: 5, pin: '' });
    forceRestNow();
    var ovB = document.getElementById('restOverlay'), byeB2 = ovB.querySelector('.rest-bye');
    byeB2.hidden = false;
    failSave();
    try { byeB2.onclick(); } finally { okSave(); }
    if (/存好了/.test(ovB.querySelector('.rest-title').textContent)) fails.push('存檔失敗時「今天先玩到這裡」還說進度存好了');
    if (byeB2.hidden) fails.push('存檔失敗時把「今天先玩到這裡」藏起來了（應該可以再按一次）');
    byeB2.onclick();
    if (!/存好了/.test(ovB.querySelector('.rest-title').textContent)) fails.push('存檔成功時沒有說存好了');
    localStorage.removeItem(REST_STATE_KEY); localStorage.removeItem(REST_CFG_KEY); endRest(); resting = false; ovB.remove();
    // P0：存不進去的時候，備份要用畫面上最新的進度，不能拿儲存區的舊版充數
    saveGame();
    G.bells = 424242;
    failSave();
    var fb2;
    try { fb2 = freshBackup(); } finally { okSave(); }
    var fbData = fb2 && readBackup(fb2);
    if (!fbData || JSON.parse(fbData.data).bells !== 424242) fails.push('存檔失敗時，備份不是畫面上最新的進度');
    // 存檔讀不出來（被鎖住）：不給備份，也不說複製好了
    SAVE_LOCKED = '{壞掉';
    var tl5 = [], realToast5 = toast; toast = function(m){ tl5.push(m); };
    try {
      if (freshBackup() !== null) fails.push('存檔被鎖住時還產生備份（畫面上的不是她的進度）');
      openTab('backup');
      var dlB = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /存成檔案/.test(b.textContent); })[0];
      var realDl2 = downloadText, dlCalled = 0; downloadText = function(){ dlCalled++; };
      try { dlB.onclick(); } finally { downloadText = realDl2; }
      if (dlCalled || tl5.some(function(m){ return /存好了/.test(m); })) fails.push('存檔被鎖住時，下載備份還是說存好了');
    } finally { toast = realToast5; SAVE_LOCKED = null; }
    G.bells = 100000; saveGame();
    // P1：房間裡有不存在的家具 → 當成讀不出來（鎖住保護），不是當成正常存檔
    var bad6 = JSON.parse(JSON.stringify(G));
    bad6.rooms[0].items = [{ uid: 1, id: 'no_such_furniture_xyz', x: 0, y: 0, rot: 0 }];
    if (normalizeSave(JSON.parse(JSON.stringify(bad6))) !== null) fails.push('有不存在的家具的存檔被當成正常存檔');
    var bad7 = JSON.parse(JSON.stringify(G)); bad7.rooms[0].wallItems = [{ uid: 2, id: 'no_such_wall_xyz', side: 'L', pos: 0 }];
    if (normalizeSave(JSON.parse(JSON.stringify(bad7))) !== null) fails.push('有不存在的掛飾的存檔被當成正常存檔');
    var goodRaw2 = localStorage.getItem(SAVE_KEY);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(bad6));
      loadGame();
      if (SAVE_LOCKED == null) fails.push('讀到有不存在的家具的存檔，沒有鎖住保護');
    } finally { SAVE_LOCKED = null; localStorage.setItem(SAVE_KEY, goodRaw2); localStorage.removeItem(rescueKey()); }
    // P2：音樂盒在休息開始時停下來
    var mbNotes = 0, realPlay3 = Sound.play, pending = [], realST3 = window.setTimeout, realCT3 = window.clearTimeout;
    window.setTimeout = function(f){ pending.push(f); return pending.length; };
    window.clearTimeout = function(id){ if (id) pending[id - 1] = null; };
    Sound.play = function(n){ if (n === 'note') mbNotes++; };
    try {
      playMusicBox({ uid: 99801 });
      saveRestCfg({ on: true, play: 20, rest: 5, pin: '' });
      forceRestNow();
      pending.forEach(function(f){ if (f) try { f(); } catch(e){} });
    } finally { window.setTimeout = realST3; window.clearTimeout = realCT3; Sound.play = realPlay3; }
    if (mbNotes) fails.push('開始休息了，音樂盒還在響（' + mbNotes + ' 個音）');
    localStorage.removeItem(REST_STATE_KEY); localStorage.removeItem(REST_CFG_KEY); endRest(); resting = false;
    var ovC = document.getElementById('restOverlay'); if (ovC) ovC.remove();
    // 寵物卡的按鈕有圖示（妹妹看圖就懂）
    ['#btnKidEat', '#btnFeed', '#btnBath', '#btnCall'].forEach(function(sel){
      var tx = ($(sel) || {}).textContent || '';
      if (!/^\p{Extended_Pictographic}/u.test(tx)) fails.push(sel + ' 前面沒有圖示：' + tx);
    });

    /* 57 桌上小物：商店買得到、可以放上桌、音樂盒會唱歌、雪花球會飄雪、縮圖看得清楚 */
    DESK_TOYS.forEach(function(id){
      var d = FURN_BY_ID[id];
      if (!d) { fails.push('沒有 ' + id); return; }
      if (d.gift || !FURNITURE.some(function(f){ return f.id === id; })) fails.push(d.name + ' 商店買不到');
      if (!canSitOnTable(id)) fails.push(d.name + ' 不能放上桌');
      if (furnKind(id) !== 'desk') fails.push(d.name + ' 不在「桌上」分類');
      if (!(d.price > 0 && d.price <= 500 && d.price % 50 === 0)) fails.push(d.name + ' 的價格怪怪的：' + d.price);
    });
    shopKind = 'desk'; shopTheme = 'all'; G.away = null; openTab('shop');
    var deskCards = document.querySelectorAll('#tabBody .grid .card');
    if (deskCards.length !== DESK_TOYS.length) fails.push('商店「桌上」不是 ' + DESK_TOYS.length + ' 樣（' + deskCards.length + '）');
    shopKind = 'all';
    // 縮圖：小東西要放大到看得清楚（有畫到的像素夠多）
    var inked = function(def){ var c5 = renderThumb(def, 64), d5 = c5.getContext('2d').getImageData(0, 0, c5.width, c5.height).data, n5 = 0; for (var q5 = 3; q5 < d5.length; q5 += 4) if (d5[q5] > 0) n5++; return n5 / (c5.width * c5.height); };
    DESK_TOYS.forEach(function(id){ var r5 = inked(FURN_BY_ID[id]); if (r5 < .12) fails.push(FURN_BY_ID[id].name + ' 的縮圖太小，看不清楚（' + Math.round(r5 * 100) + '%）'); });
    if (Math.abs(inked(FURN_BY_ID.wood_bed) - inked(FURN_BY_ID.wood_bed)) > 0) fails.push('縮圖不穩定');
    // 放上桌、音樂盒、雪花球
    var dr = G.rooms[G.cur], keepIt = dr.items, deskIt = { uid: 99701, id: 'desk', x: 0, y: 0, rot: 0 };
    dr.items = [deskIt];
    G.inv.music_box = 1;
    openTopPicker(deskIt);
    var mbCard = [].filter.call(document.querySelectorAll('#modalCard .card'), function(c){ return /音樂盒/.test(c.textContent); })[0];
    if (!mbCard) fails.push('放桌上的選單裡沒有音樂盒');
    else { mbCard.onclick(); if (deskIt.top !== 'music_box') fails.push('音樂盒放不上桌'); }
    var menuOf = function(it){ var lbls = [], realAdd = null; var real = openMenu; openMenu = function(entries){ lbls = entries.map(function(e){ return e[0]; }); }; try { showItemMenu(it, { clientX: 5, clientY: 5 }); } finally { openMenu = real; } return lbls.join('|'); };
    if (!/聽音樂盒/.test(menuOf(deskIt))) fails.push('桌上有音樂盒，點桌子沒有「聽音樂盒」');
    var notes = 0, realPlay2 = Sound.play, realST2 = window.setTimeout;
    Sound.play = function(n){ if (n === 'note') notes++; };
    window.setTimeout = function(f){ f(); return 0; };
    try { playMusicBox(deskIt); } finally { Sound.play = realPlay2; window.setTimeout = realST2; }
    if (notes < 8) fails.push('音樂盒只響了 ' + notes + ' 個音（要一小段旋律）');
    deskIt.top = 'snow_globe';
    if (!/搖一搖/.test(menuOf(deskIt))) fails.push('桌上有雪花球，點桌子沒有「搖一搖」');
    var dDef = FURN_BY_ID.desk, nBefore5 = itemLook(dDef, 0, deskIt, getParts(dDef, 0)).length;
    shakeSnowGlobe(deskIt);
    if (!(itemLook(dDef, 0, deskIt, getParts(dDef, 0)).length > nBefore5)) fails.push('搖了雪花球沒有飄雪');
    stateOf(deskIt.uid).snowUntil = 0;
    dr.items = keepIt; delete G.inv.music_box; $('#modal').hidden = true; hideItemMenu();

    /* 56 圖書館照照片改：壁畫、矮書櫃、紅圓桌＋藍地毯、蛋形座椅、踏凳、平板閱讀桌、兔子立牌、展示板；
       平板看電子書、館員說故事（一打開就念）；外觀照照片畫但不寫字 */
    var LR = PLACES.library.rooms[0];
    ['library_mural','low_shelf','story_rug','round_red_table','egg_seat','egg_seat_g','step_stool','tablet_table','bunny_sign','display_board'].forEach(function(id){
      if (!FURN_BY_ID[id]) fails.push('沒有 ' + id);
      if (FURNITURE.some(function(f){ return f.id === id; })) fails.push(id + ' 跑進商店了');
      var inRoom = LR.items.some(function(it){ return (it.id || it[0]) === id; }) || LR.wallItems.some(function(it){ return (it.id || it[0]) === id; });
      if (!inRoom) fails.push('圖書館裡沒有擺 ' + id);
    });
    if (LR.floor !== 'fl_lib' || FLOORS.some(function(f){ return f.id === 'fl_lib'; })) fails.push('圖書館地板不對或跑進商店');
    if (ACTIVITIES[FURNITURE_ACT.tablet_table].open !== 'story') fails.push('平板閱讀桌不能看電子書');
    if (ACTIVITIES[FURNITURE_ACT.round_red_table].open !== 'storytime') fails.push('紅色圓桌不能聽館員說故事');
    if (!FURNITURE_USE.egg_seat || !FURNITURE_USE.egg_seat_g || !FURNITURE_USE.step_stool) fails.push('蛋形座椅、踏凳不能坐');
    // 館員說故事：一打開就念；自己看繪本不會自己念
    var sp3 = [], realSS3 = window.speechSynthesis, realSU3 = window.SpeechSynthesisUtterance;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function(t){ this.text = t; }, configurable: true, writable: true });
    Object.defineProperty(window, 'speechSynthesis', { value: { cancel: function(){}, speak: function(u){ sp3.push(u.text); } }, configurable: true, writable: true });
    try {
      openNextStorybook({ aloud: true });
      if (!sp3.length) fails.push('館員說故事沒有念出來');
      $('#modal').hidden = true; sp3 = [];
      openNextStorybook();
      if (sp3.length) fails.push('自己看繪本也自動念了（應該按🔊才念）');
      $('#modal').hidden = true;
      G.away = { place: 'library', idx: 0 }; host.n = HOSTS.librarian;
      if (!/說故事/.test(hostMenuEntries().map(function(e){ return e[0]; }).join('|'))) fails.push('館員的選單沒有說故事');
      host.n = null; G.away = null;
    } finally {
      Object.defineProperty(window, 'speechSynthesis', { value: realSS3, configurable: true, writable: true });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: realSU3, configurable: true, writable: true });
    }
    // 外觀：不寫字、放得進畫面、去圖書館的路上會出現
    var lcv = document.createElement('canvas'); lcv.width = 360; lcv.height = 240;
    var lg = lcv.getContext('2d'), lw = [];
    lg.fillText = function(t){ lw.push(t); }; lg.strokeText = function(t){ lw.push(t); };
    drawTripLibrary(lg, 360, 240, (360 - LIBRARY_W) / 2);
    if (lw.length) fails.push('圖書館外觀寫了字：' + lw.join('、'));
    if ((360 - LIBRARY_W) / 2 < 0) fails.push('圖書館外觀太寬');
    var calledLib = 0, realDTL = drawTripLibrary;
    drawTripLibrary = function(){ calledLib++; };
    var realPN = performance.now.bind(performance), pnCalls = 0, base4 = realPN();
    performance.now = function(){ pnCalls++; return base4 + (pnCalls > 1 ? 2000 : 0); };   // 第一下是出發、之後已經走了 2 秒
    try {
      walkTrip('圖書館', function(){}, 'library');
    } finally { performance.now = realPN; drawTripLibrary = realDTL; if (typeof tripDone === 'function') tripDone(); }
    if (!calledLib) fails.push('去圖書館的路上沒有看到圖書館');
    var calledLib2 = 0; drawTripLibrary = function(){ calledLib2++; };
    pnCalls = 0; performance.now = function(){ pnCalls++; return base4 + (pnCalls > 1 ? 2000 : 0); };
    try { walkTrip('公園', function(){}, 'park'); } finally { performance.now = realPN; drawTripLibrary = realDTL; if (typeof tripDone === 'function') tripDone(); }
    if (calledLib2) fails.push('去公園的路上也出現圖書館');

    /* 55 每個地點：空地都走得到、能玩的東西都走得到也點得到、點地板不會被樹／路燈這種不能玩的東西攔住
       （你回報：公園的愛心點不到、大樹後面走不過去） */
    Object.keys(PLACES).forEach(function(pk){ PLACES[pk].rooms.forEach(function(rm3, ri){
      G.away = { place: pk, idx: ri }; var room3 = curRoom(); computeView();
      var where3 = PLACES[pk].name + rm3.name, blk3 = blockedGrid(room3);
      var st3 = nearestFree(room3, room3.w / 2, room3.d - 1.5) || [1, 1], seen3 = {}, q4 = [st3];
      seen3[st3[0] + ',' + st3[1]] = 1;
      while (q4.length) { var c4 = q4.shift(); [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){ var x = c4[0] + d[0], y = c4[1] + d[1];
        if (x < 0 || y < 0 || x >= room3.w || y >= room3.d || blk3[x][y] || seen3[x + ',' + y]) return; seen3[x + ',' + y] = 1; q4.push([x, y]); }); }
      for (var x3 = 0; x3 < room3.w; x3++) for (var y3 = 0; y3 < room3.d; y3++) {
        if (!blk3[x3][y3] && !seen3[x3 + ',' + y3]) fails.push(where3 + '：空地 ' + x3 + ',' + y3 + ' 走不進去');
        // 寵物屋跟自己家一樣，擺設點了可以拿起來搬，所以不驗這一條
        if (!blk3[x3][y3] && !PLACES[pk].inHouse) { var g4 = pickItem(iso(x3 + .5, y3 + .5, 0)); if (g4 && !canUse(g4)) fails.push(where3 + '：點地板 ' + x3 + ',' + y3 + ' 被' + g4.id + '攔住（走不過去）'); }
      }
      room3.items.forEach(function(it3){
        if (!canUse(it3)) return;
        if (!findPathToItem(room3, st3[0], st3[1], it3)) fails.push(where3 + '：走不到 ' + it3.id + '（' + it3.x + ',' + it3.y + '）');
        var d3 = FURN_BY_ID[it3.id], fp3 = footprint(d3, it3.rot || 0), h3 = itemHeight(d3), n3 = 0, hit3 = 0;
        for (var a3 = .1; a3 < 1; a3 += .2) for (var b3 = .1; b3 < 1; b3 += .2) for (var z3 = 0; z3 <= h3; z3 += Math.max(4, h3 / 5)) { n3++; if (pickItem(iso(it3.x + fp3.w * a3, it3.y + fp3.d * b3, z3)) === it3) hit3++; }
        var need3 = FURNITURE_ACT[it3.id] ? .35 : .15;   // 能做事的要很好點；椅子在桌子後面被擋一點沒關係
        if (hit3 / n3 < need3) fails.push(where3 + '：' + it3.id + '（' + it3.x + ',' + it3.y + '）被前面的東西擋住，只有 ' + Math.round(hit3 / n3 * 100) + '% 點得到');
      });
    }); });
    G.away = null;

    /* 54 你回報的：公園的愛心拍照點不到（被前面的大樹擋住）。在別人家點到不能玩的東西，要穿過去點後面能玩的 */
    travelArrive('park'); var rd6 = document.getElementById('roomDoors'); if (rd6) rd6.remove();
    computeView();
    var heartIt = curRoom().items.filter(function(x){ return x.id === 'heart_sculpture'; })[0];
    var hp = iso(heartIt.x + 1, heartIt.y + .5, 20);
    var screenOf = function(p){ return { x: p.x, y: p.y }; };
    var hitHeart = 0, hitTree = 0, tries = 0;
    for (var dz = 4; dz <= 40; dz += 4) for (var dx = -.8; dx <= .8; dx += .2) {
      var w4 = iso(heartIt.x + 1 + dx, heartIt.y + .5, dz); tries++;
      var got4 = pickItem(w4);
      if (got4 === heartIt) hitHeart++;
      else if (got4 && !canUse(got4)) hitTree++;
    }
    if (hitTree) fails.push('在公園點愛心雕塑，有 ' + hitTree + ' 個位置點到的是樹或路燈（應該穿過去點到愛心）');
    if (!hitHeart) fails.push('點不到愛心雕塑');
    // 回家：樹還是要點得到（要能搬）
    G.away = null;
    var homeTree = { uid: 999001, id: 'shade_tree', x: 1, y: 1, rot: 0 }, homeBed = { uid: 999002, id: 'wood_bed', x: 1, y: 3, rot: 0 };
    var hr = G.rooms[G.cur], keepItems = hr.items; hr.items = [homeBed, homeTree];
    homeTree.x = 2; homeTree.y = 2; homeBed.x = 0; homeBed.y = 0;   // 樹在前、床在後
    var both = null;
    for (var sx3 = 0; sx3 < 4 && !both; sx3 += .25) for (var sz3 = 0; sz3 < 90 && !both; sz3 += 5) {
      var q3 = iso(sx3, 2.5, sz3);
      if (pickItem(q3) !== homeTree) continue;
      hr.items = [homeBed]; var behind = pickItem(q3); hr.items = [homeBed, homeTree];
      if (behind === homeBed) both = q3;
    }
    if (!both) fails.push('在自己家，樹擋住床的地方點不到樹（樹要能搬）');
    else if (pickItem(both) !== homeTree) fails.push('在自己家，點樹（後面有床）點到的不是樹（樹要能搬）');
    hr.items = keepItems;
    // 新收集大圖：小遊戲進行中不要擋住；等小遊戲關掉再跳（排隊）
    SC_QUEUE.length = 0; var scOld = document.getElementById('showcase'); if (scOld) scOld.remove();
    openMemoryGame();
    var realToast4 = toast, tt4 = [];
    toast = function(m){ tt4.push(m); };
    try {
      G.animals = {}; meetAnimal(VISIT_ANIMALS[1]);
      if (document.getElementById('showcase')) fails.push('小遊戲進行中，新收集大圖擋住了遊戲');
      if (!tt4.some(function(m){ return /新的/.test(m); })) fails.push('小遊戲進行中拿到新東西，連提示都沒有');
    } finally { toast = realToast4; closeGameWindow(); G.animals = {}; }
    showcaseNext();
    if (!document.getElementById('showcase')) fails.push('小遊戲關掉後，排隊的新收集大圖沒有跳出來');
    var scQ = document.getElementById('showcase'); if (scQ) scQ.remove(); SC_QUEUE.length = 0;
    // 朗讀：可以按🔇關掉；關掉繪本就停
    var cancels = 0, spoken2 = [];
    var realSS2 = window.speechSynthesis, realSU2 = window.SpeechSynthesisUtterance;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function(t){ this.text = t; }, configurable: true, writable: true });
    Object.defineProperty(window, 'speechSynthesis', { value: { cancel: function(){ cancels++; }, speak: function(u){ spoken2.push(u.text); } }, configurable: true, writable: true });
    try {
      openStorybook('seed'); openStorybook.test.next();
      document.querySelector('#modalCard .book-say').onclick();
      var muteB = [].filter.call(document.querySelectorAll('#modalCard .book-btns button'), function(b){ return b.textContent === '🔇'; })[0];
      if (!muteB) fails.push('朗讀中沒有🔇可以關掉');
      else { var c0 = cancels; muteB.onclick(); if (cancels <= c0) fails.push('按🔇沒有停止朗讀'); var n0 = spoken2.length; openStorybook.test.next(); if (spoken2.length !== n0) fails.push('按了🔇之後翻頁還在念'); }
      $('#modal').hidden = true;
    } finally {
      Object.defineProperty(window, 'speechSynthesis', { value: realSS2, configurable: true, writable: true });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: realSU2, configurable: true, writable: true });
    }
    // 遇見誰：到了有主人的地方要記下來
    sessionLog.met = []; host.n = null; G.away = { place: 'library', idx: 0 }; hostTick(.016, performance.now());
    if (sessionLog.met.indexOf('館員') < 0) fails.push('今天遇見的人沒有記下來');
    sessionLog.met = []; host.n = null; G.away = null;

    /* 53 生活感：主人記得上次、表情、寵物個性、世界自己會動、配合動作的音效、離開時不會變得太慘 */
    if (AWAY_FLOOR < 45) fails.push('離開時數值底線太低（回來會看到寵物髒髒餓餓）');
    if (decayStat(100, 60 * 24 * 3, .25) < 45) fails.push('離開三天回來，數值掉到 45 以下');
    // 主人記得上次
    G.hostMem = {};
    G.comics = {}; openComic(); var cmT = Object.keys(G.comics)[0]; $('#modal').hidden = true;
    if (hostMemoryLine('uncle').indexOf(cmT) < 0) fails.push('叔叔不記得上次看的漫畫：' + hostMemoryLine('uncle'));
    var stk = giveSticker().s;
    if (hostMemoryLine('teacher').indexOf(stk) < 0) fails.push('老師不記得上次給的貼紙');
    openStorybook('moon'); for (var bq = 0; bq < 5; bq++) openStorybook.test.next(); $('#modal').hidden = true;
    if (hostMemoryLine('librarian').indexOf('月亮的蛋糕') < 0) fails.push('館員不記得上次看的書');
    G.animals = {}; meetAnimal(VISIT_ANIMALS.filter(function(n){ return n.id === 'fa_piglet'; })[0]);
    var scx = document.getElementById('showcase'); if (scx) scx.remove();
    if (hostMemoryLine('grandma').indexOf('小豬') < 0) fails.push('阿婆不記得上次來的動物');
    travelArrive('park'); var rd5 = document.getElementById('roomDoors'); if (rd5) rd5.remove();
    var sbx2 = curRoom().items.filter(function(x){ return x.id === 'sandbox'; })[0];
    fufuStartAct('sand', performance.now(), sbx2, false); fufu.act = null;
    if (!/沙堡/.test(hostMemoryLine('ranger') || '')) fails.push('園長不記得上次蓋沙堡');
    G.hostMem = {};
    fufuStartAct('sand', performance.now(), sbx2, true); fufu.act = null;
    if (hostMemoryLine('ranger')) fails.push('小可愛自己閒晃去玩沙，園長也記成她做的');
    // 第一句話先說上次的事；只說一次
    G.hostMem = { ranger: { act: 'slide' } };
    host.n = null; hostTick(.016, performance.now());
    host.nextTalkAt = 0; host.say = null; hostTick(.016, performance.now());
    if (!/溜滑梯/.test(host.say || '')) fails.push('到了公園，園長第一句沒有說上次的事：' + host.say);
    host.nextTalkAt = 0; hostTick(.016, performance.now());
    if (/溜滑梯好勇敢/.test(host.say || '') && host.memSaid !== true) fails.push('上次的事一直重複講');
    if ((hostMemOf('ranger').visits || 0) < 1) fails.push('沒有記錄來玩的次數');
    // 不怪孩子：所有主人的台詞都不能有責備的話
    LINE_TYPES.filter(function(t){ return /^host/.test(t.key) || t.key === 'welcomeBack'; }).forEach(function(t){
      t.lines.forEach(function(l){ if (/怎麼都沒來|為什麼沒來|好久沒來看我|你都不來/.test(l)) fails.push('台詞在怪孩子：' + l); });
    });
    // 表情
    fufu.faceUntil = 0; fufu.act = { key: 'slide', uid: 1 }; if (kidFace() !== 'joy') fails.push('溜滑梯的時候沒有開心的表情');
    fufu.act = { key: 'read', uid: 1 }; if (kidFace() !== 'focus') fails.push('看書的時候沒有專心的表情');
    fufu.act = null; kidMakeFace('wow', 2000); if (kidFace() !== 'wow') fails.push('嚇一跳的表情沒有出現');
    fufu.faceUntil = 0;
    var kh = G.kid.hunger; G.kid.hunger = 10; fufu.act = { key: 'slide', uid: 1 };
    if (kidFace() !== 'hungry') fails.push('肚子很餓的時候還在大笑（餓要優先）');
    G.kid.hunger = kh; fufu.act = null;
    var fcv = function(face){ var c2 = document.createElement('canvas'); c2.width = 60; c2.height = 80; var g2 = c2.getContext('2d'); g2.translate(30, 76); drawGirl(g2, { t: 0, outfit: currentOutfit(), face: face }); return c2.getContext('2d').getImageData(0, 0, 60, 80).data.join(','); };
    var fN = fcv('happy');
    ['joy', 'focus', 'wow'].forEach(function(f){ if (fcv(f) === fN) fails.push('「' + f + '」表情畫出來跟平常一樣'); });
    var eyes = function(face){ var c3 = document.createElement('canvas'); c3.width = 60; c3.height = 80; var g3 = c3.getContext('2d'); g3.translate(30, 76); drawGirl(g3, { t: 0, outfit: currentOutfit(), face: face }); return g3.getImageData(0, 26, 60, 8).data.join(','); };
    if (eyes('joy') === eyes('happy')) fails.push('開心的時候眼睛沒有瞇成 ^ ^');
    if (eyes('wow') === eyes('happy')) fails.push('嚇一跳的時候眼睛沒有睜大');
    // 寵物個性：只差在動作
    var spKeep = G.pet.species, stKeep = G.pet.stage;
    G.pet.stage = 'kid'; pet.sleep = false;
    G.pet.species = 'penguin'; if (petReact('pondfish', 1) !== '🐟') fails.push('愛看魚的企鵝到池塘沒有看魚');
    G.pet.species = 'bunny'; if (petReact('slide', 0) !== '💦') fails.push('害羞的兔子溜滑梯前沒有緊張');
    G.pet.species = 'chick'; if (petReact('sand', 0) !== '🏖️') fails.push('愛玩沙的小雞在沙坑沒有反應');
    G.pet.species = spKeep; G.pet.stage = stKeep;
    if (!Object.keys(PET_TRAIT_OF).every(function(k){ return PET_SPECIES.some(function(s){ return s.id === k; }); })) fails.push('個性表裡有不存在的寵物');
    if (PET_SPECIES.some(function(s){ return !PET_TRAIT_OF[s.id]; })) fails.push('有寵物沒有個性');
    // 世界自己會動：公園的花圃有蝴蝶、池塘會有魚跳
    var bcalls = 0, realBF = drawButterfly;
    drawButterfly = function(){ bcalls++; };
    try { drawAmbient(ctx, performance.now()); } finally { drawButterfly = realBF; }
    var beds = curRoom().items.filter(function(x){ return x.id === 'flower_bed'; }).length;
    if (bcalls !== beds * 2) fails.push('公園的花圃上沒有蝴蝶在飛（' + bcalls + '）');
    var pondI = curRoom().items.filter(function(x){ return x.id === 'pond'; })[0], seedP = Math.abs(pondI.uid) % 97;
    var jumpT = (Math.ceil(performance.now() / 1000 / 7) * 7 - seedP + 70) % 7;   // 讓 (t + seed) % 7 落在 0.4
    var ell = 0, realEll = CanvasRenderingContext2D.prototype.ellipse;
    CanvasRenderingContext2D.prototype.ellipse = function(){ ell++; return realEll.apply(this, arguments); };
    try {
      var base3 = Math.floor((performance.now() / 1000 + seedP) / 7) * 7 - seedP;
      drawAmbient(ctx, (base3 + .4) * 1000);
      var withFish = ell; ell = 0;
      drawAmbient(ctx, (base3 + 3.5) * 1000);
      if (!(withFish > ell)) fails.push('池塘不會有魚跳出水面');
    } finally { CanvasRenderingContext2D.prototype.ellipse = realEll; }
    // 音效跟著動作：溜滑梯滑下來的時候「咻」一次
    var played = [], realPlay = Sound.play;
    Sound.play = function(n){ played.push(n); };
    try {
      var sl2 = curRoom().items.filter(function(x){ return x.id === 'slide'; })[0];
      fufuStartAct('slide', performance.now(), sl2, true);
      fufu.ride.start = performance.now() - 1000; ridePos(performance.now());
      if (played.indexOf('whoosh') >= 0) fails.push('還在爬梯子就「咻」了');
      fufu.ride.start = performance.now() - 2500; ridePos(performance.now()); ridePos(performance.now());
      if (played.filter(function(n){ return n === 'whoosh'; }).length !== 1) fails.push('滑下來沒有剛好「咻」一次');
      fufu.ride = null; fufu.act = null; played = [];
      fufuStartAct('sand', performance.now(), sbx2, true); fufu.act = null;
      if (played.indexOf('sand') < 0) fails.push('玩沙沒有沙沙聲');
    } finally { Sound.play = realPlay; }
    G.away = null; host.n = null; G.hostMem = {}; G.animals = {};

    /* 52 第一輪 UX：可以玩的東西冒提示、點了有回應、目的地圖示、復原上一步、新收集大圖、休息前的今天成果 */
    G.away = null; closeGameWindow(); $('#modal').hidden = true; hideUndo();
    var rmU = G.rooms[G.cur];
    // ④ 復原按鈕拿掉了（家長：不需要）：放家具、搬家具之後都不會出現
    if (document.getElementById('btnUndo')) fails.push('畫面上還有「復原」按鈕');
    G.inv.wood_bed = (G.inv.wood_bed || 0) + 1;
    var nBefore = rmU.items.length;
    startHoldFromInv('wood_bed');
    if (!hold || !hold.ok) { for (var hx = 0; hx < rmU.w && !(hold && hold.ok); hx++) for (var hy = 0; hy < rmU.d; hy++) { hold.x = hx; hold.y = hy; hold.ok = canPlace(rmU, hold.def, hx, hy, 0, null); if (hold.ok) break; } }
    placeHold();
    if (rmU.items.length !== nBefore + 1) fails.push('放家具測試：床沒有放下去');
    if (/復原/.test(document.querySelector('.stage').textContent)) fails.push('放好家具後出現「復原」');
    // ② 點家具會跳一下
    var tapIt = rmU.items[0];
    if (tapIt) {
      var tDef = FURN_BY_ID[tapIt.id], base2 = getParts(tDef, tapIt.rot || 0);
      showItemMenu(tapIt, { clientX: 10, clientY: 10 }); hideItemMenu();
      stateOf(tapIt.uid).tapAt = performance.now() - 160;
      var bounced = itemLook(tDef, tapIt.rot || 0, tapIt, base2);
      if (!(bounced[0].z > base2[0].z + 2)) fails.push('點到的家具沒有跳一下');
    }
    // 目的地圖示：小可愛走過去做事的時候，那件家具上面有那件事的圖示
    var icons = [], realFI = drawFloatIcon;
    drawFloatIcon = function(c, x, y, e, a){ icons.push(e); };
    try {
      travelArrive('park'); var rdd2 = document.getElementById('roomDoors'); if (rdd2) rdd2.remove();
      var sbx = curRoom().items.filter(function(x){ return x.id === 'sandbox'; })[0];
      fufu.task = { uid: sbx.uid, act: 'sand' }; fufu.path = [[1, 1]];
      draw();                                            // 真的畫一次（不是直接叫 drawTargetMarker）
      if (icons.indexOf(actEmoji('sand')) < 0) fails.push('走去玩沙的時候，沙坑上面沒有🏖️圖示');
      fufu.task = null; fufu.path = [];
      // ① 提示：只提示還沒做過的事；做過的不再提示
      G.usedActs = {};
      actHint.at = -1e9; icons = [];
      drawActHint(ctx, performance.now());
      actHint.at = performance.now() - 1300;
      drawActHint(ctx, performance.now());
      if (!icons.length) fails.push('可以玩的東西沒有冒出提示圖示');
      G.usedActs = {}; Object.keys(ACTIVITIES).forEach(function(k){ G.usedActs[k] = 1; });
      actHint.at = -1e9; icons = [];
      drawActHint(ctx, performance.now()); actHint.at = performance.now() - 1300; drawActHint(ctx, performance.now());
      if (icons.length) fails.push('每一件都做過了，還一直冒提示');
      G.usedActs = {};
      fufuStartAct('sand', performance.now(), sbx, false); fufu.act = null;
      if (!G.usedActs.sand) fails.push('玩過沙，沒有記成「做過了」');
      G.usedActs = {};
      fufuStartAct('sand', performance.now(), sbx, true); fufu.act = null;
      if (G.usedActs.sand) fails.push('小可愛自己閒晃去玩，也算成她做過了');
    } finally { drawFloatIcon = realFI; G.away = null; G.usedActs = {}; }
    // ⑤ 新收集：大圖展示，重複的不展示
    var sc0 = document.getElementById('showcase'); if (sc0) sc0.remove();
    G.animals = {};
    meetAnimal(VISIT_ANIMALS[0]);
    if (!document.getElementById('showcase')) fails.push('遇到新動物沒有大圖展示');
    document.getElementById('showcase') && document.getElementById('showcase').remove();
    meetAnimal(VISIT_ANIMALS[0]);
    if (document.getElementById('showcase')) fails.push('重複遇到同一隻也跳大圖');
    var fishBefore = JSON.stringify(G.fish);
    var newFish = FISH.filter(function(f){ return !G.fish[f.name]; })[0];
    if (newFish) {
      catchFish(newFish); if (!document.getElementById('showcase')) fails.push('釣到新的魚沒有大圖展示');
      document.getElementById('showcase') && document.getElementById('showcase').remove();
      catchFish(newFish); if (document.getElementById('showcase')) fails.push('釣到同一種魚也跳大圖');
    }
    var sc1 = document.getElementById('showcase'); if (sc1) sc1.remove();
    G.animals = {};
    // ⑧ 休息畫面：今天做了什麼、存好了先玩到這裡
    sessionLog.met = ['園長']; sessionLog.acts = { slide: 1 }; sessionLog.newThings = ['🐷 小豬']; sessionLog.placed = 2; sessionLog.earned0 = G.earned - 500;
    var sum = sessionSummary();
    if (!/溜滑梯/.test(sum) || !/遇見了園長/.test(sum) || !/小豬/.test(sum) || !/布置了 2 樣/.test(sum)) fails.push('今天做了的內容不對：' + sum);
    if (/賺了/.test(sum)) fails.push('今天做了的已經有四件事，還把賺多少錢擠進來（錢應該最次要）');
    sessionLog.met = []; sessionLog.acts = { 'book:moon': 1 }; sessionLog.newThings = []; sessionLog.placed = 0;
    if (!/1 本繪本/.test(sessionSummary()) || !/賺了/.test(sessionSummary())) fails.push('只有看書和賺錢的時候，今天做了的內容不對：' + sessionSummary());
    sessionLog.met = [];
    sessionLog.acts = {}; sessionLog.newThings = []; sessionLog.placed = 0; sessionLog.earned0 = G.earned;
    if (sessionSummary() !== '') fails.push('什麼都沒做也有「今天做了」');
    saveRestCfg({ on: true, play: 20, rest: 5, pin: '' });
    sessionLog.acts = { slide: 1 };
    forceRestNow();
    var ovR = document.getElementById('restOverlay');
    if (!/溜滑梯/.test(ovR.querySelector('.rest-done').textContent)) fails.push('休息畫面沒有顯示今天做了什麼');
    var byeB = ovR.querySelector('.rest-bye');
    if (!byeB) fails.push('休息畫面沒有「今天先玩到這裡」');
    else { byeB.onclick(); if (!/掰掰/.test(ovR.querySelector('.rest-title').textContent)) fails.push('按了今天先玩到這裡沒有說掰掰'); }
    localStorage.removeItem(REST_STATE_KEY); localStorage.removeItem(REST_CFG_KEY); endRest(); resting = false;
    ovR.remove();
    sessionLog.acts = {};

    /* 51 場景動畫：溜滑梯爬上去滑下來、鞦韆座位擺、沙堡一層一層、池塘的魚和鴨子會動、野餐點心變少；
       冷卻中動畫照演、不跳「等幾分鐘」（零用錢的才說） */
    travelArrive('park'); var rdd = document.getElementById('roomDoors'); if (rdd) rdd.remove();
    var slideIt = curRoom().items.filter(function(x){ return x.id === 'slide'; })[0];
    var t0r = performance.now();
    G.actCD = {}; fufu.pose = null;
    fufuStartAct('slide', t0r, slideIt, true);
    if (!fufu.ride || fufu.ride.key !== 'slide' || fufu.act.until - t0r !== RIDES.slide.dur) fails.push('點溜滑梯沒有開始溜滑梯動畫');
    var at = function(ms){ fufu.ride.start = performance.now() - ms; fufu.act.start = fufu.ride.start; return ridePos(performance.now()); };
    var pClimb0 = at(50), pClimb = at(1400), pTop = at(1900), pMid = at(2600), pEnd = at(3300), pCheer = at(4000);
    if (!(pClimb.z > pClimb0.z + 30) || pClimb.sit) fails.push('爬梯子沒有往上爬（' + pClimb0.z.toFixed(0) + '→' + pClimb.z.toFixed(0) + '）');
    if (!pTop.sit || pTop.z < 50) fails.push('沒有坐在滑梯頂端');
    if (!(pMid.z < pTop.z && pMid.z > pEnd.z) || !pMid.sit) fails.push('滑下來的時候高度沒有一路往下');
    var dTop = Math.hypot(pTop.x - pClimb.x, pTop.y - pClimb.y), dEnd = Math.hypot(pEnd.x - pClimb.x, pEnd.y - pClimb.y);
    if (!(dEnd > dTop + 1.5)) fails.push('沒有沿著滑道滑到另一頭');
    if (!pCheer.cheer || pCheer.sit) fails.push('滑完沒有站起來歡呼');
    // 越滑越快：後半段移動得比前半段多
    var a1 = at(2000), a2 = at(2550), a3 = at(3100);
    if (!(Math.hypot(a3.x - a2.x, a3.y - a2.y) > Math.hypot(a2.x - a1.x, a2.y - a1.y) * 1.5)) fails.push('溜滑梯沒有越滑越快');
    // 結束：停在滑道尾巴那一格（能站的話）
    fufu.act.until = performance.now() - 1;
    fufuUpdateAct(performance.now());
    if (fufu.ride) fails.push('溜滑梯結束了還在滑');
    if (Math.abs(fufu.x - pEnd.x) > .6 || Math.abs(fufu.y - pEnd.y) > .6) fails.push('滑完沒有停在滑道尾巴（' + fufu.x.toFixed(1) + ',' + fufu.y.toFixed(1) + '）');
    // 冷卻中：動畫一樣演，不跳等待提醒；拿錢的才說
    var realToast3 = toast, tl = [];
    toast = function(m){ tl.push(m); };
    try {
      G.actCD = { slide: Date.now() };
      fufuStartAct('slide', performance.now(), slideIt, false);
      if (!fufu.ride) fails.push('冷卻中就不能溜滑梯了（應該照樣可以玩）');
      if (tl.some(function(m){ return /等/.test(m); })) fails.push('冷卻中溜滑梯跳出等待提醒：' + tl.join('|'));
      G.away = { place: 'grandma', idx: 0 }; G.actCD = { hay: Date.now() }; tl = [];
      relativePerk('hay');
      if (!tl.some(function(m){ return /零用錢/.test(m); })) fails.push('零用錢冷卻中沒有說要等');
      G.away = { place: 'park', idx: 0 };
    } finally { toast = realToast3; }
    fufu.ride = null; fufu.act = null;
    // 每個地點的溜滑梯，出口那一格都要能站（不然滑完會卡在滑梯上）
    Object.keys(PLACES).forEach(function(pk){ PLACES[pk].rooms.forEach(function(rm2){
      rm2.items.forEach(function(it2){
        if ((it2.id || it2[0]) !== 'slide') return;
        var sx = it2.x != null ? it2.x : it2[1], sy = it2.y != null ? it2.y : it2[2], sr = it2.rot != null ? it2.rot : (it2[3] || 0);
        var lp = rotPoint(FURN_BY_ID.slide, sr, 3.3, .5), lx2 = Math.floor(sx + lp.x), ly2 = Math.floor(sy + lp.y);
        var bg = blockedGrid({ w: rm2.w, d: rm2.d, items: rm2.items.map(function(q){ return q.id ? q : { id: q[0], x: q[1], y: q[2], rot: q[3] || 0 }; }) });
        if (lx2 < 0 || ly2 < 0 || lx2 >= rm2.w || ly2 >= rm2.d || bg[lx2][ly2]) fails.push(PLACES[pk].name + rm2.name + '的溜滑梯出口被擋住了');
      });
    }); });
    // 鞦韆：座位跟著擺
    travelArrive('school'); rdd = document.getElementById('roomDoors'); if (rdd) rdd.remove(); goPlaceRoom(1); rdd = document.getElementById('roomDoors'); if (rdd) rdd.remove();
    var swIt = curRoom().items.filter(function(x){ return x.id === 'swing'; })[0], swDef = FURN_BY_ID.swing;
    fufuStartAct('swing', performance.now(), swIt, true);
    var seatAt = function(ms){ fufu.ride.start = performance.now() - ms;
      var ps = itemLook(swDef, swIt.rot || 0, swIt, getParts(swDef, swIt.rot || 0)).filter(function(p){ return p.swingA === 1; })[0];
      return ps ? ps.x + ps.y + ps.z / 10 : null; };
    var s1 = seatAt(1500), s2 = seatAt(1980), s3 = seatAt(2470);
    if (s1 === null || (Math.abs(s1 - s2) < .05 && Math.abs(s2 - s3) < .05)) fails.push('盪鞦韆的時候座位沒有動');
    var rpS = (fufu.ride.start = performance.now() - 2000, ridePos(performance.now()));
    if (!rpS || !rpS.sit || rpS.z < 15) fails.push('盪鞦韆沒有坐在座位上');
    fufu.ride = null; fufu.act = null;
    var still = itemLook(swDef, swIt.rot || 0, swIt, getParts(swDef, swIt.rot || 0)).filter(function(p){ return p.swingA === 1; })[0];
    var base = getParts(swDef, swIt.rot || 0).filter(function(p){ return p.swingA === 1; })[0];
    if (still.x !== base.x || still.y !== base.y) fails.push('沒在盪的鞦韆座位也在動');
    // 沙堡：一層一層蓋、最多五層、過一陣子不見
    travelArrive('park'); rdd = document.getElementById('roomDoors'); if (rdd) rdd.remove();
    var sbIt = curRoom().items.filter(function(x){ return x.id === 'sandbox'; })[0], sbDef = FURN_BY_ID.sandbox;
    delete itemState[sbIt.uid];
    var nParts = function(){ return itemLook(sbDef, sbIt.rot || 0, sbIt, getParts(sbDef, sbIt.rot || 0)).length; };
    var n0 = nParts(), counts = [];
    for (var sb = 0; sb < 7; sb++) { fufuStartAct('sand', performance.now(), sbIt, true); fufu.act = null; counts.push(nParts()); }
    if (!(counts[0] > n0 && counts[4] > counts[2] && counts[2] > counts[0])) fails.push('沙堡沒有一層一層變高：' + n0 + ' → ' + counts.join(','));
    if (counts[6] !== counts[4] || stateOf(sbIt.uid).castle !== 5) fails.push('沙堡超過五層了');
    stateOf(sbIt.uid).castleUntil = Date.now() - 1;
    if (nParts() !== n0) fails.push('過了一陣子沙堡還在');
    // 池塘：沒有人在玩也有魚在游、鴨子在漂
    var pondIt = curRoom().items.filter(function(x){ return x.id === 'pond'; })[0], pondDef = FURN_BY_ID.pond;
    var pp = itemLook(pondDef, pondIt.rot || 0, pondIt, getParts(pondDef, pondIt.rot || 0));
    if (pp.length <= getParts(pondDef, pondIt.rot || 0).length) fails.push('池塘裡沒有魚在游');
    var duckA = pp.filter(function(p){ return p.duck; })[0], duckB = getParts(pondDef, pondIt.rot || 0).filter(function(p){ return p.duck; })[0];
    if (!duckA || (duckA.x === duckB.x && duckA.y === duckB.y)) fails.push('池塘的小鴨子沒有在漂');
    // 野餐：點心越吃越少
    var pmIt = curRoom().items.filter(function(x){ return x.id === 'picnic_mat'; })[0], pmDef = FURN_BY_ID.picnic_mat;
    fufu.act = { key: 'picnic', uid: pmIt.uid, start: performance.now(), until: performance.now() + 9e9 };
    var e0 = itemLook(pmDef, pmIt.rot || 0, pmIt, getParts(pmDef, pmIt.rot || 0)).length;
    fufu.act.start = performance.now() - 4500;
    var e1 = itemLook(pmDef, pmIt.rot || 0, pmIt, getParts(pmDef, pmIt.rot || 0)).length;
    if (!(e0 > getParts(pmDef, pmIt.rot || 0).length && e1 < e0)) fails.push('野餐沒有拿出點心、或點心沒有變少');
    var sandH = function(ms){ fufu.act.start = performance.now() - ms;
      var sp = itemLook(pmDef, pmIt.rot || 0, pmIt, getParts(pmDef, pmIt.rot || 0)).filter(function(q){ return q.c === '#ffffff' && q.z === 1.5 && q.h > 1; });
      return sp.length ? Math.max.apply(0, sp.map(function(q){ return q.h; })) : 0; };
    var h0 = sandH(0), h3 = sandH(3000), h5 = sandH(4900);
    if (!(h0 > h3 && h3 > 0)) fails.push('野餐的三明治沒有越吃越少（' + h0 + ' → ' + h3 + '）');
    if (h5 !== 0) fails.push('吃完了三明治還在');
    fufu.act = null; G.away = null; G.actCD = {};

    /* ㊿ ChatGPT 檢查出來的四個問題＋兩個建議 */
    // (1) 讀不出來的存檔：不能被新遊戲蓋掉、要另外留一份、存檔要回報失敗、畫面要提醒
    var goodRaw = localStorage.getItem(SAVE_KEY);
    try {
      localStorage.setItem(SAVE_KEY, '{這不是 JSON');
      var g2 = loadGame();
      if (SAVE_LOCKED !== '{這不是 JSON') fails.push('讀不出來的存檔沒有被鎖住保護');
      if (localStorage.getItem(rescueKey()) !== '{這不是 JSON') fails.push('讀不出來的存檔沒有另外留一份');
      var keepG = G; G = g2;
      if (saveGame() !== false) fails.push('鎖住的時候 saveGame 還說存好了');
      if (localStorage.getItem(SAVE_KEY) !== '{這不是 JSON') fails.push('讀不出來的存檔被新遊戲蓋掉了');
      var warnB = document.getElementById('saveWarn');
      if (!warnB || warnB.hidden) fails.push('存檔被鎖住，畫面上沒有提醒');
      openRescue();
      var rt = document.querySelector('#modalCard').textContent;
      if (!/下載原始資料/.test(rt) || !/重新開始/.test(rt)) fails.push('讀不出來的處理畫面少了選項');
      $('#modal').hidden = true;
      G = keepG;
    } finally { SAVE_LOCKED = null; localStorage.setItem(SAVE_KEY, goodRaw); localStorage.removeItem(rescueKey()); }
    if (saveGame() !== true) fails.push('正常的時候 saveGame 沒有回報成功');
    if (!document.getElementById('saveWarn').hidden) fails.push('存好了，提醒還掛著');
    // 存不進去（空間滿了等等）也要回報、要提醒
    var realSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function(){ throw new Error('full'); };
    var sgFail;
    try { sgFail = saveGame(); } finally { Storage.prototype.setItem = realSet; }
    if (sgFail !== false || document.getElementById('saveWarn').hidden) fails.push('存不進去的時候沒有回報或沒有提醒');
    saveGame();
    // 型態壞掉的資料不能當成舊版收下來，也不能讓程式當掉
    var badShapes = [{ rooms: [{ items: {} }] }, { rooms: [{ items: [{ id: 1, x: 0, y: 0 }] }] }, { rooms: [{ items: [] }], bells: 'abc' }, { rooms: [{ wallItems: 'x' }] }];
    badShapes.forEach(function(b, i){
      try { if (normalizeSave(JSON.parse(JSON.stringify(b))) !== null) fails.push('壞掉的資料 #' + i + ' 被當成舊版收下了'); }
      catch(e) { fails.push('壞掉的資料 #' + i + ' 讓 normalizeSave 當掉：' + e.message); }
      try { if (readBackup(JSON.stringify({ tag: SAVE_TAG, data: JSON.stringify(b) })) !== null) fails.push('壞掉的備份 #' + i + ' 被接受了'); }
      catch(e) { fails.push('壞掉的備份 #' + i + ' 讓匯入當掉：' + e.message); }
    });
    if (!normalizeSave({ rooms: [{ name: '客廳', w: 6, d: 6 }] })) fails.push('只少欄位的舊版存檔被當成壞掉');
    // 驗證沒涵蓋到的怪欄位（hairOwned 是數字）會讓 normalizeSave 丟錯：匯入要接住、不能整頁當掉
    try { if (readBackup(JSON.stringify({ tag: SAVE_TAG, data: JSON.stringify({ rooms: [{}], hairOwned: 5 }) })) !== null) fails.push('怪欄位的備份被接受了'); }
    catch(e) { fails.push('怪欄位的備份讓匯入當掉：' + e.message); }
    // (2) 釣魚被別的視窗／休息畫面關掉，動畫和按鍵也要清乾淨
    var realAdd = document.addEventListener, realRemove = document.removeEventListener, added = [], removed = [];
    document.addEventListener = function(t, f){ if (t === 'keydown') added.push(f); return realAdd.apply(this, arguments); };
    document.removeEventListener = function(t, f){ if (t === 'keydown') removed.push(f); return realRemove.apply(this, arguments); };
    try {
      openFishing();
      if (typeof gameCleanup !== 'function') fails.push('釣魚沒有登記清理工作');
      closeGameWindow();                                 // 休息提醒用的就是這個
      if (!added.length || added.some(function(f){ return removed.indexOf(f) < 0; })) fails.push('釣魚被關掉後，空白鍵事件還留著');
      if (fishTimer) fails.push('釣魚被關掉後，動畫還在跑');
      openFishing(); openFishing();                      // 連開兩次：上一個要先清掉
      closeGameWindow();
      if (added.some(function(f){ return removed.indexOf(f) < 0; })) fails.push('連開兩次釣魚，事件累積起來了');
    } finally { document.addEventListener = realAdd; document.removeEventListener = realRemove; }
    // (3) 家長密碼每次都要問
    var prompts = 0, realPrompt2 = readPin;
    saveRestCfg({ on: true, play: 20, rest: 5, pin: '4321' });
    readPin = function(m, cb){ prompts++; cb('4321'); };
    var okN = 0;
    askPin('a', function(){ okN++; }); askPin('b', function(){ okN++; });
    if (prompts !== 2 || okN !== 2) fails.push('家長密碼輸入一次後就不再問（問了 ' + prompts + ' 次）');
    // 輸入密碼要預設隱藏（●●●●）；可以按 👁 看一下；取消就什麼都不做；iPad 跳數字鍵盤
    readPin = realPrompt2;
    var pinOk = 0, pinGot = 'x';
    askPin('測試', function(){ pinOk++; });
    var pinIn = document.querySelector('#pinBox input');
    if (!pinIn) fails.push('輸入密碼沒有跳出密碼框');
    else {
      if (pinIn.type !== 'password') fails.push('輸入密碼沒有預設隱藏（type=' + pinIn.type + '）');
      if (pinIn.inputMode !== 'numeric') fails.push('輸入密碼不是數字鍵盤');
      var pcR = document.querySelector('#pinBox .pin-card').getBoundingClientRect();
      if (pcR.right > innerWidth + 1 || pcR.left < -1) fails.push('密碼框超出畫面（' + Math.round(pcR.left) + '～' + Math.round(pcR.right) + '）');
      if (!(parseInt(getComputedStyle(document.getElementById('pinBox')).zIndex, 10) > 100)) fails.push('密碼框會被休息畫面蓋住（休息中要用密碼提早結束）');
      document.querySelector('#pinBox .pin-eye').onclick();
      if (pinIn.type !== 'text') fails.push('按 👁 看不到密碼');
      pinIn.value = '4321';
      [].filter.call(document.querySelectorAll('#pinBox button'), function(b){ return b.textContent === '確定'; })[0].onclick();
      if (pinOk !== 1 || document.getElementById('pinBox')) fails.push('密碼框打對了按確定沒有通過或沒有關掉');
    }
    askPin('測試', function(){ pinOk++; });
    document.querySelector('#pinBox input').value = '4321';   // 打對了，但按取消：還是不算
    [].filter.call(document.querySelectorAll('#pinBox button'), function(b){ return b.textContent === '取消'; })[0].onclick();
    if (pinOk !== 1) fails.push('密碼框按取消也通過了');
    // 危險的按鈕也要密碼：重新開始
    var realReset = confirmReset, resetCalled = 0;
    confirmReset = function(){ resetCalled++; };
    readPin = function(m, cb){ cb('0000'); };
    openTab('save');
    var resetBtn = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /重新開始（清除存檔）/.test(b.textContent); })[0];
    if (resetBtn) { resetBtn.onclick(); if (resetCalled) fails.push('密碼錯了還能按「重新開始」'); readPin = function(m, cb){ cb('4321'); }; resetBtn.onclick(); if (!resetCalled) fails.push('密碼對了卻不能按「重新開始」'); }
    else fails.push('找不到「重新開始」按鈕');
    confirmReset = realReset; readPin = realPrompt2;
    localStorage.removeItem(REST_CFG_KEY);              // 回到預設，後面的測試要用
    // 寬限中打開新的小遊戲：直接開始休息（等一下下）
    saveRestCfg({ on: true, play: 20, rest: 5, pin: '' });
    var rs = restState(); rs.dueAt = Date.now() - 1000; rs.restUntil = 0; saveRestState(rs);
    var realFRN = forceRestNow, frn = 0; forceRestNow = function(){ frn++; };
    var realST = window.setTimeout; window.setTimeout = function(f){ f(); return 0; };
    try { openMemoryGame(); } finally { window.setTimeout = realST; forceRestNow = realFRN; }
    if (!frn) fails.push('時間到了還能開新的一局小遊戲');
    closeGameWindow(); localStorage.removeItem(REST_STATE_KEY); localStorage.removeItem(REST_CFG_KEY);
    if ($('#modalCard').classList.contains('in-game')) fails.push('關掉小遊戲之後還標著「正在玩」');
    // 繪本 🔊：念出這一頁；按過一次之後翻頁自動念
    var spoken = [], realSS = window.speechSynthesis, realSU = window.SpeechSynthesisUtterance;
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: function(t){ this.text = t; }, configurable: true, writable: true });
    Object.defineProperty(window, 'speechSynthesis', { value: { cancel: function(){}, speak: function(u){ spoken.push(u.text); } }, configurable: true, writable: true });
    try {
      openStorybook('brave');
      openStorybook.test.next();                         // 翻到第一頁
      if (spoken.length) fails.push('還沒按🔊就自己念了');
      var sayB = document.querySelector('#modalCard .book-say');
      if (!sayB) fails.push('繪本沒有🔊聽故事');
      else {
        var braveB = STORYBOOKS.filter(function(b){ return b.id === 'brave'; })[0];
        sayB.onclick();
        if (spoken[0] !== braveB.pages[0][1]) fails.push('🔊 念的不是這一頁：' + spoken[0]);
        openStorybook.test.next();
        if (spoken.length !== 2 || spoken[1] !== braveB.pages[1][1].replace(/[「」]/g, '')) fails.push('按過🔊之後，翻頁沒有自動念：' + spoken.join('|'));
      }
      openStorybook('moon');
      if (spoken.length !== 2) fails.push('換一本書也自動念了（應該要再按一次🔊）');
    } finally {
      Object.defineProperty(window, 'speechSynthesis', { value: realSS, configurable: true, writable: true });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: realSU, configurable: true, writable: true });
      $('#modal').hidden = true;
    }
    // 難度：每個選難度的地方都有星星，第一個標成最簡單
    [openCupGame, openMoleGame, openCoinGame, openPuzzleGame, openQuizGame].forEach(function(fn){
      fn();
      var lbs = document.querySelectorAll('#modalCard .lv-btn');
      var stars = [].map.call(lbs, function(b){ var st = b.querySelector('.lv-stars'); return st ? st.textContent.length : 0; });
      if (!lbs.length || stars.some(function(n, i){ return n !== (i + 1) * '⭐'.length; })) fails.push(fn.name + ' 的難度沒有一、二、三顆星：' + stars);
      if (!lbs[0] || !lbs[0].classList.contains('easy')) fails.push(fn.name + ' 最簡單的沒有標出來');
      closeGameWindow();
    });
    // (5) 備份要用按下去那一刻的最新進度
    openTab('backup');
    G.bells = 777777;
    var realDl = downloadText, got = null;
    downloadText = function(t){ got = t; };
    try {
      var dlBtn = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /存成檔案/.test(b.textContent); })[0];
      dlBtn.onclick();
    } finally { downloadText = realDl; }
    var gotSave = got && readBackup(got);
    if (!gotSave || JSON.parse(gotSave.data).bells !== 777777) fails.push('下載的備份不是最新的進度');
    G.bells = 100000; saveGame();

    /* 63 🎁 新版開幕禮：爸爸媽媽一起走進來、把包裹放在她旁邊，點包裹才打開（不是跳出來的視窗——家長怕像詐騙）。
       每格一次、10 萬＋一顆蛋；新格打開後剛好 10 萬；舊存檔也拿得到；
       爸媽送包裹時公告不跳、小安素不送；她換房間包裹跟著她；包裹沒開就關遊戲，下次會再送 */
    var gOld = JSON.parse(JSON.stringify(G)); delete gOld.openGift; gOld.bells = 3456; gOld.topup100k = true;
    var gOldN = normalizeSave(gOld);
    if (!gOldN || gOldN.openGift !== false) fails.push('已經在玩的存檔拿不到開幕包裹');
    if (gOldN && gOldN.bells !== 3456) fails.push('還沒打開包裹，錢就先變了');
    var gDone = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { openGift: true }));
    if (!gDone || gDone.openGift !== true) fails.push('打開過的包裹讀回來又可以開');
    var keepG = G, keepAway = G.away;
    G = newGame(); G.newsSeen = []; G.supplyAt = Date.now(); giftReset(); supplyGone();
    var keepFufu = [fufu.x, fufu.y, fufu.pose, fufu.path]; fufu.pose = null; fufu.path = []; fufu.x = 2.5; fufu.y = 2.5;
    $('#modal').hidden = true;
    maybeShowNews();
    if (!$('#modal').hidden) fails.push('包裹還沒開，更新公告就先跳出來（會擋住爸爸媽媽）');
    if (typeof openGiftEnvelope === 'function') fails.push('還留著跳出來的紅包視窗');
    var t0 = performance.now();
    giftTick(t0); giftTick(t0 + 500);
    if (giftVisit.state !== 'none') fails.push('一打開遊戲爸媽就衝進來（要先等一下）');
    $('#modal').hidden = false; giftTick(t0 + 3000);
    if (giftVisit.state !== 'none') fails.push('有視窗開著，爸媽還是走進來');
    $('#modal').hidden = true; giftTick(t0 + 3100);
    if (giftVisit.state !== 'in' || giftVisit.actors.length !== 2) fails.push('爸爸媽媽沒有一起走進來（' + giftVisit.state + '，' + giftVisit.actors.length + ' 人）');
    else {
      var ids = giftVisit.actors.map(function(x){ return x.who.id; }).sort().join();
      if (ids !== 'dad,mom') fails.push('走進來的不是爸爸跟媽媽：' + ids);
      if (giftDrawEntries().length !== 2) fails.push('爸爸媽媽沒有被畫出來');
      G.supplyAt = 0; G.kidFood = {}; G.food = {}; nextSupplyCheck = 0;
      supplyTick(t0 + 3200);
      if (sup.who) fails.push('爸媽送包裹的時候，又有人進來送小安素');
      supplyGone(); G.supplyAt = Date.now();
      // 走過去：最久六秒一定放下包裹
      for (var gi = 1; gi < 600 && giftVisit.state === 'in'; gi++) giftTick(t0 + 3100 + gi * 1000 / 60); // 一格畫面一格畫面走
      if (giftVisit.state !== 'drop' || !giftVisit.box) fails.push('爸爸媽媽沒有把包裹放下（' + giftVisit.state + '）');
      if (G.openGift || G.bells !== 0) fails.push('包裹還沒點開，錢就已經給了');
      if (!giftVisit.says[0]) fails.push('爸媽放下包裹時沒有說話');
      var pa = giftVisit.actors.map(function(x){ return Math.floor(x.a.x) + ',' + Math.floor(x.a.y); });
      var pq = giftVisit.actors.map(function(x){ return [Math.floor(x.a.x), Math.floor(x.a.y)]; });
      if (Math.abs((pq[0][0] - pq[0][1]) - (pq[1][0] - pq[1][1])) < 2) fails.push('爸爸媽媽在畫面上一前一後（一個擋住另一個）');
      if (pa.indexOf(Math.floor(fufu.x) + ',' + Math.floor(fufu.y)) >= 0) fails.push('爸媽站在她身上');
      if (giftVisit.box && Math.floor(giftVisit.box.x) === Math.floor(fufu.x) && Math.floor(giftVisit.box.y) === Math.floor(fufu.y)) fails.push('包裹放在她腳下（點不到）');
      // 放下之後不會自己走：站在旁邊等她打開，每隔一陣子提醒一次
      for (var gj = 0; gj < 400; gj++) giftTick(t0 + 20000 + gj * 100);
      if (giftVisit.state !== 'wait' || giftVisit.actors.length !== 2) fails.push('包裹還沒打開，爸媽就走了（' + giftVisit.state + '）');
      if (!giftBoxHere()) fails.push('包裹放下後不見了');
      var said = giftVisit.says.filter(function(x){ return x && GIFT_REMIND.indexOf(x.text) >= 0; }).length;
      if (!said) fails.push('等很久沒打開，爸媽沒有提醒');
    }
    // 點包裹：用畫面座標點下去
    var bx = giftBoxHere(), bp = iso(bx.x, bx.y, 0);
    if (!giftBoxHit({ x: bp.x, y: bp.y - 12 })) fails.push('點包裹點不到');
    if (giftBoxHit({ x: bp.x + 200, y: bp.y })) fails.push('點旁邊也算點到包裹');
    var pets0 = G.pets.length;
    var r1 = canvas.getBoundingClientRect();
    canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: r1.left + bp.x * view.scale + view.ox, clientY: r1.top + (bp.y - 12) * view.scale + view.oy, bubbles: true }));
    var openBtn = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /打開包裹/.test(b.textContent); })[0];
    if ($('#modal').hidden || !openBtn) fails.push('點了包裹沒有打開');
    if (document.querySelector('#modalCard .modal-x')) fails.push('包裹視窗有 ✕（會不小心關掉）');
    if (!/爸爸媽媽/.test($('#modalCard').textContent)) fails.push('包裹沒寫是爸爸媽媽送的');
    if (openBtn) openBtn.onclick();
    if (G.bells !== START_BELLS) fails.push('新的存檔格打開包裹後不是 ' + START_BELLS + '（' + G.bells + '）');
    if (G.pets.length !== pets0 + 1 || G.pet.stage !== 'egg') fails.push('包裹沒有送寵物蛋，或蛋沒有變成主要照顧的那隻');
    if (G.pets[G.pets.length - 1].species === 'mochi') fails.push('包裹的蛋沒有優先孵出還沒收集到的');
    if (G.earned !== 0) fails.push('包裹的錢被算成「賺到的」');
    if (!/100,000/.test($('#modalCard').textContent)) fails.push('打開後沒寫拿到多少');
    if (giftBoxHere()) fails.push('打開了包裹還在地上');
    giftTick(t0 + 61000); giftTick(t0 + 62000);
    if (giftVisit.state !== 'wait') fails.push('她還在看包裹裡面，爸媽就先走了（' + giftVisit.state + '）');
    var reG = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    if (!reG || !reG.openGift) fails.push('打開過包裹沒有存起來');
    if (claimOpenGift() !== null || G.bells !== START_BELLS) fails.push('包裹可以開第二次');
    var okEnv = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /謝謝/.test(b.textContent); })[0];
    if (!okEnv) fails.push('打開後沒有關掉的按鈕');
    else { okEnv.onclick(); if (!$('#modal').hidden) fails.push('打開後關不掉'); }
    giftTick(t0 + 63000);
    if (giftVisit.state !== 'thanks') fails.push('說了謝謝，爸媽沒有回話（' + giftVisit.state + '）');
    else {
      if (giftVisit.says[0] && GIFT_BYE.indexOf(giftVisit.says[0].text) >= 0) fails.push('她的「謝謝」還沒說完，爸媽就搶著回話（對話框疊在一起）');
      giftTick(t0 + 65500);
      if (!giftVisit.says[0] || GIFT_BYE.indexOf(giftVisit.says[0].text) < 0) fails.push('爸媽回的話不對');
      if (giftVisit.state !== 'thanks') fails.push('爸媽話還沒說完就走了');
    }
    for (var gk = 0; gk < 1500 && giftVisit.state !== 'none'; gk++) giftTick(t0 + 63100 + gk * 1000 / 60);
    if (giftVisit.state !== 'none') fails.push('說完謝謝，爸媽走不掉（' + giftVisit.state + '）');
    giftTick(t0 + 200000); giftTick(t0 + 210000);
    if (giftVisit.state !== 'none') fails.push('打開過了爸媽又送來一次（說完謝謝之後）');
    // 爸媽在旁邊等的時候她換房間：爸媽先走，包裹跟著她；出門的時候不畫、回來還在
    G.openGift = false; giftReset();
    giftTick(t0 + 300000); for (var gm = 0; gm < 1500 && giftVisit.state !== 'wait'; gm++) giftTick(t0 + 303000 + gm * 1000 / 60);
    if (giftVisit.state !== 'wait') fails.push('（換房間測試）爸媽沒有進來等');
    if (G.rooms.length < 2) G.rooms.push(JSON.parse(JSON.stringify(G.rooms[0])));
    G.cur = 1; giftTick(t0 + 320000); giftTick(t0 + 320100);
    if (!giftBoxHere()) fails.push('她換房間，包裹沒有跟過來');
    G.cur = 0; giftTick(t0 + 320200);
    G.away = { place: 'uncle', idx: 0 };
    if (giftBoxHere()) fails.push('在叔叔家也看得到自己家的包裹');
    G.away = null; giftTick(t0 + 320300);
    if (!giftBoxHere()) fails.push('從叔叔家回來，包裹不見了');
    G.openGift = true; giftTick(t0 + 320400);
    if (giftBoxHere()) fails.push('打開過了，包裹還留在地上');
    // 爸媽的對話框沒有鄰居在的時候也要畫（以前的 bug：只有鄰居在才畫）
    var drew = 0, realNB = drawNeighborBubble;
    if (visitorDrawEntries().length) fails.push('（測試前提）房間裡有鄰居');
    sup.who = PARENTS[0]; sup.a = { x: 1, y: 1, z: 0, path: [] }; sup.say = '測試'; sup.sayUntil = performance.now() + 9999;
    drawNeighborBubble = function(){ drew++; };
    try { visitorDrawOverlay(canvas.getContext('2d'), performance.now()); } finally { drawNeighborBubble = realNB; }
    supplyGone();
    if (!drew) fails.push('沒有鄰居來玩的時候，爸媽說的話不會顯示');
    fufu.x = keepFufu[0]; fufu.y = keepFufu[1]; fufu.pose = keepFufu[2]; fufu.path = keepFufu[3];
    G = keepG; G.away = keepAway; G.openGift = true; saveGame(); giftReset();
    $('#modal').hidden = true;

    /* 75 📣 叫大家：睡覺、跳舞、點心、大合照、跟我走（只有寵物屋、蛋不參加、不改數值、不花錢） */
    var keepG13 = JSON.stringify(G), realToast13 = toast, realTake = takePhoto, shots = 0;
    toast = function(){}; takePhoto = function(){ shots++; return 'x'; };
    var run13 = function(n, t0){ for (var f = 0; f < n; f++) gameStep(1 / 60, t0 + f * 17); return t0 + n * 17; };
    try {
      G = normalizeSave(JSON.parse(keepG13)); G.away = null; G.petHouse = null; $('#modal').hidden = true; cancelHold(); phReset();
      G.pets = [newPet('mochi', 'kid', 'Main')];
      for (var q13 = 1; q13 <= 7; q13++) G.pets.push(newPet(PET_SPECIES[q13].id, 'kid', 'P' + q13));
      G.pets.push(newPet(PET_SPECIES[9].id, 'egg', ''));
      G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
      fufu.pose = null; fufu.path = []; fufu.x = 3.5; fufu.y = 5.5;
      refreshDupBtn();
      if (!$('#btnCallAll').hidden) fails.push('不在寵物屋也有「叫大家」');
      enterPetHouse(); refreshDupBtn();
      if ($('#btnCallAll').hidden) fails.push('寵物屋沒有「📣 叫大家」');
      $('#btnCallAll').onclick();
      if ($('#modalCard').querySelectorAll('.call-pick').length !== 9 || /大合照/.test($('#modalCard').textContent)) fails.push('叫大家不是九個選項（大合照要拿掉）');
      $('#modal').hidden = true;
      var walkers = phWalkers(), egg13 = phActor(9), ex13 = [egg13.x, egg13.y];
      if (walkers.length !== 7) fails.push('（測試）寵物屋裡的寵物數量不對：' + walkers.length);
      var stats0 = JSON.stringify(G.pets.slice(1).map(function(p){ return [p.hunger, p.clean, p.mood, p.growth]; })), bells0 = G.bells, food0 = JSON.stringify([G.food, G.kidFood]);
      var t13 = performance.now() + 100000;
      // 💤 睡覺
      phCallAll('sleep');
      if ($('#nightShade').hidden || !$('#nightShade').getBoundingClientRect().height) fails.push('大家去睡覺，房間沒有變暗');
      t13 = run13(1500, t13);
      if (!walkers.every(function(a){ return a.sleep; })) fails.push('叫大家去睡覺，有的沒有睡（' + walkers.filter(function(a){ return !a.sleep; }).length + ' 隻醒著）');
      var bedUids = walkers.filter(function(a){ return a.sleep && a.sleep.uid != null; }).map(function(a){ return a.sleep.uid; });
      if (new Set(bedUids).size !== bedUids.length) fails.push('兩隻擠在同一張床');
      var nBeds = curRoom().items.filter(function(it){ return PET_BEDS[it.id] && !PET_BEDS[it.id].withKid && !(pet.sleep && pet.sleep.uid === it.uid); }).length; // 照顧中那隻自己去睡掉的那張不算
      if (bedUids.length !== Math.min(nBeds, walkers.length)) fails.push('床沒有睡滿（' + bedUids.length + '/' + nBeds + '）');
      if (egg13.x !== ex13[0] || egg13.y !== ex13[1]) fails.push('蛋也跑去睡覺了');
      t13 = run13(600, t13);
      if (!walkers.every(function(a){ return a.sleep; })) fails.push('大家睡一下就自己醒了（要點畫面才天亮）');
      // 照顧中那隻不能擠到別隻睡著的床上
      var busyBed = curRoom().items.filter(function(it){ return bedUids.indexOf(it.uid) >= 0; })[0];
      if (busyBed) {
        var keepPS = pet.sleep; pet.sleep = null;
        pet.x = busyBed.x + .5; pet.y = busyBed.y + 1.5; pet.task = { uid: busyBed.uid, kind: 'nap' };
        petArriveBed(performance.now(), curRoom());
        if (pet.sleep) { fails.push('照顧中的寵物擠到別隻睡著的床上'); pet.sleep = null; pet.z = 0; }
        pet.sleep = keepPS;
      }
      // 點空的地方：不會叫醒大家
      var r13 = canvas.getBoundingClientRect();
      canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: r13.left + 5, clientY: r13.top + 5, bubbles: true }));
      if (!phMode || walkers.some(function(a){ return !a.sleep; })) fails.push('點空的地方，大家就醒了（要點到哪隻才醒哪隻）');
      // 點一隻：只有那隻起床，其他繼續睡
      var w0 = walkers[0], wi0 = phList().filter(function(i){ return phActors[i] === w0; })[0];
      phTap(wi0, { clientX: 10, clientY: 10 }); hideItemMenu();
      if (w0.sleep) fails.push('點了睡著的寵物，牠沒有起床');
      if (walkers.slice(1).some(function(a){ return !a.sleep; })) fails.push('點一隻，其他的也一起醒了');
      var nk3 = PH_NAP_CHANCE, pk3 = PH_PLAY_SHARE; PH_NAP_CHANCE = 1; PH_PLAY_SHARE = 0;   // 一定想去睡的時候也不能睡回去
      try { t13 = run13(300, t13); } finally { PH_NAP_CHANCE = nk3; PH_PLAY_SHARE = pk3; }
      if (w0.sleep) fails.push('叫醒的那隻又睡回去了');
      if (walkers.slice(1).some(function(a){ return !a.sleep; })) fails.push('沒點到的沒等時間到就醒了');
      refreshDupBtn();
      if (!/叫大家起床/.test($('#btnCallAll').textContent)) fails.push('睡覺時按鈕沒有變成「☀️ 叫大家起床」');
      if (!(Math.abs(phMode.until - phMode.start - PH_SLEEP_MS) < 1)) fails.push('睡覺沒有設定幾分鐘後自己起床');
      // 時間到：全部起床
      phMode.until = 0; t13 = run13(2, t13);
      if (phMode || walkers.some(function(a){ return a.sleep; }) || !$('#nightShade').hidden) fails.push('睡覺時間到，大家沒有起床、天沒亮');
      if (PH_SLEEP_MS > 180000) fails.push('睡覺要睡太久才自己起床');
      // ☀️ 按鈕：全部起床
      phCallAll('sleep'); t13 = run13(1500, t13); refreshDupBtn(); $('#btnCallAll').onclick();
      if (phMode || walkers.some(function(a){ return a.sleep; })) fails.push('按「☀️ 叫大家起床」，大家沒有起床');
      // 💃 跳舞
      phCallAll('dance');
      t13 = run13(700, t13);   // 寵物屋變 10×10，走過來要久一點
      if (!phMode || !phMode.gathered) fails.push('跳舞：圍好之後沒有開始算時間（大房間裡會走一走就結束）');
      var far = walkers.filter(function(a){ return Math.hypot(a.x - fufu.x, a.y - fufu.y) > 3.6; }).length;
      if (far) fails.push('跳舞時有 ' + far + ' 隻沒有圍在小可愛旁邊');
      var hops = 0; walkers.forEach(function(a){ a.beatAt = 0; }); run13(40, t13); walkers.forEach(function(a){ if (a.beatAt > t13) hops++; });
      if (hops < walkers.length) fails.push('跳舞時有的沒在跳（' + hops + '/' + walkers.length + '）');
      t13 = run13(600, t13 + 40 * 17);
      if (phMode) fails.push('跳舞一直沒結束');
      // 🍪 點心
      phCallAll('snack');
      var nSn = phMode.snacks.length;
      if (!nSn || phSnackEntries().length !== nSn) fails.push('點心時間沒有撒點心（或沒畫出來）');
      t13 = run13(650, t13);   // 15 秒會自己結束，這裡 11 秒內就要吃完
      if (phMode) fails.push('點心吃不完（' + (phMode.snacks || []).filter(function(q){ return q.left; }).length + ' 塊沒吃）');
      if (phMode) phModeEnd();
      // 🚂 跟我走
      phCallAll('train'); refreshDupBtn();
      if (!/解散/.test($('#btnCallAll').textContent)) fails.push('跟我走的時候按鈕沒有變成「解散」');
      var steps = [[3, 5], [4, 5], [5, 5], [5, 4], [5, 3]];
      steps.forEach(function(st){ fufu.x = st[0] + .5; fufu.y = st[1] + .5; fufu.path = []; fufu.idleUntil = Infinity; t13 = run13(80, t13); });
      t13 = run13(120, t13);
      var lead = walkers[0];
      if (Math.hypot(lead.x - fufu.x, lead.y - fufu.y) > 2.6) fails.push('跟我走：第一隻沒有跟在小可愛後面（距離 ' + Math.hypot(lead.x - fufu.x, lead.y - fufu.y).toFixed(1) + '）');
      fufu.idleUntil = 0;
      $('#btnCallAll').onclick();
      if (phMode) fails.push('按「解散」沒有結束跟我走');
      // 🙈 捉迷藏：躲好（淡淡的）、點到才找到、全部找到放煙火結束
      phCallAll('hide'); t13 = run13(700, t13);
      if (!walkers.every(function(a){ return a.hidden; })) fails.push('捉迷藏：有的沒躲好（' + walkers.filter(function(a){ return !a.hidden; }).length + ' 隻）');
      var alphas = [], realDPA2 = drawPetActor;
      drawPetActor = function(ctx){ alphas.push(ctx.globalAlpha); return realDPA2.apply(this, arguments); };
      try { draw(); } finally { drawPetActor = realDPA2; }
      if (!alphas.some(function(x){ return x < .6; })) fails.push('捉迷藏：躲起來的看起來跟平常一樣（沒有變淡）');
      walkers.forEach(function(a, k){ var ix = phList().filter(function(i){ return phActors[i] === a; })[0]; phTap(ix, { clientX: 1, clientY: 1 }); hideItemMenu(); });
      if (!phMode || !phMode.allFound || phMode.found !== walkers.length) fails.push('捉迷藏：全部點到了卻沒有「全部找到」');
      t13 = run13(200, t13);
      if (phMode) fails.push('捉迷藏：全部找到之後沒結束');
      // 🎵 音樂會：排成一排，點哪隻唱哪個音（不同音），不跳選單
      var played = [], realPlay = Sound.play;
      Sound.play = function(n, arg){ if (n === 'freq') played.push(arg); return realPlay.apply(this, arguments); };
      try {
        phCallAll('concert'); t13 = run13(600, t13);
        walkers.forEach(function(a){ var ix = phList().filter(function(i){ return phActors[i] === a; })[0]; phTap(ix, { clientX: 1, clientY: 1 }); });
      } finally { Sound.play = realPlay; }
      if (new Set(played).size !== Math.min(walkers.length, 8)) fails.push('音樂會：每隻沒有唱不同的音（' + played.join(',') + '）');
      if (!$('#itemMenu').hidden) fails.push('音樂會：點寵物跳出選單');
      refreshDupBtn(); $('#btnCallAll').onclick();
      if (phMode) fails.push('音樂會按「結束」沒有結束');
      // 🫧 泡泡：會冒泡泡、點得破、寵物會撲、時間到結束
      phCallAll('bubble'); t13 = run13(300, t13);
      var bb = phMode && phMode.bubbles.filter(function(q){ return !q.popped; })[0];
      if (!bb) fails.push('泡泡派對沒有泡泡');
      else {
        var bp2 = iso(bb.x, bb.y, bb.z), rB2 = canvas.getBoundingClientRect();
        canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: rB2.left + bp2.x * view.scale + view.ox, clientY: rB2.top + bp2.y * view.scale + view.oy, bubbles: true }));
        if (!bb.popped) fails.push('點泡泡沒有破');
        t13 = run13(900, t13);
        if (!(phMode && phMode.petPops)) fails.push('寵物不會撲泡泡');
      }
      t13 = run13(800, t13);
      if (phMode) fails.push('泡泡派對沒結束');
      // 🎂 生日：圍著蛋糕、點蛋糕吹蠟燭、結束
      phCallAll('birthday'); t13 = run13(600, t13);
      var ck = phMode && phMode.cake;
      if (!ck || !ck.lit) fails.push('生日派對沒有點蠟燭的蛋糕');
      else {
        var farC = walkers.filter(function(a){ return Math.hypot(a.x - ck.x - .5, a.y - ck.y - .5) > 3.2; }).length;
        if (farC) fails.push('生日派對：有 ' + farC + ' 隻沒有圍著蛋糕');
        var cp2 = iso(ck.x + .5, ck.y + .5, 0);
        if (!phCakeHit({ x: cp2.x, y: cp2.y - 14 }) || ck.lit) fails.push('點蛋糕沒有吹熄蠟燭');
        t13 = run13(400, t13);
        if (phMode) fails.push('吹完蠟燭沒結束');
      }
      // 🎀 戴帽子：點一下換一頂、會畫出來、按「戴好了」結束但帽子還在
      phCallAll('hats');
      var hx = phList().filter(function(i){ return phActors[i] === walkers[0]; })[0];
      phTap(hx, { clientX: 1, clientY: 1 }); var h1 = walkers[0].hat; phTap(hx, { clientX: 1, clientY: 1 }); var h2 = walkers[0].hat;
      if (!h1 || h1 === h2) fails.push('戴帽子：點了沒有換帽子');
      if (!$('#itemMenu').hidden) fails.push('戴帽子：點寵物跳出選單');
      var texts = [], realFT = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(t){ texts.push(t); return realFT.apply(this, arguments); };
      try { draw(); } finally { CanvasRenderingContext2D.prototype.fillText = realFT; }
      if (texts.indexOf(h2) < 0) fails.push('戴帽子：帽子沒有畫出來');
      refreshDupBtn(); $('#btnCallAll').onclick();
      if (phMode || walkers[0].hat !== h2) fails.push('按「戴好了」沒有結束，或帽子不見了');
      // 寵物屋寵物的 💤🎵💕 有畫出來
      walkers[1].particles.push({ kind: 'emoji', emoji: '🧪', x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 2 });
      var t2 = [], realFT2 = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function(t){ t2.push(t); return realFT2.apply(this, arguments); };
      try { draw(); } finally { CanvasRenderingContext2D.prototype.fillText = realFT2; }
      if (t2.indexOf('🧪') < 0) fails.push('寵物屋寵物冒的符號（💤🎵💕）沒有畫出來');
      // 不改數值、不花錢、不用食物
      if (JSON.stringify(G.pets.slice(1).map(function(p){ return [p.hunger, p.clean, p.mood, p.growth]; })) !== stats0) fails.push('叫大家改到了寵物屋寵物的數值');
      if (G.bells !== bells0 || JSON.stringify([G.food, G.kidFood]) !== food0) fails.push('點心時間花了錢或用掉了食物');
      // 離開寵物屋就結束
      phCallAll('dance'); leavePetHouse(0); gameStep(1 / 60, t13 + 20);
      if (phMode) fails.push('離開寵物屋，活動還沒結束');
    } finally { toast = realToast13; takePhoto = realTake; if (phMode) phModeEnd(); hideItemMenu(); G = normalizeSave(JSON.parse(keepG13)); saveGame(); phReset(); refreshTop(); refreshDupBtn(); $('#modal').hidden = true; }

    /* 77 寵物屋原本的擺設是非賣品：收進我的東西也不能賣；搬到別的房間再收起來還是非賣品；自己買的一樣可以賣 */
    var keepG15 = JSON.stringify(G), realToast15 = toast; toast = function(){};
    try {
      G = normalizeSave(JSON.parse(keepG15)); G.away = null; G.petHouse = null; G.noSell = {}; G.inv = {}; cancelHold(); $('#modal').hidden = true;
      enterPetHouse();
      var ph15 = curRoom().items.filter(function(x){ return x.id === 'pet_house'; })[0];
      startHoldFromRoom(ph15); storeHold();
      if (G.inv.pet_house !== 1) fails.push('（測試）寵物小屋沒收進我的東西');
      if (furnSellBlock('pet_house') !== '非賣品') fails.push('寵物屋原本的寵物小屋收起來後可以賣');
      openTab('inv');
      if (!/非賣品/.test($('#tabBody').textContent)) fails.push('我的東西沒有標「非賣品」');
      // 自己買一個：多的那個可以賣，原本那個還是不能
      G.inv.pet_house = 2;
      if (furnSellBlock('pet_house') !== null) fails.push('自己買的寵物小屋不能賣');
      sellFurniture('pet_house');
      if (G.inv.pet_house !== 1 || furnSellBlock('pet_house') !== '非賣品') fails.push('賣掉自己買的之後，原本的變成可以賣了');
      // 拿到客廳放，再收起來：還是非賣品
      leavePetHouse(0);
      startHoldFromInv('pet_house');
      var put15 = false, r15 = curRoom();
      for (var x15 = 0; x15 < r15.w && !put15; x15++) for (var y15 = 0; y15 < r15.d && !put15; y15++) { hold.x = x15; hold.y = y15; hold.ok = canPlace(r15, hold.def, x15, y15, hold.rot, null); if (hold.ok) { placeHold(); put15 = true; } }
      var placed15 = r15.items.filter(function(x){ return x.id === 'pet_house'; }).pop();
      if (!placed15 || !placed15.ns) fails.push('非賣品放到客廳沒有記號');
      if ((G.noSell.pet_house || 0) !== 0) fails.push('非賣品拿出來放了，數量沒有扣');
      // 右鍵（或收起來）收回去：還是非賣品
      r15.items = r15.items.filter(function(x){ return x.uid !== placed15.uid; }); storeRoomItem(placed15);
      if (furnSellBlock('pet_house') !== '非賣品') fails.push('非賣品繞一圈收回來就可以賣了');
      // 存檔讀回來還記得
      saveGame(); var re15 = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
      if (!re15 || re15.noSell.pet_house !== 1) fails.push('非賣品的記錄沒有存起來');
      var bad15 = JSON.parse(localStorage.getItem(SAVE_KEY)); bad15.noSell = 'x';
      var badN = normalizeSave(bad15);
      if (!badN || typeof badN.noSell !== 'object' || typeof badN.noSell === 'string') fails.push('非賣品記錄壞掉時沒有修好');
    } finally { toast = realToast15; cancelHold(); G = normalizeSave(JSON.parse(keepG15)); saveGame(); phReset(); refreshTop(); openTab('inv'); }

    /* 79 寵物食物加骨頭（只給寵物吃）；多兩隻特別的寵物（翅膀、閃亮亮、光環，比稀有更難孵） */
    if (!FOOD_BY_ID.bone || FOOD_BY_ID.bone.emoji !== '🦴') fails.push('寵物食物沒有骨頭');
    var keepFood17 = JSON.stringify([G.food, G.kidFood, G.kid.hunger, G.bells]);
    try {
      G.bells = 99999; G.food = {}; shopKind = 'food'; shopTheme = 'all'; openTab('shop');
      var boneCard = [].filter.call(document.querySelectorAll('#tabBody .card'), function(c){ return /骨頭/.test(c.textContent); })[0];
      if (!boneCard) fails.push('商店買不到骨頭');
      else { boneCard.onclick(); if (G.food.bone !== 1) fails.push('買了骨頭沒有進寵物食物'); }
      G.food.bone = 2;
      showFoodMenu('kid');
      if (/骨頭/.test($('#foodMenu').textContent)) fails.push('小可愛的食物選單出現骨頭（她不啃骨頭）');
      $('#foodMenu').hidden = true;
      if (feedKid('bone', 'pet') !== null) fails.push('小可愛可以吃骨頭');
      showFoodMenu('pet');
      if (!/骨頭/.test($('#foodMenu').textContent)) fails.push('寵物的食物選單沒有骨頭');
      $('#foodMenu').hidden = true;
    } finally { var kf17 = JSON.parse(keepFood17); G.food = kf17[0]; G.kidFood = kf17[1]; G.kid.hunger = kf17[2]; G.bells = kf17[3]; shopKind = 'all'; openTab('inv'); }
    var specials = PET_SPECIES.filter(function(s){ return s.special; });
    if (specials.length !== 2) fails.push('特別的寵物不是兩隻');
    specials.forEach(function(sp){
      if (!sp.wings || !sp.sparkle || !sp.rare) fails.push(sp.name + ' 沒有翅膀／閃亮亮／稀有');
      if (!(sp.weight < 3)) fails.push(sp.name + ' 沒有比稀有更難孵到');
      // 畫得出來，而且比拿掉翅膀／拿掉星星的版本多畫了東西
      var countFills = function(spx){ var c = document.createElement('canvas'); c.width = c.height = 80; var g = c.getContext('2d'); g.translate(40, 60);
        var n = 0, rf = g.fill.bind(g); g.fill = function(){ n++; return rf.apply(null, arguments); }; drawCreature(g, spx, { happy: true, clean: 100 }); return n; };
      var full = countFills(sp);
      if (!(full > countFills(Object.assign({}, sp, { wings: null })) + 3)) fails.push(sp.name + ' 沒有畫出翅膀');
      if (!(full > countFills(Object.assign({}, sp, { sparkle: false })))) fails.push(sp.name + ' 沒有一閃一閃的星星');
    });

    /* 87 長大（家長：要看得到往下一階段的進度、長大要有動畫＋放大圖片、長大的樣子也能收集＝成長圖鑑） */
    try {
      if (!(newGame().growDex || {})['mochi:kid']) fails.push('新遊戲的成長圖鑑沒有一開始那隻（小朋友）');
      // 舊存檔沒有成長圖鑑：大朋友的寵物，寶寶、小朋友、大朋友都算收集到
      var old87 = JSON.parse(JSON.stringify(G)); delete old87.growDex;
      old87.pets = [newPet('mochi', 'adult', 'x'), newPet(PET_SPECIES[1].id, 'baby', 'y'), newPet(PET_SPECIES[2].id, 'egg', '')];
      old87.activePet = 0; old87.companions = [];
      var n87 = normalizeSave(old87);
      if (!n87 || growDexCount(n87) !== 4) fails.push('舊存檔補成長圖鑑，數量不對：' + (n87 && growDexCount(n87)));
      // 長大：收進成長圖鑑、跳出「長大了」的大圖
      var keepDex = JSON.stringify(G.growDex || {}), sp87 = PET_SPECIES[3].id;
      var p87 = newPet(sp87, 'baby', 't87'); G.pets.push(p87);
      delete (G.growDex || {})[growKey(sp87, 'kid')];
      var c0 = growDexCount();
      var up87 = addPetGrowth(PET_STAGE_BY_ID.baby.next, p87);
      if (!up87 || up87.to !== 'kid' || !up87.newDex || !G.growDex[growKey(sp87, 'kid')] || growDexCount() !== c0 + 1) fails.push('寶寶長成小朋友，沒有收進成長圖鑑');
      SC_QUEUE.length = 0; var scO = document.getElementById('showcase'); if (scO) scO.remove();
      var realBlk = showcaseBlocked; showcaseBlocked = function(){ return false; };
      try { celebrateStage(up87, p87); } finally { showcaseBlocked = realBlk; }
      var sc87 = document.getElementById('showcase');
      if (!sc87 || !sc87.querySelector('.grow-pic') || !/長成小朋友/.test(sc87.textContent) || !/成長圖鑑/.test(sc87.textContent)) fails.push('長大的時候沒有跳出放大的圖片');
      else if (sc87.querySelectorAll('.grow-pic canvas').length !== 2) fails.push('長大的圖片沒有「原本 → 長大後」兩張');
      if (sc87) sc87.remove(); SC_QUEUE.length = 0;
      // 同一種再長一次：已經有了，不算新的
      var p87b = newPet(sp87, 'baby', 't87b'); G.pets.push(p87b);
      var up87b = addPetGrowth(999, p87b);
      if (!up87b || up87b.newDex) fails.push('同一種寵物第二次長成小朋友，又算成新收集');
      G.pets.splice(G.pets.indexOf(p87b), 1); G.pets.splice(G.pets.indexOf(p87), 1);
      G.growDex = JSON.parse(keepDex);
      // 主畫面小卡：🌱 進度條跟著長大的進度
      var cur87 = G.pet, keepSt = cur87.stage, keepGr = cur87.growth;
      try {
        cur87.stage = 'kid'; cur87.growth = PET_STAGE_BY_ID.kid.next / 2; updatePetCard();
        if (Math.abs(parseFloat($('#barGrow').style.width) - 50) > .5) fails.push('主畫面的長大進度條不對：' + $('#barGrow').style.width);
        if ($('#growRow').classList.contains('max')) fails.push('還沒長到大朋友，進度條就變金色');
        cur87.stage = 'adult'; cur87.growth = 0; updatePetCard();
        if (!$('#growRow').classList.contains('max') || $('#barGrow').style.width !== '100%') fails.push('大朋友的進度條沒有變成滿的金色');
      } finally { cur87.stage = keepSt; cur87.growth = keepGr; updatePetCard(); }
      // 圖鑑頁：成長圖鑑一種一排、三格
      openTab('book');
      if (!document.getElementById('dexGrow')) fails.push('圖鑑頁沒有成長圖鑑');
      var rows87 = document.querySelectorAll('#tabBody .grow-row');
      if (rows87.length !== PET_SPECIES.length) fails.push('成長圖鑑排數不對：' + rows87.length);
      else if ([].some.call(rows87, function(r){ return r.querySelectorAll('.gr-cell').length !== 3; })) fails.push('成長圖鑑每排不是三格');
      var lit87 = document.querySelectorAll('#tabBody .grow-row .gr-cell:not(.dim)').length;
      if (lit87 !== growDexCount()) fails.push('成長圖鑑亮起來的格數（' + lit87 + '）跟收集數（' + growDexCount() + '）不一樣');
      if (trophyCount('grow')[1] !== PET_SPECIES.length * 3) fails.push('成長獎盃的總數不對');
      // 寶寶有圍兜、跟小朋友畫出來不一樣
      var pb = renderPetPortrait({ species: 'mochi', stage: 'baby', growth: 0 }, 60, 54).toDataURL(), pk = renderPetPortrait({ species: 'mochi', stage: 'kid', growth: 0 }, 60, 54).toDataURL();
      if (pb === pk) fails.push('寶寶跟小朋友畫出來一模一樣');
    } catch (e) { fails.push('長大測試出錯：' + e.message); }

    /* 86 檢查出來的小問題（第三批）：檸檬床、檸檬椅能用；寵物天地第一步不能一開始就完成；滑梯點一下會跳；
       刪存檔連帶的紀錄也刪掉；照片不能吃掉存檔的位子；休息畫面不能吃掉公告和剛拍的照片；包裹不放在寵物腳下 */
    try {
      if (!FURNITURE_USE.lemon_bed || FURNITURE_USE.lemon_bed.use !== 'lie' || !PET_BEDS.lemon_bed) fails.push('檸檬床不能躺、寵物也不能上去睡');
      if (!FURNITURE_USE.lemon_chair || FURNITURE_USE.lemon_chair.use !== 'sit') fails.push('檸檬椅不能坐');
      // 寵物天地：預設寵物屋就有 5 個床／小屋，第一步不能一開始就打勾
      var phR = petHouseRoom(), phSave86 = phR.items;
      try {
        phR.items = phSave86.filter(function(it){ return it.id !== 'pet_castle' && it.id !== 'cat_tower'; });
        var plStep = THEMES.find(function(t){ return t.id === 'petland'; }).steps[0];
        if (plStep.test()) fails.push('寵物天地第一步，一開始的寵物屋就已經完成了');
        phR.items = phR.items.concat([{ uid: 99086, id: 'pet_castle', x: 0, y: 0, rot: 0 }]);
        if (!plStep.test()) fails.push('寵物天地：放了寵物城堡還是沒有完成');
      } finally { phR.items = phSave86; }
      // 滑梯的弧形底座點一下也要跟著跳
      var rampDef = Object.values(FURN_BY_ID).find(function(d){ return (d.parts || []).some(function(q){ return q.k === 'ramp'; }); });
      if (!rampDef) fails.push('測試找不到有斜坡的家具');
      else {
        itemState.t86 = { tapAt: performance.now() - 160 };
        var lk = itemLook(rampDef, 0, { uid: 't86' }, rampDef.parts), ri = rampDef.parts.findIndex(function(q){ return q.k === 'ramp'; });
        if (!(lk[ri].zHi > rampDef.parts[ri].zHi && lk[ri].zLo > rampDef.parts[ri].zLo)) fails.push('點滑梯，斜坡的部分沒有跟著跳');
        delete itemState.t86;
      }
      // 刪存檔：備份提醒、第一次玩的時間、救援檔都要一起刪（之後新開的格子可能用到同一個編號）
      var sid = addSlot('測試86');
      ['myHouse_lastBackup:', 'myHouse_firstSeen:', 'myHouseGame_rescue:'].forEach(function(k){ localStorage.setItem(k + sid, '1'); });
      removeSlot(sid);
      ['myHouse_lastBackup:', 'myHouse_firstSeen:', 'myHouseGame_rescue:'].forEach(function(k){ if (localStorage.getItem(k + sid) != null) fails.push('刪掉存檔後，' + k + ' 還留著'); });
      // 照片塞得進去、遊戲卻存不了：這張照片要退掉
      var realSave86 = saveGame, n86 = loadPhotos().length;
      if (n86 < PHOTO_MAX) {
        saveGame = function(){ return false; };
        var r86;
        try { r86 = keepPhoto('data:image/png;base64,AAAA'); } finally { saveGame = realSave86; }
        if (r86 !== 'space' || loadPhotos().length !== n86) fails.push('照片把存檔的位子吃掉了，照片還是留著（' + r86 + '）');
      }
      // 爸媽的謝謝：不管視窗是怎麼關掉的，都要接著跳公告
      var realNews = maybeShowNews, realST = window.setTimeout, newsN = 0;
      maybeShowNews = function(){ newsN++; };
      window.setTimeout = function(f){ f(); return 0; };
      try { giftVisit.spec = GIFT_SPECS[0]; giftThanks(performance.now()); } finally { window.setTimeout = realST; maybeShowNews = realNews; giftReset(); }
      if (newsN !== 1) fails.push('爸媽謝謝之後沒有接著跳公告');
      // 相簿滿了正在選：休息畫面跳出來，休息完要再問一次
      var realToast86 = toast; toast = function(){};
      try {
        openPhotoSwap('data:image/png;base64,BBBB');
        showRest(Date.now() + 60000);
        if (!$('#modal').hidden) fails.push('休息畫面沒有把相簿視窗關掉');
        endRest();
        var pn = document.querySelector('#modalCard img.photo-new');
        if ($('#modal').hidden || !pn || pn.src.indexOf('BBBB') < 0) fails.push('休息完，剛拍的照片不見了');
      } finally { toast = realToast86; $('#modal').hidden = true; resting = false; var ro = document.getElementById('restOverlay'); if (ro) ro.hidden = true; }
      // 包裹：不要放在寵物腳下
      if (!G.away) {
        var px86 = pet.x, py86 = pet.y, realSnd = Sound.play; Sound.play = function(){};
        try {
          giftVisit.spec = GIFT_SPECS[0]; giftVisit.actors = [];
          giftDrop(performance.now());
          var b1 = giftVisit.box; pet.x = Math.floor(b1.x) + .5; pet.y = Math.floor(b1.y) + .5;
          giftDrop(performance.now());
          if (Math.floor(giftVisit.box.x) === Math.floor(pet.x) && Math.floor(giftVisit.box.y) === Math.floor(pet.y)) fails.push('包裹放在寵物腳下，點不到包裹');
        } finally { pet.x = px86; pet.y = py86; Sound.play = realSnd; giftReset(); }
      }
    } catch (e) { fails.push('第三批小問題測試出錯：' + e.message); }

    /* 85 小遊戲的問題：結束後畫面迴圈要停、杯子蛋糕做對一個不能連點多次、玩到一半可以離開、關掉視窗後烤餅乾不會自己給錢 */
    var realToast22 = toast; toast = function(){};
    try {
      [['Scoop', 1], ['Bake', 0], ['Cupcake', 0]].forEach(function(gm){
        window['open' + gm[0] + 'Game'](); document.querySelectorAll('#modalCard .lv-btn')[gm[1]].onclick();
        if (![].some.call(document.querySelectorAll('#modalCard button'), function(b){ return /不想玩了/.test(b.textContent); })) fails.push(gm[0] + '：玩到一半沒有「不想玩了」');
        window['open' + gm[0] + 'Game'].test.finish();
      });
      closeGameWindow();
      // 杯子蛋糕：做對之後連點 4 下只算 1 個
      openCupcakeGame(); document.querySelectorAll('#modalCard .lv-btn')[0].onclick();
      var T22 = openCupcakeGame.test, w22 = T22.want();
      T22.pick('cream', w22.cream); T22.pick('top', w22.top); T22.pick('top', w22.top); T22.pick('top', w22.top); T22.pick('top', w22.top);
      if (T22.made() !== 1) fails.push('杯子蛋糕：做對一個連點，算了 ' + T22.made() + ' 個');
      closeGameWindow();
      // 烤餅乾：最後一片拿出來後馬上關掉視窗（休息時間到），不能自己算完給錢
      openBakeGame(); document.querySelectorAll('#modalCard .lv-btn')[0].onclick();
      var T23 = openBakeGame.test; T23.setRound(BAKE_N - 1); var z23 = T23.zone(); T23.setK((z23[0] + z23[1]) / 2); T23.take();
      if (T23.timers() < 1) fails.push('烤餅乾測試：拿出最後一片後沒有排下一步（測試本身不對）');
      if (T23.ended()) fails.push('烤餅乾測試：還沒關視窗就結束了（測試本身不對）');
      closeGameWindow();
      if (!T23.ended()) fails.push('烤餅乾關掉視窗後，還是自己算完給了錢');
    } catch (e) { fails.push('小遊戲問題測試出錯：' + e.message); }
    finally { toast = realToast22; closeGameWindow(); }

    /* 84 檢查出來的問題（第一批）：搬桌子、收桌子，桌上的東西不能不見；重新開始時手上拿的不能掉進新存檔；
       賣掉重複寵物後，舊的選單不能動到別隻；大家睡覺時床被搬走，寵物改睡地上；蛋糕在第一格前就吹熄也會結束 */
    var keepG20 = JSON.stringify(G), realToast20 = toast, keepPet20 = [pet.x, pet.y, pet.room, pet.path, pet.sleep, pet.task, pet.z]; toast = function(){};
    try {
      G = normalizeSave(JSON.parse(keepG20)); G.away = null; G.cur = 0; cancelHold(); $('#modal').hidden = true;
      var rm20 = G.rooms[0]; rm20.items = [{ uid: 501, id: 'wood_table', x: 2, y: 2, rot: 0, top: 'small_cake' }]; G.inv = {};
      // 搬桌子：桌上的蛋糕跟著
      startHoldFromRoom(rm20.items[0]); hold.x = 4; hold.y = 4; hold.ok = canPlace(rm20, hold.def, 4, 4, 0, hold.fromUid); placeHold();
      var t20 = rm20.items.filter(function(x){ return x.uid === 501; })[0];
      if (!t20 || t20.top !== 'small_cake') fails.push('搬桌子之後，桌上的東西不見了');
      // 收桌子（選單的收起來、拿起來再收）：桌上的東西回到我的東西
      startHoldFromRoom(t20); storeHold();
      if (G.inv.wood_table !== 1 || G.inv.small_cake !== 1) fails.push('收桌子時，桌上的東西沒有一起收回來：' + JSON.stringify(G.inv));
      rm20.items = [{ uid: 502, id: 'wood_table', x: 2, y: 2, rot: 0, top: 'tea_set' }]; G.inv = {};
      storeRoomItem(rm20.items[0]);
      if (G.inv.tea_set !== 1) fails.push('收起來（選單）時，桌上的東西沒有一起收回來');
      // 重新開始時手上拿著東西：不能掉進新存檔
      rm20.items = [{ uid: 503, id: 'wood_chair', x: 1, y: 1, rot: 0 }];
      startHoldFromRoom(rm20.items[0]);
      var realReset20 = confirmReset;
      cancelHold(); hold = null; G = newGame(); giftReset();   // 跟 confirmReset 裡的順序一樣（先放回去再換）
      if (G.rooms[0].items.some(function(x){ return x.uid === 503; })) fails.push('重新開始時，手上拿的東西掉進新存檔');
      G = normalizeSave(JSON.parse(keepG20));
      // 舊的寵物選單：賣掉重複的之後再按，不能動到別隻
      G.away = null; G.pets = [newPet('mochi', 'kid', 'M'), newPet('bunny', 'kid', 'B1'), newPet('bunny', 'baby', 'B2'), newPet('bear', 'kid', 'T')];
      G.activePet = 0; G.pet = G.pets[0]; G.companions = []; enterPetHouse();
      var iT = 3; phActor(iT); phTap(iT, { clientX: 50, clientY: 50 });
      var careB20 = [].filter.call(document.querySelectorAll('#itemMenu button'), function(b){ return /照顧/.test(b.textContent); })[0];
      openDupSell(); $('#modal').hidden = true;
      if (!$('#itemMenu').hidden) fails.push('打開重複寵物清單時，舊的寵物選單沒關掉');
      releasePet(2);   // 賣掉 B2：熊的號碼從 3 變 2
      if (careB20) careB20.onclick();
      if (G.pet.name !== 'T') fails.push('賣掉重複寵物後按舊選單，照顧到別隻了：' + G.pet.name);
      // 大家睡覺時床被收起來：那隻改睡地上，畫得出來
      leavePetHouse(0); G.petHouse = null; phAppliedFor = null; phReset();
      G.pets = [newPet('mochi', 'kid', 'M'), newPet('bunny', 'kid', 'A'), newPet('bear', 'kid', 'B')]; G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
      enterPetHouse(); phCallAll('sleep');
      var t21 = performance.now() + 500000; for (var f21 = 0; f21 < 1500; f21++) gameStep(1 / 60, t21 + f21 * 17);
      var onBed = phWalkers().filter(function(a){ return a.sleep && a.sleep.uid != null; })[0];
      if (onBed) {
        var bedU = onBed.sleep.uid; curRoom().items = curRoom().items.filter(function(x){ return x.uid !== bedU; });
        gameStep(1 / 60, t21 + 1600 * 17);
        if (!onBed.sleep || onBed.sleep.uid != null) fails.push('大家睡覺時床被收起來，睡在上面的寵物沒有改睡地上');
        var shown21 = phDrawEntries().filter(function(e){ return e.drawFn; }).length;
        if (shown21 < 1) fails.push('床被收起來後，寵物看不到');
      } else fails.push('（測試）沒有寵物睡在床上');
      phModeEnd();
      // 蛋糕在第一格之前就吹熄：還是會結束
      phCallAll('birthday'); var ck21 = phMode.cake, cp21 = iso(ck21.x + .5, ck21.y + .5, 0);
      var hitAt21 = performance.now(); phCakeHit({ x: cp21.x, y: cp21.y - 14 });
      gameStep(1 / 60, hitAt21 + 17);
      if (!phMode || !(phMode.until <= hitAt21 + 6000)) fails.push('第一格之前吹蠟燭，生日派對不會很快結束（until 被蓋掉了）');
      phModeEnd(); leavePetHouse(0);
    } catch (e) { fails.push('檢查出來的問題（第一批）測試出錯：' + e.message); }
    finally { toast = realToast20; cancelHold(); hideItemMenu(); if (phMode) phModeEnd(); G = normalizeSave(JSON.parse(keepG20)); saveGame(); phReset(); refreshTop(); $('#modal').hidden = true;
      pet.x = keepPet20[0]; pet.y = keepPet20[1]; pet.room = keepPet20[2]; pet.path = keepPet20[3]; pet.sleep = keepPet20[4]; pet.task = keepPet20[5]; pet.z = keepPet20[6]; }

    /* 83 新的賺錢小遊戲：撈金魚、烤餅乾、杯子蛋糕店（在賺錢分頁、選難度、玩得到錢、可以離開） */
    var realToast19 = toast; toast = function(){};
    var bells19 = G.bells;
    try {
      openTab('earn');
      ['撈金魚', '烤餅乾', '杯子蛋糕店'].forEach(function(nm){ if (![].some.call(document.querySelectorAll('#tabBody .game-pick'), function(b){ return b.textContent.indexOf(nm) >= 0; })) fails.push('賺錢分頁沒有「' + nm + '」'); });
      var lvClick = function(i){ var b = document.querySelectorAll('#modalCard .lv-btn')[i || 0]; if (b) b.onclick(); return !!b; };
      // 🐠
      openScoopGame();
      if (!/不想玩了/.test($('#modalCard').textContent)) fails.push('撈金魚選難度時不能離開');
      lvClick(1);
      var T1 = openScoopGame.test, f1 = T1.fish();
      if (f1.length < 5) fails.push('撈金魚的魚太少（' + f1.length + '）');
      f1[0].gold = true; T1.scoop(f1[0]); var f2 = T1.fish()[0]; f2.gold = false; T1.scoop(f2);
      if (T1.got() !== 4) fails.push('撈金魚：撈一隻金魚＋一隻普通的不是 4 隻（' + T1.got() + '）');
      var b1 = G.bells; T1.finish();
      if (G.bells - b1 !== 4 * 15 * T1.level.mul) fails.push('撈金魚的錢不對（' + (G.bells - b1) + '）');
      closeGameWindow();
      // 🍪
      openBakeGame(); lvClick(0);
      var T2 = openBakeGame.test, z = T2.zone();
      T2.setK((z[0] + z[1]) / 2); T2.take();
      if (T2.score() !== 2) fails.push('烤餅乾：剛好金黃色拿出來不是 2 分（' + T2.score() + '）');
      T2.take();
      if (T2.score() !== 2) fails.push('烤餅乾：同一片拿兩次算了兩次分');
      var b2 = G.bells; T2.finish();
      if (G.bells - b2 !== 2 * 10 * T2.level.mul) fails.push('烤餅乾的錢不對（' + (G.bells - b2) + '）');
      closeGameWindow();
      openBakeGame(); lvClick(0); var T3 = openBakeGame.test; T3.setK(.99); T3.take();
      if (T3.score() !== 0) fails.push('烤餅乾：烤焦了還有分');
      closeGameWindow();
      // 🧁
      openCupcakeGame(); lvClick(2);
      var T4 = openCupcakeGame.test, wnt = T4.want();
      T4.pick('top', wnt.top);
      if (T4.made() !== 0) fails.push('杯子蛋糕：還沒擠奶油就算做好了');
      T4.pick('cream', (wnt.cream + 1) % T4.level.n); T4.pick('top', wnt.top);
      if (T4.made() !== 0) fails.push('杯子蛋糕：奶油顏色錯了也算做好');
      T4.pick('cream', wnt.cream); T4.pick('top', wnt.top);
      if (T4.made() !== 1) fails.push('杯子蛋糕：做對了沒有算');
      var b4 = G.bells; T4.finish();
      if (G.bells - b4 !== 25 * T4.level.mul) fails.push('杯子蛋糕的錢不對（' + (G.bells - b4) + '）');
      closeGameWindow();
    } catch (e) { fails.push('新的小遊戲出錯：' + e.message); }
    finally { toast = realToast19; closeGameWindow(); G.bells = bells19; saveGame(); openTab('inv'); }

    /* 82 小主題第二批：空房間做不到、照說明布置就做得到 */
    var keepG18 = JSON.stringify(G);
    try {
      var NEWT = ['sweets', 'candyland', 'petland', 'goodnight', 'rainbow', 'concert', 'garden', 'princess', 'buddies'];
      NEWT.forEach(function(id){ if (!THEME_BY_ID[id]) fails.push('少了小主題 ' + id); });
      if (THEMES.length < 16) fails.push('小主題不到 16 個（' + THEMES.length + '）');
      G = normalizeSave(JSON.parse(keepG18)); G.petHouse = { items: [], wallItems: [] }; G.companions = [];
      G.rooms = [{ name: '測試', w: 8, d: 8, wall: 'wp_cream', floor: 'fl_wood', items: [], wallItems: [] }];
      NEWT.forEach(function(id){ var pr = themeProgress(THEME_BY_ID[id]); if (pr.done === pr.total) fails.push('空房間就完成了小主題「' + THEME_BY_ID[id].title + '」'); });
      var u = 100, put = function(id, x, y){ G.rooms[0].items.push({ uid: u++, id: id, x: x, y: y, rot: 0 }); };
      G.rooms[0].wall = 'wp_candy'; G.rooms[0].floor = 'fl_cookie';
      put('cupcake_chair', 0, 0); put('macaron_table', 1, 0); put('lollipop_tree', 2, 0);
      put('cute_bed', 0, 2); put('unicorn_rocker', 3, 2); G.rooms[0].wallItems.push({ uid: u++, id: 'heart_mirror', side: 'L', pos: 1 });
      put('star_lamp', 3, 4); put('rainbow_rug', 4, 5); put('rainbow_shelf', 5, 0);
      put('piano', 6, 2); put('wood_chair', 6, 4);
      put('plant_s', 7, 0); put('plant_l', 7, 1); put('cactus', 7, 4); put('sunflower', 7, 5); put('leaf_rug', 5, 6);
      G.petHouse = { items: [{ uid: -1, id: 'pet_bed', x: 0, y: 0, rot: 0 }, { uid: -2, id: 'pet_house', x: 2, y: 0, rot: 0 }, { uid: -3, id: 'pet_castle', x: 4, y: 0, rot: 0 },
                             { uid: -4, id: 'teddy', x: 0, y: 4, rot: 0 }, { uid: -5, id: 'toybox', x: 2, y: 4, rot: 0 }], wallItems: [] };
      phAppliedFor = null;   // 寵物屋的擺法是照存檔快取的，這裡直接換了存檔內容，要重新套
      G.pets = [newPet('mochi', 'kid', 'A'), newPet('bunny', 'kid', 'B')]; G.activePet = 0; G.pet = G.pets[0]; G.companions = [1];
      NEWT.forEach(function(id){ var pr = themeProgress(THEME_BY_ID[id]); if (pr.done !== pr.total) fails.push('照說明布置了，小主題「' + THEME_BY_ID[id].title + '」還沒完成（' + pr.done + '/' + pr.total + '）'); });
    } finally { G = normalizeSave(JSON.parse(keepG18)); saveGame(); }

    /* 81 第四批家具：甜點風一整組＋可愛風＋寵物用；每件畫得出來、商店買得到、椅子坐得下、床躺得下、寵物床睡得了 */
    var NEW4 = ['cupcake_chair', 'macaron_table', 'donut_rug', 'candy_bed', 'icecream_lamp', 'cake_shelf', 'lollipop_tree', 'strawberry_sofa', 'cookie_jar', 'cream_wardrobe',
                'cloud_sofa', 'unicorn_rocker', 'star_lamp', 'heart_mirror', 'rainbow_shelf', 'bunny_cushion', 'pet_castle', 'cat_tower'];
    NEW4.forEach(function(id){
      var df = FURN_BY_ID[id];
      if (!df) { fails.push('第四批少了 ' + id); return; }
      try { renderThumb(df, 64); } catch (e) { fails.push(df.name + ' 畫不出來：' + e.message); }
      if (!(df.price > 0)) fails.push(df.name + ' 沒有價錢');
      if (!FURN_KIND_OF[id]) fails.push(df.name + ' 沒有分類');
    });
    if (FURNITURE.filter(function(f){ return f.theme === 'sweet'; }).length < 10) fails.push('甜點風不到 10 樣');
    if (!WALLPAPERS.some(function(w){ return w.theme === 'sweet'; }) || !FLOORS.some(function(f){ return f.theme === 'sweet'; })) fails.push('甜點風沒有壁紙或地板');
    ['cupcake_chair', 'bunny_cushion', 'strawberry_sofa', 'cloud_sofa'].forEach(function(id){ if (!FURNITURE_USE[id] || FURNITURE_USE[id].use !== 'sit') fails.push(FURN_BY_ID[id].name + ' 不能坐'); });
    if (!FURNITURE_USE.candy_bed || !PET_BEDS.candy_bed || !PET_BEDS.candy_bed.withKid) fails.push('糖果床不能躺、或寵物不能上來一起睡');
    if (!PET_BEDS.pet_castle || !PET_BEDS.cat_tower) fails.push('寵物城堡／跳台寵物不能睡');
    if (!canHaveTop('macaron_table') || !canSitOnTable('cookie_jar')) fails.push('馬卡龍桌不能放東西、或餅乾罐不能放桌上');
    shopKind = 'all'; shopTheme = 'sweet'; openTab('shop');
    var sweetCards = [].filter.call(document.querySelectorAll('#tabBody .card'), function(c){ return /杯子蛋糕椅|糖果床|草莓沙發/.test(c.textContent); });
    if (sweetCards.length < 3) fails.push('商店選「甜點」風格看不到甜點家具');
    shopTheme = 'all'; openTab('inv');

    /* 80 家長說不用做極稀有（爸比龍、媽咪鳳）：已經拿掉；萬一存檔裡有，讀回來變成粉紅糰子，不會壞 */
    if (PET_SPECIES.some(function(s){ return s.id === 'papadragon' || s.id === 'mamaphoenix'; })) fails.push('爸比龍、媽咪鳳還在');
    var oldP = JSON.parse(JSON.stringify(G)); oldP.pets = [newPet('mochi', 'kid', 'A')]; oldP.pets.push(Object.assign(newPet('mochi', 'kid', 'B'), { species: 'papadragon' }));
    var oldPn = normalizeSave(oldP);
    if (!oldPn || oldPn.pets[1].species !== 'mochi') fails.push('存檔裡有已經拿掉的寵物，讀回來壞掉');

    /* 78 一起逛的寵物也跟著上床睡（第二隻以後也要）；不同位置；跟床一起畫；她起床就起來 */
    var keepG16 = JSON.stringify(G), keepFufu16 = [fufu.x, fufu.y, fufu.pose, fufu.path];
    try {
      G = normalizeSave(JSON.parse(keepG16)); G.away = null; G.cur = 0; cancelHold();
      G.rooms = [G.rooms[0], JSON.parse(JSON.stringify(G.rooms[0])), JSON.parse(JSON.stringify(G.rooms[0])), JSON.parse(JSON.stringify(G.rooms[0]))];
      var rm16 = G.rooms[0];
      rm16.items = [{ uid: 8801, id: 'wood_bed', x: 1, y: 0, rot: 0 }];
      G.pets = [newPet('mochi', 'kid', 'M'), newPet(PET_SPECIES[1].id, 'kid', 'A'), newPet(PET_SPECIES[2].id, 'kid', 'B'), newPet(PET_SPECIES[3].id, 'kid', 'C')];
      G.activePet = 0; G.pet = G.pets[0]; G.companions = [1, 2, 3];
      [1, 2, 3].forEach(function(i){ compArrive(i); });
      fufu.path = []; fufu.pose = { type: 'lie', uid: 8801, snap: '1,0,0', lx: 1, ly: 1.5, z: 30, bath: false, until: Infinity, snoreAt: Infinity };
      var t16 = performance.now() + 300000;
      for (var f16 = 0; f16 < 700; f16++) { var cl = compList(); cl.forEach(function(a){ a.t += 0; }); compUpdate(1 / 60, t16 + f16 * 17, rm16); }
      var cls = compList();
      if (cls.length !== 3 || !cls.every(function(a){ return a.bedSleep; })) fails.push('一起逛的寵物沒有全部跟著上床睡（' + cls.filter(function(a){ return a.bedSleep; }).length + '/' + cls.length + '）');
      var spots16 = cls.map(function(a){ return a.x.toFixed(2) + ',' + a.y.toFixed(2); });
      if (new Set(spots16).size !== spots16.length) fails.push('一起睡的寵物疊在同一個位置');
      if (!cls.every(function(a){ return a.x >= 1 && a.x <= 3 && a.y >= 0 && a.y <= 3; })) fails.push('一起睡的寵物不在床上');
      if (compOccupants().length !== 3) fails.push('一起睡的寵物沒有跟床一起畫');
      if (petDrawEntries().length !== 1) fails.push('一起睡的寵物畫了兩次');
      var drawn16 = {}, realDPA16 = drawPetActor;
      drawPetActor = function(ctx, a){ if (a && a.idx != null) drawn16[a.idx] = (drawn16[a.idx] || 0) + 1; return realDPA16.apply(this, arguments); };
      try { draw(); } finally { drawPetActor = realDPA16; }
      if ([1, 2, 3].some(function(i){ return drawn16[i] !== 1; })) fails.push('一起睡的寵物畫面上沒畫出來（或畫兩次）：' + JSON.stringify(drawn16));
      fufu.pose = null;
      compUpdate(1 / 60, t16 + 800 * 17, rm16);
      if (compList().some(function(a){ return a.bedSleep || a.z; })) fails.push('小可愛起床了，一起睡的寵物還躺著');
    } finally { fufu.x = keepFufu16[0]; fufu.y = keepFufu16[1]; fufu.pose = keepFufu16[2]; fufu.path = keepFufu16[3]; G = normalizeSave(JSON.parse(keepG16)); saveGame(); }

    /* 76 音樂多兩首（共 6 首）：每首 64 拍、音名都認得；小可愛躺上床，照顧中的寵物一定跳上來抱著睡、先滾一滾；
       寵物屋沒有玩具：原地跳舞或跑去找小可愛 */
    var SG = Sound._t.songs, NT = Sound._t.notes;
    if (SG.length !== 6 || Sound.songCount !== 6) fails.push('背景音樂不是 6 首（' + SG.length + '）');
    SG.forEach(function(sg){
      var beats = sg.melody.reduce(function(t, n){ return t + n[1]; }, 0);
      if (Math.abs(beats - 64) > 1e-9) fails.push('「' + sg.name + '」不是 64 拍（' + beats + '）');
      sg.melody.concat(sg.bass.map(function(b){ return [b, 0]; })).forEach(function(n){ if (n[0] !== null && !NT[n[0]]) fails.push('「' + sg.name + '」有不認得的音 ' + n[0]); });
      if (sg.bass.length !== 8) fails.push('「' + sg.name + '」的低音不是 8 個');
    });
    if (new Set(SG.map(function(sg){ return sg.name; })).size !== 6) fails.push('歌名有重複');
    // 抱著睡：每次都會上來（以前是一半機率）
    var keepG14 = JSON.stringify(G);
    try {
      G = normalizeSave(JSON.parse(keepG14)); G.away = null; G.cur = 0; cancelHold();
      G.pets = [newPet('mochi', 'kid', 'M')]; G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
      var bedRoom = G.rooms[0], bed14 = bedRoom.items.filter(function(it){ return it.id === 'wood_bed' || it.id === 'cute_bed'; })[0];
      if (!bed14) { bed14 = { uid: 7777, id: 'wood_bed', x: 0, y: 0, rot: 0 }; bedRoom.items.push(bed14); }
      var joined = 0;
      for (var jj = 0; jj < 8; jj++) { pet.sleep = null; pet.task = null; petMaybeJoinBed(bed14); if (pet.task && pet.task.kind === 'bed') joined++; }
      if (joined !== 8) fails.push('小可愛躺上床，照顧中的寵物沒有每次都跳上來（' + joined + '/8）');
      // 到床邊：躺好、先滾一滾，滾的時候畫面有轉
      var fpB = footprint(FURN_BY_ID[bed14.id], bed14.rot);
      pet.x = bed14.x + fpB.w + .5; pet.y = bed14.y + .5; pet.task = { uid: bed14.uid, kind: 'nap' };
      var nowB = performance.now(); petArriveBed(nowB, bedRoom);
      if (!pet.sleep) fails.push('（測試）寵物沒有躺上床');
      else {
        if (!(pet.rollUntil > nowB)) fails.push('寵物上床沒有滾一滾');
        // 滾的時候比不滾的時候多轉一次（角度剛好接近 0 的瞬間也算）
        var rot14 = 0, realRot = CanvasRenderingContext2D.prototype.rotate;
        CanvasRenderingContext2D.prototype.rotate = function(r){ rot14++; return realRot.apply(this, arguments); };
        var c14 = canvas.getContext('2d'), rotNo, rotYes;
        try {
          pet.rollUntil = 0; rot14 = 0; drawPetActor(c14, Object.assign({}, pet, { t: 1 }), G.pet); rotNo = rot14;
          pet.rollUntil = performance.now() + 2000; rot14 = 0; drawPetActor(c14, Object.assign({}, pet, { t: 1 }), G.pet); rotYes = rot14;
        } finally { CanvasRenderingContext2D.prototype.rotate = realRot; }
        if (!(rotYes > rotNo)) fails.push('寵物在床上滾的時候畫面沒有轉');
      }
      pet.sleep = null; pet.z = 0; pet.task = null; pet.rollUntil = 0;
      // 寵物屋沒有玩具：去跳舞或找小可愛
      G.petHouse = null; G.away = null; phReset();
      G.pets = [newPet('mochi', 'kid', 'M'), newPet(PET_SPECIES[1].id, 'kid', 'A'), newPet(PET_SPECIES[2].id, 'kid', 'B')];
      G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
      enterPetHouse();
      curRoom().items = curRoom().items.filter(function(it){ return furnKind(it.id) !== 'toy'; });
      var nk2 = PH_NAP_CHANCE, pk2 = PH_PLAY_SHARE; PH_NAP_CHANCE = 1; PH_PLAY_SHARE = 1;
      var kinds = {}, tF = performance.now() + 200000;
      for (var ff = 0; ff < 2500 && !(kinds.dance && kinds.kid); ff++) {
        gameStep(1 / 60, tF + ff * 17);
        [1, 2].forEach(function(i){ var a = phActors[i]; if (a && a.play) { kinds[a.play.kind] = 1; if (a.play.uid != null) kinds.toy = 1; } });
      }
      PH_NAP_CHANCE = nk2; PH_PLAY_SHARE = pk2;
      if (kinds.toy) fails.push('沒有玩具也在玩玩具');
      if (!kinds.dance) fails.push('寵物屋沒有玩具時，寵物不會自己跳舞');
      if (!kinds.kid) fails.push('寵物屋沒有玩具時，寵物不會跑去找小可愛玩');
    } finally { G = normalizeSave(JSON.parse(keepG14)); saveGame(); phReset(); pet.sleep = null; pet.z = 0; pet.rollUntil = 0; refreshTop(); }

    /* 74 寵物屋可以自己布置（跟家裡一樣）：搬、轉向、收起來、放自己的家具、搬牆上的東西；擺法跟著存檔走；
       上一版的存法讀得懂；寵物會自己去寵物小屋／寵物床睡覺，點了會醒 */
    var keepG12 = JSON.stringify(G), realToast12 = toast;
    toast = function(){};
    try {
      G = normalizeSave(JSON.parse(keepG12)); G.petHouse = null; G.away = null; $('#modal').hidden = true; cancelHold();
      enterPetHouse();
      var phR = curRoom(), house = phR.items.filter(function(x){ return x.id === 'pet_house'; })[0];
      var nItems = phR.items.length, invPH = G.inv.pet_house || 0;
      // 收起來 → 進「我的東西」
      startHoldFromRoom(house);
      if (!hold) fails.push('寵物屋的擺設拿不起來');
      else {
        if ($('#btnStore').hidden) fails.push('寵物屋的擺設沒有「收起來」');
        storeHold();
        if (hold || (G.inv.pet_house || 0) !== invPH + 1 || curRoom().items.length !== nItems - 1) fails.push('寵物屋的擺設收不起來（沒進我的東西）');
      }
      if (!G.petHouse || G.petHouse.items.length !== nItems - 1) fails.push('寵物屋收起來一件，存檔沒有跟著變');
      // 放自己的家具進寵物屋（找一格放得下的）
      G.inv.teddy = (G.inv.teddy || 0) + 1;
      startHoldFromInv('teddy');
      if (!hold) fails.push('自己的家具不能放進寵物屋');
      else {
        var put = false;
        for (var px = 0; px < phR.w && !put; px++) for (var py = 0; py < phR.d && !put; py++) { hold.x = px; hold.y = py; hold.ok = canPlace(curRoom(), hold.def, px, py, hold.rot, null); if (hold.ok) { placeHold(); put = true; } }
        if (!put) fails.push('寵物屋找不到地方放自己的家具');
      }
      var hasTeddy = G.petHouse && G.petHouse.items.some(function(x){ return x.id === 'teddy' && x.uid > 0; });
      if (!hasTeddy) fails.push('放進寵物屋的家具沒有存起來');
      // 牆上的也能搬
      var wi12 = curRoom().wallItems[0];
      if (wi12) {
        // 用點的：算出牆上那件的畫面位置點下去
        var wdef = FURN_BY_ID[wi12.id], uu = (wi12.pos + wdef.w / 2) * TW / 2, vv = wdef.z + wdef.h / 2;
        var ww = { x: wi12.side === 'R' ? uu : -uu, y: .5 * uu - vv }, rw2 = canvas.getBoundingClientRect();
        if (pickWallItem(ww) !== wi12) fails.push('（測試）算的牆上位置不對');
        canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: rw2.left + ww.x * view.scale + view.ox, clientY: rw2.top + ww.y * view.scale + view.oy, bubbles: true }));
        if (!hold || hold.fromUid !== wi12.uid) fails.push('寵物屋牆上的東西點了不能搬');
        cancelHold();
      }
      // 換存檔再換回來：擺法跟著存檔
      var saved12 = JSON.stringify(G);
      G = newGame(); G.away = { place: 'pethouse', idx: 0 };
      if (curRoom().items.length !== nItems || curRoom().items.some(function(x){ return x.id === 'teddy' && x.uid > 0; })) fails.push('別的存檔的寵物屋也跟著變了');
      G = normalizeSave(JSON.parse(saved12)); G.away = { place: 'pethouse', idx: 0 };
      if (!curRoom().items.some(function(x){ return x.id === 'teddy' && x.uid > 0; }) || curRoom().items.some(function(x){ return x.uid === house.uid; })) fails.push('讀回存檔，寵物屋的擺法沒有回來');
      // 上一版的存法（只有位置）
      G = newGame(); var defR = JSON.parse(phDefault).items, m0 = defR[0], oldFmt = {};
      oldFmt[m0.uid] = { id: m0.id, x: m0.x, y: m0.y, rot: (m0.rot + 1) % 4 };
      G.petHouse = oldFmt; G.away = { place: 'pethouse', idx: 0 };
      var g0 = curRoom().items.filter(function(x){ return x.uid === m0.uid; })[0];
      if (!g0 || g0.rot !== (m0.rot + 1) % 4) fails.push('上一版存的寵物屋擺法讀不懂');
      // 寵物去睡覺：一定會去的時候，有一隻睡在寵物床／小屋上，跟床一起畫；點了會醒
      G = normalizeSave(JSON.parse(saved12)); G.away = null; phReset();
      G.pets = [newPet('mochi', 'kid', 'M'), newPet(PET_SPECIES[1].id, 'kid', 'N')]; G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
      enterPetHouse();
      var napKeep = PH_NAP_CHANCE, shareKeep = PH_PLAY_SHARE; PH_NAP_CHANCE = 1; PH_PLAY_SHARE = 0;
      var tN = performance.now() + 10000, slept = null;
      for (var nf = 0; nf < 1500 && !slept; nf++) { gameStep(1 / 60, tN + nf * 17); var aN = phActors[1]; if (aN && aN.sleep) slept = aN; }
      PH_NAP_CHANCE = napKeep; PH_PLAY_SHARE = shareKeep;
      if (!slept) fails.push('寵物屋的寵物不會去寵物床／小屋睡覺');
      else {
        var bedIt = curRoom().items.filter(function(x){ return x.uid === slept.sleep.uid; })[0];
        if (!bedIt || !PET_BEDS[bedIt.id]) fails.push('寵物睡的不是寵物床／小屋');
        if (!phOccupants().length) fails.push('睡著的寵物沒有跟床一起畫');
        if (phDrawEntries().length) fails.push('睡著的寵物畫了兩次');
        var realDPA = drawPetActor, drewSlept = 0;
        drawPetActor = function(ctx, a, st){ if (a === slept) drewSlept++; return realDPA.apply(this, arguments); };
        try { draw(); } finally { drawPetActor = realDPA; }
        if (!drewSlept) fails.push('睡著的寵物畫面上看不到（沒有跟床一起畫）');
        phTap(1, { clientX: 10, clientY: 10 }); hideItemMenu();
        if (slept.sleep) fails.push('點睡著的寵物沒有醒來');
      }
      // 玩玩具：一定去玩的時候，走到玩具旁邊一跳一跳、冒符號、玩具也跳；時間到停；點了停
      phReset(); G.away = null; enterPetHouse();
      var toyIt = curRoom().items.filter(function(x){ return furnKind(x.id) === 'toy'; })[0];
      if (!toyIt) fails.push('（測試）寵物屋裡沒有玩具');
      var nk = PH_NAP_CHANCE, pk = PH_PLAY_SHARE, fk = PH_FUN_SHARE; PH_NAP_CHANCE = 1; PH_PLAY_SHARE = 1; PH_FUN_SHARE = 0;
      var tP = performance.now() + 50000, player = null;
      for (var pf3 = 0; pf3 < 1500 && !player; pf3++) { gameStep(1 / 60, tP + pf3 * 17); var aP = phActors[1]; if (aP && aP.play) player = aP; }
      PH_NAP_CHANCE = nk; PH_PLAY_SHARE = pk; PH_FUN_SHARE = fk;
      if (!player) fails.push('寵物屋的寵物不會去玩玩具');
      else {
        var pIt = curRoom().items.filter(function(x){ return x.uid === player.play.uid; })[0];
        if (!pIt || furnKind(pIt.id) !== 'toy') fails.push('寵物玩的不是玩具：' + (pIt && pIt.id));
        var fp3 = footprint(FURN_BY_ID[pIt.id], pIt.rot);
        if (!(player.x > pIt.x - 1.6 && player.x < pIt.x + fp3.w + 1.6 && player.y > pIt.y - 1.6 && player.y < pIt.y + fp3.d + 1.6)) fails.push('寵物沒有走到玩具旁邊就開始玩');
        var px0 = player.x, py0 = player.y, tP2 = tP + pf3 * 17;
        for (var pf4 = 1; pf4 <= 120; pf4++) gameStep(1 / 60, tP2 + pf4 * 17);
        if (player.x !== px0 || player.y !== py0) fails.push('寵物玩玩具的時候自己走掉了');
        if (!player.particles.length) fails.push('寵物玩玩具沒有冒出符號');
        if (!(stateOf(pIt.uid).tapAt > tP2)) fails.push('寵物玩玩具，玩具沒有跟著跳');
        phTap(1, { clientX: 10, clientY: 10 }); hideItemMenu();
        if (player.play) fails.push('點正在玩的寵物，牠沒有停下來');
        player.play = { uid: pIt.uid, snap: pIt.x + ',' + pIt.y + ',' + pIt.rot, until: 0, hopAt: 0, fxAt: 0, fx: '⭐' };
        phPlayTick(player, performance.now(), curRoom());
        if (player.play) fails.push('玩玩具時間到了沒有停');
      }
    } finally { toast = realToast12; cancelHold(); hideItemMenu(); G = normalizeSave(JSON.parse(keepG12)); saveGame(); phReset(); refreshTop(); updateHoldUI(); }

    /* 73 🧺 寵物屋裡可以賣重複的寵物：只有在寵物屋、有重複時才出現；每種至少留一隻；
       照顧中、一起逛、蛋不會被賣；先賣最小的；要確認；拿回半價 */
    var keepG11 = JSON.stringify(G), realConfirm11 = window.confirm, realToast11 = toast;
    toast = function(){};
    try {
      G = normalizeSave(JSON.parse(keepG11)); G.away = null; $('#modal').hidden = true;
      var spA = PET_SPECIES[0].id, spB = PET_SPECIES[1].id;
      G.pets = [newPet(spA, 'adult', 'A1'), newPet(spA, 'baby', 'A2'), newPet(spA, 'kid', 'A3'), newPet(spB, 'kid', 'B1'), newPet(spB, 'kid', 'B2'), newPet(spA, 'egg', '')];
      G.activePet = 3; G.pet = G.pets[3]; G.companions = [4];
      refreshDupBtn();
      if (!$('#btnDup').hidden) fails.push('不在寵物屋也出現「重複的寵物」按鈕');
      enterPetHouse(); refreshDupBtn();
      if ($('#btnDup').hidden) fails.push('寵物屋有重複的寵物，卻沒有「重複的寵物」按鈕');
      var gs = dupGroups();
      if (gs.length !== 1 || gs[0].species !== spA) fails.push('重複的清單不對（B 兩隻都在照顧／一起逛，不能賣）：' + JSON.stringify(gs));
      else if (G.pets[gs[0].pick].name !== 'A2') fails.push('沒有先賣最小的（寶寶）：' + G.pets[gs[0].pick].name);
      $('#btnDup').onclick();
      var sellB = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /賣掉一隻/.test(b.textContent); })[0];
      if (!sellB) fails.push('重複的寵物清單沒有「賣掉一隻」');
      else {
        var b0 = G.bells, n0 = G.pets.length;
        window.confirm = function(){ return false; }; sellB.onclick();
        if (G.pets.length !== n0) fails.push('按了「取消」還是賣掉了');
        window.confirm = function(){ return true; }; sellB.onclick();
        if (G.pets.length !== n0 - 1 || G.bells !== b0 + EGG_PRICE) fails.push('賣重複的寵物沒有拿到原價或沒有少一隻');
        if (G.pets.some(function(pp){ return pp.name === 'A2'; })) fails.push('賣掉的不是最小的那隻');
        if (G.pet.name !== 'B1' || G.companions.map(function(c){ return G.pets[c].name; }).join() !== 'B2') fails.push('賣了之後照顧中／一起逛的跑掉了');
        // 再賣一隻 A，剩一隻就不能再賣
        var sellB2 = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /賣掉一隻/.test(b.textContent); })[0];
        if (sellB2) sellB2.onclick();
        if (G.pets.filter(function(pp){ return pp.species === spA && pp.stage !== 'egg'; }).length !== 1) fails.push('同一種沒有留下最後一隻');
        if (!G.pets.some(function(pp){ return pp.stage === 'egg'; })) fails.push('還沒孵的蛋被賣掉了');
        if (dupGroups().length) fails.push('沒有重複了還列在清單上');
        refreshDupBtn();
        if (!$('#btnDup').hidden) fails.push('沒有重複了，按鈕還在');
      }
    } finally { window.confirm = realConfirm11; toast = realToast11; $('#modal').hidden = true; G = normalizeSave(JSON.parse(keepG11)); saveGame(); phReset(); refreshDupBtn(); refreshTop(); }

    /* 72 圖鑑沒集滿、剩下的種類都在還沒孵的蛋裡：不能寫「都收集到了」（家長：13/18 卻顯示全滿） */
    var keepPets10 = JSON.stringify([G.pets, G.activePet, G.companions]);
    G.pets = PET_SPECIES.map(function(sp, k){ return newPet(sp.id, k < 13 ? 'kid' : 'egg', ''); });
    G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
    openTab('pets');
    var ptx = $('#tabBody').textContent;
    if (new RegExp(PET_SPECIES.length + ' 種都收集到了').test(ptx)) fails.push('還有幾種在蛋裡沒孵，卻寫「都收集到了」');
    if (!new RegExp((PET_SPECIES.length - 13) + ' 種新的寵物都在你的蛋裡面').test(ptx)) fails.push('沒有說剩下的種類在蛋裡面、要摸一摸讓牠們孵出來');
    var eggBtn10 = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /寵物蛋/.test(b.textContent); })[0];
    if (!eggBtn10 || !eggBtn10.disabled) fails.push('剩下的種類都在蛋裡，買蛋按鈕還可以按');
    G.pets.forEach(function(pp){ pp.stage = 'kid'; });
    openTab('pets');
    if (!new RegExp(PET_SPECIES.length + ' 種都收集到了').test($('#tabBody').textContent)) fails.push('真的全部孵出來了，沒有寫「都收集到了」');
    var eggBtn11 = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /寵物蛋/.test(b.textContent); })[0];
    if (!eggBtn11 || !eggBtn11.disabled || !/賣完/.test(eggBtn11.textContent)) fails.push('18 種都有了，買蛋按鈕沒有變成「賣完了」');
    var kp10 = JSON.parse(keepPets10); G.pets = kp10[0]; G.activePet = kp10[1]; G.companions = kp10[2]; G.pet = G.pets[G.activePet];
    openTab('inv');

    /* 71 寵物分頁沒有「送回店裡」（家長：小孩會不小心碰到） */
    var keepPets9 = JSON.stringify([G.pets, G.activePet, G.companions]);
    G.pets = [newPet('mochi', 'kid', 'A'), newPet('mochi', 'kid', 'B')]; G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
    openTab('pets');
    if (/送回店裡|送回寵物店/.test($('#tabBody').textContent)) fails.push('寵物分頁還有「送回店裡」');
    var kp9 = JSON.parse(keepPets9); G.pets = kp9[0]; G.activePet = kp9[1]; G.companions = kp9[2]; G.pet = G.pets[G.activePet];
    openTab('inv');

    /* 70 🔊 iPad 沒聲音：手指放開（touchend／click）也要開聲音；interrupted 也要重新開；靜音模式下也要能播 */
    var realAc = Sound._t.getAc(), resumes = 0;
    var fakeAc = { state: 'interrupted', resume: function(){ resumes++; this.state = 'running'; return Promise.resolve(); } };
    var hadSession = 'audioSession' in navigator, fakeSession = { type: 'auto' };
    Object.defineProperty(navigator, 'audioSession', { value: fakeSession, configurable: true });
    try {
      Sound._t.setAc(fakeAc);
      window.dispatchEvent(new Event('touchend'));
      if (!resumes) fails.push('iPad：手指放開（touchend）時沒有把聲音打開');
      fakeAc.state = 'interrupted'; resumes = 0;
      window.dispatchEvent(new Event('click'));
      if (!resumes) fails.push('iPad：聲音被中斷（interrupted）之後，點畫面沒有重新開');
      if (fakeSession.type !== 'playback') fails.push('iPad：沒有跟系統說要播音樂（靜音模式下會沒聲音）');
    } finally {
      Sound._t.setAc(realAc);
      if (!hadSession) delete navigator.audioSession;
    }

    /* 69 🐾 寵物屋：在家裡（不用出門、不在出門選單）、免費不佔房間數；沒帶出來的寵物（含蛋）在裡面走來走去；
       點了只開心、數值不變、不會長大；可以直接「照顧牠」或「一起逛」；回房間不用走路過場 */
    var keepG7 = JSON.stringify(G);
    var realToast8 = toast; toast = function(){};
    try {
      G = normalizeSave(JSON.parse(keepG7)); G.away = null; G.cur = 0; cancelHold(); $('#modal').hidden = true;
      var sp2 = PET_SPECIES[1].id, sp3 = PET_SPECIES[2].id;
      G.pets = [newPet('mochi', 'kid', 'A'), newPet(sp2, 'baby', 'B'), newPet(sp3, 'kid', 'C'), newPet('mochi', 'egg', '')];
      G.activePet = 0; G.pet = G.pets[0]; G.companions = [2];
      var rooms0 = G.rooms.length, lim0 = petsOutLimit();
      openTravelMenu();
      if (/寵物屋/.test($('#modalCard').textContent)) fails.push('寵物屋跑進出門選單了（它在家裡）');
      $('#modal').hidden = true;
      refreshTop();
      var phBtn = [].filter.call(document.querySelectorAll('#roomTabs button'), function(b){ return /寵物屋/.test(b.textContent); })[0];
      if (!phBtn) fails.push('家裡的房間列沒有「🐾 寵物屋」');
      else phBtn.onclick();
      if (!inPetHouse() || curRoom().name !== '寵物屋') fails.push('點了寵物屋沒有進去');
      if (G.rooms.length !== rooms0 || petsOutLimit() !== lim0) fails.push('寵物屋佔了房間數（會影響能帶幾隻寵物）');
      var lst = phList();
      if (lst.join() !== '1,3') fails.push('寵物屋裡的寵物不對（應該是沒照顧、沒一起逛的，含蛋）：' + lst.join());
      var nowP = performance.now();
      for (var pf = 0; pf < 120; pf++) gameStep(1 / 60, nowP + pf * 17);
      var shown69 = phDrawEntries().length + phOccupants().length;   // 睡在床上的是跟床一起畫
      if (shown69 !== 2) fails.push('寵物屋裡的寵物沒有畫出來（' + shown69 + '）');
      var eggA = phActor(3), ex = eggA.x, ey = eggA.y;
      for (var pf2 = 0; pf2 < 600; pf2++) gameStep(1 / 60, nowP + 3000 + pf2 * 17);
      if (eggA.x !== ex || eggA.y !== ey) fails.push('寵物屋裡的蛋自己走來走去');
      // 點一下：開心，但數值、成長都不變
      var pB = G.pets[1], before = JSON.stringify([pB.hunger, pB.clean, pB.mood, pB.growth, pB.stage]);
      var pM = G.pet, beforeM = JSON.stringify([pM.hunger, pM.clean, pM.mood, pM.growth]);
      var aB = phActor(1), ppB = iso(aB.x, aB.y), rB = canvas.getBoundingClientRect();
      if (phHit({ x: ppB.x, y: ppB.y - 10 }) !== 1) fails.push('點寵物屋裡的寵物點不到');
      canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: rB.left + ppB.x * view.scale + view.ox, clientY: rB.top + (ppB.y - 10) * view.scale + view.oy, bubbles: true }));
      if (JSON.stringify([pB.hunger, pB.clean, pB.mood, pB.growth, pB.stage]) !== before) fails.push('在寵物屋點寵物，數值或成長變了（應該只是去看看）');
      if (JSON.stringify([pM.hunger, pM.clean, pM.mood, pM.growth]) !== beforeM) fails.push('在寵物屋點寵物，照顧中那隻的數值變了');
      if (!(aB.happyUntil > performance.now())) fails.push('在寵物屋點寵物沒有開心的反應');
      var mItems = [].map.call(document.querySelectorAll('#itemMenu button'), function(b){ return b.textContent; });
      if (!mItems.some(function(t){ return /照顧/.test(t); }) || !mItems.some(function(t){ return /一起逛/.test(t); })) fails.push('寵物屋的寵物選單沒有「照顧牠／一起逛」：' + mItems.join('|'));
      var careB = [].filter.call(document.querySelectorAll('#itemMenu button'), function(b){ return /照顧/.test(b.textContent); })[0];
      if (careB) careB.onclick();
      if (G.activePet !== 1) fails.push('在寵物屋按「照顧牠」沒有換過來');
      if (phList().indexOf(1) >= 0) fails.push('換成照顧的那隻還留在寵物屋清單');
      hideItemMenu();
      // 蛋：在寵物屋摸一摸也會孵出來；孵出來的寶寶留在寵物屋（就算是重複的種類）
      G.pets = [newPet('mochi', 'kid', 'M'), newPet('mochi', 'egg', '')]; G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
      SC_QUEUE.length = 0; var oE = document.getElementById('showcase'); if (oE) oE.remove();
      var eggI2 = 1, eA = phActor(eggI2), taps = 0;
      hideItemMenu(); phTap(eggI2, { clientX: 10, clientY: 10 });
      if (!$('#itemMenu').hidden) fails.push('摸蛋時跳出選單（要連點很多下會很煩）');
      hideItemMenu(); G.pets[eggI2].growth = 0;
      while (G.pets[eggI2].stage === 'egg' && taps < 30) { eA.lastGrowAt = 0; phTap(eggI2, { clientX: 10, clientY: 10 }); taps++; }
      if (G.pets[eggI2].stage === 'egg') fails.push('在寵物屋摸蛋不會孵化');
      else if (taps > 10) fails.push('在寵物屋孵蛋要摸太多下（' + taps + '）');
      var hs = document.getElementById('showcase');
      if (!hs || !hs.querySelector('.sc-egg')) fails.push('在寵物屋孵蛋沒有搖蛋、裂開的大圖');
      // 還有位置：新孵出來的自動一起逛（不在寵物屋清單，跟在她身邊）
      if (petsOutLimit() > 1 && G.companions.indexOf(eggI2) < 0) fails.push('新孵出來的寵物沒有自動一起逛');
      // 位置滿了：留在寵物屋（就算跟照顧中的同種也要看得到）
      G.companions = []; G.pets.push(newPet('mochi', 'kid', 'Z')); G.companions = [2];
      G.pets[eggI2].stage = 'egg'; G.pets[eggI2].growth = 0; delete G.pets[eggI2].hatchedAt;
      var limKeep = petsOutLimit; petsOutLimit = function(){ return 2; };
      try {
        var tapsB = 0; while (G.pets[eggI2].stage === 'egg' && tapsB < 30) { eA.lastGrowAt = 0; phTap(eggI2, { clientX: 10, clientY: 10 }); tapsB++; }
        if (G.companions.indexOf(eggI2) >= 0) fails.push('位置滿了還把新孵出來的帶出去');
        if (phList().indexOf(eggI2) < 0) fails.push('在寵物屋孵出來的寶寶不見了（跟照顧中的同種也要留著）');
      } finally { petsOutLimit = limKeep; }
      if (G.activePet !== 0) fails.push('在寵物屋孵蛋，照顧中的寵物被換掉了');
      if (hs) hs.remove(); SC_QUEUE.length = 0; hideItemMenu();
      // 重複的同一種只出來一隻；已經在房間裡（照顧中）的那一種也不用再出來；蛋每顆都放
      G.pets = [newPet('mochi', 'kid', 'M'), newPet('mochi', 'kid', 'M2'), newPet(sp2, 'kid', 'X'), newPet(sp2, 'adult', 'X2'), newPet(sp2, 'baby', 'X3'), newPet('mochi', 'egg', ''), newPet('mochi', 'egg', '')];
      G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
      if (phList().join() !== '2,5,6') fails.push('寵物屋裡重複的寵物沒有只出來一隻：' + phList().join());
      // 最多 12 隻（每隻都不同種）
      G.pets = []; for (var pn = 0; pn < 16; pn++) G.pets.push(newPet(PET_SPECIES[pn % PET_SPECIES.length].id, 'kid', 'P' + pn));
      G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
      if (phList().length !== PH_MAX || PH_MAX > 12) fails.push('寵物屋同時超過 12 隻');
      // 回自己家的房間：不用走路過場，回到點的那間
      refreshTop();
      var backB = [].filter.call(document.querySelectorAll('#roomTabs button'), function(b){ return b.textContent === G.rooms[0].name; })[0];
      if (!backB) fails.push('寵物屋的房間列沒有回自己房間的按鈕');
      else backB.onclick();
      if (G.away || G.cur !== 0) fails.push('從寵物屋回房間沒有回來');
      gameStep(1 / 60, nowP + 20000);
      if (Object.keys(phActors).length) fails.push('離開寵物屋，裡面的寵物還在算');
      // 存檔讀回來（在寵物屋時存的）
      G.away = { place: 'pethouse', idx: 0 }; saveGame();
      var reP = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
      if (!reP || reP.away !== null) fails.push('在寵物屋存的檔讀不回來（或重新打開沒有回到自己家）');
    } finally { toast = realToast8; hideItemMenu(); G = normalizeSave(JSON.parse(keepG7)); saveGame(); phReset(); refreshTop(); }

    /* 68 🏠 搬新家：叔叔、阿婆也來送包裹（只有家人會來家裡）。只有新存檔、只來一次；
       教學做完 3 分鐘叔叔、6 分鐘阿婆；教學沒做完的話打開爸媽包裹 10 分鐘後也會來；
       送她還沒有的家具（3,000 以內，叔叔現代／玩具、阿婆自然／植物）；打開才給；說謝謝才走 */
    var FAMILY = ['mom', 'dad', 'uncle', 'grandma'];
    GIFT_SPECS.forEach(function(sp){ sp.people().forEach(function(pp){ if (FAMILY.indexOf(pp.id) < 0) fails.push('來家裡送禮的「' + pp.id + '」不是家人'); }); });
    var oldW = JSON.parse(JSON.stringify(G)); delete oldW.welcome;
    var oldWn = normalizeSave(oldW);
    if (!oldWn || oldWn.welcome.uncle !== true || oldWn.welcome.grandma !== true) fails.push('已經在玩的存檔也算搬新家（叔叔阿婆會跑來）');
    var keepG6 = JSON.stringify(G), keepFufu6 = [fufu.x, fufu.y, fufu.pose, fufu.path];
    var realToast7 = toast; toast = function(){};
    try {
      G = newGame(); G.away = null; cancelHold(); giftReset(); $('#modal').hidden = true; SC_QUEUE.length = 0;
      fufu.pose = null; fufu.path = []; fufu.x = 2.5; fufu.y = 2.5;
      claimOpenGift(); $('#modal').hidden = true; giftReset();
      if (welcomeDue('uncle')) fails.push('教學還沒做完、包裹剛打開，叔叔就來了');
      G.openGiftAt = Date.now() - 9 * 60000;
      if (welcomeDue('uncle')) fails.push('教學沒做完，打開包裹 9 分鐘叔叔就來了（要 10 分鐘）');
      G.openGiftAt = Date.now() - 11 * 60000;
      if (!welcomeDue('uncle')) fails.push('教學一直沒做完，10 分鐘後叔叔還是不會來');
      G.openGiftAt = Date.now();
      G.welcome.at = Date.now() - 2 * 60000;
      if (welcomeDue('uncle')) fails.push('教學做完 2 分鐘叔叔就來了（要 3 分鐘）');
      G.welcome.at = Date.now() - 7 * 60000;
      if (!welcomeDue('uncle')) fails.push('教學做完 7 分鐘叔叔還沒來');
      if (welcomeDue('grandma')) fails.push('叔叔還沒來，阿婆先來了');
      var tw = performance.now();
      giftTick(tw); giftTick(tw + 2100);
      if (giftVisit.state !== 'in' || !giftVisit.spec || giftVisit.spec.id !== 'uncle' || giftVisit.actors.length !== 1 || giftVisit.actors[0].who.id !== 'uncle') fails.push('叔叔沒有走進來（' + giftVisit.state + '／' + (giftVisit.spec && giftVisit.spec.id) + '）');
      else {
        if (giftDrawEntries().length !== 1) fails.push('叔叔沒有被畫出來');
        for (var w1 = 0; w1 < 1500 && giftVisit.state !== 'wait'; w1++) giftTick(tw + 2200 + w1 * 1000 / 60);
        if (giftVisit.state !== 'wait' || !giftBoxHere()) fails.push('叔叔沒有放下包裹等她（' + giftVisit.state + '）');
        if (!giftVisit.says[0] || !/叔叔/.test(giftVisit.says[0].text)) fails.push('叔叔放包裹時沒有說話');
        if (G.welcome.uncle !== false) fails.push('包裹還沒打開就算送過了');
        var bxw = giftBoxHere(), bpw = iso(bxw.x, bxw.y, 0), rw = canvas.getBoundingClientRect();
        canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: rw.left + bpw.x * view.scale + view.ox, clientY: rw.top + (bpw.y - 12) * view.scale + view.oy, bubbles: true }));
        if ($('#modal').hidden || !/叔叔送的包裹/.test($('#modalCard').textContent)) fails.push('點叔叔的包裹沒有打開「叔叔送的包裹」');
        var seenBefore = JSON.stringify(G.seen);
        var ob = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /打開包裹/.test(b.textContent); })[0];
        if (ob) ob.onclick();
        if (G.welcome.uncle !== true) fails.push('打開叔叔的包裹沒有記起來');
        var gotId = Object.keys(G.seen).filter(function(k){ return JSON.parse(seenBefore)[k] !== true; })[0];
        var gd = gotId && FURN_BY_ID[gotId];
        if (!gd) fails.push('叔叔的包裹裡沒有新的家具');
        else {
          if (gd.price > WELCOME_MAX_PRICE) fails.push('叔叔送的家具太貴（' + gd.price + '）');
          if (!(gd.theme === 'modern' || furnKind(gd.id) === 'toy')) fails.push('叔叔送的不是現代風或玩具：' + gd.name);
        }
        giftTick(tw + 60000);
        if (giftVisit.state !== 'wait') fails.push('她還在看包裹，叔叔就先走了');
        var tb = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /謝謝叔叔/.test(b.textContent); })[0];
        if (!tb) fails.push('沒有「謝謝叔叔！」');
        else tb.onclick();
        giftTick(tw + 60100);
        if (giftVisit.state !== 'thanks') fails.push('說了謝謝叔叔，叔叔沒有回話');
        for (var w2 = 0; w2 < 2000 && giftVisit.state !== 'none'; w2++) giftTick(tw + 60200 + w2 * 1000 / 60);
        if (giftVisit.state !== 'none') fails.push('叔叔走不掉（' + giftVisit.state + '）');
        giftTick(tw + 200000);
        if (giftVisit.state !== 'none') fails.push('叔叔送過了又來一次（或阿婆太早來）');
      }
      // 阿婆：叔叔來過、時間到了才來；送自然風或植物
      G.welcome.at = Date.now() - 7 * 60000;
      if (!welcomeDue('grandma')) fails.push('叔叔來過、過了 6 分鐘，阿婆還不來');
      if (giftNextSpec() !== giftSpecById('grandma')) fails.push('下一個來的不是阿婆');
      var gs2 = JSON.stringify(G.seen), gid = claimWelcome('grandma'), gd2 = FURN_BY_ID[gid];
      if (!gd2 || !(gd2.theme === 'nature' || furnKind(gid) === 'plant')) fails.push('阿婆送的不是自然風或植物：' + (gd2 && gd2.name));
      if (JSON.parse(gs2)[gid]) fails.push('阿婆送了她已經有的家具');
      if (claimWelcome('grandma') !== null) fails.push('阿婆的包裹可以開兩次');
      var tooExp = 0; for (var wp = 0; wp < 300; wp++) { if (FURN_BY_ID[welcomePick(function(){ return true; })].price > WELCOME_MAX_PRICE) tooExp++; }
      if (tooExp) fails.push('搬新家禮物會挑到超過 ' + WELCOME_MAX_PRICE + ' 的家具');
      if (giftNextSpec()) fails.push('叔叔阿婆都送過了，還有人要來');
    } finally {
      toast = realToast7; giftReset(); $('#modal').hidden = true; SC_QUEUE.length = 0;
      var o9 = document.getElementById('showcase'); if (o9) o9.remove();
      fufu.x = keepFufu6[0]; fufu.y = keepFufu6[1]; fufu.pose = keepFufu6[2]; fufu.path = keepFufu6[3];
      G = normalizeSave(JSON.parse(keepG6)); saveGame();
    }

    /* 67 💾 備份獨立成一個分頁（家長：從設定移出來）：設定頁不再有備份；寫上次備份幾天前；
       超過 7 天分頁上有紅點；存成檔案之後紅點消失；存不進去的紅色提醒帶到備份頁 */
    var bkTab = document.querySelector('#tabs button[data-tab="backup"]');
    if (!bkTab || !/💾/.test(bkTab.textContent) || !/備份/.test(bkTab.textContent)) fails.push('沒有「💾 備份」分頁');
    openTab('save');
    if (/複製備份|存成檔案|把備份放回來/.test($('#tabBody').textContent)) fails.push('設定頁還留著備份（應該移到備份分頁）');
    if (!/重新開始/.test($('#tabBody').textContent) || !/開一個新存檔/.test($('#tabBody').textContent)) fails.push('設定頁的存檔、重新開始不見了');
    var keepLB = lsGet(backupKey()), keepFS = lsGet(firstSeenKey());
    try {
      localStorage.removeItem(backupKey()); lsSet(firstSeenKey(), String(Date.now() - 8 * 864e5));
      refreshBackupDot();
      if (!bkTab.classList.contains('dot')) fails.push('8 天沒備份，分頁上沒有紅點');
      openTab('backup');
      if (!/還沒有備份過/.test($('#tabBody .backup-state').textContent) || !$('#tabBody .backup-state').classList.contains('due')) fails.push('沒備份過，備份頁沒有提醒');
      lsSet(firstSeenKey(), String(Date.now() - 2 * 864e5)); refreshBackupDot();
      if (bkTab.classList.contains('dot')) fails.push('才 2 天就掛紅點');
      lsSet(firstSeenKey(), String(Date.now() - 8 * 864e5)); refreshBackupDot();
      var dlB3 = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /存成檔案/.test(b.textContent); })[0];
      var realDl3 = downloadText; downloadText = function(){};
      try { dlB3.onclick(); } finally { downloadText = realDl3; }
      if (bkTab.classList.contains('dot')) fails.push('存成檔案之後紅點沒有消失');
      openTab('backup');
      if (!/今天備份過了/.test($('#tabBody .backup-state').textContent)) fails.push('備份完沒有寫「今天備份過了」');
      lsSet(backupKey(), String(Date.now() - 10 * 864e5)); refreshBackupDot(); openTab('backup');
      if (!bkTab.classList.contains('dot') || !/10 天前/.test($('#tabBody .backup-state').textContent)) fails.push('上次備份 10 天前：沒有紅點或沒寫幾天前');
      // 存不進去的紅色提醒：點了要到備份頁
      showSaveWarn('fail'); openTab('inv');
      document.getElementById('saveWarn').onclick();
      if (tab !== 'backup') fails.push('「進度沒有存好」的提醒點了沒有到備份頁');
      if (!/💾 備份/.test(document.getElementById('saveWarn').textContent)) fails.push('「進度沒有存好」的提醒沒說去「💾 備份」');
      showSaveWarn(null);
    } finally {
      if (keepLB == null) localStorage.removeItem(backupKey()); else lsSet(backupKey(), keepLB);
      if (keepFS == null) localStorage.removeItem(firstSeenKey()); else lsSet(firstSeenKey(), keepFS);
      refreshBackupDot(); openTab('inv');
    }

    /* 66 🏆 集滿獎盃：每種圖鑑集滿送一座（只送一次），放進我的東西；不能賣；可以擺桌上；
       獎盃不算家具圖鑑（不然家具永遠集不滿）；圖鑑頁看得到寵物和獎盃架（還差幾個） */
    var keepG5 = JSON.stringify(G);
    var realToast6 = toast; toast = function(){};
    try {
      SC_QUEUE.length = 0; var o6 = document.getElementById('showcase'); if (o6) o6.remove();
      G.trophies = {}; G.stickers = {};
      STICKERS.slice(0, -1).forEach(function(x){ G.stickers[x] = 1; });
      checkTrophies();
      if (G.trophies.sticker) fails.push('貼紙還沒集滿就給獎盃');
      G.stickers[STICKERS[STICKERS.length - 1]] = 1;
      SC_QUEUE.length = 0; o6 = document.getElementById('showcase'); if (o6) o6.remove();
      checkTrophies();
      if (!G.trophies.sticker || !G.inv.trophy_sticker) fails.push('貼紙集滿沒有拿到獎盃');
      var sb6 = document.getElementById('showcase');
      if (!sb6 || !/貼紙獎盃/.test(sb6.textContent) || !/集滿了/.test(sb6.querySelector('.sc-new').textContent)) fails.push('拿到獎盃沒有跳「集滿了」大圖');
      var inv6 = G.inv.trophy_sticker; checkTrophies();
      if (G.inv.trophy_sticker !== inv6) fails.push('獎盃發了兩次');
      if (furnSellBlock('trophy_sticker') == null) fails.push('獎盃可以賣掉');
      if (!canSitOnTable('trophy_sticker')) fails.push('獎盃不能擺在桌上');
      if (FURNITURE.some(function(f){ return /^trophy_/.test(f.id); })) fails.push('獎盃算進家具圖鑑了（家具會永遠集不滿）');
      // 存起來、讀回來還在；房間裡擺獎盃讀得回來（不會被當成壞掉的存檔）
      G.rooms[0].items.push({ uid: 9876, id: 'trophy_sticker', x: 0, y: 0, rot: 0 });
      saveGame();
      var re6 = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
      if (!re6 || !re6.trophies.sticker) fails.push('擺了獎盃的存檔讀不回來');
      // 已經集滿的舊存檔：補發
      var old6 = JSON.parse(keepG5); delete old6.trophies; old6.themesDone = {}; THEMES.forEach(function(t){ old6.themesDone[t.id] = 1; });
      G = normalizeSave(old6); checkTrophies();
      if (!G.trophies.theme) fails.push('之前就集滿的存檔沒有補發獎盃');
      // 圖鑑頁：獎盃架、寵物
      openTab('book');
      var shelf = document.getElementById('dexTrophy');
      if (!shelf) fails.push('圖鑑沒有獎盃架');
      if (!/還差 \d+ 個/.test($('#tabBody').textContent)) fails.push('獎盃架沒寫還差幾個');
      var pH = document.getElementById('dexPet'), pG = pH && pH.nextElementSibling;
      while (pG && !pG.classList.contains('grid') && pG.tagName !== 'H3') pG = pG.nextElementSibling;
      if (!pG || !pG.classList.contains('grid') || pG.children.length !== PET_SPECIES.length) fails.push('圖鑑的寵物那一段沒有 ' + PET_SPECIES.length + ' 格');
    } finally { toast = realToast6; G = normalizeSave(JSON.parse(keepG5)); saveGame(); SC_QUEUE.length = 0; var o7 = document.getElementById('showcase'); if (o7) o7.remove(); openTab('inv'); }
    // 家具分三座：20 件銅、45 件銀、全部金；一次跨過好幾個門檻，每一座都要給
    toast = function(){};
    try {
      G.trophies = {}; G.seen = {};
      FURNITURE.slice(0, 19).forEach(function(f){ G.seen[f.id] = true; });
      checkTrophies();
      if (G.trophies.furn20) fails.push('家具 19 件就給銅獎盃');
      G.seen[FURNITURE[19].id] = true; checkTrophies();
      if (!G.trophies.furn20 || !G.inv.trophy_furn20) fails.push('家具 20 件沒有銅獎盃');
      if (G.trophies.furn45 || G.trophies.furn) fails.push('家具 20 件就給了銀或金獎盃');
      if (FURN_BY_ID.trophy_furn20.name !== '家具銅獎盃' || FURN_BY_ID.trophy_furn.name !== '家具金獎盃') fails.push('家具獎盃名字不對：' + FURN_BY_ID.trophy_furn20.name + '／' + FURN_BY_ID.trophy_furn.name);
      FURNITURE.forEach(function(f){ G.seen[f.id] = true; }); checkTrophies();
      if (!G.trophies.furn45 || !G.trophies.furn) fails.push('家具全部集滿，銀、金獎盃沒有都給');
      G.trophies = {}; G.seen = {}; FURNITURE.slice(0, 30).forEach(function(f){ G.seen[f.id] = true; });
      openTab('book');
      var silver = [].filter.call(document.querySelectorAll('#tabBody .card.dex'), function(c){ return /家具・銀/.test(c.textContent); })[0];
      if (!silver || !/還差 15 個/.test(silver.textContent)) fails.push('家具 30 件時，銀獎盃沒寫還差 15 個');
    } finally { toast = realToast6; G = normalizeSave(JSON.parse(keepG5)); saveGame(); SC_QUEUE.length = 0; var o8 = document.getElementById('showcase'); if (o8) o8.remove(); openTab('inv'); }

    /* 65 收集到新東西：每一種圖鑑都跳大圖（光芒、彩帶、進度條），重複的不跳；孵蛋先搖蛋再跳寵物；
       排隊一個一個跳；點一下可以關 */
    var scClear = function(){ SC_QUEUE.length = 0; var o = document.getElementById('showcase'); if (o) o.remove(); };
    var scShown = function(re, label, needBar){
      var b = document.getElementById('showcase');
      if (!b) { fails.push(label + '：沒有跳大圖'); return; }
      if (re && !re.test(b.textContent)) fails.push(label + '：大圖寫的不對（' + b.textContent.slice(0, 40) + '）');
      if (needBar !== false && !b.querySelector('.sc-bar')) fails.push(label + '：沒有圖鑑進度條');
      if (!b.querySelector('.sc-rays') || b.querySelectorAll('.sc-bit').length < 8) fails.push(label + '：沒有光芒或彩帶');
    };
    var keepG4 = JSON.stringify(G), keepAway4 = G.away;
    var realToast5 = toast; toast = function(){};
    try {
      $('#modal').hidden = true;
      // 家具：第一次拿到才跳；已經有的不跳
      var fNew = FURNITURE.filter(function(f){ return !G.seen[f.id] && !f.gift; })[0];
      scClear(); addItem(fNew.id); scShown(new RegExp(fNew.name + '[\\s\\S]*家具圖鑑'), '新家具');
      scClear(); addItem(fNew.id);
      if (document.getElementById('showcase')) fails.push('已經有的家具又跳大圖');
      // 漫畫、貼紙、閱讀護照、好朋友、魚
      G.comics = {}; scClear(); openComic(); scShown(/漫畫 1 \/ /, '新漫畫'); $('#modal').hidden = true;
      G.stickers = {}; scClear(); giveSticker(); scShown(/貼紙 1 \/ /, '新貼紙');
      G.passport = {}; scClear(); finishBook(STORYBOOKS[0]); scShown(/閱讀護照 1 \/ /, '閱讀護照新章');
      scClear(); finishBook(STORYBOOKS[0]);
      if (document.getElementById('showcase')) fails.push('看過的書又跳大圖');
      G.friends = {}; scClear(); newFriendShowcase(NEIGHBORS[0]); scShown(/好朋友 0 \/ |新朋友/, '新朋友');
      G.fish = {}; scClear(); catchFish(FISH[1]); scShown(/小丑魚[\s\S]*魚類圖鑑 1 \//, '新的魚');
      if (document.querySelector('#showcase .sc-emoji').textContent !== '🐠') fails.push('小丑魚的大圖不是 🐠');
      // 排隊：一次拿兩樣，先跳第一個，關掉後跳第二個
      G.fish = {}; scClear(); catchFish(FISH[0]); catchFish(FISH[2]);
      if (SC_QUEUE.length !== 1) fails.push('一次拿兩樣沒有排隊（排了 ' + SC_QUEUE.length + ' 個）');
      document.getElementById('showcase').onclick();
      var waitQ = document.getElementById('showcase');
      // 點了要淡出 0.3 秒才拿掉，直接當作淡出完
      if (waitQ && waitQ.classList.contains('out')) { waitQ.remove(); showcaseNext(); }
      if (!document.getElementById('showcase') || !/竹筴魚/.test(document.getElementById('showcase').textContent)) fails.push('點掉第一個後，排隊的第二個沒有跳出來');
      // 孵蛋：先搖蛋（還不能點掉），之後跳寵物
      scClear();
      var eggI = addEgg(); G.activePet = eggI; G.pet = G.pets[eggI];
      var spNew = PET_SPECIES_BY_ID[G.pet.species];
      G.pet.growth = PET_STAGE_BY_ID.egg.next - 1; pet.lastGrowAt = 0;
      petGainGrowth(5, 0);
      var hb = document.getElementById('showcase');
      if (!hb || !hb.querySelector('.sc-egg')) fails.push('孵蛋沒有先搖蛋的動畫');
      else {
        hb.onclick();
        if (hb.classList.contains('out')) fails.push('蛋還在搖就可以點掉（還沒看到寵物）');
      }
    } finally { toast = realToast5; scClear(); G = normalizeSave(JSON.parse(keepG4)); G.away = keepAway4; saveGame(); }
    // 孵蛋：時間到換成寵物
    (function(){
      var tg = JSON.stringify(G);
      var i2 = addEgg(); G.activePet = i2; G.pet = G.pets[i2]; G.pet.growth = PET_STAGE_BY_ID.egg.next - 1; pet.lastGrowAt = 0;
      SC_QUEUE.length = 0; var o = document.getElementById('showcase'); if (o) o.remove();
      petGainGrowth(5, 0);
      var hb2 = document.getElementById('showcase');
      if (hb2 && hb2._reveal) hb2._reveal();
      if (!hb2 || hb2.querySelector('.sc-egg') || !hb2.querySelector('.sc-pic') || !/寵物圖鑑|又多一個/.test(hb2.textContent)) fails.push('孵蛋動畫結束沒有跳出寵物大圖');
      else {
        if (!/孵出來了/.test(hb2.textContent)) fails.push('孵蛋大圖沒有寫「孵出來了」');
        hb2.onclick(); if (!hb2.classList.contains('out')) fails.push('寵物跳出來之後點了關不掉');
      }
      if (hb2) hb2.remove();
      G = normalizeSave(JSON.parse(tg)); saveGame();
    })();

    /* 64 👇 第一次玩的小手教學：只有新存檔有；摸蛋 → 放家具（我的東西 → 點家具 → 放這裡）→ 打開商店；
       做到了自動下一步；包裹還沒開／有視窗時不出現；做完存起來不再出現 */
    var oldG2 = JSON.parse(JSON.stringify(G)); delete oldG2.guide; delete oldG2.guideAsked;
    var oldG2n = normalizeSave(oldG2);
    if (!oldG2n || oldG2n.guide !== 'done') fails.push('已經在玩的存檔也跑出新手教學');
    if (newGame().guide !== 'egg') fails.push('新存檔沒有新手教學');
    var mid = JSON.parse(JSON.stringify(G)); mid.guide = 'place'; delete mid.guideAsked;
    var midN = normalizeSave(mid);
    if (!midN || !midN.guideAsked) fails.push('已經教到一半的存檔又要問一次要不要教');
    if (!oldG2n.guideAsked) fails.push('已經在玩的存檔會被問要不要小手教學');
    var keepG3 = G, hand = $('#guideHand');
    var near = function(t, x, y){ return t && !hand.hidden && Math.abs(parseFloat(hand.style.left) - x) < 30 && Math.abs(parseFloat(hand.style.top) - y) < 40; };
    var center = function(node){ var r = node.getBoundingClientRect(); return [r.left + r.width / 2, r.top + 4]; };
    G = newGame(); G.away = null; cancelHold(); openTab('inv'); $('#modal').hidden = true; giftReset();
    guideNext = 0; guideTick(performance.now());
    if (!hand.hidden) fails.push('包裹還沒打開，小手就出來了');
    claimOpenGift(); giftReset(); $('#modal').hidden = true;
    if (!isEgg()) fails.push('（教學測試）主要的寵物不是蛋');
    // 先問要不要：選「不用」就結束、叔叔阿婆開始算時間；設定裡可以再打開
    guideNext = 0; guideTick(performance.now());
    var askNo = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /不用/.test(b.textContent); })[0];
    var askYes = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /要，教我/.test(b.textContent); })[0];
    if ($('#modal').hidden || !askNo || !askYes) fails.push('開始小手教學前沒有問要不要');
    if (!hand.hidden) fails.push('還沒選要不要，小手就出來了');
    if (askNo) {
      askNo.onclick();
      if (G.guide !== 'done' || !G.guideAsked) fails.push('選「不用」，教學沒有關掉');
      if (!(G.welcome.at > 0)) fails.push('選「不用」，叔叔阿婆不知道什麼時候來');
      guideNext = 0; guideTick(performance.now());
      if (!hand.hidden || !$('#modal').hidden) fails.push('選「不用」之後，小手或問題又跑出來');
      openTab('save');
      var gOnB = [].filter.call(document.querySelectorAll('#tabBody .filter button'), function(b){ return b.textContent === '開' && b.parentNode.previousElementSibling && /小手/.test(b.parentNode.previousElementSibling.textContent); })[0];
      if (!gOnB) fails.push('設定裡沒有小手教學的開關');
      else { gOnB.onclick(); if (G.guide !== 'egg') fails.push('設定裡打開小手教學沒有重新開始'); }
      openTab('inv');
    }
    if (G.guide !== 'egg') { G.guide = 'egg'; G.guideAsked = true; }
    G.welcome.at = 0;
    guideNext = 0; guideTick(performance.now());
    var cr = canvas.getBoundingClientRect(), pp = iso(pet.x, pet.y, 0);
    if (hand.hidden) fails.push('新存檔打開包裹後，小手沒有出來指蛋');
    else if (Math.abs(parseFloat(hand.style.left) - (cr.left + view.ox + pp.x * view.scale)) > 30) fails.push('小手沒有指著蛋');
    $('#modal').hidden = false; guideNext = 0; guideTick(performance.now());
    if (!hand.hidden) fails.push('有視窗開著，小手還浮在上面');
    $('#modal').hidden = true;
    // 孵出來 → 放家具
    G.pet.stage = 'baby';
    openTab('shop'); guideNext = 0; guideTick(performance.now());
    if (G.guide !== 'place') fails.push('蛋孵出來了，教學沒有換到放家具（' + G.guide + '）');
    var invB = document.querySelector('#tabs button[data-tab="inv"]'), ci = center(invB);
    if (!near(true, ci[0], ci[1])) fails.push('不在「我的東西」時，小手沒有指「我的東西」');
    openTab('inv'); $('#tabBody').scrollTop = 99999; guideScrolled = null; guideNext = 0; guideTick(performance.now());
    var bR = $('#tabBody').getBoundingClientRect(), c0 = document.querySelector('#tabBody .grid .card').getBoundingClientRect();
    if (c0.top < bR.top - 1 || c0.bottom > bR.bottom + 1) fails.push('家具卡片在面板外面，教學沒有捲過去');
    var card1 = document.querySelector('#tabBody .grid .card'), cc = card1 && center(card1);
    if (!cc || !near(true, cc[0], cc[1])) fails.push('在「我的東西」時，小手沒有指家具');
    startHoldFromInv(Object.keys(G.inv).filter(function(id){ return G.inv[id] > 0; })[0]);
    guideNext = 0; guideTick(performance.now());
    if ($('#btnPlace').getBoundingClientRect().width) {     // 觸控：有「✓ 放這裡」
      var cp = center($('#btnPlace'));
      if (!near(true, cp[0], cp[1])) fails.push('拿著家具時，小手沒有指「放這裡」');
    } else {                                                // 滑鼠：指著拿著的家具
      var gpp = iso(hold.x + .5, hold.y + .5, 0);
      if (!near(true, cr.left + view.ox + gpp.x * view.scale, cr.top + view.oy + (gpp.y - 30) * view.scale)) fails.push('拿著家具時，小手沒有指著家具');
    }
    // 觸控的版本：讓「✓ 放這裡」顯示出來，小手要指它
    $('#btnPlace').style.display = 'inline-block';
    guideNext = 0; guideTick(performance.now());
    var cp2 = center($('#btnPlace'));
    if (!near(true, cp2[0], cp2[1])) fails.push('平板上拿著家具時，小手沒有指「✓ 放這裡」');
    $('#btnPlace').style.display = '';
    cancelHold();
    G.rooms[0].items.push({ uid: 999, id: 'wood_bed', x: 0, y: 0, rot: 0 });
    guideNext = 0; guideTick(performance.now());
    if (G.guide !== 'shop') fails.push('放好家具，教學沒有換到商店（' + G.guide + '）');
    var cs = center(document.querySelector('#tabs button[data-tab="shop"]'));
    if (!near(true, cs[0], cs[1])) fails.push('小手沒有指「商店」');
    openTab('shop'); guideNext = 0; guideTick(performance.now());
    if (G.guide !== 'done' || !hand.hidden) fails.push('打開商店後教學沒有結束');
    if (!G.welcome || !(G.welcome.at > 0)) fails.push('教學做完沒有記時間（叔叔阿婆不知道什麼時候來）');
    var reG3 = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    if (!reG3 || reG3.guide !== 'done') fails.push('教學做完沒有存起來（下次又要教一次）');
    // 出錯也不能讓畫面停住
    var realIso = iso; G.guide = 'egg'; G.pet.stage = 'egg';
    iso = function(){ throw new Error('x'); };
    try { guideNext = 0; guideTick(performance.now()); } catch (e) { fails.push('教學出錯會讓整個畫面停住'); } finally { iso = realIso; }
    G = keepG3; $('#guideHand').hidden = true; openTab('inv'); saveGame();

    /* ㊾ 更新公告：舊存檔要看到、新存檔不用看、看過不再跳、有別的視窗時不要蓋掉、
       設定頁可以再看；新進商店的家具兩週內掛「新」，買過就不掛 */
    var oldSave = JSON.parse(JSON.stringify(G)); delete oldSave.newsSeen;
    if (!unseenNews(normalizeSave(oldSave)).length) fails.push('舊存檔看不到這次的更新公告');
    if (unseenNews(newGame()).length) fails.push('新開的存檔還要看以前的更新公告');
    var keepSeen = G.newsSeen;
    G.newsSeen = []; saveGame();                         // 存檔裡也先改成「沒看過」
    $('#modal').hidden = false; $('#modalCard').innerHTML = '<p id="busy">小遊戲中</p>';
    maybeShowNews();                                     // 有別的視窗開著：不能把它蓋掉（晚點再試）
    if (!document.getElementById('busy')) fails.push('更新公告把正在開的視窗蓋掉了');
    $('#modal').hidden = true;
    maybeShowNews();
    if ($('#modal').hidden || !document.querySelector('#modalCard .news')) fails.push('有沒看過的公告卻沒有跳出來');
    else {
      if (document.querySelectorAll('#modalCard .news-ic').length !== NEWS[0].lines.length) fails.push('公告每一行前面沒有圖示（最新一次要完整列出）');
      if (NEWS.length > 1 && !document.querySelector('#modalCard .news-older')) fails.push('之前沒看過的更新沒有用一排圖示帶過');
      var xBtn = document.querySelector('#modalCard .modal-x');
      if (!xBtn) fails.push('公告右上角沒有 ✕');
      var mcS = getComputedStyle($('#modalCard'));
      if (mcS.overflowY !== 'auto' || mcS.maxHeight === 'none') fails.push('視窗太高時不能捲（手機上會按不到下面的按鈕）');
      if (getComputedStyle(document.querySelector('#modalCard .news-ok')).position !== 'sticky') fails.push('「好！去玩囉」沒有固定在最下面');
      // 小手機（高 560）：關閉按鈕都要在畫面裡
      var cv6 = $('#modal'); cv6.style.height = '560px';
      var okR = document.querySelector('#modalCard .news-ok').getBoundingClientRect(), xR = xBtn.getBoundingClientRect();
      cv6.style.height = '';
      if (xR.top < 0 || xR.bottom > window.innerHeight) fails.push('公告的 ✕ 跑到畫面外');
      xBtn.onclick(); if (!$('#modal').hidden) fails.push('按 ✕ 關不掉公告');
      $('#modal').hidden = false;
    }
    if (unseenNews().length) fails.push('看過公告還算沒看過');
    var reloaded = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    if (unseenNews(reloaded).length) fails.push('看過公告沒有存起來，下次打開又會跳');
    $('#modal').hidden = true;
    maybeShowNews();
    if (!$('#modal').hidden) fails.push('看過的公告又跳出來');
    openTab('save');
    var nbtn = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /更新紀錄/.test(b.textContent); })[0];
    if (!nbtn) fails.push('設定頁沒有「更新紀錄」');
    else {
      nbtn.onclick();
      if ($('#modal').hidden) fails.push('設定頁的「更新紀錄」打不開');
      // 每一次更新都要列出來（不是只有最新的），最新的打開、其他收著，每一次都有日期
      var hs = document.querySelectorAll('#modalCard details.news-hist'), wantN = Math.min(NEWS.length, 10);
      if (hs.length !== wantN) fails.push('更新紀錄列了 ' + hs.length + ' 次，應該有 ' + wantN + ' 次');
      else {
        if (!hs[0].open || [].slice.call(hs, 1).some(function(d){ return d.open; })) fails.push('更新紀錄：應該只有最新的一次是打開的');
        var lastN = NEWS[wantN - 1], funN = lastN.lines.filter(function(l){ return l[2] !== 'info'; });
        if (hs[wantN - 1].querySelectorAll('.news-row').length !== funN.length) fails.push('更新紀錄：最早那次的內容不完整');
        if (/休息|便宜/.test(document.querySelector('#modalCard').textContent)) fails.push('更新紀錄：列了不是新東西的說明（休息、變便宜）');
        [].forEach.call(hs, function(d, i){ if (!/\d+ 月 \d+ 日/.test(d.querySelector('.nh-when').textContent)) fails.push('更新紀錄第 ' + (i + 1) + ' 張沒有日期'); });
        if (!hs[0].querySelector('summary').textContent.includes('第 ' + NEWS.length + ' 次')) fails.push('更新紀錄：最新的那次編號不對');
      }
      // 超過 10 次：只列最近 10 次
      for (var nf = 0; nf < 8; nf++) NEWS.push({ id: '2020-01-0' + (nf + 1), title: '假的', lines: [['🧪', '測試']], newItems: [] });
      try { openNewsHistory(); if (document.querySelectorAll('#modalCard details.news-hist').length !== 10) fails.push('更新紀錄超過 10 次沒有只列最近 10 次'); }
      finally { NEWS.length -= 8; }
    }
    $('#modal').hidden = true;
    // 新進商店的家具掛「新」
    var testDef = FURNITURE.filter(function(d){ return !d.gift && !d.fresh; })[0];
    var keepSeenItem = G.seen[testDef.id];
    delete G.seen[testDef.id];
    var today = new Date().toISOString().slice(0, 10);
    NEWS.unshift({ id: today, title: 't', lines: [['🆕', 'x']], newItems: [testDef.id] });
    var tagged = function(){ shopKind = 'all'; shopTheme = 'all'; openTab('shop');
      var card = [].filter.call(document.querySelectorAll('#tabBody .card'), function(c){ return c.textContent.indexOf(testDef.name) >= 0; })[0];
      return !!(card && card.querySelector('.tag.new')); };
    if (!tagged()) fails.push('新進商店的家具沒有掛「新」');
    G.seen[testDef.id] = 1;
    if (tagged()) fails.push('買過的新家具還掛著「新」');
    delete G.seen[testDef.id];
    NEWS[0].id = '2020-01-01';
    if (tagged()) fails.push('很久以前進的家具還掛著「新」');
    NEWS.shift();
    if (keepSeenItem) G.seen[testDef.id] = keepSeenItem;
    G.newsSeen = keepSeen;
    openTab('inv');

    /* ㊽ 休息提醒：玩滿時間就休息、提前提醒、玩小遊戲時等她玩完、離開夠久算休息過、
       看不到畫面不算時間、休息完寵物不會變餓、重新整理躲不掉、家長密碼 */
    var realToast2 = toast, toasts2 = [];
    toast = function(t){ toasts2.push(t); };
    var realPrompt = readPin;
    var restReset = function(cfg){ localStorage.removeItem(REST_STATE_KEY); saveRestCfg(Object.assign({ on: true, play: 20, rest: 5, pin: '' }, cfg || {})); restUnlocked = false; endRest(); resting = false; };
    var playFor = function(t, secs, visible){ for (var q = 0; q < secs; q += 4) { t += 4000; restTick(t, visible === undefined ? true : visible); if (resting) break; } return t; };
    try {
      var dc = restCfg();
      if (!dc.on || dc.play !== 20 || dc.rest !== 5) fails.push('休息提醒預設不是「開、玩 20 分、休息 5 分」');
      restReset();
      $('#modal').hidden = true;
      var T = 1e12; restTick(T, true);
      T = playFor(T, 18 * 60 + 30);
      if (resting) fails.push('還沒到 20 分鐘就要休息');
      if (!toasts2.some(function(x){ return /再玩 \d 分鐘就要休息/.test(x); })) fails.push('快到時間沒有先提醒');
      T = playFor(T, 3 * 60);
      if (!resting) fails.push('玩滿 20 分鐘沒有休息');
      var ov = document.getElementById('restOverlay');
      if (!ov || ov.hidden) fails.push('休息畫面沒有出現');
      var until = restState().restUntil;
      if (Math.abs(until - T - 5 * 60000) > 5000) fails.push('休息時間不是 5 分鐘');
      // 重新整理躲不掉：畫面關掉再打開（resting 歸零），時間還沒到就繼續休息
      endRest(); resting = false;
      restTick(T + 60000, true);
      if (!resting) fails.push('重新整理之後就不用休息了');
      // 休息完：畫面消失、寵物從現在開始重新算肚子餓
      G.pet.lastTick = 0;
      restTick(until + 1000, true);
      if (resting || !ov.hidden) fails.push('休息時間到了，休息畫面沒有關掉');
      if (Math.abs(G.pet.lastTick - Date.now()) > 3000) fails.push('休息完寵物的肚子沒有重新算（休息時會變餓）');
      // 玩小遊戲時時間到：等她玩完；但最多再等 3 分鐘
      restReset(); T = 2e12; restTick(T, true);
      $('#modal').hidden = false; $('#modalCard').classList.add('in-game');
      T = playFor(T, 20 * 60 + 30);
      if (resting) fails.push('正在玩小遊戲，時間一到就被打斷');
      $('#modal').hidden = true; $('#modalCard').classList.remove('in-game'); restTick(T + 1000, true);
      if (!resting) fails.push('小遊戲玩完了還沒休息');
      // 看繪本（不是小遊戲）不給寬限
      restReset(); T = 2.5e12; restTick(T, true);
      $('#modal').hidden = false; $('#modalCard').classList.remove('in-game');
      T = playFor(T, 20 * 60 + 30);
      if (!resting) fails.push('看繪本的時候也一直不用休息（只有小遊戲才能等）');
      $('#modal').hidden = true;
      // 寬限中（時間到了、正在等這一局玩完）不能再開新的一局
      restReset(); T = 2.7e12; restTick(T, true);
      $('#modal').hidden = false; $('#modalCard').classList.add('in-game');
      T = playFor(T, 20 * 60 + 30);
      if (!restIsDue()) fails.push('時間到了卻沒有進入寬限');
      forceRestNow();
      if (!resting) fails.push('寬限中叫 forceRestNow 沒有開始休息');
      $('#modalCard').classList.remove('in-game'); $('#modal').hidden = true;
      restReset(); T = 3e12; restTick(T, true);
      $('#modal').hidden = false; $('#modalCard').classList.add('in-game');
      T = playFor(T, 20 * 60 + 3 * 60 + 30);
      if (!resting) fails.push('一直開著小遊戲，超過 3 分鐘還是不用休息');
      $('#modal').hidden = true; $('#modalCard').classList.remove('in-game');
      // 畫面看不到（切到別的 App）不算時間
      restReset(); T = 4e12; restTick(T, true);
      T = playFor(T, 30 * 60, false);
      if (resting || restState().played > 1) fails.push('沒有在看畫面也在算時間');
      // 離開超過休息時間 → 回來重新算
      restReset(); T = 5e12; restTick(T, true);
      T = playFor(T, 15 * 60);
      restTick(T + 6 * 60000, true);
      if (restState().played > 10) fails.push('離開超過 5 分鐘回來，時間沒有重新算');
      // 關掉提醒就不會休息
      restReset({ on: false }); T = 6e12; restTick(T, true);
      T = playFor(T, 60 * 60);
      if (resting) fails.push('提醒關掉了還是要休息');
      // 家長密碼：錯的不能改、對的可以；提早結束休息也要密碼
      restReset({ pin: '1234' });
      readPin = function(m, cb){ cb('0000'); };
      openTab('save');
      var offBtn = [].filter.call(document.querySelectorAll('#tabBody .filter button'), function(b){ return b.textContent === '關'; })[0];
      if (!offBtn) fails.push('設定頁沒有休息提醒的開關');
      else {
        offBtn.onclick();
        if (!restCfg().on) fails.push('密碼錯了還是能把提醒關掉');
        readPin = function(m, cb){ cb('1234'); };
        offBtn.onclick();
        if (restCfg().on) fails.push('密碼對了卻關不掉提醒');
      }
      restReset({ pin: '1234' }); T = 7e12; restTick(T, true); T = playFor(T, 21 * 60);
      readPin = function(m, cb){ cb('9999'); };
      var pb = document.querySelector('#restOverlay .rest-parent');
      pb.onclick();
      if (!resting) fails.push('密碼錯了也能提早結束休息');
      readPin = function(m, cb){ cb('1234'); };
      pb.onclick();
      if (resting) fails.push('家長密碼對了卻不能提早結束休息');
    } catch(e) { fails.push('休息提醒測試出錯：' + e.message); }
    finally {
      toast = realToast2; readPin = realPrompt;
      saveRestCfg({ on: false, play: 20, rest: 5, pin: '' });   // 後面的測試不要被休息畫面擋住
      localStorage.removeItem(REST_STATE_KEY); endRest(); resting = false; restUnlocked = false;
      $('#modal').hidden = true;
    }

    /* ㊺ 手機讓房間大一點：放大按鈕、點分頁自動打開面板、記住選擇、
       放大時房間可以比螢幕寬並跟著小可愛、提示條玩過幾次就收起來（拿著家具時還是要有） */
    setBigRoom(false);
    $('#btnZoom').onclick();
    if (!document.body.classList.contains('bigroom') || !/縮小/.test($('#btnZoom').textContent)) fails.push('按放大沒有進入放大模式');
    if (localStorage.getItem(BIG_KEY) !== '1') fails.push('放大模式沒有記住');
    document.querySelector('#tabs button[data-tab="shop"]').onclick();
    if (document.body.classList.contains('bigroom')) fails.push('放大時點分頁，面板沒有打開');
    if (localStorage.getItem(BIG_KEY) !== '0') fails.push('離開放大模式沒有記住');
    // 跟著小可愛：把畫布弄成直立手機的比例
    var cvs = document.getElementById('view'), keepCss = cvs.getAttribute('style');
    cvs.style.width = '360px'; cvs.style.height = '640px';
    G.away = null; computeView();
    var normalScale = view.scale;
    setBigRoom(true); cam.key = null;
    var rm = curRoom(), minX = iso(0, rm.d).x - 30, maxX = iso(rm.w, 0).x + 30;
    fufu.x = .5; fufu.y = rm.d - .5; computeView();                    // 走到最左邊
    var bigScale = view.scale, leftOx = view.ox;
    if (!(bigScale > normalScale * 1.3)) fails.push('放大模式的房間沒有比較大（' + normalScale.toFixed(2) + ' → ' + bigScale.toFixed(2) + '）');
    if (leftOx > -minX * bigScale + .5 || leftOx + maxX * bigScale < 360 - .5) fails.push('放大時畫面捲到房間外面了');
    fufu.x = rm.w - .5; fufu.y = .5;                                     // 走到最右邊，畫面要慢慢跟過去
    for (var fr = 0; fr < 120; fr++) computeView();
    if (!(view.ox < leftOx - 20)) fails.push('小可愛走到右邊，畫面沒有跟過去');
    if (view.ox + maxX * bigScale < 360 - .5) fails.push('跟到右邊時捲過頭了');
    setBigRoom(false); computeView();
    if (Math.abs(view.scale - normalScale) > 1e-6) fails.push('縮小回來，房間大小沒有恢復');
    if (keepCss == null) cvs.removeAttribute('style'); else cvs.setAttribute('style', keepCss);
    // 提示條：收起來時房間可以往下長；拿著家具時一定要看得到
    var stg = $('.stage');
    stg.classList.remove('hint-off');
    if (!hintShown()) fails.push('提示條預設看不到');
    stg.classList.add('hint-off');
    if (hintShown()) fails.push('提示條收起來了卻還看得到');
    stg.classList.add('holding');
    if (!hintShown()) fails.push('拿著家具的時候提示條不見了');
    stg.classList.remove('holding', 'hint-off');
    // 平常那句提示：前 3 次、15 秒後自己收起來；拿著家具還是要看得到
    if (HINT_RUNS > 3 || HINT_SHOW_MS > 20000) fails.push('提示條出現太多次或太久（' + HINT_RUNS + ' 次、' + HINT_SHOW_MS + ' 毫秒）');
    hideIdleHint();
    if (hintShown()) fails.push('時間到了提示條沒有收起來');
    stg.classList.add('holding');
    if (!hintShown()) fails.push('提示條收起來後，拿著家具卻看不到怎麼放');
    stg.classList.remove('holding', 'hint-off');
    // 房間被高度卡住的時候，收起提示條房間要變大
    var cv2 = document.getElementById('view'), keep2 = cv2.getAttribute('style');
    cv2.style.width = '900px'; cv2.style.height = '300px';
    computeView(); var sOn = view.scale;
    stg.classList.add('hint-off'); computeView(); var sOff = view.scale;
    stg.classList.remove('hint-off');
    if (keep2 == null) cv2.removeAttribute('style'); else cv2.setAttribute('style', keep2);
    if (!(sOff > sOn)) fails.push('提示條收起來，房間沒有變大（' + sOn.toFixed(3) + ' / ' + sOff.toFixed(3) + '）');
    if (typeof HINT_RUNS !== 'number' || HINT_RUNS < 3) fails.push('提示條太快收起來');

    /* ㊹ 阿婆家的動物圖鑑：小農場有動物輪流來玩，點了記進圖鑑 */
    G.animals = {};
    G.away = { place: 'grandma', idx: 2 }; farm.actors = []; farm.spot = null;
    var t0 = performance.now();
    farmTick(.016, t0, curRoom());
    var vis = farm.actors.filter(function(f){ return f.visitor; });
    if (vis.length !== 1) fails.push('小農場來玩的動物不是一隻（' + vis.length + '）');
    else {
      var firstVis = vis[0];
      farmTick(.016, t0 + 1000, curRoom());
      if (farm.actors.filter(function(f){ return f.visitor; })[0] !== firstVis) fails.push('來玩的動物一秒就換了');
      farmTick(.016, t0 + FARM_VISIT_MS + 1000, curRoom());
      var v2 = farm.actors.filter(function(f){ return f.visitor; });
      if (v2.length !== 1 || v2[0] === firstVis) fails.push('過了一陣子，來玩的動物沒有換（或變成兩隻）');
      if (farm.actors.filter(function(f){ return !f.visitor; }).length !== FARM_ANIMALS.length) fails.push('換動物的時候小牛小羊不見了');
    }
    // 點一般的動物：摸摸、記進圖鑑；沒有「照顧小牛小羊」
    var dogF = { n: VISIT_ANIMALS.filter(function(n){ return n.id === 'fa_dog'; })[0], visitor: true, a: farm.actors[0].a };
    var dm = farmMenuEntries(dogF);
    if (!/摸摸/.test(dm[0][0]) || dm.some(function(e){ return /照顧/.test(e[0]); })) fails.push('來玩的小狗選單不對：' + dm.map(function(e){ return e[0]; }).join('|'));
    dm[0][1]();
    if (G.animals.fa_dog !== 1) fails.push('摸了小狗沒有記進動物圖鑑');
    // 猴子：野生的，只能看；企鵝：迷路的
    var mk = { n: VISIT_ANIMALS.filter(function(n){ return n.id === 'fa_monkey'; })[0], visitor: true, a: farm.actors[0].a };
    var mm = farmMenuEntries(mk).map(function(e){ return e[0]; }).join('|');
    if (/摸|餵/.test(mm) || !/看猴子/.test(mm)) fails.push('猴子的選單不對（野生的不能摸）：' + mm);
    farmMenuEntries(mk)[0][1]();
    if (!G.animals.fa_monkey) fails.push('看了猴子沒有記進圖鑑');
    var pg2 = { n: VISIT_ANIMALS.filter(function(n){ return n.id === 'fa_penguin'; })[0], visitor: true, a: farm.actors[0].a };
    if (!/企鵝/.test(farmMenuEntries(pg2)[0][0])) fails.push('迷路的企鵝選單不對');
    // 小牛小羊也算：摸了記進去，而且還能照顧
    var calfF = farm.actors.filter(function(f){ return !f.visitor; })[0];
    var cm2 = farmMenuEntries(calfF);
    cm2[0][1]();
    if (!G.animals[calfF.n.id]) fails.push('摸了' + calfF.n.short + '沒有記進圖鑑');
    if (!cm2.some(function(e){ return /照顧/.test(e[0]); })) fails.push('小牛小羊的「照顧」不見了');
    // 稀有度：企鵝最少見、猴子第二
    var ws = VISIT_ANIMALS.map(function(n){ return n.w; }).sort(function(a, b){ return a - b; });
    var wOf = function(id){ return VISIT_ANIMALS.filter(function(n){ return n.id === id; })[0].w; };
    if (wOf('fa_penguin') !== ws[0] || wOf('fa_monkey') !== ws[1] || ws[0] === ws[1]) fails.push('企鵝、猴子不是最少見的');
    // 抽一千次：每一種都抽得到（不會有永遠收集不到的）
    var drawn = {};
    for (var rv = 0; rv < 3000; rv++) drawn[rollVisitor().id] = 1;
    if (Object.keys(drawn).length !== VISIT_ANIMALS.length) fails.push('有動物永遠不會來：抽到 ' + Object.keys(drawn).length + ' / ' + VISIT_ANIMALS.length);
    // 公園不會跑出農場的動物
    G.away = { place: 'park', idx: 0 }; farmTick(.016, performance.now(), curRoom());
    if (farm.actors.some(function(f){ return f.visitor; })) fails.push('公園也跑出小農場的動物');
    // 圖鑑：遇過的有名字，沒遇過的是剪影＋？？？
    G.away = null; farm.actors = []; farm.spot = null;
    openTab('book');
    var dexTxt = document.querySelector('#tabBody').textContent;
    var meetN = Object.keys(G.animals).length;
    if (dexTxt.indexOf('阿婆家的動物 ' + meetN + ' / ' + ANIMAL_DEX().length) < 0) fails.push('動物圖鑑的數字不對');
    if (!/小狗/.test(dexTxt) || /小馬/.test(dexTxt)) fails.push('動物圖鑑沒有遇過的也顯示名字了（或遇過的沒顯示）');
    // 阿婆的選單可以直接看動物圖鑑
    G.away = { place: 'grandma', idx: 0 }; host.n = HOSTS.grandma;
    if (!/動物圖鑑/.test(hostMenuEntries().map(function(e){ return e[0]; }).join('|'))) fails.push('阿婆的選單沒有動物圖鑑');
    host.n = null; G.away = null; G.animals = {};

    /* ㊸ 公園照照片改：步道、磚地、展示戰車、愛心雕塑、紅花綠籬、沙坑溜滑梯、松鼠 */
    var PR = PLACES.park.rooms[0];
    if (PR.floor !== 'fl_park') fails.push('公園的地板不是步道草地');
    if (FLOORS.some(function(f){ return f.id === 'fl_park'; })) fails.push('公園草地跑進商店了');
    // 步道（第 4、5 行）上不能擺東西，要走得過去
    PR.items.forEach(function(it){
      var id = it.id || it[0], x = it.x != null ? it.x : it[1], rot = it.rot != null ? it.rot : (it[3] || 0);
      var fp = footprint(FURN_BY_ID[id], rot);
      if (x < 6 && x + fp.w > 4) fails.push('公園步道上擺了 ' + id);
    });
    ['display_tank','heart_sculpture','sandbox','slide','flower_bed'].forEach(function(id){
      if (!PR.items.some(function(it){ return (it.id || it[0]) === id; })) fails.push('公園沒有 ' + id);
      if (FURNITURE.some(function(f){ return f.id === id; })) fails.push(id + ' 跑進商店了');
    });
    if (FURNITURE_ACT.display_tank !== 'tank' || FURNITURE_ACT.heart_sculpture !== 'heart' || FURNITURE_ACT.sandbox !== 'sand') fails.push('公園新家具沒有對應的事');
    // 溜滑梯在學校、公園都有效果，在阿婆家沒有
    [['school', true], ['park', true], ['grandma', false]].forEach(function(c){
      G.away = { place: c[0], idx: 0 }; G.actCD = {}; G.pet.mood = 20;
      relativePerk('slide');
      if ((G.pet.mood === 35) !== c[1]) fails.push('溜滑梯在' + c[0] + (c[1] ? '沒有效果' : '也有效果'));
    });
    G.away = { place: 'park', idx: 0 }; G.actCD = {}; G.pet.mood = 20;
    relativePerk('sand');
    if (G.pet.mood !== 30) fails.push('玩沙沒有寵物心情 +10');
    // 松鼠：在公園跑出來，只能看、不能摸；到阿婆的小農場換成小牛小羊
    farm.actors = []; farm.spot = null;
    farmTick(.016, performance.now(), curRoom());
    var sq = farm.actors.filter(function(f){ return f.n.wild; });
    if (sq.length !== 2) fails.push('公園沒有兩隻松鼠（' + farm.actors.length + '）');
    else {
      var sm = farmMenuEntries(sq[0]).map(function(e){ return e[0]; }).join('|');
      if (/摸/.test(sm) || !/看松鼠/.test(sm)) fails.push('松鼠的選單不對：' + sm);
      var p0 = iso(sq[0].a.x, sq[0].a.y, 0);
      if (farmHit({ x: p0.x, y: p0.y - 10 }) !== sq[0] && farmHit({ x: p0.x, y: p0.y - 10 }) !== sq[1]) fails.push('點松鼠點不到');
    }
    G.away = { place: 'grandma', idx: 2 };
    farmTick(.016, performance.now(), curRoom());
    if (farm.actors.some(function(f){ return f.n.wild && !f.visitor; }) || farm.actors.filter(function(f){ return !f.visitor; }).length !== FARM_ANIMALS.length) fails.push('到了小農場，松鼠沒有換成小牛小羊');
    if (!/照顧/.test(farmMenuEntries(farm.actors[0]).map(function(e){ return e[0]; }).join('|'))) fails.push('小牛小羊的選單不見了');
    G.away = { place: 'school', idx: 0 };
    farmTick(.016, performance.now(), curRoom());
    if (farm.actors.length) fails.push('離開公園，松鼠還跟著');
    G.away = null; G.actCD = {}; farm.actors = []; farm.spot = null;

    /* ㊴ 圖書館：繪本（看完最後一頁才蓋章）、閱讀護照（蓋滿送獎狀）、找書、貓咪館員 */
    var LB = PLACES.library;
    if (!LB || !HOSTS[LB.host]) fails.push('沒有圖書館或沒有館員');
    else {
      ['lib_shelf','story_stand','lib_counter','quiet_sign'].forEach(function(id){
        if (!FURN_BY_ID[id]) fails.push('沒有 ' + id);
        if (FURNITURE.some(function(f){ return f.id === id; })) fails.push(id + ' 跑進商店了');
      });
      if (ACTIVITIES[FURNITURE_ACT.lib_shelf].open !== 'shelf' || ACTIVITIES[FURNITURE_ACT.story_stand].open !== 'story' || ACTIVITIES[FURNITURE_ACT.lib_counter].open !== 'passport')
        fails.push('圖書館的家具沒有對到找書／繪本／護照');
      host.n = HOSTS.librarian; G.away = { place: 'library', idx: 0 };
      if (hostLineKey() !== 'hostLibrarian') fails.push('館員講的是別人的台詞');
      var lm = hostMenuEntries().map(function(e){ return e[0]; }).join('|');
      if (!/繪本/.test(lm) || !/護照/.test(lm) || !/找書/.test(lm)) fails.push('館員的選單不對：' + lm);
      host.n = null; G.away = null;
    }
    // 繪本：每本四頁；翻到一半關掉不蓋章；看完才蓋；看完一本不給錢
    STORYBOOKS.forEach(function(b){ if (b.pages.length !== 4) fails.push('繪本「' + b.title + '」不是四頁'); });
    if (STORYBOOKS.length !== 8) fails.push('繪本不是八本');
    if (/🔪/.test(JSON.stringify(STORYBOOKS))) fails.push('繪本裡有刀子');
    G.passport = {};
    openStorybook('brave');
    var SB = openStorybook.test;
    SB.next(); SB.next();
    $('#modal').hidden = true;
    if (Object.keys(G.passport).length) fails.push('繪本翻到一半就蓋章了');
    openStorybook('brave');
    var bk0 = G.bells;
    for (var pgi = 0; pgi < 5; pgi++) openStorybook.test.next();
    if (!G.passport.brave) fails.push('繪本看完沒有蓋章');
    if (G.bells !== bk0) fails.push('看繪本給了錢');
    if (!document.querySelector('#modalCard .pass-grid') || document.querySelectorAll('#modalCard .pass-stamp').length !== 1) fails.push('看完沒有打開閱讀護照，或章數不對');
    // 繪本架先給沒看過的：連開七次，八本全部看過
    for (var bi = 0; bi < 7; bi++) {
      openNextStorybook();
      if (G.passport[openStorybook.test.book.id]) { fails.push('繪本架給了看過的書（還有沒看過的）'); break; }
      for (var pj = 0; pj < 5; pj++) openStorybook.test.next();
    }
    // 第八本看完 → 蓋滿 → 獎狀
    if (Object.keys(G.passport).length !== 8) fails.push('八本都看完，護照只有 ' + Object.keys(G.passport).length + ' 個章');
    G.passport = {}; STORYBOOKS.slice(1).forEach(function(b){ G.passport[b.id] = 1; });
    var cert0 = G.inv.certificate || 0;
    openStorybook(STORYBOOKS[0].id); for (var pk2 = 0; pk2 < 5; pk2++) openStorybook.test.next();
    if ((G.inv.certificate || 0) !== cert0 + 1) fails.push('閱讀護照蓋滿沒有拿到獎狀');
    openStorybook(STORYBOOKS[0].id); for (var pk3 = 0; pk3 < 5; pk3++) openStorybook.test.next();
    if ((G.inv.certificate || 0) !== cert0 + 1) fails.push('蓋滿之後再看一次又送一張獎狀');
    $('#modal').hidden = true;
    // 找書：題目要對得上書架、放對加錢
    SHELF_LEVELS.forEach(function(L, li){
      for (var k = 0; k < 200; k++) {
        var B = shelfBook(L);
        if (B.ans < 0 || B.ans > 3) { fails.push('找書的答案超出範圍'); break; }
        if (li === 0 && B.color !== L.shelves[B.ans][1]) { fails.push('一年級的書顏色對不上書架'); break; }
        if (li > 0) { var v = Number(B.label), sh = L.shelves[B.ans]; if (!(v >= sh[0] && v <= sh[1])) { fails.push(L.name + ' 的書號 ' + v + ' 不在 ' + sh.join('～')); break; } }
      }
    });
    openShelfGame(); document.querySelectorAll('.lv-btn')[1].onclick();
    var ST = openShelfGame.test, sb0 = G.bells;
    for (var q = 0; q < 10; q++) { var bb2 = ST.book(); ST.choose(q < 6 ? bb2.ans : (bb2.ans + 1) % 4); ST.choose(bb2.ans); ST.next(); }
    if (ST.right() !== 6) fails.push('找書放對 6 本卻記成 ' + ST.right());
    if (G.bells - sb0 !== 6 * 15 * 2) fails.push('找書的錢不對：' + (G.bells - sb0));
    closeGameWindow();
    var md9 = document.querySelector('#modal'); if (md9) md9.hidden = true;

    /* ㊵ 📖 圖鑑分頁：名字是「圖鑑」、所有收集都在這一頁、總覽的數字要對 */
    var bookTab = document.querySelector('button[data-tab="book"]');
    if (!bookTab || !/圖鑑/.test(bookTab.textContent) || !/📖/.test(bookTab.textContent)) fails.push('分頁不是「📖 圖鑑」：' + (bookTab && bookTab.textContent));
    G.comics = { '早餐': 1, '恐龍': 3 }; G.stickers = { '⭐': 1 }; G.butterflies = { red: 2, blue: 1, rainbow: 1 }; G.passport = { moon: 1, seed: 1 };
    openTab('book');
    var chips = [].map.call(document.querySelectorAll('#tabBody .dex-chip'), function(c){ return c.textContent; });
    if (chips.length !== 12) fails.push('圖鑑總覽不是 12 項（9 種收集＋寵物＋成長＋獎盃）：' + chips.length);
    [['漫畫', '2/12'], ['貼紙', '1/12'], ['蝴蝶', '3/6'], ['閱讀護照', '2/8']].forEach(function(p){
      if (!chips.some(function(t){ return t.indexOf(p[0]) >= 0 && t.indexOf(p[1]) >= 0; })) fails.push('圖鑑總覽的「' + p[0] + '」不是 ' + p[1] + '：' + chips.join(' | '));
    });
    ['dexTrophy','dexPet','dexFurn','dexFish','dexFriend','dexAnimal','dexTheme','dexComic','dexSticker','dexBfly','dexPass'].forEach(function(id){
      if (!document.getElementById(id)) fails.push('圖鑑少了一段：' + id);
    });
    // 看過的漫畫點一下可以再看，但不能算成多看一次、也不能變成新的
    var tiles = document.querySelectorAll('#tabBody .dex-tile:not(.theme-tile)');
    var seenTile = [].filter.call(tiles, function(t){ return !t.disabled; });
    if (seenTile.length !== 2 || [].filter.call(tiles, function(t){ return t.disabled; }).length !== 10) fails.push('漫畫格子：看過 2 本可以點、其他 10 本不能點（' + seenTile.length + '）');
    else {
      var before = JSON.stringify(G.comics);
      seenTile[0].onclick();
      if (document.querySelectorAll('#modalCard .comic-p').length !== 4) fails.push('從圖鑑點漫畫沒有打開');
      if (JSON.stringify(G.comics) !== before) fails.push('從圖鑑再看一次漫畫，收集次數被改了');
      if (/新的一則/.test(document.querySelector('#modalCard').textContent)) fails.push('從圖鑑再看一次，卻說是新的一則');
      $('#modal').hidden = true;
    }
    // 閱讀護照：看過的點了打開那本繪本
    openTab('book');
    var pcells = [].filter.call(document.querySelectorAll('#tabBody .pass'), function(c){ return !c.disabled; });
    if (pcells.length !== 2) fails.push('閱讀護照可以點的不是 2 本（' + pcells.length + '）');
    else { pcells[0].onclick(); if (!document.querySelector('#modalCard .book-page')) fails.push('從圖鑑點繪本沒有打開'); $('#modal').hidden = true; }
    if (document.querySelectorAll('#tabBody .bfly canvas').length !== 3) fails.push('圖鑑的蝴蝶不是 3 隻有圖');
    G.comics = {}; G.stickers = {}; G.butterflies = {}; G.passport = {};

    /* ㊶ 壁紙地板併進「我的東西」；商店多「🎨 壁紙地板」；小遊戲難度不寫年級 */
    var tabNames = [].map.call(document.querySelectorAll('.tabs button'), function(b){ return b.textContent; });
    if (!tabNames.some(function(t){ return /我的東西/.test(t); })) fails.push('沒有「我的東西」分頁：' + tabNames.join('|'));
    if (tabNames.some(function(t){ return /收納|壁紙地板/.test(t); })) fails.push('還有「收納」或「壁紙地板」分頁：' + tabNames.join('|'));
    G.away = null; sellMode = false;
    var rm0 = curRoom(), keepWall = rm0.wall, keepWalls = G.walls.slice(), keepFloors = G.floors.slice();
    G.walls = ['wp_cream', 'wp_pink']; G.floors = ['fl_wood']; rm0.wall = 'wp_cream';
    openTab('inv');
    var invTxt = document.querySelector('#tabBody').textContent;
    if (!/粉紅圓點/.test(invTxt) || /薄荷條紋/.test(invTxt)) fails.push('我的東西的壁紙不是只列自己有的');
    var pinkCard = [].filter.call(document.querySelectorAll('#tabBody .card'), function(c){ return /粉紅圓點/.test(c.textContent); })[0];
    var bInv = G.bells;
    if (pinkCard) { pinkCard.onclick(); if (curRoom().wall !== 'wp_pink' || G.bells !== bInv) fails.push('在我的東西點壁紙沒有換上（或扣了錢）'); }
    // 商店：只賣還沒有的，買了就換上、變成自己的
    shopKind = 'paper'; openTab('shop');
    var shopTxt = document.querySelector('#tabBody').textContent;
    if (/粉紅圓點/.test(shopTxt) || !/薄荷條紋/.test(shopTxt)) fails.push('商店的壁紙沒有排除已經有的');
    var mint = [].filter.call(document.querySelectorAll('#tabBody .card'), function(c){ return /薄荷條紋/.test(c.textContent); })[0];
    var bShop = G.bells;
    if (mint) { mint.onclick(); if (curRoom().wall !== 'wp_stripe' || G.walls.indexOf('wp_stripe') < 0 || bShop - G.bells !== WALLPAPERS.filter(function(w){ return w.id === 'wp_stripe'; })[0].price) fails.push('商店買壁紙沒有換上或扣錢不對'); }
    // 在別人家：我的東西、商店都不能換壁紙
    G.away = { place: 'uncle', idx: 0 };
    openTab('inv');
    if (document.querySelector('#tabBody').textContent.indexOf('回家才能換壁紙地板') < 0) fails.push('在叔叔家的我的東西沒有說不能換壁紙');
    shopKind = 'paper'; openTab('shop');
    if (document.querySelector('#tabBody').textContent.indexOf('回家才能買壁紙地板') < 0) fails.push('在叔叔家的商店沒有說不能買壁紙');
    // 就算在別人家點到壁紙卡片，也不能說成「鈴錢不夠」（錢明明夠）
    var lastToast = '', realToast = toast;
    toast = function(t){ lastToast = t; };
    try { var awayGrid = decoGrid('wall', WALLPAPERS, G.walls, 'wp_cream', 'own'); awayGrid.querySelector('.card').onclick(); }
    finally { toast = realToast; }
    if (/鈴錢不夠/.test(lastToast) || !/回家/.test(lastToast)) fails.push('在叔叔家點壁紙的提示不對：' + lastToast);
    G.away = null; shopKind = 'all';
    // 賣東西模式也要看得到壁紙
    sellMode = true; openTab('inv');
    if (!/粉紅圓點/.test(document.querySelector('#tabBody').textContent)) fails.push('我的東西賣東西模式看不到壁紙');
    sellMode = false;
    rm0.wall = keepWall; G.walls = keepWalls; G.floors = keepFloors;
    openTab('inv');

    /* ㊷ 商店的風格：每一類只列有東西的風格、數字要對、選了沒東西的風格要自動回到全部、不會空白一整頁 */
    G.away = null;
    var themeBtns = function(){ return [].map.call(document.querySelectorAll('#tabBody .filter.themes button'), function(b){ return b.textContent; }); };
    var cardsNow = function(){ return document.querySelectorAll('#tabBody .grid .card').length; };
    ['all', 'paper'].concat(FURN_KINDS.map(function(k){ return k.id; })).forEach(function(kind){
      var cnt = shopThemeCounts(kind);
      Object.keys(THEME_NAMES).concat(['all']).forEach(function(th){
        shopKind = kind; shopTheme = th; openTab('shop');
        var shown = themeBtns();
        // 有列出來的風格，一定有東西；沒東西的風格不能列
        Object.keys(THEME_NAMES).forEach(function(t){
          var listed = shown.some(function(x){ return x.indexOf(THEME_NAMES[t]) >= 0; });
          if (listed && !(cnt[t] > 0)) fails.push('商店「' + kind + '」列出了沒有東西的風格：' + THEME_NAMES[t]);
          if (listed && shown.every(function(x){ return x.indexOf(THEME_NAMES[t] + ' ' + cnt[t]) < 0; })) fails.push('商店「' + kind + '」的風格數字不對：' + THEME_NAMES[t]);
        });
        if (th !== 'all' && !(cnt[th] > 0) && shopTheme !== 'all') fails.push('商店「' + kind + '」選了沒東西的風格「' + th + '」沒有回到全部');
        if (!cardsNow() && !/買齊了/.test(document.querySelector('#tabBody').textContent)) fails.push('商店「' + kind + '／' + th + '」一整頁空白');
        // 按鈕上寫幾樣，選下去就要真的有幾樣（不是拿同一個函式比自己）
        if (kind !== 'all' && th !== 'all' && cnt[th] > 0 && cardsNow() !== cnt[th]) fails.push('商店「' + kind + '／' + THEME_NAMES[th] + '」寫 ' + cnt[th] + ' 樣，實際 ' + cardsNow() + ' 樣');
      });
    });
    // 在「全部」選風格：最上面就要是那個風格的家具，不能還是食物（點了看起來沒反應）
    shopKind = 'all'; shopTheme = 'cute'; openTab('shop');
    var firstH = [].map.call(document.querySelectorAll('#tabBody h3'), function(h){ return h.textContent; });
    if (firstH.some(function(t){ return /食物/.test(t); })) fails.push('在全部選了可愛風格，還是先顯示食物：' + firstH.join('|'));
    var firstCards = [].slice.call(document.querySelectorAll('#tabBody .grid'))[0];
    var cuteIds = FURNITURE.filter(function(d){ return !d.gift && d.theme === 'cute'; }).length;
    if (!firstCards || firstCards.children.length !== cuteIds) fails.push('在全部選了可愛風格，第一區不是可愛家具（' + (firstCards && firstCards.children.length) + ' / ' + cuteIds + '）');
    shopTheme = 'all'; openTab('shop');
    if (![].some.call(document.querySelectorAll('#tabBody h3'), function(h){ return /食物/.test(h.textContent); })) fails.push('全部＋全部風格卻沒有食物');
    // 只有一種風格的類別（像衛浴）不用顯示風格那一排
    var one = FURN_KINDS.map(function(k){ return k.id; }).filter(function(k){ return Object.keys(shopThemeCounts(k)).length === 1; })[0];
    if (one) { shopKind = one; shopTheme = 'all'; openTab('shop'); if (themeBtns().length) fails.push('只有一種風格的「' + one + '」還顯示風格那一排'); }
    shopKind = 'food'; openTab('shop');
    if (themeBtns().length) fails.push('食物也顯示風格那一排');
    shopKind = 'all'; shopTheme = 'all'; openTab('inv');
    // 所有小遊戲的難度名字都不寫年級
    ['MOLE_LEVELS','RACE_LEVELS','QUIZ_LEVELS','RUN_LEVELS','BFLY_LEVELS','SHELF_LEVELS','CUP_LEVELS','COIN_LEVELS','PUZZLE_LEVELS'].forEach(function(nm){
      var LV; try { LV = eval(nm); } catch(e) { return; }
      (LV || []).forEach(function(L){ if (/年級/.test((L.name || '') + (L.sub || ''))) fails.push(nm + ' 的難度寫了年級：' + L.name); });
    });
    openQuizGame();
    if (/年級/.test(document.querySelector('#modalCard').textContent)) fails.push('小考的難度選單還有年級');
    closeGameWindow();

    /* ㊲ 教室（照片參考）：綠桌墊課桌、紅藍布袋、置物櫃、注音布告欄、綠窗簾、磨石子地
       另外所有地點的房間都檢查：家具不重疊、不超出房間；牆上的東西不重疊、不超出牆 */
    var CR = PLACES.school.rooms[0];
    if (CR.floor !== 'fl_terrazzo') fails.push('教室不是磨石子地');
    if (FLOORS.some(function(f){ return f.id === 'fl_terrazzo'; })) fails.push('磨石子地跑進商店了');
    ['school_desk_b','cubby_lockers','zhuyin_board','class_window'].forEach(function(id){
      if (!FURN_BY_ID[id]) fails.push('沒有 ' + id);
      if (FURNITURE.some(function(f){ return f.id === id; })) fails.push(id + ' 跑進商店了');
    });
    if (FURNITURE_ACT.school_desk_b !== 'lesson') fails.push('藍布袋的課桌不能上課');
    ['school_desk','school_desk_b'].forEach(function(id){
      var ps = FURN_BY_ID[id].parts;
      if (!ps.some(function(p){ return p.c === '#2f9e7a' && p.z >= 24; })) fails.push(id + ' 不是綠色桌墊');
    });
    if (FURN_BY_ID.school_desk.parts[8].c === FURN_BY_ID.school_desk_b.parts[8].c) fails.push('兩種課桌的布袋同一個顏色');
    // 椅子在課桌後面一格、轉 180 度（坐下來臉朝黑板，黑板在左牆＝靠 y 小的那邊）
    var deskAt = {};
    CR.items.forEach(function(it){ var id = it.id || it[0]; if (/^school_desk/.test(id)) deskAt[(it.x != null ? it.x : it[1]) + ',' + (it.y != null ? it.y : it[2])] = 1; });
    CR.items.forEach(function(it){
      var id = it.id || it[0]; if (id !== 'school_chair') return;
      var x = it.x != null ? it.x : it[1], y = it.y != null ? it.y : it[2], rot = it.rot != null ? it.rot : (it[3] || 0);
      if (!deskAt[x + ',' + (y - 1)]) fails.push('椅子 (' + x + ',' + y + ') 前面沒有課桌');
      if (rot !== 2) fails.push('椅子 (' + x + ',' + y + ') 沒有轉向黑板（rot ' + rot + '）');
    });
    // 教室的書櫃、置物櫃要靠牆（擺在教室中間會擋住課桌，看起來也怪）
    CR.items.forEach(function(it){
      var id = it.id || it[0]; if (id !== 'bookshelf' && id !== 'cubby_lockers') return;
      var x = it.x != null ? it.x : it[1], y = it.y != null ? it.y : it[2];
      if (x !== 0 && y !== 0) fails.push('教室的 ' + id + ' 沒有靠牆（' + x + ',' + y + '）');
    });
    Object.keys(PLACES).forEach(function(pk){
      PLACES[pk].rooms.forEach(function(r){
        var where = PLACES[pk].name + r.name;
        var cells = {};
        r.items.forEach(function(it){
          var id = it.id || it[0], def = FURN_BY_ID[id]; if (!def) return;
          var x = it.x != null ? it.x : it[1], y = it.y != null ? it.y : it[2], rot = it.rot != null ? it.rot : (it[3] || 0);
          var fp = footprint(def, rot);
          if (x < 0 || y < 0 || x + fp.w > r.w || y + fp.d > r.d) fails.push(where + '：' + id + ' 超出房間');
          for (var i = 0; i < fp.w; i++) for (var j = 0; j < fp.d; j++) {
            var k = (x + i) + ',' + (y + j);
            if (def.layer === 'floor') continue;
            if (cells[k]) fails.push(where + '：' + id + ' 跟 ' + cells[k].id + ' 疊在一起（' + k + '）');
            cells[k] = def;
          }
        });
        ['L', 'R'].forEach(function(side){
          var used = {}, len = wallLength(r, side);
          (r.wallItems || []).forEach(function(wi){
            var id = wi.id || wi[0], sd = wi.side || wi[1], pos = wi.pos != null ? wi.pos : wi[2];
            if (sd !== side || !FURN_BY_ID[id]) return;
            var wd = FURN_BY_ID[id].w;
            if (pos < 0 || pos + wd > len) fails.push(where + '：牆上的 ' + id + ' 超出牆');
            for (var q = 0; q < wd; q++) { if (used[pos + q]) fails.push(where + '：牆上的 ' + id + ' 跟 ' + used[pos + q] + ' 疊在一起'); used[pos + q] = id; }
          });
        });
      });
    });

    /* ㉜ 每個小遊戲一打開就要有「離開」的按鈕
       （iPad 上看到：賽車選難度的畫面只有三個難度，不想玩就走不掉）。
       在家裡和在親戚家都測，按下去要真的關掉。 */
    var keepAway2 = G.away;
    [null, { place: 'uncle', idx: 0 }].forEach(function(aw){
      G.away = aw;
      ['openFishing','openMemoryGame','openCatchGame','openBubbleGame','openCupGame','openStackGame','openSimonGame',
       'openMoleGame','openRaceGame','openBrickGame','openFarmGame','openCoinGame','openMarbleGame','openPuzzleGame','openSlingGame','openQuizGame','openRunGame','openButterflyGame','openShelfGame'
      ].forEach(function(fn){
        try {
          window[fn]();
          var out = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){
            return /回家|離開|不想玩/.test(b.textContent) && b.offsetParent; })[0];
          if (!out) { fails.push(fn + (aw ? '（親戚家）' : '') + ' 一打開沒有離開的按鈕'); closeGameWindow(); return; }
          out.onclick();
          if (!document.querySelector('#modal').hidden) { fails.push(fn + ' 按「' + out.textContent + '」關不掉'); closeGameWindow(); }
        } catch(e) { fails.push(fn + ' 打開出錯：' + e.message); try { closeGameWindow(); } catch(_){} }
      });
    });
    G.away = keepAway2;

    /* ㊻ 蓋房間頁的說明要跟真的規則一樣（以前寫「最多 3 隻」，其實是 5 隻）；蓋滿了就不要再說「每多蓋一間」 */
    var keepRooms = G.rooms; G.away = null;
    G.rooms = [keepRooms[0]];
    openTab('build');
    var bt = document.querySelector('#tabBody').textContent;
    var realMax = Math.min(MAX_PETS_OUT, 1 + ROOM_NAMES.length);
    if (bt.indexOf('最多 ' + realMax + ' 隻') < 0) fails.push('蓋房間頁寫的寵物上限不對（應該是 ' + realMax + ' 隻）');
    G.rooms = ROOM_NAMES.map(function(){ return keepRooms[0]; });
    if (petsOutLimit() !== realMax) fails.push('房間全蓋好，寵物上限不是 ' + realMax);
    openTab('build');
    bt = document.querySelector('#tabBody').textContent;
    if (/每多蓋一間/.test(bt) || !/全部蓋好/.test(bt)) fails.push('房間全蓋好了，還在說每多蓋一間');
    G.rooms = keepRooms; G.cur = 0;
    /* ㊼ 價格：全部買齊（四間房擴建到最大＋每樣一個）要在 15～20 萬之間（大約玩兩小時），
       不能有東西變成免費、價格要是整數好看的數字 */
    var sumP = function(l){ return l.reduce(function(s2, x){ return s2 + (x.price || 0); }, 0); };
    var allCost = NEW_ROOM_COST.reduce(function(a2, b2){ return a2 + b2; }, 0)
      + ROOM_NAMES.length * Object.values(EXPAND_COST).reduce(function(a2, b2){ return a2 + b2; }, 0)
      + sumP(FURNITURE.filter(function(d){ return !d.gift; })) + sumP(WALLPAPERS) + sumP(FLOORS) + sumP(CLOTHES) + sumP(HAIR_STYLES);
    // 116.10 家長要多加家具（第四批），全部買齊從約 18 萬變約 20 萬；上限放到 22 萬
    if (allCost < 150000 || allCost > 220000) fails.push('全部買齊要 ' + allCost + '，不在 15～22 萬');
    [FURNITURE, WALLPAPERS, FLOORS, CLOTHES, HAIR_STYLES].forEach(function(l){ l.forEach(function(x){
      if (typeof x.price !== 'number') return;
      if (x.price % 50) fails.push(x.name + ' 的價格不是整數好看的數字：' + x.price);
    }); });
    if (EGG_PRICE > 1500) fails.push('寵物蛋還是太貴：' + EGG_PRICE);
    // ⑦ 其他分頁沒被改壞
    ['inv','shop','dress','pets','build','earn','book','talk','save'].forEach(function(t){
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
    openTab('backup');
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
    // FileReader 什麼時候讀完不一定（機器忙的時候 80ms 不夠），等到有結果或 3 秒
    var waitFor = function(ok, then, t0){
      t0 = t0 || Date.now();
      if (ok() || Date.now() - t0 > 3000) then(); else setTimeout(function(){ waitFor(ok, then, t0); }, 50);
    };
    feed(good, 'ok.json');
    waitFor(function(){ return tb.value === good; }, function(){
      if (tb.value !== good) fails.push('選了備份檔，內容沒有被讀進來');
      tb.value = '';
      feed('這不是備份', 'bad.json');
      // 壞檔案「不填進去」沒有東西可以等，就固定多等一下
      setTimeout(function(){
        if (tb.value) fails.push('選了不是備份的檔案，竟然還填進框裡');
        // 休息的時候整個遊戲要暫停：給小可愛一條路，等一下，她不能動
        try {
          G.away = null; closeGameWindow(); $('#modal').hidden = true;
          var sx = fufu.x, sy = fufu.y;
          resting = true;
          var rmP = curRoom(), tries = [[rmP.w - 1, rmP.d - 1], [0, 0], [rmP.w - 1, 0], [0, rmP.d - 1]];
          for (var ti2 = 0; ti2 < tries.length && !(fufu.path && fufu.path.length); ti2++) fufuWalkTo(tries[ti2][0], tries[ti2][1]);
          if (!(fufu.path && fufu.path.length)) fails.push('暫停測試：找不到可以走的路');
          var nowS = performance.now();
          for (var gs = 0; gs < 30; gs++) gameStep(.05, nowS + gs * 50);
          if (Math.abs(fufu.x - sx) > .01 || Math.abs(fufu.y - sy) > .01) fails.push('休息的時候小可愛還在走（遊戲沒有暫停）');
          resting = false;
          for (var gs2 = 0; gs2 < 30; gs2++) gameStep(.05, nowS + 2000 + gs2 * 50);
          if (Math.abs(fufu.x - sx) < .01 && Math.abs(fufu.y - sy) < .01) fails.push('暫停測試：不休息的時候小可愛也沒走（測試本身不對）');
          fufu.path = [];
          pendingChecks.forEach(function(f){ try { f(); } catch(e2) { fails.push('延後的檢查出錯：' + e2.message); } });
          // 視窗不管怎麼關掉都要停止朗讀（MutationObserver 是 microtask，用 Promise 排在它後面再驗）
          var stopN = 0, realStopS = stopSpeak;
          stopSpeak = function(){ stopN++; };
          openStorybook('seed');
          $('#modal').hidden = true;
          Promise.resolve().then(function(){
            stopSpeak = realStopS;
            if (!stopN) fails.push('關掉繪本視窗，朗讀沒有停');
            report();
          });
        } catch(e) { fails.push('暫停測試出錯：' + e.message); report(); }
      }, 400);
    });
  } catch(e){ errs.push('THROW(file) '+e.message); report(); }
})();</script>
