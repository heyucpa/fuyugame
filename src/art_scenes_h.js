/* ===== 「第一關守住了」slip 結局插圖 =====
   共同語彙：左上角綠色徽章＝第 1 次你守住了；右上角虛線框＝第 2 次還沒守住
*/
// tone 預設是綠色（第一關守住、後面只是少一步）；
// 傳 'warn' 用琥珀色——那幾篇第二次真的出事了，不該用慶祝的綠勾
const HOLD1 = (tone) => {
  const warn = tone === 'warn';
  const bg = warn ? '#ffeec2' : '#b7f0c2';
  const fg = warn ? '#a07a00' : '#1e7d46';
  return '<g><rect x="6" y="5" width="74" height="21" rx="10.5" fill="' + bg +
    '" stroke="' + fg + '" stroke-width="1.8"/>' +
    '<path d="M15 15 l4 4.5 l8 -9" fill="none" stroke="' + fg + '" stroke-width="2.6" ' +
    'stroke-linecap="round" stroke-linejoin="round"/>' +
    '<text x="52" y="19.5" font-size="10.5" fill="' + fg +
    '" text-anchor="middle" font-weight="bold">第1次做對</text></g>';
};

const AGAIN = (label) =>
  '<g class="fadeDanger"><rect x="106" y="5" width="88" height="36" rx="9" fill="#fff7e2" ' +
  'stroke="#a07a00" stroke-width="2.2" stroke-dasharray="6 5"/>' +
  '<text x="150" y="19" font-size="9.5" fill="#c08a00" text-anchor="middle" font-weight="bold">第2次</text>' +
  '<text x="150" y="34" font-size="11" fill="#a07a00" text-anchor="middle" font-weight="bold">' + label + '</text></g>';

// 男同學（簡單的男生身形，重複用在幾個校園場景）
const BOY = (x, y, s, color) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  LIMB(-11, -30, -16, -14, 6) + LIMB(11, -30, 16, -14, 6) +
  '<path d="M-13 0 L-10 -38 L10 -38 L13 0 Z" fill="' + (color || '#8a8f96') +
  '" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
  '<circle cx="0" cy="-50" r="12" fill="#fde2c5" stroke="#33224a" stroke-width="1.6"/>' +
  '<path d="M-12 -52 q-1 -15 12 -15 q13 0 12 15 q-3 -6 -12 -6 q-9 0 -12 6 Z" fill="#33224a"/>' +
  '<circle cx="-4" cy="-51" r="1.5" fill="#33224a"/><circle cx="4" cy="-51" r="1.5" fill="#33224a"/>' +
  '<path d="M-4 -43 h8" stroke="#33224a" stroke-width="1.6" stroke-linecap="round"/></g>';

