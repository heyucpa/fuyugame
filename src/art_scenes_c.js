/* ===== 第 17 個劇本：同學給的糖果 ===== */
// 花花綠綠的可疑糖果包
const CANDYBAG = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<path d="M-16 -20 L16 -20 L20 18 L-20 18 Z" fill="#ff8fb8" stroke="#33224a" stroke-width="1.8" stroke-linejoin="round"/>' +
  '<path d="M-16 -20 L16 -20 L14 -12 L-14 -12 Z" fill="#7fc1ed"/>' +
  '<path d="M-18 -4 L18 -4 M-19 8 L19 8" stroke="#ffd23f" stroke-width="4"/>' +
  '<circle cx="-7" cy="2" r="3" fill="#a8e6c0"/><circle cx="6" cy="12" r="3" fill="#ffe055"/>' +
  '<path d="M-16 -20 l-5 -6 l8 2 Z M16 -20 l5 -6 l-8 2 Z" fill="#ff8fb8" stroke="#33224a" stroke-width="1.4" stroke-linejoin="round"/>' +
  '<text x="0" y="-6" font-size="7" text-anchor="middle" fill="#33224a" font-weight="bold">? ? ?</text>' +
  '</g>';

Object.assign(ART_SCENES, {
  // 🌟 拒絕，並且告訴老師 —— 老師把整包收走
  'candy.best': SVG('老師把來路不明的糖果收走，小女生和同學都沒事',
    BG('#eefaf0') + BOARD(10, 14) + SUNBURST(66, 68) +
    ADULT(150, 118, 0.9, { color: '#5e8f78', pose: 'reachL' }) +
    '<g class="fly">' + CANDYBAG(118, 66, 0.85) + '</g>' +
    EMO(96, 44, '🚫', 20, 'clash') +
    GIRL(60, 118, 0.95, { pose: 'reachR' }) +
    EMO(24, 46, '✨', 15, 'twinkle')),

  // 👍 自己沒吃、也勸了同學，但沒告訴大人 —— 那包還在班上流傳
  'candy.good': SVG('小女生自己沒吃也勸了同學，但那包糖果還在班上傳來傳去',
    BG('#f2f7ff', '#c8dcf0') + BOARD(12, 14) +
    GIRL(62, 118, 0.95, { pose: 'reachR' }) +
    EMO(92, 58, '🚫', 18, 'clash') +
    '<g class="dragonMiss" opacity=".85">' + CANDYBAG(128, 92, 0.72) + '</g>' +
    '<g opacity=".45" fill="#b6a7d6"><circle cx="170" cy="74" r="9"/><rect x="162" y="84" width="16" height="34" rx="4"/></g>' +
    EMO(150, 44, '➡️', 15, 'dash')),

  // 😮‍💨 已經吃了，但馬上說出來 —— 保健室，說清楚吃了什麼
  'candy.escape': SVG('小女生不舒服，馬上告訴老師剛剛吃了什麼',
    BG('#eafaf1') +
    '<rect x="112" y="72" width="80" height="46" rx="4" fill="#fff" stroke="#33224a" stroke-width="1.8"/>' +
    '<path d="M146 80 h12 M146 86 h12" stroke="#e85a92" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M152 76 v14 M145 83 h14" stroke="#e85a92" stroke-width="4" stroke-linecap="round"/>' +
    '<text x="152" y="110" font-size="10" fill="#6b4a9e" text-anchor="middle" font-weight="bold">保健室</text>' +
    ADULT(88, 118, 0.9, { color: '#5e8f78', pose: 'reachL' }) +
    GIRL(38, 118, 0.9, { pose: 'reachR', mood: 'flat' }) +
    EMO(14, 56, '💦', 13) +
    SPEECH(52, 30, '🍬')),

  // 🔁 吃了又忍著不說
  'candy.bad': SVG('吃了以後不舒服卻忍著沒說',
    BG('#e6e2f5', '#8f83b3') +
    '<g class="bob">' + CANDYBAG(146, 62, 0.85) + '</g>' +
    GIRL(72, 118, 0.95, { pose: 'sit', mood: 'flat' }) +
    EMO(44, 58, '💦', 14) +
    '<g class="zzz">' + EMO(104, 56, '💭', 18) + '</g>'),
});

