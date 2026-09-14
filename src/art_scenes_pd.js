/* ===== 泳池兩篇、道館兩篇的定場圖與結局圖 =====
   沿用既有零件：WATER / HELPER（救生員）/ DOJO / DOBOK / BOY。

   兩個刻意的畫法：
   1. 溺水那一篇，「不用下水」的結局裡主角一定站在岸上、腳沒碰到水。
      畫面本身就是那一課。
   2. 更衣室那一篇不畫人、不畫身體，只畫門縫跟一支手機。
      那件事本來就不需要被畫出來。
*/

// 更衣室：兩格門 + 地板
const LOCKERS = () =>
  '<rect width="200" height="130" fill="#eaf4fa"/>' +
  '<rect x="0" y="104" width="200" height="26" fill="#cfd8de"/>' +
  '<rect x="0" y="104" width="200" height="2.5" fill="#a9b4bc"/>' +
  '<rect x="14" y="18" width="80" height="86" rx="3" fill="#bcd4e0" stroke="#33224a" stroke-width="2"/>' +
  '<rect x="106" y="18" width="80" height="86" rx="3" fill="#bcd4e0" stroke="#33224a" stroke-width="2"/>' +
  '<circle cx="84" cy="62" r="3.4" fill="#8a949c"/><circle cx="116" cy="62" r="3.4" fill="#8a949c"/>';

/* 從門縫伸過來的手機（鏡頭朝上）

   注意：動畫的 class 一定要掛在「外面再包一層」的 <g>，不能跟 transform
   放在同一個元素上。.bob / .clash / .fly 這些動畫本身在改 transform，
   CSS 的 transform 會整個蓋掉 SVG 的 transform 屬性——
   結果就是那個東西被搬到畫面原點，看起來像整個消失。
   第一版就是這樣：手機跟水裡的人都畫了，但畫面上一個都看不到。 */
const PEEKPHONE = (x, y, tilt) =>
  '<g transform="translate(' + x + ',' + y + ') rotate(' + (tilt || 0) + ')">' +
  '<rect x="-7" y="-13" width="14" height="26" rx="2.6" fill="#33224a" stroke="#1d1430" stroke-width="1.4"/>' +
  '<rect x="-5" y="-11" width="10" height="20" rx="1.6" fill="#5b6a7e"/>' +
  '<circle cx="0" cy="-6" r="2.6" fill="#cfe6ff" stroke="#1d1430" stroke-width="1"/></g>';

// 池邊的浮板
const KICKBOARD = (x, y, tilt) =>
  '<g transform="translate(' + x + ',' + y + ') rotate(' + (tilt || 0) + ')">' +
  '<rect x="-13" y="-9" width="26" height="18" rx="4" fill="#ffd23f" stroke="#33224a" stroke-width="1.8"/>' +
  '<rect x="-4" y="-9" width="8" height="9" rx="3" fill="#eaf4fa" stroke="#33224a" stroke-width="1.4"/></g>';

// 穿道袍的男生。DOBOK 是用 GIRL 畫的，學長直接用它會變成女生
const DOBOY = (x, y, s, belt) => {
  const w = 11.6 * s, by = y - 20 * s;
  return BOY(x, y, s, '#ffffff') +
    '<rect x="' + (x - w) + '" y="' + by + '" width="' + (w * 2) + '" height="' + (4.4 * s) +
    '" rx="1" fill="' + belt + '" stroke="#33224a" stroke-width="' + (1.1 * s) + '"/>';
};

/* 水裡掙扎的人：只露出頭跟兩隻往上抓的手。
   刻意不畫表情細節，也不畫整個身體——夠清楚，但不嚇人。 */
const DROWN = (x, y, s) =>
  '<g class="bob"><g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  LIMB(-9, 2, -17, -20, 6) + LIMB(9, 2, 17, -20, 6) +
  '<circle cx="0" cy="-4" r="12" fill="#fde2c5" stroke="#33224a" stroke-width="1.6"/>' +
  '<path d="M-12 -8 q-1 -15 12 -15 q13 0 12 15 q-3 -6 -12 -6 q-9 0 -12 6 Z" fill="#33224a"/>' +
  // 眼睛畫成睜大的圓，不要用叉叉——叉叉看起來像昏過去了，對一年級太超過
  '<circle cx="-4.6" cy="-5" r="2" fill="#33224a"/><circle cx="4.6" cy="-5" r="2" fill="#33224a"/>' +
  '<ellipse cx="0" cy="4" rx="3.4" ry="4" fill="#33224a"/></g></g>';