Object.assign(ART_SCENES, {
  // 🚗 進到店裡了，但沒告訴店員
  'road.slip': SVG('小女生站在便利商店門邊，門外那台車又停下來了',
    BG('#fff4e0', '#c8c0b0') +
    '<rect x="120" y="48" width="76" height="70" fill="#eaf4ff" stroke="#33224a" stroke-width="2"/>' +
    '<path d="M158 48 v70" stroke="#33224a" stroke-width="1.6"/>' +
    '<g class="fadeDanger">' + CAR(158, 110, 0.6, true) + '</g>' +
    SHELF(26, 118, 0.62) +
    HELPER(58, 92, 0.82, '#2f8f5b', false) +
    GIRL(104, 118, 0.9, { mood: 'flat' }) +
    EMO(84, 56, '👀', 13) +
    HOLD1() + AGAIN('也要告訴店員')),

  // 📱 封鎖了，但回了他一句
  'online.slip': SVG('新帳號又傳訊息來，小女生回了一句對不起',
    BG('#eefaf0') + PHONE(150, 74, 0.82) +
    '<circle cx="150" cy="54" r="8" fill="#c9a98a" stroke="#33224a" stroke-width="1.3"/>' +
    '<rect x="132" y="70" width="36" height="9" rx="4.5" fill="#fff" stroke="#8a8f96" stroke-width="1"/>' +
    '<rect x="136" y="84" width="32" height="9" rx="4.5" fill="#a8e6c0" stroke="#33224a" stroke-width="1"/>' +
    '<text x="152" y="91.5" font-size="6.5" fill="#33224a" text-anchor="middle">對不起</text>' +
    GIRL(56, 118, 0.92, { mood: 'flat' }) + EMO(80, 74, '💬', 13) +
    HOLD1() + AGAIN('一個字都別回')),

  // 😔 告訴老師了，但被罵告狀就退縮
  'bully.slip': SVG('小女生低頭走開，小柔又變成一個人吃飯',
    BG('#f2f7ff', '#c8dcf0') +
    '<g class="fadeDanger">' + GIRL(150, 118, 0.82, { pose: 'sit', dress: '#7fc1ed', mood: 'flat' }) +
    EMO(166, 106, '🍱', 13) + '</g>' +
    GIRL(52, 118, 0.9, { mood: 'flat' }) + EMO(76, 78, '💧', 13) +
    HOLD1('warn') + AGAIN('別躲開小柔')),

  // 🌏 疏散對了，但陪同學回教室拿書包
  'quake.slip': SVG('餘震來了，兩個人躲在教室的桌子底下',
    BG('#fff6e6', '#d8c3a0') + DESK(102, 118, 0.98) +
    GIRL(82, 118, 0.7, { pose: 'sit', mood: 'flat' }) +
    GIRL(122, 118, 0.7, { pose: 'sit', dress: '#7fc1ed', mood: 'flat' }) +
    EMO(146, 112, '🎒', 13) +
    '<g class="fadeDanger">' + EMO(14, 66, '〰️', 18) + EMO(174, 66, '〰️', 18) + '</g>' +
    HOLD1('warn') + AGAIN('要等老師說可以')),

  // 🏠 沒開門，但隔著門大喊
  'home.slip': SVG('小女生隔著門大喊，門外的腳步聲慢慢走掉',
    BG('#fff6e6', '#d8c3a0') + DOOR(152, 118, 0.74) +
    GIRL(58, 118, 0.95, { pose: 'shout' }) +
    SPEECH(96, 58, '走開') +
    '<g class="fadeDanger">' + EMO(184, 92, '👣', 14) + '</g>' +
    HOLD1() + AGAIN('安靜打 110')),

  // 📱 關掉了，但第二次點進去
  'scam.slip': SVG('假畫面要小女生輸入帳號密碼，還在倒數計時',
    BG('#eefaf0') + PHONE(148, 74, 0.84) +
    '<rect x="130" y="54" width="36" height="10" rx="2" fill="#fff" stroke="#8a8f96" stroke-width="1"/>' +
    '<rect x="130" y="68" width="36" height="10" rx="2" fill="#fff" stroke="#8a8f96" stroke-width="1"/>' +
    '<text x="148" y="93" font-size="9" fill="#a33" text-anchor="middle" font-weight="bold">09:58</text>' +
    GIRL(56, 118, 0.92, { mood: 'flat' }) + EMO(82, 74, '❗', 15, 'clash') +
    HOLD1() + AGAIN('嚇你的都是假的')),

  // 🔥 都做對了，但讓媽媽上樓拿手機
  'fire.slip': SVG('媽媽回樓上拿手機，小女生一個人在樓下等',
    BG('#e6e2f5', '#8f83b3') +
    '<rect x="112" y="46" width="82" height="72" fill="#efe6d4" stroke="#33224a" stroke-width="2"/>' +
    '<rect x="122" y="56" width="22" height="20" fill="#cfe6ff" stroke="#33224a" stroke-width="1.3"/>' +
    '<rect x="162" y="56" width="22" height="20" fill="#cfe6ff" stroke="#33224a" stroke-width="1.3"/>' +
    '<rect x="140" y="84" width="26" height="34" fill="#c98f52" stroke="#33224a" stroke-width="1.6"/>' +
    '<g class="fadeDanger"><circle cx="133" cy="66" r="5" fill="#a8e6c0"/>' +
    '<circle cx="173" cy="64" r="4" fill="#a8e6c0"/></g>' +
    '<g class="fadeDanger">' + MOM(128, 118, 0.6) + '</g>' +
    GIRL(48, 118, 0.9, { mood: 'flat' }) + EMO(72, 80, '🕐', 15) +
    HOLD1('warn') + AGAIN('大人也要等')),

  // 🏊 救人對了，但答應保密
  'pool.slip': SVG('岸邊，嗆到水的同學要小女生不要跟大人講',
    '<rect width="200" height="130" fill="#eaf6ff"/>' + WATER(30) +
    '<rect x="0" y="88" width="200" height="42" fill="#dfe6ee"/>' +
    '<rect x="0" y="88" width="200" height="4" fill="#b9c3cc"/>' +
    GIRL(62, 122, 0.88, { mood: 'flat' }) +
    GIRL(114, 122, 0.84, { pose: 'sit', dress: '#7fc1ed', mood: 'flat' }) +
    EMO(136, 100, '💧', 12) + EMO(140, 78, '🤫', 16) +
    HOLD1('warn') + AGAIN('還是要說')),

  // 💰 讓大人知道了，但又借他錢
  'money.slip': SVG('小女生又借錢給同學，錢一去不回',
    BG('#fffbe6') +
    GIRL(56, 118, 0.9, { pose: 'reachR', mood: 'flat' }) +
    BOY(118, 118, 0.86) + EMO(86, 74, '💵', 15) +
    '<g class="fadeDanger">' + EMO(146, 62, '💵', 12) + EMO(162, 50, '💵', 11) + '</g>' +
    HOLD1('warn') + AGAIN('不是你的責任')),

  // 📝 自己沒作弊，但沒提醒朋友
  'exam.slip': SVG('小美作弊被老師抓到，小女生在旁邊看著',
    BG('#f2f7ff', '#c8dcf0') +
    ADULT(164, 118, 0.74, { color: '#5e8f78', pose: 'reachL' }) +
    GIRL(122, 118, 0.78, { dress: '#7fc1ed', mood: 'flat' }) +
    GIRL(56, 118, 0.88, { mood: 'flat' }) +
    EMO(146, 66, '❗', 14, 'clash') + EMO(80, 78, '😟', 13) +
    HOLD1() + AGAIN('一句提醒就夠')),

  // 🤫 說出來了，但回了對不起
  'secret.slip': SVG('對方傳訊息說你害我，小女生回了對不起',
    BG('#fff0f6') + PHONE(150, 74, 0.82) +
    '<rect x="130" y="54" width="34" height="9" rx="4.5" fill="#fff" stroke="#8a8f96" stroke-width="1"/>' +
    '<rect x="130" y="67" width="26" height="9" rx="4.5" fill="#fff" stroke="#8a8f96" stroke-width="1"/>' +
    '<rect x="136" y="84" width="32" height="9" rx="4.5" fill="#a8e6c0" stroke="#33224a" stroke-width="1"/>' +
    '<text x="152" y="91.5" font-size="6.5" fill="#33224a" text-anchor="middle">對不起</text>' +
    GIRL(54, 118, 0.92, { mood: 'flat' }) + EMO(80, 76, '😟', 14) +
    HOLD1('warn') + AGAIN('要道歉的是他')),

  // 🚔 掛掉了，但第二通聽下去
  'fakecop.slip': SVG('同一個號碼換一個身分又打來，小女生聽了幾句',
    BG('#eefaf0') +
    '<rect x="122" y="52" width="58" height="60" rx="8" fill="#33224a"/>' +
    '<rect x="127" y="58" width="48" height="40" rx="3" fill="#cfe6ff"/>' +
    '<text x="151" y="82" font-size="9" fill="#33224a" text-anchor="middle" font-weight="bold">同一個號碼</text>' +
    GIRL(52, 118, 0.92, { mood: 'flat' }) +
    '<rect x="72" y="70" width="10" height="18" rx="3" fill="#33224a"/>' +
    EMO(92, 52, '📞', 14) +
    HOLD1() + AGAIN('直接掛掉')),

  // 🛍️ 自己沒買，但幫忙分享
  'shop.slip': SVG('小女生把假特價分享到班群，三個同學被騙',
    BG('#eefaf0') + PHONE(48, 74, 0.76) + EMO(38, 86, '📤', 18) +
    GIRL(96, 118, 0.86, { mood: 'flat' }) +
    '<g class="fadeDanger">' + GIRL(140, 118, 0.7, { dress: '#a8e6c0', mood: 'flat' }) +
    BOY(166, 118, 0.66, '#b6a7d6') + EMO(128, 66, '💸', 13) + EMO(180, 60, '💸', 12) + '</g>' +
    HOLD1('warn') + AGAIN('別幫忙分享')),

  // 👤 上次識破了，這次還是買了點數卡
  'imposter.slip': SVG('小女生買了點數卡，本人卻說我沒有傳給你',
    BG('#eefaf0') +
    '<rect x="120" y="70" width="42" height="26" rx="4" fill="#ffd23f" stroke="#33224a" stroke-width="1.8"/>' +
    '<path d="M120 80 h42" stroke="#33224a" stroke-width="1.4"/>' +
    '<text x="141" y="92" font-size="8" fill="#33224a" text-anchor="middle" font-weight="bold">點數卡</text>' +
    GIRL(56, 118, 0.9, { pose: 'reachR', mood: 'flat' }) +
    '<g class="fadeDanger">' + BOY(180, 118, 0.7, '#7fc1ed') + EMO(166, 58, '❓', 14) + '</g>' +
    HOLD1('warn') + AGAIN('先打電話確認')),

  // 🍳 求助對了，但沒指認
  'breakfast.slip': SVG('老闆送小女生回家，那個人還站在對面看著',
    BG('#efe6f8', '#9b8ec0') +
    '<rect x="0" y="40" width="58" height="78" fill="#fff6e0" stroke="#33224a" stroke-width="1.6"/>' +
    '<rect x="0" y="40" width="58" height="14" fill="#e0a76a" stroke="#33224a" stroke-width="1.4"/>' +
    '<rect x="8" y="62" width="20" height="20" fill="#cfe6ff" stroke="#33224a" stroke-width="1.3"/>' +
    '<rect x="34" y="62" width="18" height="56" fill="#c98f52" stroke="#33224a" stroke-width="1.4"/>' +
    HELPER(78, 96, 0.72, '#e74c3c', false) +
    GIRL(108, 118, 0.86, { mood: 'flat' }) +
    '<g class="fadeDanger"><rect x="152" y="50" width="48" height="8" fill="#8f83b3"/>' +
    '<rect x="154" y="58" width="6" height="60" fill="#b6a7d6"/>' +
    BOY(178, 118, 0.76) + EMO(190, 62, '👀', 13) + '</g>' +
    HOLD1() + AGAIN('要指認出來')),

  // 🍬 跟老師說了，但事後道歉
  'candy.slip': SVG('小女生跟同學道歉，他後來又拿東西給別人',
    BG('#f2f7ff', '#c8dcf0') +
    GIRL(50, 118, 0.88, { mood: 'flat' }) + BOY(94, 118, 0.82) +
    SPEECH(70, 36, '抱歉') +
    '<g class="fadeDanger">' + BOY(146, 118, 0.66, '#b6a7d6') +
    GIRL(176, 118, 0.62, { dress: '#a8e6c0', mood: 'flat' }) + EMO(154, 62, '🍬', 13) + '</g>' +
    HOLD1() + AGAIN('這條線不能退')),

  // 🚨 離開又找老師了，但說不出經過
  'knife.slip': SVG('老師問小女生看到什麼，她還在發抖說不出話',
    BG('#f2f7ff', '#c8dcf0') +
    ADULT(146, 118, 0.78, { color: '#5e8f78', pose: 'reachL' }) +
    GIRL(72, 118, 0.9, { mood: 'flat' }) +
    '<g class="fadeDanger"><path d="M104 52 q22 0 22 12 q0 12 -22 12 q-4 5 -10 6 q3 -4 2 -7 ' +
    'q-14 -3 -14 -11 q0 -12 22 -12 Z" fill="#fff" stroke="#a07a00" stroke-width="1.6" stroke-dasharray="4 4"/>' +
    '<text x="111" y="69" font-size="12" fill="#a07a00">…</text></g>' +
    EMO(50, 90, '💦', 14) +
    HOLD1() + AGAIN('慢慢說就好')),
});

