/* ===== 跟妹妹有關的兩篇：定場圖與結局圖 =====
   妹妹一律是黃裙子（跟小鎮地圖、小事定場圖同一個人），
   而且畫得比姊姊矮一截——她的身高在這兩篇裡是有意義的。

   定場圖照舊只交代情境，不交代評價：
   不畫兇臉、不暗示哪個選項是對的。
*/

// 攤子：商店街的菜攤，不寫店名
const STALL = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<rect x="-34" y="-30" width="68" height="30" fill="#d9c8a8" stroke="#33224a" stroke-width="1.8"/>' +
  '<path d="M-40 -30 h80 l-6 -10 h-68 Z" fill="#e07a5f" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
  '<circle cx="-18" cy="-38" r="5" fill="#a8e6c0" stroke="#33224a" stroke-width="1.2"/>' +
  '<circle cx="-4" cy="-38" r="5" fill="#ffd23f" stroke="#33224a" stroke-width="1.2"/>' +
  '<circle cx="10" cy="-38" r="5" fill="#ff8fb8" stroke="#33224a" stroke-width="1.2"/></g>';

// 水壺：這兩篇的關鍵道具
const BOTTLE = (x, y, s, tilt) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ') rotate(' + (tilt || 0) + ')">' +
  '<rect x="-7" y="-20" width="14" height="20" rx="3" fill="#7fc1ed" stroke="#33224a" stroke-width="1.6"/>' +
  '<rect x="-4" y="-25" width="8" height="6" rx="1.5" fill="#e85a92" stroke="#33224a" stroke-width="1.4"/>' +
  '<path d="M-7 -12 h14" stroke="#33224a" stroke-width="1.1" opacity=".5"/></g>';

const SIS = (x, y, s, o) => {
  o = o || {};
  o.dress = '#ffd23f';
  return GIRL(x, y, s, o);
};