Object.assign(ART_SCENES, {
  /* ---------- 24. 有人在水裡 ---------- */
  'poolsave.intro': SVG('深水區有人在掙扎，救生員背對著那邊',
    BG('#e8f6ff', '#dbe8f0') + WATER(70) +
    KICKBOARD(30, 62, -8) +
    DROWN(128, 92, 0.9) +
    '<g opacity=".85">' + HELPER(176, 70, 0.8, '#e74c3c', false) + '</g>' +
    GIRL(58, 70, 0.85)),

  'poolsave.best': SVG('小女生站在岸上大喊，同時把浮板丟向水裡的人',
    BG('#eafaf1', '#dbe8f0') + WATER(72) +
    DROWN(140, 92, 0.86) +
    '<g class="fly">' + KICKBOARD(104, 58, 22) + '</g>' +
    GIRL(50, 72, 0.98, { pose: 'shout' }) +
    '<g class="dash" stroke="#e85a92" stroke-width="3" fill="none" stroke-linecap="round">' +
    '<path d="M68 42 q8 8 0 16"/><path d="M76 36 q13 14 0 28"/></g>' +
    HELPER(178, 72, 0.8, '#e74c3c', false) + SUNBURST(120, 40)),

  'poolsave.good': SVG('小女生喊完之後站在岸上等，救生員正在跑過來',
    BG('#e8f6ff', '#dbe8f0') + WATER(72) +
    DROWN(132, 92, 0.86) +
    KICKBOARD(34, 64, -8) + EMO(34, 46, '👆', 13, 'bob') +
    GIRL(64, 72, 0.92) +
    '<g class="fly">' + HELPER(176, 72, 0.8, '#e74c3c', false) + '</g>'),

  'poolsave.quiet': SVG('浮板丟出去了，但岸上只有小女生一個人知道',
    BG('#e8f6ff', '#dbe8f0') + WATER(72) +
    DROWN(136, 92, 0.86) +
    '<g class="fly">' + KICKBOARD(100, 60, 18) + '</g>' +
    GIRL(52, 72, 0.92) +
    '<g opacity=".4">' + HELPER(180, 72, 0.78, '#e74c3c', false) + '</g>' +
    EMO(166, 50, '🔇', 14)),

  'poolsave.escape': SVG('小女生從水裡爬回岸邊，救生員這時候才跳下去',
    BG('#e8f6ff', '#dbe8f0') + WATER(62) +
    DROWN(146, 88, 0.84) +
    '<g class="bob">' + GIRL(58, 96, 0.86, { pose: 'hang', mood: 'flat' }) + '</g>' +
    '<g class="puff" fill="#fff" opacity=".7"><circle cx="76" cy="66" r="4.6"/><circle cx="84" cy="56" r="3.2"/></g>' +
    '<g class="fly">' + HELPER(180, 62, 0.78, '#e74c3c', false) + '</g>'),

  'poolsave.bad': SVG('兩個人都在水裡，救生員同時要拉兩個',
    BG('#cfe6ff') + WATER(30) +
    '<g class="fly">' + GIRL(78, 104, 0.84, { pose: 'hang', mood: 'flat' }) + '</g>' +
    DROWN(126, 86, 0.84) +
    '<g class="puff" fill="#fff" opacity=".7">' +
    '<circle cx="98" cy="58" r="5"/><circle cx="108" cy="46" r="3.6"/><circle cx="116" cy="36" r="2.6"/></g>' +
    EMO(20, 24, '🆘', 18, 'clash')),

  /* ---------- 25. 更衣室裡的手機 ----------
     不畫人、不畫身體：那件事不需要被畫出來。 */
  'poolphone.intro': SVG('更衣室隔間門底下伸過來一支手機',
    LOCKERS() + '<g class="clash">' + PEEKPHONE(100, 94, 12) + '</g>' +
    EMO(150, 44, '👀', 15, 'clash')),

  'poolphone.best': SVG('救生員與媽媽都到了，小女生站在她們中間',
    BG('#eafaf1', '#cfd8de') +
    HELPER(44, 118, 0.86, '#e74c3c', false) +
    GIRL(104, 118, 0.94, { pose: 'reachR' }) +
    MOM(152, 118, 0.9, 'reachL') +
    '<g class="hearts">' + EMO(126, 44, '💖', 15) + '</g>' + SUNBURST(110, 56)),

  'poolphone.later': SVG('回到家才跟媽媽說，媽媽正在打電話',
    BG('#fff6e6', '#d9c8a8') + DOOR(28, 118, 0.9) +
    MOM(76, 118, 0.9, 'reachR') +
    '<g class="ring">' + PHONE(118, 48, 0.5) + '</g>' +
    GIRL(156, 118, 0.9, { mood: 'flat' }) +
    '<g class="fadeDanger">' + EMO(136, 36, '🕐', 14) + '</g>'),

  'poolphone.shy': SVG('小女生說沒事，走出更衣室時對方就在門口',
    BG('#eaf4fa', '#cfd8de') +
    '<rect x="8" y="18" width="66" height="86" rx="3" fill="#bcd4e0" stroke="#33224a" stroke-width="2"/>' +
    GIRL(102, 118, 0.9, { mood: 'flat' }) +
    '<g class="fadeDanger">' + ADULT(168, 118, 0.86, { color: '#8a8f96' }) +
    PEEKPHONE(150, 74, -6) + '</g>' +
    EMO(126, 46, '💧', 13)),

  'poolphone.confront': SVG('小女生敲隔壁的門，門沒有開',
    BG('#eaf4fa', '#cfd8de') +
    '<rect x="96" y="16" width="92" height="90" rx="3" fill="#9fbccb" stroke="#33224a" stroke-width="2.2"/>' +
    '<circle cx="108" cy="62" r="3.6" fill="#7a858d"/>' +
    GIRL(56, 118, 0.92, { pose: 'reachR', mood: 'flat' }) +
    '<g class="clash">' + EMO(76, 48, '✊', 15) + '</g>' +
    EMO(146, 52, '❓', 16, 'bob')),

  'poolphone.bad': SVG('小女生一個人坐著，那個畫面一直在腦袋裡',
    BG('#e6e2f5', '#8f83b3') +
    '<rect x="120" y="26" width="62" height="70" rx="3" fill="#5b5176" stroke="#33224a" stroke-width="1.8"/>' +
    GIRL(62, 118, 0.88, { pose: 'sit', mood: 'flat' }) +
    '<g class="fadeDanger">' + EMO(92, 44, '💭', 16) + PEEKPHONE(146, 58, 10) + '</g>'),

  /* ---------- 26. 「你不是會跆拳道嗎」 ---------- */
  'dojopower.intro': SVG('教室裡有個男生一直推小女生的肩膀，旁邊同學圍著看',
    '<rect width="200" height="130" fill="#eef3f7"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#cfc4b4"/>' +
    '<rect x="0" y="104" width="200" height="2.5" fill="#a99a88"/>' +
    DESK(160, 104, 0.62) +
    '<g opacity=".4">' + BOY(26, 104, 0.56, '#b3a8c4') + BOY(46, 104, 0.54, '#9aa4ad') + '</g>' +
    BOY(120, 104, 0.78, '#8a9bb0') +
    '<path d="M104 66 L86 72" stroke="#33224a" stroke-width="8.6" stroke-linecap="round" opacity=".25"/>' +
    '<path d="M104 66 L86 72" stroke="#fde2c5" stroke-width="6.4" stroke-linecap="round"/>' +
    GIRL(74, 104, 0.86)),

  'dojopower.best': SVG('小女生在老師面前把事情講清楚，沒有動手',
    BG('#eefaf0') + BOARD(12, 14) +
    ADULT(50, 118, 0.92, { color: '#5e8f78' }) +
    GIRL(112, 118, 0.94, { pose: 'reachL' }) + SPEECH(120, 36, '💬') +
    '<g opacity=".7">' + BOY(168, 118, 0.72, '#8a9bb0') + '</g>' +
    EMO(78, 50, '✋', 15) + SUNBURST(96, 60)),

  'dojopower.let': SVG('小女生說算了，一個禮拜後他又開始推她',
    BG('#fff6e6', '#c8c0b0') +
    GIRL(64, 118, 0.9, { mood: 'flat' }) +
    '<g class="fadeDanger">' + BOY(132, 118, 0.76, '#8a9bb0') +
    '<path d="M116 78 L98 84" stroke="#fde2c5" stroke-width="6" stroke-linecap="round"/></g>' +
    EMO(96, 44, '🔁', 15, 'bob')),

  'dojopower.endure': SVG('小女生站在教室門口，不想進去',
    BG('#e6e2f5', '#8f83b3') +
    '<rect x="104" y="20" width="84" height="86" rx="3" fill="#5b5176" stroke="#33224a" stroke-width="2"/>' +
    '<circle cx="116" cy="64" r="3.6" fill="#d9c8a8"/>' +
    GIRL(52, 118, 0.88, { mood: 'flat' }) +
    '<g class="fadeDanger">' + EMO(80, 46, '💭', 15) + '</g>'),

  'dojopower.own': SVG('小女生自己跟老師承認，也把前面的事講出來',
    BG('#f3f0ff', '#c9bfe0') + BOARD(12, 14) +
    ADULT(52, 118, 0.9, { color: '#5e8f78' }) +
    GIRL(112, 118, 0.9, { pose: 'reachL', mood: 'flat' }) + SPEECH(120, 38, '💬') +
    '<g opacity=".6">' + BOY(170, 118, 0.7, '#8a9bb0') + '</g>' +
    EMO(84, 52, '📝', 14)),

  'dojopower.blame': SVG('同學指出是她推的，老師的臉沉下來',
    BG('#e6e2f5', '#8f83b3') +
    ADULT(48, 118, 0.9, { color: '#5e8f78', mood: 'flat' }) +
    GIRL(108, 118, 0.86, { pose: 'hang', mood: 'flat' }) +
    '<g opacity=".75">' + BOY(160, 118, 0.72, '#8a9bb0') + BOY(184, 118, 0.6, '#b3a8c4') + '</g>' +
    '<g class="clash">' + EMO(128, 44, '👈', 15) + '</g>'),

  /* ---------- 27. 「這是在幫你練」 ---------- */
  'dojohurt.intro': SVG('道館裡，大一點的學長站在小女生前面，她手臂上有瘀青',
    DOJO() +
    DOBOY(128, 100, 0.94, '#33224a') +
    DOBOK(70, 100, 0.78, '#ffd23f', { dress: '#ffffff', mood: 'flat' }) +
    // 瘀青：手臂上一小塊，不誇張
    '<ellipse cx="59" cy="78" rx="4.6" ry="3.4" fill="#9b7fb8" opacity=".8"/>' +
    EMO(88, 44, '💬', 14)),

  'dojohurt.best': SVG('教練與媽媽都知道了，兩個大人在講話',
    DOJO() + SUNBURST(104, 54) +
    ADULT(44, 100, 0.86, { color: '#33224a' }) +
    MOM(158, 100, 0.86, 'reachL') +
    DOBOK(102, 100, 0.8, '#ffd23f', { dress: '#ffffff' }) +
    '<g class="hearts">' + EMO(122, 34, '💖', 15) + '</g>'),

  'dojohurt.onlycoach': SVG('教練請假那天，代課老師不知道這件事',
    DOJO() +
    '<g opacity=".35">' + ADULT(30, 100, 0.82, { color: '#33224a' }) + '</g>' +
    ADULT(166, 100, 0.84, { color: '#7f9ab8' }) +
    DOBOY(120, 100, 0.92, '#33224a') +
    DOBOK(76, 100, 0.76, '#ffd23f', { dress: '#ffffff', mood: 'flat' }) +
    '<g class="fadeDanger">' + EMO(48, 40, '🚪', 15) + '</g>'),

  'dojohurt.mom': SVG('換衣服的時候媽媽看到手臂上的瘀青',
    BG('#fff6e6', '#d9c8a8') +
    MOM(64, 118, 0.92, 'reachR') +
    GIRL(126, 118, 0.9, { mood: 'flat' }) +
    '<ellipse cx="112" cy="92" rx="6" ry="4.4" fill="#9b7fb8" opacity=".85"/>' +
    '<g class="clash">' + EMO(96, 44, '❗', 16) + '</g>' +
    '<g class="ring">' + PHONE(164, 52, 0.5) + '</g>'),

  'dojohurt.hide': SVG('小女生開始找理由不去道館，道袍掛著沒有動',
    BG('#e6e2f5', '#8f83b3') +
    '<rect x="120" y="22" width="76" height="6" rx="3" fill="#8a7fa8"/>' +
    '<g opacity=".9">' +
    '<path d="M158 34 l-12 -8 h24 Z" fill="none" stroke="#8a7fa8" stroke-width="2"/>' +
    // 兩隻袖子一定要畫，不然整件看起來像板凳
    '<path d="M146 34 L122 52 l8 10 l18 -14 Z" fill="#efeaf7" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M170 34 L194 52 l-8 10 l-18 -14 Z" fill="#efeaf7" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M146 34 h24 l8 54 h-40 Z" fill="#f7f4fb" stroke="#33224a" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M158 34 L146 56 M158 34 L170 56" stroke="#33224a" stroke-width="1.4" fill="none"/>' +
    '<rect x="138" y="64" width="40" height="6" rx="1" fill="#ffd23f" stroke="#33224a" stroke-width="1.2"/></g>' +
    GIRL(56, 118, 0.88, { pose: 'sit', mood: 'flat' }) +
    '<g class="fadeDanger">' + EMO(86, 46, '💭', 15) + '</g>'),
});