/* ===== bully 後果卡模式：兩個新結局的插圖 =====
   不用 HOLD1/AGAIN 的「守住／沒守住」語彙，因為這兩張不是在評分，
   而是在呈現「你這樣選之後，事情變成什麼樣子」
*/
// 一長串快速跳出的班群訊息（只有色塊，不寫具體字，避免變成罵人範本）
const CHATLINES = (x, y, w) =>
  Array.from({ length: 6 }, (_, i) => {
    const right = i % 2 === 1, bw = w * (0.5 + ((i * 37) % 40) / 100);
    return '<rect x="' + (right ? x + w - bw : x) + '" y="' + (y + i * 11) + '" width="' + bw +
      '" height="8" rx="4" fill="' + (right ? '#ffc9c9' : '#e2dcee') + '" stroke="#8a7fa8" stroke-width="0.7"/>';
  }).join('');

Object.assign(ART_SCENES, {
  // 💬 在班群裡吵到底 —— 兩個人都被捲進去
  'bully.chatfight': SVG('班群訊息一直跳出來，小女生皺著眉看著手機',
    BG('#f2f7ff', '#c8dcf0') +
    '<g transform="translate(142,66)"><rect x="-34" y="-52" width="68" height="106" rx="10" fill="#33224a"/>' +
    '<rect x="-29" y="-45" width="58" height="92" rx="3" fill="#f7f4ff"/>' +
    '<rect x="-29" y="-45" width="58" height="13" rx="3" fill="#cbbce0"/>' +
    '<text x="0" y="-35.5" font-size="8" fill="#33224a" text-anchor="middle" font-weight="bold">班群</text></g>' +
    CHATLINES(116, 40, 52) +
    '<g class="fadeDanger"><circle cx="122" cy="104" r="6.5" fill="#7fc1ed" stroke="#33224a" stroke-width="1.2"/>' +
    '<rect x="132" y="99" width="34" height="10" rx="5" fill="#ffc9c9" stroke="#8a7fa8" stroke-width="0.7"/>' +
    '<text x="149" y="106.5" font-size="7" fill="#8a7fa8" text-anchor="middle" font-weight="bold">小柔</text></g>' +
    GIRL(52, 118, 0.96, { pose: 'sit', mood: 'flat' }) +
    EMO(76, 58, '💢', 16, 'clash') + EMO(20, 68, '💧', 13)),

  // 💬 回罵回去 —— 老師只看到兩個人在吵
  'bully.retaliate': SVG('走廊上兩個學生隔著距離生氣對話，老師從遠處走過來',
    BG('#f2f7ff', '#c8dcf0') +
    '<rect x="0" y="30" width="200" height="8" fill="#b6a7d6"/>' +
    '<rect x="14" y="38" width="7" height="80" fill="#cbbce0"/>' +
    '<rect x="186" y="38" width="7" height="80" fill="#cbbce0"/>' +
    '<g class="fadeDanger">' + ADULT(178, 118, 0.6, { color: '#5e8f78', pose: 'reachL' }) +
    EMO(160, 62, '👀', 12) + '</g>' +
    GIRL(56, 118, 0.92, { pose: 'shout' }) +
    BOY(114, 118, 0.88) +
    '<g class="clash">' +
    '<path d="M78 60 l10 6 l-9 4 l11 6" stroke="#e74c3c" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M98 60 l-10 6 l9 4 l-11 6" stroke="#e74c3c" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>' +
    EMO(34, 58, '💢', 14) + EMO(128, 56, '💢', 14)),
});