Object.assign(ART_SCENES, {
  /* ---------- 22. 妹妹不見了 ---------- */
  'sislost.intro': SVG('姊姊在攤子前挑菜，旁邊原本牽著的手空了',
    '<rect width="200" height="130" fill="#f7ecdc"/>' +
    '<rect x="0" y="110" width="200" height="20" fill="#c9bfae"/>' +
    STALL(56, 110, 1) +
    '<g opacity=".35">' + ADULT(158, 110, 0.7, { color: '#9aa4ad' }) +
      ADULT(184, 110, 0.66, { color: '#b3a8c4' }) + '</g>' +
    GIRL(110, 110, 0.92, { pose: 'reachL' }) +
    // 原本牽著的位置畫成虛線的空框，不畫「壞人」也不畫妹妹
    '<rect x="126" y="66" width="26" height="44" rx="6" fill="none" stroke="#a99ac9" ' +
    'stroke-width="2" stroke-dasharray="5 4"/>'),

  'sislost.best': SVG('姊姊留在店裡，媽媽牽著妹妹走進來',
    BG('#eafaf1') + STORE(6) +
    HELPER(40, 96, 0.8, '#27ae60', true) +
    GIRL(78, 118, 0.92, { pose: 'reachR' }) +
    MOM(142, 118, 0.88, 'reachL') + SIS(172, 118, 0.6) +
    '<g class="hearts">' + EMO(104, 44, '💖', 15) + '</g>' + SUNBURST(150, 60)),

  'sislost.good': SVG('兩姊妹牽手回到家，媽媽手上的電話還亮著',
    BG('#fff6e6', '#d9c8a8') + DOOR(30, 118, 0.9) +
    MOM(64, 118, 0.9) +
    '<g class="ring">' + PHONE(102, 52, 0.55) + '</g>' +
    EMO(104, 38, '📵', 13, 'clash') +
    GIRL(140, 118, 0.9, { pose: 'reachR', mood: 'flat' }) + SIS(170, 118, 0.6)),

  'sislost.escape': SVG('姊姊跑回大街，服務台正在廣播妹妹的名字',
    BG('#fff4e0', '#c8c0b0') +
    '<rect x="140" y="80" width="54" height="38" rx="3" fill="#d9c8a8" stroke="#33224a" stroke-width="1.8"/>' +
    '<text x="167" y="74" font-size="10" fill="#6b4a9e" text-anchor="middle" font-weight="bold">服務台</text>' +
    EMO(150, 52, '📢', 16, 'ring') +
    SIS(128, 118, 0.55) +          // 要在櫃檯外面，畫進櫃檯裡會變成她站在桌子中間
    '<g class="dragonMiss" opacity=".4">' + ADULT(26, 118, 0.8, { color: '#8a8f96', pose: 'reachR' }) + '</g>' +
    GIRL(92, 118, 0.95, { pose: 'run' }) + EMO(114, 50, '💨', 14)),

  'sislost.alone': SVG('天黑了，姊姊才走進店裡開口',
    BG('#e6e2f5', '#8f83b3') + STALL(40, 112, 0.85) +
    '<g opacity=".8">' + HELPER(120, 96, 0.78, '#2f8f5b', true) + '</g>' +
    GIRL(84, 118, 0.86, { mood: 'flat', pose: 'reachR' }) +
    '<g class="fadeDanger">' + EMO(150, 44, '🌙', 16) + '</g>' +
    EMO(58, 52, '⏳', 14, 'bob')),

  'sislost.bad': SVG('姊姊被帶進沒有人的巷子，妹妹其實在服務台等著',
    BG('#e6e2f5', '#8f83b3') +
    '<path d="M54 26 L146 26 L170 118 L30 118 Z" fill="#544a70"/>' +
    ADULT(80, 112, 0.78, { color: '#6b5a7e', pose: 'reachR' }) +
    GIRL(114, 112, 0.72, { pose: 'hang', mood: 'flat' }) + EMO(134, 60, '💦', 13)),

  /* ---------- 23. 妹妹被欺負了 ---------- */
  'sisbully.intro': SVG('三個小朋友把妹妹的水壺舉高，姊姊剛走到走廊',
    '<rect width="200" height="130" fill="#eef3f7"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#cfc4b4"/>' +
    '<rect x="0" y="104" width="200" height="2.5" fill="#a99a88"/>' +
    WINDOW(12, 22, 34, 30) + WINDOW(56, 22, 34, 30) +
    BOY(104, 104, 0.62, '#9aa4ad') + BOY(134, 104, 0.58, '#b3a8c4') + BOY(160, 104, 0.6, '#8a9bb0') +
    // 手臂要自己畫：BOY 的手是固定垂著的，不畫的話水壺會浮在半空中
    '<path d="M111 86 L120 62" stroke="#33224a" stroke-width="8.6" stroke-linecap="round" opacity=".25"/>' +
    '<path d="M111 86 L120 62" stroke="#fde2c5" stroke-width="6.4" stroke-linecap="round"/>' +
    BOTTLE(122, 58, 0.9, 18) +
    SIS(86, 104, 0.5, { pose: 'cheer' }) +
    '<g opacity=".9">' + GIRL(26, 104, 0.78) + '</g>'),

  'sisbully.best': SVG('妹妹在老師面前自己開口，姊姊站在她旁邊',
    BG('#eefaf0') + BOARD(12, 14) +
    ADULT(46, 118, 0.92, { color: '#5e8f78' }) +
    SIS(112, 118, 0.62, { pose: 'reachR' }) + SPEECH(92, 34, '💬') +
    GIRL(150, 118, 0.9) +
    '<g class="hearts">' + EMO(80, 46, '✨', 14) + '</g>' + SUNBURST(128, 66)),

  'sisbully.everyday': SVG('姊姊每天站在走廊等妹妹，日曆上有一天是空的',
    BG('#fff6e6', '#c8c0b0') +
    '<rect x="122" y="24" width="66" height="54" rx="4" fill="#fff" stroke="#33224a" stroke-width="1.8"/>' +
    '<rect x="122" y="24" width="66" height="12" rx="4" fill="#e8a33d" stroke="#33224a" stroke-width="1.6"/>' +
    '<g fill="#7cc9a0">' + [0, 1, 2].map(i =>
      '<rect x="' + (130 + i * 17) + '" y="44" width="12" height="12" rx="2"/>').join('') + '</g>' +
    '<rect x="130" y="61" width="12" height="12" rx="2" fill="none" stroke="#c96a6a" stroke-width="2" stroke-dasharray="3 3"/>' +
    GIRL(52, 118, 0.92, { pose: 'reachR' }) + SIS(88, 118, 0.6)),

  'sisbully.selfhelp': SVG('妹妹自己說了「還我」，但鉛筆盒裡少了東西',
    BG('#fff6e6', '#c8c0b0') +
    SIS(56, 118, 0.66, { pose: 'reachR' }) + SPEECH(66, 46, '💬') +
    '<g class="fadeDanger" transform="translate(126,86)">' +
    '<rect x="-30" y="-16" width="60" height="30" rx="5" fill="#ffd9e4" stroke="#33224a" stroke-width="1.8"/>' +
    '<path d="M-30 -4 h60" stroke="#33224a" stroke-width="1.3" opacity=".6"/>' +
    '<rect x="-22" y="-13" width="5" height="9" rx="1" fill="#e8a33d"/>' +
    '<rect x="-13" y="-13" width="5" height="9" rx="1" fill="#7fc1ed"/>' +
    '<rect x="2" y="-13" width="20" height="9" rx="1" fill="none" stroke="#a99ac9" stroke-width="1.6" stroke-dasharray="3 3"/>' +
    '</g>' + EMO(150, 40, '❔', 15, 'bob')),

  'sisbully.speakfor': SVG('姊姊在老師面前講，妹妹站在後面點頭',
    BG('#eef7ff') + BOARD(12, 14) +
    ADULT(44, 118, 0.92, { color: '#5e8f78' }) +
    GIRL(114, 118, 0.9, { pose: 'reachL' }) + SPEECH(122, 38, '💬') +
    '<g opacity=".75">' + SIS(162, 118, 0.56, { mood: 'flat' }) + '</g>'),

  'sisbully.unfair': SVG('姊姊在辦公室寫反省單，妹妹在門口等',
    BG('#f3f0ff', '#c9bfe0') +
    DESK(70, 118, 0.95) +
    '<g transform="rotate(-6 92 82)"><rect x="74" y="70" width="36" height="24" rx="2" fill="#fff" stroke="#33224a" stroke-width="1.6"/>' +
    '<path d="M80 79 h22 M80 86 h15" stroke="#c8c8d8" stroke-width="2" stroke-linecap="round"/></g>' +
    GIRL(44, 118, 0.86, { mood: 'flat', pose: 'reachR' }) +
    '<rect x="150" y="34" width="6" height="84" fill="#c9bfae"/>' +
    '<g opacity=".85">' + SIS(176, 118, 0.55, { mood: 'flat' }) + '</g>' +
    EMO(120, 42, '📄', 14)),

  'sisbully.toughen': SVG('妹妹轉過去睡了，姊姊站在房門口',
    BG('#e6e2f5', '#8f83b3') +
    '<rect x="96" y="72" width="92" height="46" rx="4" fill="#c9bfdd" stroke="#33224a" stroke-width="1.8"/>' +
    '<rect x="96" y="72" width="92" height="12" rx="4" fill="#a99ac9" stroke="#33224a" stroke-width="1.5"/>' +
    '<ellipse cx="150" cy="66" rx="13" ry="11" fill="#fde2c5" stroke="#33224a" stroke-width="1.6"/>' +
    '<path d="M137 62 q0 -14 13 -14 q13 0 13 14 q-4 -6 -13 -6 q-9 0 -13 6 Z" fill="#5d3a1f"/>' +
    '<path d="M156 66 q3 3 6 0" stroke="#33224a" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
    '<rect x="20" y="30" width="6" height="88" fill="#8a7fa8"/>' +
    GIRL(50, 118, 0.86, { mood: 'flat' }) +
    '<g class="fadeDanger">' + EMO(74, 52, '💭', 15) + '</g>'),

  'sisbully.bad': SVG('妹妹一個人在房間裡哭，門是關著的',
    BG('#e6e2f5', '#8f83b3') +
    '<rect x="112" y="24" width="76" height="94" rx="4" fill="#5b5176" stroke="#33224a" stroke-width="2"/>' +
    '<circle cx="124" cy="74" r="3.6" fill="#d9c8a8"/>' +
    '<g opacity=".9">' + SIS(62, 118, 0.6, { pose: 'hang', mood: 'flat' }) + '</g>' +
    '<g class="hearts">' + EMO(76, 72, '💧', 13) + EMO(50, 66, '💧', 11) + '</g>'),
});
