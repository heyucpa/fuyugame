// 髮型、眼鏡、小飾品：買得到、舊存檔留得住、每個地方都畫得出來、圖示夠大
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  const dir = process.env.HOUSE_DIR || '/agent/repos/fuyugame';
  await p.goto('file://' + dir + '/house.html');
  await p.waitForTimeout(1500);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const fails = [];
    const shot = (ids, w, h, opt) => renderGirl(ids, w, h, opt).src;
    const oldHair = ['bob', 'pony', 'twin', 'long', 'bun'];
    const fresh = HAIR_STYLES.map(h => h.id).filter(id => oldHair.indexOf(id) < 0);
    if (fresh.length < 5) fails.push('新髮型少於 5：' + fresh.join(','));
    ['braid', 'twinbraid', 'curly', 'pixie', 'side', 'half'].forEach(id => { if (!HAIR_BY_ID[id]) fails.push('缺髮型 ' + id); });
    if (HAIR_BY_ID.short) fails.push('爸爸的短髮跑進商店了');
    if (HAIR_BY_ID.pixie && HAIR_BY_ID.pixie.name !== '短髮') fails.push('短髮名字不對');
    ['red', 'orange', 'silver'].forEach(id => { if (!HAIR_COLOR_BY_ID[id]) fails.push('缺髮色 ' + id); });
    const seenHair = {}, seenHairBack = {};
    HAIR_STYLES.forEach(h => {
      let d, back;
      try {
        d = shot(DEFAULT_OUTFIT, 80, 100, { hair: { style: h.id, color: 'gold' } });
        back = shot(DEFAULT_OUTFIT, 80, 100, { hair: { style: h.id, color: 'gold' }, back: true });
      } catch (e) { fails.push(h.name + ' 畫不出來 ' + e.message); return; }
      if (seenHair[d]) fails.push(h.name + ' 正面跟 ' + seenHair[d] + ' 一樣');
      seenHair[d] = h.name;
      if (seenHairBack[back]) fails.push(h.name + ' 背面跟 ' + seenHairBack[back] + ' 一樣');
      seenHairBack[back] = h.name;
    });
    const headPx = style => {
      const cv = document.createElement('canvas'); cv.width = 70; cv.height = 70;
      const cx = cv.getContext('2d'); cx.translate(35, 78);
      drawGirlHead(cx, { hair: { style: style, color: 'black' } });
      return cx.getImageData(0, 0, 70, 70).data.join(',');
    };
    if (headPx('pixie') === headPx('bob')) fails.push('短髮跟妹妹頭一樣');
    if (headPx('pixie') === headPx('short')) fails.push('短髮跟爸爸的平頭一樣');
    if (headPx('short') === headPx('bob')) fails.push('爸爸的短髮被改成跟妹妹頭一樣');

    const face = CLOTHES.filter(c => c.slot === 'face' && c.id !== 'face_none');
    const byStyle = {};
    face.forEach(c => { (byStyle[c.style] = byStyle[c.style] || {})[c.color] = c; });
    ['gRound', 'gSquare', 'gHeart', 'gStar', 'gCat', 'gSun'].forEach(s => {
      const n = byStyle[s] ? Object.keys(byStyle[s]).length : 0;
      if (n < 4) fails.push(s + ' 顏色只有 ' + n);
    });
    if (face.length < 24) fails.push('眼鏡只有 ' + face.length + ' 副');
    const none = shot(DEFAULT_OUTFIT, 72, 90, { hair: { style: 'bob', color: 'black' } });
    const seenG = {};
    CLOTHES.filter(c => c.slot === 'face').forEach(c => {
      let d;
      try { d = shot(Object.assign({}, DEFAULT_OUTFIT, { face: c.id }), 72, 90, { hair: { style: 'bob', color: 'black' } }); }
      catch (e) { fails.push(c.name + ' 畫不出來 ' + e.message); return; }
      if (c.id !== 'face_none' && d === none) fails.push(c.name + ' 跟沒戴眼鏡一樣');
      if (seenG[d]) fails.push(c.name + ' 跟 ' + seenG[d] + ' 一樣');
      seenG[d] = c.name;
    });
    // 頭飾、項鍊也不能兩件長一樣（含既有的，跟走查同一套比較）
    const seenH = {};
    CLOTHES.filter(c => c.slot === 'head').forEach(c => {
      let d;
      try { d = shot(Object.assign({}, DEFAULT_OUTFIT, { head: c.id }), 47, 59, { hair: { style: 'bob', color: 'black' } }); }
      catch (e) { fails.push(c.name + ' 畫不出來 ' + e.message); return; }
      if (seenH[d]) fails.push('頭飾「' + c.name + '」跟「' + seenH[d] + '」一樣');
      seenH[d] = c.name;
    });
    const seenN = {};
    CLOTHES.filter(c => c.slot === 'neck').forEach(c => {
      const d = shot(Object.assign({}, DEFAULT_OUTFIT, { neck: c.id }), 72, 90, { hair: { style: 'bob', color: 'black' } });
      if (c.id !== 'neck_none' && d === none) fails.push(c.name + ' 跟沒戴項鍊一樣');
      if (seenN[d]) fails.push(c.name + ' 跟 ' + seenN[d] + ' 一樣');
      seenN[d] = c.name;
    });
    const names = CLOTHES.map(c => c.name).join('\n');
    ['髮夾', '蝴蝶結', '皇冠', '帽', '耳罩', '項鍊', '圓框', '方框', '愛心', '星星', '貓眼', '墨鏡'].forEach(w => {
      if (names.indexOf(w) < 0) fails.push('沒有名稱含「' + w + '」的飾品');
    });
    // 新頭飾的畫法要真的寫在程式裡（style 打錯就完全不顯示）
    const src = document.documentElement.innerHTML, drawn = {};
    const re = /h\.style === '(\w+)'/g; let mm;
    while ((mm = re.exec(src))) drawn[mm[1]] = 1;
    CLOTHES.filter(c => (c.slot === 'head' || c.slot === 'clip') && c.style !== 'none').forEach(c => {
      if (!drawn[c.style]) fails.push((c.slot === 'clip' ? '髮飾' : '頭飾') + '「' + c.name + '」沒有畫法 ' + c.style);
    });

    const old = {
      rooms: [{ name: '舊房', w: 6, d: 6, items: [], wallItems: [] }],
      bells: 12345, topup100k: true, charName: '妹妹',
      hair: { style: 'twin', color: 'pink' }, hairOwned: ['bob', 'twin'],
      outfit: { head: 'santa_hat', top: 'uniform', bottom: 'red_shorts', shoes: 'black_shoes' },
      wardrobe: ['head_none', 'uniform', 'red_shorts', 'black_shoes', 'santa_hat']
    };
    const g = normalizeSave(JSON.parse(JSON.stringify(old)));
    if (!g) fails.push('舊存檔讀不出來');
    else {
      if (g.bells !== 12345) fails.push('鈴錢變了 ' + g.bells);
      if (g.charName !== '妹妹') fails.push('名字變了');
      if (g.hair.style !== 'twin' || g.hair.color !== 'pink') fails.push('舊髮型沒留住 ' + JSON.stringify(g.hair));
      if (g.outfit.head !== 'santa_hat') fails.push('舊頭飾沒留住 ' + g.outfit.head);
      if (g.outfit.top !== 'uniform') fails.push('舊上衣沒留住');
      if (g.outfit.face !== 'face_none') fails.push('舊檔被戴上眼鏡');
      if (g.outfit.neck !== 'neck_none') fails.push('舊檔被戴上項鍊');
      if (g.hairOwned.indexOf('twin') < 0) fails.push('買過的雙馬尾不見了');
      if (g.hairOwned.indexOf('braid') >= 0) fails.push('舊檔被送了麻花辮');
      if (g.wardrobe.indexOf('santa_hat') < 0) fails.push('買過的聖誕帽不見了');
      if (g.wardrobe.indexOf('gl_round_blk') >= 0) fails.push('舊檔白送眼鏡');
      if (g.wardrobe.indexOf('face_none') < 0 || g.wardrobe.indexOf('neck_none') < 0) fails.push('沒補上不戴');
    }
    const badIn = JSON.parse(JSON.stringify(old));
    badIn.outfit = { head: 'santa_hat', top: 'uniform', bottom: 'red_shorts', shoes: 'black_shoes', face: 'nope', neck: 3 };
    badIn.hair = { style: 'no-such', color: 'pink' };
    badIn.hairOwned = 5;
    const bad = normalizeSave(badIn);
    if (!bad) fails.push('壞欄位讓整份存檔讀不出來');
    else {
      if (bad.outfit.face !== 'face_none' || bad.outfit.neck !== 'neck_none') fails.push('壞的眼鏡／項鍊沒修回不戴');
      if (bad.hair.style !== 'bob') fails.push('不存在的髮型沒換回妹妹頭');
      if (bad.hair.color !== 'pink') fails.push('還認得的髮色被清掉了');
      if (bad.outfit.head !== 'santa_hat') fails.push('修新欄位時把頭飾弄掉了');
      if (!Array.isArray(bad.hairOwned)) fails.push('hairOwned 壞掉後不是陣列');
    }
    // 眼鏡 id 放進頭飾欄要被擋下來（欄位不能互塞）
    const swap = JSON.parse(JSON.stringify(old));
    swap.outfit.face = 'santa_hat';
    swap.wardrobe.push('santa_hat');
    const swapped = normalizeSave(swap);
    if (swapped && swapped.outfit.face === 'santa_hat') fails.push('頭飾被當成眼鏡戴上');

    ['bald', 'azhi', 'quiff', 'afro', 'rocket', 'spike', 'mohawk', 'buns'].forEach(id => {
      if (!HAIR_BY_ID[id]) fails.push('缺髮型 ' + id);
      else if (HAIR_BY_ID[id].price < 50 || HAIR_BY_ID[id].price > 250) fails.push(HAIR_BY_ID[id].name + ' 價錢不在 50～250：' + HAIR_BY_ID[id].price);
    });
    const funny = normalizeSave(JSON.parse(JSON.stringify(old)));
    funny.hair = { style: 'no-such-hair', color: 'orange' };
    const funnyBad = normalizeSave(funny);
    if (!funnyBad || funnyBad.hair.style !== 'bob' || funnyBad.hair.color !== 'orange') fails.push('不認得的髮型沒有安全退回');
    const keepHair = JSON.parse(JSON.stringify(old));
    keepHair.hair = { style: 'azhi', color: 'silver' };
    keepHair.hairOwned = ['bob', 'azhi'];
    const keptHair = normalizeSave(keepHair);
    if (!keptHair || keptHair.hair.style !== 'azhi' || keptHair.hair.color !== 'silver') fails.push('新髮型存檔沒留住');
    if (keptHair && keptHair.hairOwned.indexOf('azhi') < 0) fails.push('買過的阿志頭不見了');
    const bowIn = JSON.parse(JSON.stringify(old));
    bowIn.outfit.head = 'ribbon';
    bowIn.wardrobe = bowIn.wardrobe.concat(['ribbon']);
    const bowG = normalizeSave(bowIn);
    if (!bowG || bowG.outfit.clip !== 'ribbon' || bowG.outfit.head !== 'head_none') fails.push('蝴蝶結沒從舊的頭飾格搬開 ' + (bowG && JSON.stringify(bowG.outfit)));
    if (bowG && bowG.wardrobe.indexOf('ribbon') < 0) fails.push('買過的蝴蝶結被刪掉');
    const glassIn = JSON.parse(JSON.stringify(old));
    glassIn.outfit.face = 'gl_sun_yel';
    glassIn.wardrobe = glassIn.wardrobe.concat(['gl_sun_yel', 'gl_round_red']);
    const glassG = normalizeSave(glassIn);
    if (!glassG || glassG.outfit.face !== 'gl_sun_yel') fails.push('穿著的黃色太陽墨鏡變色了 ' + (glassG && glassG.outfit.face));
    if (glassG && (glassG.wardrobe.indexOf('gl_sun_yel') < 0 || glassG.wardrobe.indexOf('gl_round_red') < 0)) fails.push('舊的眼鏡色號被刪掉');
    const keepWard = G.wardrobe, keepFace = G.outfit.face, keepHead = G.outfit.head;
    G.wardrobe = glassG.wardrobe.slice();
    G.outfit.face = glassG.outfit.face;
    if (!ownsGlassLook('sun') || !ownsGlassLook('round')) fails.push('有一個顏色卻不算擁有那個造型');
    const shopFaces = faceShopItems().filter(c => c.glass);
    if (shopFaces.length !== 6) fails.push('換裝眼鏡不是 6 種：' + shopFaces.length);
    const shopNames = shopFaces.map(c => (GLASS_LOOKS.find(s => s.id === c.glass) || {}).name);
    if (shopNames.join(',') !== GLASS_LOOKS.map(s => s.name).join(',')) fails.push('眼鏡名稱還帶顏色 ' + shopNames.join(','));
    G.outfit.head = 'bear_muffs';
    const leaked = renderGirl(Object.assign({}, DEFAULT_OUTFIT, { head: 'bear_muffs', face: 'gl_sun_yel' }), 80, 100, { hair: { style: 'bob', color: 'black' } }).src;
    const clean = renderGirl(previewOutfit('face', 'gl_sun_yel'), 80, 100, { hair: { style: 'bob', color: 'black' } }).src;
    if (clean === leaked) fails.push('眼鏡預覽還帶著熊耳罩');
    G.wardrobe = keepWard; G.outfit.face = keepFace; G.outfit.head = keepHead;

    G.bells = 80000;
    const gid = 'gl_cat_pnk';
    const price = CLOTHES_BY_ID[gid].price;
    if (!buyAndWear(gid)) fails.push('買不了貓眼眼鏡');
    if (G.outfit.face !== gid) fails.push('買了眼鏡沒戴上');
    if (G.wardrobe.indexOf(gid) < 0) fails.push('衣櫃沒有新眼鏡');
    if (G.bells !== 80000 - price) fails.push('眼鏡價錢扣錯 ' + (80000 - G.bells));
    const hid = 'curly';
    if ((G.hairOwned || []).indexOf(hid) >= 0) fails.push('一開始就有捲髮');
    const hp = HAIR_BY_ID[hid].price;
    const before = G.bells;
    if (!spend(hp)) fails.push('買不起捲髮');
    else { G.hairOwned.push(hid); G.hair.style = hid; G.hair.color = 'silver'; }
    if (G.hair.style !== 'curly' || G.hair.color !== 'silver') fails.push('髮型髮色沒換上');
    if (G.bells !== before - hp) fails.push('髮型價錢扣錯');
    if (!buyAndWear('pearl_neck')) fails.push('買不了項鍊');
    if (!buyAndWear('beret')) fails.push('買不了帽子');
    // 眼鏡＋帽子＋項鍊同時穿
    if (G.outfit.face !== gid || G.outfit.head !== 'beret' || G.outfit.neck !== 'pearl_neck') fails.push('三樣沒有一起戴上');
    saveGame();
    const again = normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)));
    if (!again || again.hair.style !== 'curly' || again.hair.color !== 'silver' || again.outfit.face !== gid || again.outfit.neck !== 'pearl_neck' || again.outfit.head !== 'beret') fails.push('存檔重讀掉了新造型');
    if (again.hairOwned.indexOf('curly') < 0) fails.push('重讀掉了買過的捲髮');
    if (again.bells !== G.bells) fails.push('重讀鈴錢變了');

    const fit = currentOutfit();
    if (!fit.face || fit.face.id !== gid) fails.push('現在的穿搭沒有眼鏡');
    if (!fit.head || fit.head.id !== 'beret') fails.push('現在的穿搭沒有帽子');
    if (!fit.neck || fit.neck.id !== 'pearl_neck') fails.push('現在的穿搭沒有項鍊');
    // 道館換道服會拿掉頭飾，眼鏡跟項鍊留著（小可愛還是同一個人）
    const away = G.away;
    G.away = { place: 'dojo', idx: 0 };
    const dojo = currentOutfit();
    G.away = away;
    if (!dojo.face || dojo.face.id !== gid) fails.push('道館裡眼鏡不見了');
    if (!dojo.neck || dojo.neck.id !== 'pearl_neck') fails.push('道館裡項鍊不見了');
    if (dojo.head && dojo.head.id !== 'head_none') fails.push('道館沒有拿掉頭飾');

    const paint = (sc, outfit) => {
      const cv = document.createElement('canvas'); cv.width = 160; cv.height = 180;
      const cx = cv.getContext('2d'); cx.translate(80, 168); cx.scale(sc, sc);
      drawGirl(cx, { t: 1.2, walking: true, outfit: outfit || currentOutfit(), hair: G.hair, face: 'joy', stage: 'school' });
      return cv.toDataURL();
    };
    try {
      const quest = paint(.54);
      const plain = paint(.54, Object.assign({}, currentOutfit(), { face: CLOTHES_BY_ID.face_none, head: CLOTHES_BY_ID.head_none, neck: CLOTHES_BY_ID.neck_none }));
      if (quest === plain) fails.push('闖關縮小之後看不出眼鏡帽子項鍊');
      paint(1); // 小屋裡的大小
      const cv = document.createElement('canvas'); cv.width = 120; cv.height = 140;
      const cx = cv.getContext('2d'); cx.translate(60, 120);
      drawGirl(cx, { t: 1, walking: true, back: true, outfit: currentOutfit(), hair: G.hair }); // 大地圖轉過去
    } catch (e) { fails.push('大地圖／闖關畫不出來 ' + e.message); }

    // 舊邀請卡沒有眼鏡欄，補不戴，不弄壞她原本的髮型
    const inv = cleanInvite({ v: 1, at: 1, n: '朋友', f: '', id: 'abc12345', o: { head: 'crown', top: 'uniform', bottom: 'red_shorts', shoes: 'black_shoes' }, h: { style: 'pony', color: 'brown' }, s: 'kinder', pn: [], r: [{ n: '房', w: 6, d: 6, wp: WALLPAPERS[0].id, fl: FLOORS[0].id, i: [], wi: [] }] });
    if (!inv) fails.push('舊邀請卡讀不出來');
    else {
      if (inv.h.style !== 'pony' || inv.h.color !== 'brown') fails.push('邀請卡髮型被改掉');
      if (inv.o.head !== 'crown') fails.push('邀請卡頭飾被改掉');
      if (inv.o.face !== 'face_none' || inv.o.neck !== 'neck_none') fails.push('舊邀請卡被戴上新飾品');
    }

    const baldA = shot(DEFAULT_OUTFIT, 70, 90, { hair: { style: 'bald', color: 'red' } });
    const baldB = shot(DEFAULT_OUTFIT, 70, 90, { hair: { style: 'bald', color: 'silver' } });
    if (baldA !== baldB) fails.push('尼姑頭還跟著髮色變');
    const sidePx = (style, x, y) => {
      const cv = document.createElement('canvas'); cv.width = 90; cv.height = 110;
      const cx = cv.getContext('2d'); cx.translate(45, 100);
      drawGirlHead(cx, { hair: { style: style, color: 'black' } });
      return cx.getImageData(x, y, 1, 1).data;
    };
    const cap = sidePx('azhi', 45, 38), cheek = sidePx('azhi', 32, 58), bobCheek = sidePx('bob', 32, 58);
    if (cap[0] > 80) fails.push('阿志頭的頭頂不是頭髮');
    if (cheek[0] < 180 || cheek[2] < 120) fails.push('阿志頭兩側沒有露出皮膚 ' + [cheek[0], cheek[1], cheek[2]].join(','));
    if (bobCheek[0] > 80 && cheek[0] > 180) { /* 妹妹頭兩側是頭髮、阿志頭是皮膚 */ }
    else if (bobCheek[0] > 180) fails.push('取樣點沒有落在妹妹頭的頭髮上');
    const cv = document.createElement('canvas'); cv.width = 140; cv.height = 160;
    const gx = cv.getContext('2d'); gx.translate(70, 145);
    const glassFit = {};
    OUTFIT_SLOTS.forEach(({ key }) => { glassFit[key] = CLOTHES_BY_ID[previewOutfit('face', 'gl_sun_yel')[key]]; });
    drawGirl(gx, { t: 0, outfit: glassFit, hair: { style: 'bob', color: 'black' } });
    const mid = gx.getImageData(70, 100, 1, 1).data, lens = gx.getImageData(64, 100, 1, 1).data;
    if (!(lens[0] > 150 && lens[2] < 110 && mid[2] > lens[2] + 30)) fails.push('太陽墨鏡兩片鏡片沒有分開（中間 ' + [mid[0], mid[1], mid[2]].join(',') + ' 鏡片 ' + [lens[0], lens[1], lens[2]].join(',') + '）');
    const kA = girlBakeKey({ hair: { style: 'afro', color: 'red' }, outfit: currentOutfit() });
    const kB = girlBakeKey({ hair: { style: 'buns', color: 'red' }, outfit: currentOutfit() });
    if (!kA || kA === kB) fails.push('站著的圖快取沒有算進髮型');
    const withClip = currentOutfit(); withClip.clip = CLOTHES_BY_ID.ribbon;
    const kC = girlBakeKey({ hair: { style: 'bob', color: 'black' }, outfit: withClip });
    const kD = girlBakeKey({ hair: { style: 'bob', color: 'black' }, outfit: currentOutfit() });
    if (!kC || kC === kD) fails.push('站著的圖快取沒有算進髮飾');
    const bag = names + HAIR_STYLES.map(h => h.name).join('') + HAIR_COLORS.map(h => h.name).join('');
    for (const ch of bag) { const cp = ch.codePointAt(0); if (cp >= 0x1FA70 && cp <= 0x1FAFF) fails.push('用了 Windows 10 顯示不出的表情符號'); }
    CLOTHES.concat(HAIR_STYLES).forEach(x => { if (typeof x.price === 'number' && x.price % 50) fails.push(x.name + ' 價格不好看 ' + x.price); });
    const sumP = l => l.reduce((s, x) => s + (x.price || 0), 0);
    const allCost = NEW_ROOM_COST.reduce((a, b) => a + b, 0)
      + ROOM_NAMES.length * Object.values(EXPAND_COST).reduce((a, b) => a + b, 0)
      + sumP(FURNITURE.filter(d => !d.gift)) + sumP(WALLPAPERS) + sumP(FLOORS) + sumP(CLOTHES) + sumP(HAIR_STYLES);
    if (allCost < 150000 || allCost > 220000) fails.push('全部買齊要 ' + allCost + '，不在 15～22 萬');

    G.guide = 'done';
    $('#modal').hidden = true;
    openTab('dress');
    const canvases = [].slice.call(document.querySelectorAll('#tabBody .dress-grid canvas, #tabBody .dress-grid img.girl-thumb'));
    if (canvases.length < 20) fails.push('換裝大圖太少 ' + canvases.length);
    const w = canvases[0] ? parseInt(canvases[0].style.width, 10) : 0;
    if (w < 80) fails.push('換裝圖示太小 ' + w);
    const sw = document.querySelector('#tabBody .swatch');
    const swr = sw ? sw.getBoundingClientRect() : { width: 0 };
    if (swr.width < 44) fails.push('髮色按鈕太小 ' + Math.round(swr.width));
    const txt = document.querySelector('#tabBody').textContent;
    ['麻花辮', '丸子頭', '捲髮', '短髮', '雙馬尾', '雙麻花', '側馬尾', '半扎髮', '眼鏡', '耳罩', '項鍊', '圓框眼鏡', '太陽墨鏡'].forEach(s => {
      if (txt.indexOf(s) < 0) fails.push('換裝頁沒有「' + s + '」');
    });
    const card = document.querySelector('#tabBody .dress-grid .card');
    const box = card.getBoundingClientRect();
    if (box.width < 70 || box.height < 110) fails.push('卡片點擊區太小 ' + Math.round(box.width) + 'x' + Math.round(box.height));
    return { fails, allCost, nFace: face.length, nHair: HAIR_STYLES.length, nHead: CLOTHES.filter(c => c.slot === 'head').length };
  });
  console.log(JSON.stringify({ allCost: r.allCost, nFace: r.nFace, nHair: r.nHair, nHead: r.nHead, fails: r.fails, errs }, null, 0));

  // 截圖：全部髮型一排、眼鏡造型×顏色、換裝頁的大按鈕
  const shots = await p.evaluate(() => {
    const label = (g, text, x, y) => { g.fillStyle = '#5c5346'; g.font = '700 16px "Microsoft JhengHei","PingFang TC",sans-serif'; g.textAlign = 'center'; g.fillText(text, x, y); };
    const hairC = document.createElement('canvas');
    const cols = HAIR_STYLES.length, cw = 150, ch = 210;
    hairC.width = cols * cw; hairC.height = ch + 230;
    const hg = hairC.getContext('2d');
    hg.fillStyle = '#fff8ef'; hg.fillRect(0, 0, hairC.width, hairC.height);
    HAIR_STYLES.forEach((h, i) => {
      const x = i * cw;
      hg.fillStyle = '#fff'; hg.fillRect(x + 8, 28, cw - 16, 168);
      hg.drawImage(renderGirl(Object.assign({}, DEFAULT_OUTFIT, { face: 'face_none', neck: 'neck_none' }), 130, 160, { hair: { style: h.id, color: i % 2 ? 'pink' : 'brown' } }), x + 10, 32);
      label(hg, h.name, x + cw / 2, 18);
    });
    const colors = HAIR_COLORS;
    const bw = Math.floor(hairC.width / colors.length);
    colors.forEach((c, i) => {
      const x = i * bw;
      hg.drawImage(renderGirl(DEFAULT_OUTFIT, 110, 140, { hair: { style: 'long', color: c.id } }), x + (bw - 110) / 2, 214);
      label(hg, c.name, x + bw / 2, hairC.height - 8);
    });
    const looks = ['gRound', 'gSquare', 'gHeart', 'gStar', 'gCat', 'gSun'];
    const tints = [];
    looks.forEach(() => {});
    const sample = looks.map(st => CLOTHES.filter(c => c.style === st));
    const gw = 130, gh = 176;
    const glassC = document.createElement('canvas');
    glassC.width = sample[0].length * gw;
    glassC.height = looks.length * gh + 8;
    const gg = glassC.getContext('2d');
    gg.fillStyle = '#fff8ef'; gg.fillRect(0, 0, glassC.width, glassC.height);
    sample.forEach((row, ri) => {
      row.forEach((c, ci) => {
        const x = ci * gw, y = ri * gh;
        gg.fillStyle = '#fff'; gg.fillRect(x + 6, y + 26, gw - 12, 140);
        gg.drawImage(renderGirl(Object.assign({}, DEFAULT_OUTFIT, { face: c.id }), 120, 140, { hair: { style: 'bob', color: 'black' } }), x + 5, y + 26);
        label(gg, c.name.replace('眼鏡', '').replace('太陽', '太陽'), x + gw / 2, y + 18);
      });
    });
    return { hair: hairC.toDataURL('image/png'), glasses: glassC.toDataURL('image/png') };
  });
  const outDir = '/opt/cursor/artifacts/screenshots';
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'hairstyles.png'), Buffer.from(shots.hair.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(outDir, 'glasses.png'), Buffer.from(shots.glasses.split(',')[1], 'base64'));
  await p.evaluate(() => { const b = document.querySelector('#tabBody'); if (b) b.scrollTop = 0; $('#modal').hidden = true; });
  const cap = async (file, scroll) => {
    if (scroll) await p.evaluate(scroll);
    await p.screenshot({ path: path.join(outDir, file), clip: { x: 0, y: 0, width: 480, height: 900 }, timeout: 8000, animations: 'disabled' }).catch(() => {});
  };
  await cap('dress-tab.png');
  await cap('dress-glasses.png', () => {
    const b = document.querySelector('#tabBody');
    const h = [].find.call(b.querySelectorAll('h3'), n => n.textContent === '眼鏡');
    if (h) h.scrollIntoView({ block: 'start' });
  });
  await b.close();
  if (r.fails.length || errs.length) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
