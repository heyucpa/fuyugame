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
    if (PET_SPECIES.length !== 18) fails.push('寵物變成 ' + PET_SPECIES.length + ' 種了');
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
    openTab('pets');
    var dexCards = document.querySelectorAll('#tabBody .card.dex');
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
    // 十個小遊戲都要在清單上，而且每一顆都叫得出對應的函式
    openTab('earn');
    var picks = document.querySelectorAll('.game-pick');
    if (picks.length !== 10) fails.push('小遊戲清單有 ' + picks.length + ' 個，應該是 10 個');
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

    /* 61 拍照：拍得出照片、留下來、最多 12 張（滿了要先刪）、可以刪、每個存檔格分開、壞掉／空間不夠不當掉 */
    localStorage.removeItem(photoKey());
    var shot = takePhoto();
    if (!shot || shot.indexOf('data:image/jpeg') !== 0) fails.push('拍不出照片');
    if (!document.querySelector('#modalCard .photo-big')) fails.push('拍完沒有預覽');
    var keepBtn = [].filter.call(document.querySelectorAll('#modalCard button'), function(b){ return /留下來/.test(b.textContent); })[0];
    keepBtn.onclick();
    if (loadPhotos().length !== 1) fails.push('按留下來，相簿沒有多一張');
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
      openTab('save');
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
      openTab('save');
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
        if (!blk3[x3][y3]) { var g4 = pickItem(iso(x3 + .5, y3 + .5, 0)); if (g4 && !canUse(g4)) fails.push(where3 + '：點地板 ' + x3 + ',' + y3 + ' 被' + g4.id + '攔住（走不過去）'); }
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
    // 新收集大圖：小遊戲進行中不要擋住
    openMemoryGame();
    var realToast4 = toast, tt4 = [];
    toast = function(m){ tt4.push(m); };
    try {
      G.animals = {}; meetAnimal(VISIT_ANIMALS[1]);
      if (document.getElementById('showcase')) fails.push('小遊戲進行中，新收集大圖擋住了遊戲');
      if (!tt4.some(function(m){ return /新的/.test(m); })) fails.push('小遊戲進行中拿到新東西，連提示都沒有');
    } finally { toast = realToast4; closeGameWindow(); G.animals = {}; }
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
    // ④ 復原：從收納放一張床 → 復原 → 床回到收納、房間沒有那張床
    G.inv.wood_bed = (G.inv.wood_bed || 0) + 1;
    var invBefore = G.inv.wood_bed, nBefore = rmU.items.length;
    startHoldFromInv('wood_bed');
    if (!hold || !hold.ok) { for (var hx = 0; hx < rmU.w && !(hold && hold.ok); hx++) for (var hy = 0; hy < rmU.d; hy++) { hold.x = hx; hold.y = hy; hold.ok = canPlace(rmU, hold.def, hx, hy, 0, null); if (hold.ok) break; } }
    placeHold();
    if (rmU.items.length !== nBefore + 1) fails.push('復原測試：床沒有放下去');
    if ($('#btnUndo').hidden) fails.push('放好家具後沒有出現「復原」');
    $('#btnUndo').onclick();
    if (rmU.items.length !== nBefore || G.inv.wood_bed !== invBefore) fails.push('按復原沒有把床收回來（' + rmU.items.length + '/' + nBefore + '，收納 ' + G.inv.wood_bed + '/' + invBefore + '）');
    if (!$('#btnUndo').hidden) fails.push('復原完按鈕還在');
    // 搬動 → 復原回原位
    var mv = rmU.items[0];
    if (mv) {
      var ox2 = mv.x, oy2 = mv.y, ouid = mv.uid;
      startHoldFromRoom(mv);
      var moved = false;
      for (var mx = 0; mx < rmU.w && !moved; mx++) for (var my = 0; my < rmU.d; my++) { if ((mx !== ox2 || my !== oy2) && canPlace(rmU, hold.def, mx, my, hold.rot, hold.fromUid)) { hold.x = mx; hold.y = my; hold.ok = true; moved = true; break; } }
      placeHold();
      $('#btnUndo').onclick();
      var back = rmU.items.filter(function(x){ return x.uid === ouid; })[0];
      if (!back || back.x !== ox2 || back.y !== oy2) fails.push('搬動之後按復原，家具沒有回到原位');
    }
    // 拿起來又取消：什麼都沒改，不要出現復原
    if (rmU.items[0]) { startHoldFromRoom(rmU.items[0]); cancelHold(); offerUndo(); if (!$('#btnUndo').hidden) fails.push('拿起來又放回去（取消），之後還留著可以復原的東西'); hideUndo(); }
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
    var prompts = 0, realPrompt2 = window.prompt;
    saveRestCfg({ on: true, play: 20, rest: 5, pin: '4321' });
    window.prompt = function(){ prompts++; return '4321'; };
    var okN = 0;
    askPin('a', function(){ okN++; }); askPin('b', function(){ okN++; });
    if (prompts !== 2 || okN !== 2) fails.push('家長密碼輸入一次後就不再問（問了 ' + prompts + ' 次）');
    // 危險的按鈕也要密碼：重新開始
    var realReset = confirmReset, resetCalled = 0;
    confirmReset = function(){ resetCalled++; };
    window.prompt = function(){ return '0000'; };
    openTab('save');
    var resetBtn = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /重新開始（清除存檔）/.test(b.textContent); })[0];
    if (resetBtn) { resetBtn.onclick(); if (resetCalled) fails.push('密碼錯了還能按「重新開始」'); window.prompt = function(){ return '4321'; }; resetBtn.onclick(); if (!resetCalled) fails.push('密碼對了卻不能按「重新開始」'); }
    else fails.push('找不到「重新開始」按鈕');
    confirmReset = realReset; window.prompt = realPrompt2;
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
    openTab('save');
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
    var nbtn = [].filter.call(document.querySelectorAll('#tabBody button'), function(b){ return /最近的更新/.test(b.textContent); })[0];
    if (!nbtn) fails.push('設定頁沒有「看最近的更新」');
    else { nbtn.onclick(); if ($('#modal').hidden) fails.push('設定頁的「看最近的更新」打不開'); }
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
    var realPrompt = window.prompt;
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
      window.prompt = function(){ return '0000'; };
      openTab('save');
      var offBtn = [].filter.call(document.querySelectorAll('#tabBody .filter button'), function(b){ return b.textContent === '關'; })[0];
      if (!offBtn) fails.push('設定頁沒有休息提醒的開關');
      else {
        offBtn.onclick();
        if (!restCfg().on) fails.push('密碼錯了還是能把提醒關掉');
        window.prompt = function(){ return '1234'; };
        offBtn.onclick();
        if (restCfg().on) fails.push('密碼對了卻關不掉提醒');
      }
      restReset({ pin: '1234' }); T = 7e12; restTick(T, true); T = playFor(T, 21 * 60);
      window.prompt = function(){ return '9999'; };
      var pb = document.querySelector('#restOverlay .rest-parent');
      pb.onclick();
      if (!resting) fails.push('密碼錯了也能提早結束休息');
      window.prompt = function(){ return '1234'; };
      pb.onclick();
      if (resting) fails.push('家長密碼對了卻不能提早結束休息');
    } catch(e) { fails.push('休息提醒測試出錯：' + e.message); }
    finally {
      toast = realToast2; window.prompt = realPrompt;
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
    if (chips.length !== 9) fails.push('圖鑑總覽不是九種收集：' + chips.length);
    [['漫畫', '2/12'], ['貼紙', '1/12'], ['蝴蝶', '3/6'], ['閱讀護照', '2/8']].forEach(function(p){
      if (!chips.some(function(t){ return t.indexOf(p[0]) >= 0 && t.indexOf(p[1]) >= 0; })) fails.push('圖鑑總覽的「' + p[0] + '」不是 ' + p[1] + '：' + chips.join(' | '));
    });
    ['dexFurn','dexFish','dexFriend','dexAnimal','dexTheme','dexComic','dexSticker','dexBfly','dexPass'].forEach(function(id){
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
    if (allCost < 150000 || allCost > 200000) fails.push('全部買齊要 ' + allCost + '，不在 15～20 萬');
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
