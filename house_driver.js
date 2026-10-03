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
      fails.push('「重新開始」還在家具分頁');
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
      G.away = { place: 'school', idx: 0 }; G.actCD = {};
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
    try { var tc = document.createElement('canvas').getContext('2d'); drawTripSchool(tc, 360, 240, 150); }
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
       'openMoleGame','openRaceGame','openBrickGame','openFarmGame','openCoinGame','openMarbleGame','openPuzzleGame','openSlingGame','openQuizGame','openRunGame'
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
        report();
      }, 400);
    });
  } catch(e){ errs.push('THROW(file) '+e.message); report(); }
})();</script>
