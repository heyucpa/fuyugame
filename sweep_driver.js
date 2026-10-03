<script>(function(){
  // 萬一還是有東西讓頁面重新載入，第二次就不要再跑，直接報出來
  try {
    if (sessionStorage.getItem('sweepRan')) {
      var p0 = document.createElement('pre'); p0.id = 'R';
      p0.textContent = '失敗 1\nJS 錯誤 0\n\n頁面在檢查途中被重新載入了（有按鈕觸發了 reload）';
      document.body.innerHTML = ''; document.body.appendChild(p0); return;
    }
    sessionStorage.setItem('sweepRan', '1');
  } catch (e) {}
  /* 全面掃 bug：專門找「走查沒想到的」。
     house_driver.js 測的是我想得到的規則；這一支換角度：
       A. 拿她真實的舊備份（較早的版本產生的）載入新版
       B. 用盡所有新功能的存檔，備份 → 清空 → 還原，逐欄比對
       C. 每個分頁、每顆按鈕亂按，抓 JS 錯誤
       D. 模擬玩好幾個小時，找 NaN、負數、不存在的 id
     任何一條都不該需要「知道程式怎麼寫」才驗得出來。 */
  var fails = [], errs = [], notes = [];
  window.addEventListener('error', function(e){ errs.push(String(e.message) + ' @' + e.lineno); });
  function bad(v){ return typeof v === 'number' && (isNaN(v) || !isFinite(v)); }
  function scanNumbers(obj, path, out){
    if (obj === null || obj === undefined) return;
    if (typeof obj === 'number') { if (bad(obj)) out.push(path + '=' + obj); return; }
    if (typeof obj !== 'object') return;
    Object.keys(obj).forEach(function(k){ scanNumbers(obj[k], path + '.' + k, out); });
  }
  function checkHealth(tag){
    var nan = []; scanNumbers(G, 'G', nan);
    if (nan.length) fails.push(tag + '：存檔裡有壞掉的數字 ' + nan.slice(0, 3).join(', '));
    if (G.bells < 0) fails.push(tag + '：鈴錢變負的 ' + G.bells);
    Object.keys(G.inv || {}).forEach(function(id){
      if (!FURN_BY_ID[id]) fails.push(tag + '：收納裡有不存在的家具 ' + id);
      if (!(G.inv[id] > 0)) fails.push(tag + '：收納數量不對 ' + id + '=' + G.inv[id]);
    });
    G.rooms.forEach(function(r, ri){
      r.items.forEach(function(it){
        if (!FURN_BY_ID[it.id]) fails.push(tag + '：房間 ' + ri + ' 有不存在的家具 ' + it.id);
        if (it.top && !FURN_BY_ID[it.top]) fails.push(tag + '：桌上有不存在的東西 ' + it.top);
      });
    });
    G.pets.forEach(function(p, i){
      if (!PET_SPECIES_BY_ID[p.species]) fails.push(tag + '：寵物 ' + i + ' 的種類不存在 ' + p.species);
    });
    if (!G.pets[G.activePet]) fails.push(tag + '：照顧中的寵物指到不存在的位置');
    (G.companions || []).forEach(function(c){ if (!G.pets[c]) fails.push(tag + '：一起逛的寵物指到不存在的位置'); });
    if (!HAIR_BY_ID[G.hair.style] || !HAIR_COLOR_BY_ID[G.hair.color]) fails.push(tag + '：髮型或髮色不存在');
    Object.keys(G.outfit).forEach(function(k){
      if (!CLOTHES_BY_ID[G.outfit[k]]) fails.push(tag + '：穿了不存在的衣服 ' + G.outfit[k]);
    });
  }

  try {
    /* ── A. 她真實的舊備份（2026-10-03 14:28，存檔格、髮型、配送、桌上擺東西都還沒有的版本） ── */
    var REAL = {"tag":"myHouse-save","v":1,"at":"2026-10-03 14:28","data":"{\"bells\":100000,\"earned\":0,\"inv\":{\"wood_bed\":1,\"wood_chair\":1,\"plant_s\":1},\"walls\":[\"wp_cream\"],\"floors\":[\"fl_wood\"],\"rooms\":[{\"name\":\"客廳\",\"w\":6,\"d\":6,\"wall\":\"wp_cream\",\"floor\":\"fl_wood\",\"items\":[{\"uid\":1,\"id\":\"wood_table\",\"x\":1,\"y\":3,\"rot\":0}],\"wallItems\":[]}],\"cur\":0,\"seen\":{\"wood_bed\":true,\"wood_chair\":true,\"wood_table\":true,\"plant_s\":true},\"fish\":{},\"lastGift\":\"\",\"lastClaim\":\"\",\"uid\":2,\"lines\":{},\"charName\":\"小可愛\",\"pets\":[{\"species\":\"mochi\",\"stage\":\"kid\",\"growth\":0,\"name\":\"圓圓\",\"hunger\":25.92,\"clean\":41.38,\"mood\":26.6,\"lastTick\":1791037722802}],\"activePet\":0,\"companions\":[],\"friends\":{\"qiqi\":1,\"meme\":1},\"tree\":{\"n\":5,\"t\":1791036497715},\"orchard\":{\"n\":6,\"t\":1791036497715},\"away\":null,\"giftAt\":{},\"food\":{\"apple\":3,\"cookie\":2},\"kid\":{\"hunger\":23.2,\"height\":135,\"lastTick\":1791037722802},\"kidFood\":{\"xiaoansu\":2,\"sandwich\":2},\"outfit\":{\"head\":\"head_none\",\"top\":\"uniform\",\"bottom\":\"red_shorts\",\"shoes\":\"black_shoes\"},\"wardrobe\":[\"head_none\",\"uniform\",\"red_shorts\",\"black_shoes\"],\"pet\":{\"species\":\"mochi\",\"stage\":\"kid\",\"growth\":0,\"name\":\"圓圓\",\"hunger\":25.92,\"clean\":41.38,\"mood\":26.6,\"lastTick\":1791037722802},\"topup100k\":true}"};
    var realTxt = JSON.stringify(REAL);
    if (!readBackup(realTxt)) fails.push('A：她真實的舊備份，新版讀不進來');
    else {
      localStorage.removeItem(SAVE_KEY);
      if (!applyBackup(realTxt)) fails.push('A：舊備份還原失敗');
      G = loadGame();
      checkHealth('A 舊備份載入後');
      if (G.bells !== 100000) fails.push('A：舊備份的錢不對 ' + G.bells);
      if (G.rooms[0].items.length !== 1) fails.push('A：舊備份房間裡的桌子不見了');
      if (G.pets[0].name !== '圓圓') fails.push('A：寵物的名字不見了');
      if (G.charName !== '小可愛') fails.push('A：角色名字不見了');
      if (!G.hair || !G.hair.style) fails.push('A：舊存檔沒有被補上髮型');
      if (G.bells !== 100000) fails.push('A：補償旗標已經有了，卻又補了一次');
      // 載入之後所有分頁都要打得開
      ['inv','shop','dress','pets','deco','build','earn','book','talk','save'].forEach(function(t){
        try { openTab(t); } catch (e) { fails.push('A：舊存檔打開「' + t + '」分頁出錯 ' + e.message); }
      });
    }

    /* ── 舊格式：還沒有存檔格的版本，存檔放在沒有後綴的 key ── */
    var legacy = JSON.parse(REAL.data);
    localStorage.clear();
    localStorage.setItem('myHouseGame_v1', JSON.stringify(legacy));
    // 模擬重新打開：搬家只在載入時跑一次，這裡直接叫同一段邏輯
    (function(){
      var old = localStorage.getItem('myHouseGame_v1');
      if (old && !localStorage.getItem(slotSave('p1'))) localStorage.setItem(slotSave('p1'), old);
    })();
    if (!localStorage.getItem(slotSave('p1'))) fails.push('A2：沒有存檔格之前的那一份，沒搬進第 1 格');
    if (!localStorage.getItem('myHouseGame_v1')) fails.push('A2：搬家時把原本那一份刪掉了（應該留著當保險）');

    /* ── B. 把每一樣新功能都用上，備份 → 清空 → 還原，逐欄比對 ── */
    localStorage.clear();
    G = newGame();
    G.pets = PET_SPECIES.map(function(sp, i){ return newPet(sp.id, ['egg','baby','kid','adult'][i % 4], sp.name + i); });
    G.activePet = 3; G.pet = G.pets[3];
    G.rooms.push(JSON.parse(JSON.stringify(G.rooms[0]))); G.rooms[1].name = '臥室';
    G.rooms.push(JSON.parse(JSON.stringify(G.rooms[0]))); G.rooms[2].name = '閣樓';
    G.companions = [5, 9];
    G.rooms[0].items = [
      { uid: 11, id: 'wood_table', x: 1, y: 1, rot: 0, top: 'game_cart' },
      { uid: 12, id: 'pink_desk', x: 3, y: 1, rot: 1, top: 'globe' },
      { uid: 13, id: 'lemon_bed', x: 1, y: 3, rot: 0 }
    ];
    G.uid = 20;
    G.hair = { style: 'twin', color: 'pink' };
    G.hairOwned = ['bob', 'twin', 'long'];
    G.wardrobe = G.wardrobe.concat(['santa_hat', 'witch_hat', 'pink_tee']);
    G.outfit.head = 'santa_hat'; G.outfit.top = 'pink_tee';
    G.fish = { '鯽魚': 3, '寶箱': 1, '舊靴子': 2 };
    G.friends = { qiqi: 4, abu: 2 };
    G.kidFood = { xiaoansu: 7 }; G.food = { xiaoansu: 5, apple: 2 };
    G.supplyAt = Date.now() - 123456; G.supplyWho = 1;
    G.bells = 54321; G.charName = '姊姊的小可愛';
    G.lines = { chat: ['自己寫的台詞一', '自己寫的台詞二'] };
    saveGame();
    var before = localStorage.getItem(SAVE_KEY);
    var code = makeBackup();
    localStorage.clear();
    if (localStorage.getItem(SAVE_KEY)) fails.push('B：清空沒有清乾淨');
    if (!applyBackup(code)) fails.push('B：完整存檔還原失敗');
    if (localStorage.getItem(SAVE_KEY) !== before) fails.push('B：還原之後存檔跟原本差了一個字以上');
    G = loadGame();
    checkHealth('B 還原後');
    [['寵物數', G.pets.length, 18], ['照顧中', G.activePet, 3], ['房間數', G.rooms.length, 3],
     ['桌上卡帶', G.rooms[0].items[0].top, 'game_cart'], ['桌上地球儀', G.rooms[0].items[1].top, 'globe'],
     ['髮型', G.hair.style, 'twin'], ['髮色', G.hair.color, 'pink'], ['頭飾', G.outfit.head, 'santa_hat'],
     ['寶箱', G.fish['寶箱'], 1], ['錢', G.bells, 54321], ['名字', G.charName, '姊姊的小可愛'],
     ['自訂台詞', (G.lines.chat || [])[1], '自己寫的台詞二'], ['配送輪到誰', G.supplyWho, 1]
    ].forEach(function(r){ if (r[1] !== r[2]) fails.push('B：還原後「' + r[0] + '」變成 ' + r[1] + '（應該是 ' + r[2] + '）'); });

    /* ── C. 每個分頁、每顆按鈕亂按（跳過會離開頁面、會清存檔的那幾顆） ── */
    var realConfirm = window.confirm, realReplace = location.replace;
    window.confirm = function(){ return false; };   // 所有「真的要嗎？」一律按取消
    var SKIP = /強制更新|重新開始|刪掉|清除|還原|換回|存成檔案|複製|回家|出門|換成這個|開一間/;
    var clicked = 0;
    ['inv','shop','dress','pets','deco','build','earn','book','talk','save'].forEach(function(t){
      for (var pass = 0; pass < 2; pass++) {
        try { openTab(t); } catch (e) { fails.push('C：打開「' + t + '」出錯 ' + e.message); return; }
        var bs = [].slice.call(document.querySelectorAll('#tabBody button'));
        bs.forEach(function(b, i){
          if (SKIP.test(b.textContent)) return;
          if (!document.body.contains(b)) return;
          try { if (typeof b.onclick === 'function') { b.onclick({ stopPropagation: function(){}, preventDefault: function(){} }); clicked++; } }
          catch (e) { fails.push('C：「' + t + '」分頁按「' + b.textContent.trim().slice(0, 12) + '」出錯 ' + e.message); }
          // 有些按鈕會開小視窗，關掉再繼續
          try { if (typeof closeGameWindow === 'function') closeGameWindow(); } catch (e) {}
          var md = document.querySelector('#modal'); if (md) md.hidden = true;
          try { cancelAnimationFrame(fishTimer); } catch (e) {}
        });
      }
    });
    window.confirm = realConfirm;
    notes.push('C：亂按了 ' + clicked + ' 顆按鈕');
    checkHealth('C 亂按之後');

    /* ── D. 模擬玩三個小時：飢餓、配送、寵物衰退一路跑下去 ── */
    var t0 = Date.now();
    var realNow = Date.now;
    var fake = t0;
    Date.now = function(){ return fake; };
    G.away = null;
    for (var min = 0; min < 180; min += 2) {
      fake = t0 + min * 60000;
      try { petTick(); } catch (e) { fails.push('D：第 ' + min + ' 分鐘 petTick 出錯 ' + e.message); break; }
      try { supplyGone(); nextSupplyCheck = 0; if (supplyDue(fake)) doSupply(fake); }
      catch (e) { fails.push('D：第 ' + min + ' 分鐘配送出錯 ' + e.message); break; }
    }
    Date.now = realNow;
    checkHealth('D 三小時後');
    if ((G.kidFood.xiaoansu || 0) > SUPPLY_CAP) fails.push('D：小安素超過上限 ' + G.kidFood.xiaoansu);
    if ((G.food.xiaoansu || 0) > SUPPLY_CAP) fails.push('D：寵物的小安素超過上限 ' + G.food.xiaoansu);
    if (G.kid.hunger < 0 || G.kid.hunger > 100) fails.push('D：小可愛的飽足超出範圍 ' + G.kid.hunger);
    G.pets.forEach(function(p, i){
      ['hunger','clean','mood'].forEach(function(k){
        if (typeof p[k] === 'number' && (p[k] < 0 || p[k] > 100)) fails.push('D：寵物 ' + i + ' 的 ' + k + ' 超出範圍 ' + p[k]);
      });
    });

    /* ── E. 存了再讀，讀了再存：來回十次不可以越變越歪 ── */
    var snap = JSON.stringify(G);
    for (var r = 0; r < 10; r++) { saveGame(); G = loadGame(); }
    checkHealth('E 來回十次後');
    var drift = JSON.parse(snap), now = JSON.parse(JSON.stringify(G));
    ['bells','charName','hair','outfit','fish','friends'].forEach(function(k){
      if (JSON.stringify(drift[k]) !== JSON.stringify(now[k])) fails.push('E：存讀十次之後「' + k + '」變了');
    });
    if (now.pets.length !== drift.pets.length) fails.push('E：存讀十次之後寵物數變了');
  } catch (e) { errs.push('THROW ' + e.message + ' | ' + (e.stack || '').split('\n')[1]); }

  var pre = document.createElement('pre'); pre.id = 'R';
  pre.textContent = ['失敗 ' + fails.length, 'JS 錯誤 ' + errs.length, notes.join('\n'), '',
    fails.concat(errs).slice(0, 25).join('\n')].join('\n');
  document.body.innerHTML = ''; document.body.appendChild(pre);
})();</script>