/* ===== money 後果卡模式：兩個新結局的插圖 ===== */
Object.assign(ART_SCENES, {
  // 💬 那筆錢沒有再提起 —— 兩個人之間多了一段距離
  'money.unpaid': SVG('小女生和同學各坐一邊，中間空著一段距離',
    BG('#fffbe6', '#e0d6b8') +
    DESK(46, 118, 0.62) + DESK(154, 118, 0.62) +
    GIRL(46, 118, 0.88, { pose: 'sit', mood: 'flat' }) +
    BOY(154, 118, 0.84, '#8a8f96') +
    // 中間那段講不出口的距離
    '<g class="fadeDanger">' +
    '<path d="M78 96 h44" stroke="#a07a00" stroke-width="2.2" stroke-dasharray="5 5" fill="none"/>' +
    '<path d="M78 96 l6 -4 M78 96 l6 4 M122 96 l-6 -4 M122 96 l-6 4" stroke="#a07a00" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
    EMO(93, 84, '💵', 13) + '</g>' +
    EMO(70, 62, '💭', 15) + EMO(126, 60, '💭', 13)),

  // 💬 你劃出了一條線 —— 界線畫出來了，人還在
  'money.boundary': SVG('小女生站著把話說清楚，中間有一條線，同學還站在那裡',
    BG('#fffbe6', '#e0d6b8') +
    // 地上的界線：實線，不是牆
    '<path d="M100 54 v64" stroke="#1e7d46" stroke-width="3" stroke-dasharray="7 4" stroke-linecap="round"/>' +
    '<rect x="60" y="14" width="80" height="22" rx="11" fill="#b7f0c2" stroke="#1e7d46" stroke-width="1.8"/>' +
    '<text x="100" y="29" font-size="11" fill="#1e7d46" text-anchor="middle" font-weight="bold">這次我不借</text>' +
    '<path d="M100 36 v14" stroke="#1e7d46" stroke-width="1.6"/>' +
    GIRL(52, 118, 0.94, { pose: 'reachR' }) +
    BOY(148, 118, 0.86, '#8a8f96') +
    EMO(176, 76, '😐', 14)),
});

