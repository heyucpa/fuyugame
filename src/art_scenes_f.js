/* ===== 第 20 個劇本：跆拳道館下課 ===== */
// 穿道服的女孩（白色道服 + 腰帶）
const DOBOK = (x, y, s, belt, o) => {
  o = Object.assign({ dress: '#ffffff' }, o || {});
  const w = 10.6 * s, by = y - 18 * s;
  return GIRL(x, y, s, o) +
    '<rect x="' + (x - w) + '" y="' + by + '" width="' + (w * 2) + '" height="' + (4.2 * s) +
    '" rx="1" fill="' + belt + '" stroke="#33224a" stroke-width="' + (1.1 * s) + '"/>';
};
// 道館：木地板 + 牆上「跆拳道」+ 靶
const DOJO = () =>
  '<rect width="200" height="130" fill="#fff6e6"/>' +
  '<rect x="0" y="100" width="200" height="30" fill="#e0bb84"/>' +
  '<path d="M0 100 h200 M30 100 v30 M70 100 v30 M110 100 v30 M150 100 v30" stroke="#c99b5e" stroke-width="1.4"/>' +
  '<rect x="10" y="14" width="60" height="22" rx="3" fill="#3f6b53" stroke="#33224a" stroke-width="1.8"/>' +
  '<text x="40" y="30" font-size="12" fill="#fff" text-anchor="middle" font-weight="bold">跆拳道</text>' +
  '<circle cx="176" cy="36" r="13" fill="#e74c3c" stroke="#33224a" stroke-width="1.6"/>' +
  '<circle cx="176" cy="36" r="6" fill="#fff"/>';
// 樓梯間（往下的階梯 + 扶手 + 轉角）
const STAIRS = (x, y, s2, dark) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s2 + ')">' +
  '<rect x="-52" y="-96" width="104" height="96" fill="' + (dark ? '#3b3352' : '#dfd7ea') + '"/>' +
  Array.from({ length: 5 }, (_, i) =>
    '<rect x="' + (-52 + i * 12) + '" y="' + (-40 + i * 12) + '" width="' + (104 - i * 12) + '" height="12" ' +
    'fill="' + (dark ? '#4c4368' : '#c9bfdd') + '" stroke="' + (dark ? '#2a2440' : '#a99ac9') + '" stroke-width="1.2"/>').join('') +
  '<path d="M-52 -84 L14 -20" stroke="' + (dark ? '#6b5a8e' : '#9b8ec0') + '" stroke-width="4" stroke-linecap="round"/>' +
  '</g>';
// 一樓亮著燈的小吃店（招牌只有圖示，不寫店名，避免指到特定店家）
const RAMEN = (x, y) =>
  '<rect x="' + x + '" y="' + y + '" width="86" height="20" rx="4" fill="#e8a33d" stroke="#33224a" stroke-width="1.8"/>' +
  '<text x="' + (x + 43) + '" y="' + (y + 15) + '" font-size="11" fill="#fff" text-anchor="middle" font-weight="bold">🍜 小吃</text>' +
  '<rect x="' + (x + 6) + '" y="' + (y + 24) + '" width="74" height="70" fill="#fffce8" stroke="#33224a" stroke-width="1.6"/>';

Object.assign(ART_SCENES, {
  // 🌟 打電話確認後在道館等到媽媽
  'dojo.best': SVG('姊妹倆在跆拳道館裡等到媽媽，教練陪著她們',
    DOJO() + SUNBURST(112, 62) +
    DAD(24, 100, 0.76, 'reachR') +
    ADULT(174, 100, 0.78, { color: '#9b59b6', pose: 'reachL' }) +
    DOBOK(84, 100, 0.8, '#e85a92', { pose: 'reachR' }) +
    DOBOK(126, 100, 0.62, '#ffd23f', { pose: 'reachL' }) +
    '<g class="hearts">' + EMO(104, 36, '💖', 16) + EMO(130, 26, '💕', 12) + '</g>'),

  // 👍 沒下樓，但沒跟教練說，自己在角落等
  'dojo.good': SVG('姊妹倆坐在道館角落等，媽媽終於上來了',
    DOJO() +
    HELPER(24, 100, 0.7, '#33224a', false) +
    ADULT(166, 100, 0.8, { color: '#9b59b6', pose: 'reachL' }) +
    DOBOK(96, 100, 0.8, '#e85a92', { pose: 'sit' }) +
    DOBOK(124, 100, 0.62, '#ffd23f', { pose: 'sit' }) +
    EMO(76, 44, '🕐', 15, 'ring')),

  // 😮‍💨 掙脫並帶著妹妹跑回道館
  'dojo.escape': SVG('姊姊拉著妹妹跑進一樓亮著燈的小吃店，老闆出來看',
    BG('#fff4e0', '#c8c0b0') + STAIRS(172, 118, 0.9, false) + RAMEN(6, 14) +
    '<g class="dragonMiss" opacity=".6" style="transform-origin:146px 80px">' +
    ADULT(146, 118, 0.82, { color: '#8a8f96', pose: 'reachL' }) + '</g>' +
    HELPER(52, 108, 0.7, '#e8a33d', true) +
    DOBOK(96, 118, 0.9, '#e85a92', { pose: 'shout' }) +
    DOBOK(122, 118, 0.68, '#ffd23f', { pose: 'reachL' }) +
    '<g class="dash" stroke="#e85a92" stroke-width="3" fill="none" stroke-linecap="round">' +
    '<path d="M76 58 q-8 8 0 16"/><path d="M68 52 q-13 14 0 28"/></g>' +
    EMO(28, 62, '💨', 14)),

  // 🔁 電梯門關上，往下走
  'dojo.bad': SVG('空蕩蕩的樓梯間，只剩下往下的階梯',
    BG('#2e2745', '#463d63') + STAIRS(104, 118, 1.15, true) +
    '<g class="bob"><text x="100" y="30" font-size="12" fill="#8a7fb0" text-anchor="middle" font-weight="bold">3F ▼ 2F ▼ 1F</text></g>' +
    EMO(24, 78, '💦', 16) + EMO(170, 66, '💢', 18, 'fadeDanger')),
});

