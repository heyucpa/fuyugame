/* ===== 開場定場圖：每一篇故事開頭一張 =====

   規則（跟結局插圖不一樣，要特別守）：
   只交代「情境」，不交代「評價」。
   - 不畫兇臉、不畫武器、不畫危險符號
   - 不暗示哪個選項是對的——她還沒選，圖不能幫她選
   - 中性到「把圖遮住，故事一樣讀得懂；把字遮住，看不出誰是好人壞人」

   例如「教室裡的危險」不畫美工刀，只畫「後面吵起來、她回頭」；
   「不能說的秘密」不把那個大人畫成壞人，只畫「有人送禮物」。
*/

// 幾個開場常用、但結局圖沒有的小佈景
const STREET = () =>
  '<rect width="200" height="130" fill="#dfeaf5"/>' +
  '<rect x="0" y="104" width="200" height="26" fill="#b9c3cc"/>' +
  '<rect x="0" y="104" width="200" height="3" fill="#9aa4ad"/>' +
  '<path d="M14 117 h18 M50 117 h18 M86 117 h18 M122 117 h18 M158 117 h18" ' +
  'stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>';

const ROOM = (wall, floor) =>
  '<rect width="200" height="130" fill="' + (wall || '#f4eee4') + '"/>' +
  '<rect x="0" y="100" width="200" height="30" fill="' + (floor || '#d9c8a8') + '"/>' +
  '<rect x="0" y="100" width="200" height="2.5" fill="#b9a888"/>';

const WINDOW = (x, y, w, h) =>
  '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" ' +
  'fill="#cfe6ff" stroke="#33224a" stroke-width="1.8"/>' +
  '<path d="M' + (x + w / 2) + ' ' + y + ' v' + h + ' M' + x + ' ' + (y + h / 2) + ' h' + w + '" ' +
  'stroke="#33224a" stroke-width="1.2"/>';

const TV = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<rect x="-24" y="-18" width="48" height="32" rx="3" fill="#33224a"/>' +
  '<rect x="-20" y="-14" width="40" height="24" rx="2" fill="#7fc1ed"/>' +
  '<rect x="-5" y="14" width="10" height="5" fill="#33224a"/></g>';

const SIGN = (x, y, w, txt, bg) =>
  '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="16" rx="3" fill="' + (bg || '#ffd23f') +
  '" stroke="#33224a" stroke-width="1.6"/>' +
  '<text x="' + (x + w / 2) + '" y="' + (y + 12) + '" font-size="9" fill="#33224a" ' +
  'text-anchor="middle" font-weight="bold">' + txt + '</text>';

Object.assign(ART_SCENES, {

  // 1 放學路上 —— 車就是一台車，不畫駕駛的臉
  'road.intro': SVG('放學路上，一台車停在人行道旁',
    STREET() + '<rect x="150" y="52" width="50" height="52" fill="#cfd6dc"/>' +
    GIRL(58, 104, 0.95) + CAR(140, 104, 0.9, true)),

  // 2 網路上的新朋友 —— 只有遊戲畫面，不畫對方
  'online.intro': SVG('小女生在玩線上遊戲，螢幕上有隊友',
    ROOM('#efe8fa', '#cfc7de') +
    GIRL(56, 100, 0.95, { pose: 'sit' }) + PHONE(140, 66, 0.95) +
    EMO(128, 58, '🎮', 14) + EMO(152, 92, '💬', 12)),

  // 3 班上的事 —— 一群人在一邊，一個人在另一邊。不畫誰在欺負誰
  'bully.intro': SVG('教室裡，幾個同學聚在一起，一個同學自己坐著',
    '<rect width="200" height="130" fill="#f2f7ff"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#dfe6ee"/>' + BOARD(62, 4) +
    GIRL(118, 104, 0.8, { dress: '#a8e6c0' }) + GIRL(142, 104, 0.8, { dress: '#ffd23f' }) +
    GIRL(166, 104, 0.8, { dress: '#c9a2e8' }) +
    GIRL(28, 104, 0.8, { pose: 'sit', dress: '#7fc1ed', mood: 'flat' })),

  // 4 地震來了 —— 桌子在搖，人還坐著
  'quake.intro': SVG('上課中，教室的桌子開始輕輕搖晃',
    '<rect width="200" height="130" fill="#f2f7ff"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#dfe6ee"/>' + BOARD(118, 6) +
    DESK(140, 104, 0.62) + GIRL(46, 104, 0.92, { pose: 'sit', mood: 'flat' }) +
    '<g class="bob">' + EMO(84, 52, '〜', 20) + EMO(100, 40, '〜', 15) + '</g>'),

  // 5 一個人在家 —— 只有她和門
  'home.intro': SVG('家裡只有小女生一個人',
    ROOM() + DOOR(150, 100, 0.9) + TV(48, 74, 0.9) +
    GIRL(96, 100, 0.95, { pose: 'sit' })),

  // 6 手機裡的訊息 —— 跳出一則通知，不寫內容
  'scam.intro': SVG('平板跳出一則通知',
    ROOM('#eef6ee', '#c8dcc8') + GIRL(52, 100, 0.95, { pose: 'sit' }) +
    PHONE(140, 68, 1.05) + EMO(126, 44, '🔔', 15, 'bob')),

  // 7 廚房起火了 —— 她在客廳，廚房方向飄出味道。不畫火，火在故事裡才出現
  'fire.intro': SVG('小女生在客廳看電視，廚房方向飄來怪味道',
    ROOM() +
    '<rect x="136" y="44" width="64" height="56" fill="#efe6d4" stroke="#33224a" stroke-width="1.8"/>' +
    '<rect x="146" y="56" width="44" height="9" rx="2" fill="#9aa4ad" stroke="#33224a" stroke-width="1.3"/>' +
    '<g class="fadeDanger"><circle cx="160" cy="40" r="6" fill="#cfd6dc"/>' +
    '<circle cx="172" cy="30" r="4.5" fill="#cfd6dc"/><circle cx="150" cy="28" r="3.5" fill="#cfd6dc"/></g>' +
    TV(44, 74, 0.85) + GIRL(92, 100, 0.9, { pose: 'sit', mood: 'flat' })),

  // 8 泳池邊 —— 水、岸邊、她站著
  'pool.intro': SVG('小女生站在泳池邊',
    '<rect width="200" height="130" fill="#eaf6ff"/>' + WATER(58) +
    '<rect x="0" y="86" width="200" height="44" fill="#dfe6ee"/>' +
    '<rect x="0" y="86" width="200" height="4" fill="#b9c3cc"/>' +
    GIRL(46, 122, 0.92, { mood: 'flat' }) +
    GIRL(150, 122, 0.82, { dress: '#7fc1ed', pose: 'cheer' })),

  // 9 賣場走失 —— 貨架前看模型，媽媽已經不在畫面裡
  'lost.intro': SVG('賣場裡，小女生停在貨架前看玩具',
    ROOM('#fffbe6', '#e6dcc0') + SHELF(150, 100, 1.05) + SHELF(196, 100, 1.05) +
    GIRL(62, 100, 0.95, { pose: 'reachR' }) + EMO(92, 62, '🧸', 15)),

  // 10 同學的請求 —— 兩個同學說話，不畫錢
  'money.intro': SVG('教室裡，同學走過來跟小女生說話',
    '<rect width="200" height="130" fill="#fffbe6"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#eee0bc"/>' + BOARD(140, 14) +
    GIRL(60, 104, 0.95) + BOY(112, 104, 0.9) + EMO(84, 52, '💬', 14)),

  // 11 考試那天 —— 課本和明天的考試
  'exam.intro': SVG('書桌上攤著課本，明天要考試',
    ROOM('#f6f2ff', '#d9d0e8') + DESK(126, 100, 0.78) +
    '<rect x="102" y="42" width="42" height="30" rx="2" fill="#fff" stroke="#33224a" stroke-width="1.8"/>' +
    '<path d="M110 54 h26 M110 62 h18" stroke="#c8c8d8" stroke-width="2.2" stroke-linecap="round"/>' +
    GIRL(50, 100, 0.95, { pose: 'sit', mood: 'flat' }) + EMO(74, 56, '💭', 14)),

  // 12 不能說的秘密 —— 一個大人送禮物。刻意畫成溫和的，因為現實中就是溫和的
  'secret.intro': SVG('一位認識的大人送禮物給小女生',
    ROOM('#fff0f6', '#e8d0dc') +
    GIRL(58, 100, 0.95) + ADULT(140, 100, 0.85, { color: '#b6a7d6', pose: 'reachL' }) +
    EMO(96, 68, '🎁', 16)),

  // 13 自稱警察的電話 —— 只有電話在響
  'fakecop.intro': SVG('家裡的電話響了，只有小女生一個人在家',
    ROOM('#eef6ee', '#c8dcc8') + DESK(150, 100, 0.62) +
    '<g class="bob"><rect x="136" y="56" width="30" height="18" rx="4" fill="#33224a"/>' +
    '<rect x="141" y="60" width="20" height="7" rx="2" fill="#cfe6ff"/></g>' +
    EMO(142, 44, '📞', 15, 'clash') +
    GIRL(56, 100, 0.95, { pose: 'sit', mood: 'flat' })),

  // 14 便宜的遊戲點數 —— 想要的造型 800，零用錢 300
  'shop.intro': SVG('遊戲裡想要的造型要 800 元，零用錢只有 300',
    ROOM('#eefaf0', '#c4e4cf') + PHONE(146, 66, 1) +
    EMO(132, 44, '✨', 14, 'twinkle') +
    GIRL(50, 100, 0.95, { pose: 'sit' }) +
    SIGN(74, 52, 34, '800', '#ffd23f') + SIGN(74, 74, 34, '300', '#cfd6dc')),

  // 15 好朋友傳來的訊息 —— 手機上是好朋友的名字
  'imposter.intro': SVG('晚上，好朋友傳訊息來',
    ROOM('#eef2fa', '#ccd4e4') + GIRL(52, 100, 0.95, { pose: 'sit' }) +
    PHONE(142, 66, 1.05) +
    '<rect x="124" y="44" width="36" height="8" rx="4" fill="#fff" stroke="#8a8f96" stroke-width="1"/>' +
    '<rect x="124" y="56" width="26" height="8" rx="4" fill="#fff" stroke="#8a8f96" stroke-width="1"/>' +
    EMO(126, 96, '💬', 13)),

  // 16 去買早餐 —— 巷口的早餐店，走路三分鐘
  'breakfast.intro': SVG('週末早上，小女生自己走到巷口的早餐店',
    STREET() + '<rect x="120" y="40" width="80" height="64" fill="#fff4d6" stroke="#33224a" stroke-width="1.8"/>' +
    SIGN(130, 46, 60, '🍳 早餐', '#ffd23f') +
    WINDOW(134, 68, 24, 24) + WINDOW(166, 68, 24, 24) +
    GIRL(52, 104, 0.95) + EMO(76, 66, '💵', 13)),

  // 17 同學給的糖果 —— 走廊角落，手裡有一小包東西
  'candy.intro': SVG('下課時間，同學在走廊角落拿出一小包東西',
    '<rect width="200" height="130" fill="#f2f7ff"/>' +
    '<rect x="0" y="0" width="200" height="30" fill="#dfe6ee"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#cfd6dc"/>' +
    GIRL(64, 104, 0.95, { mood: 'flat' }) + BOY(122, 104, 0.9, '#7fc1ed') +
    '<rect x="94" y="62" width="16" height="12" rx="3" fill="#ff8fb8" stroke="#33224a" stroke-width="1.4"/>'),

  // 18 等不到爸媽 —— 校門口、天色暗、只剩她
  'gate.intro': SVG('放學後的校門口，天色暗了，只剩小女生一個人',
    '<rect width="200" height="130" fill="#cfc7de"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#9aa4ad"/>' +
    '<rect x="140" y="34" width="10" height="70" fill="#8a8f96"/>' +
    '<rect x="188" y="34" width="10" height="70" fill="#8a8f96"/>' +
    '<rect x="140" y="34" width="58" height="9" fill="#8a8f96"/>' +
    EMO(158, 22, '🌙', 14) +
    GIRL(58, 104, 0.95, { mood: 'flat' })),

  // 19 教室裡的危險 —— 只畫「後面吵起來、她回頭」。刻意不畫刀，也不畫誰對誰錯
  'knife.intro': SVG('教室後面突然吵了起來，小女生回頭看',
    '<rect width="200" height="130" fill="#f2f7ff"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#dfe6ee"/>' +
    WINDOW(14, 18, 30, 28) + WINDOW(54, 18, 30, 28) +
    GIRL(52, 104, 0.9, { pose: 'reachR', mood: 'flat' }) +
    '<g class="fadeDanger">' + BOY(140, 104, 0.85, '#9aa4ad') + BOY(174, 104, 0.85, '#b6a7d6') +
    EMO(150, 40, '💢', 16) + '</g>'),

  // 20 跆拳道館下課 —— 樓梯間、一樓的小吃店
  'dojo.intro': SVG('跆拳道館下課，姊妹在等媽媽，教練在收器材',
    DOJO() +
    HELPER(168, 100, 0.72, '#33224a', false) +
    DOBOK(62, 100, 0.86, '#e85a92') +
    DOBOK(96, 100, 0.66, '#ffd23f') +
    EMO(120, 44, '🕐', 15, 'ring')),

  // 21 同學賣的幸運手鍊 —— 走廊角落、一條普通串珠手鍊
  'wish.intro': SVG('下課時間，同學在走廊拿出一條手鍊',
    '<rect width="200" height="130" fill="#f6f2ff"/>' +
    '<rect x="0" y="0" width="200" height="30" fill="#e4dcf2"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#cfc7de"/>' +
    GIRL(62, 104, 0.95, { mood: 'flat' }) + GIRL(126, 104, 0.9, { dress: '#a8e6c0' }) +
    '<g class="twinkle">' +
    Array.from({ length: 7 }, (_, i) =>
      '<circle cx="' + (88 + i * 5) + '" cy="' + (66 + (i % 2 ? 2 : 0)) + '" r="2.6" ' +
      'fill="#ffd23f" stroke="#33224a" stroke-width="0.8"/>').join('') + '</g>'),
});

// 開場圖是選配的：沒有就不顯示，不要掉到結局的預設圖去
function introFor(scenarioId) {
  return ART_SCENES[scenarioId + '.intro'] || '';
}

