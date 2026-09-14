/* ===== 第 18 個劇本：等不到爸媽 ===== */
// 校門（含「學校」牌子）
const GATE = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<rect x="-46" y="-70" width="9" height="70" fill="#b6a7d6" stroke="#33224a" stroke-width="1.8"/>' +
  '<rect x="37" y="-70" width="9" height="70" fill="#b6a7d6" stroke="#33224a" stroke-width="1.8"/>' +
  '<rect x="-50" y="-84" width="100" height="16" rx="4" fill="#5e8f78" stroke="#33224a" stroke-width="1.8"/>' +
  '<text x="0" y="-72" font-size="11" fill="#fff" text-anchor="middle" font-weight="bold">學校</text>' +
  '<path d="M-37 -56 v56 M-26 -56 v56 M-15 -56 v56 M-4 -56 v56" stroke="#cbbce0" stroke-width="2.4"/>' +
  '</g>';
// 警衛室
const GUARDBOX = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<rect x="-34" y="-56" width="68" height="56" rx="3" fill="#fff6e6" stroke="#33224a" stroke-width="2"/>' +
  '<path d="M-40 -56 L0 -76 L40 -56 Z" fill="#c98f52" stroke="#33224a" stroke-width="2" stroke-linejoin="round"/>' +
  '<rect x="-26" y="-46" width="52" height="26" rx="2" fill="#cfe6ff" stroke="#33224a" stroke-width="1.5"/>' +
  '<text x="0" y="-8" font-size="10" fill="#6b4a9e" text-anchor="middle" font-weight="bold">警衛室</text>' +
  '</g>';
const STREETLAMP = (x, y, s, on) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<rect x="-2" y="-64" width="4" height="64" fill="#6b5a7e"/>' +
  '<path d="M-10 -68 h20 l-4 8 h-12 Z" fill="#6b5a7e" stroke="#33224a" stroke-width="1.2"/>' +
  (on ? '<path d="M-34 0 L-7 -58 L7 -58 L34 0 Z" fill="#fff3b0" opacity=".22"/>' : '') +
  '</g>';

Object.assign(ART_SCENES, {
  // 🌟 回學校，在警衛室等到媽媽
  'gate.best': SVG('小女生在警衛室裡等到媽媽，媽媽衝進來抱住她',
    BG('#eefaf0') + SUNBURST(64, 66) + GUARDBOX(56, 118, 0.95) +
    HELPER(24, 108, 0.62, '#3f6bb5', true) +
    ADULT(150, 118, 0.9, { color: '#9b59b6', pose: 'reachL' }) +
    GIRL(112, 118, 0.82, { pose: 'reachR' }) +
    '<g class="hearts">' + EMO(122, 44, '💖', 16) + EMO(142, 34, '💕', 12) + '</g>'),

  // 👍 在門口攔到剛好要出校門的老師
  'gate.good': SVG('小女生跑向剛好要出校門的老師求助',
    BG('#f2f7ff', '#c8dcf0') + GATE(70, 118, 0.95) +
    ADULT(148, 118, 0.9, { color: '#5e8f78', pose: 'reachL' }) +
    GIRL(106, 118, 0.9, { pose: 'reachR' }) +
    SPEECH(112, 30, '🙋') + EMO(178, 46, '🕕', 15, 'ring')),

  // 😮‍💨 走到一半轉進亮亮的便利商店
  'gate.escape': SVG('天黑了，小女生轉進亮著燈的便利商店請店員幫忙',
    BG('#3d3357', '#5a4a72') + STREETLAMP(28, 118, 1, true) +
    '<rect x="96" y="14" width="96" height="18" rx="4" fill="#27ae60" stroke="#33224a" stroke-width="1.8"/>' +
    '<text x="144" y="27" font-size="10" fill="#fff" text-anchor="middle" font-weight="bold">OPEN 24H</text>' +
    '<rect x="102" y="36" width="84" height="82" fill="#fffce8" stroke="#33224a" stroke-width="1.6"/>' +
    HELPER(122, 108, 0.72, '#27ae60', true) +
    GIRL(160, 118, 0.88, { pose: 'reachL' }) +
    EMO(66, 60, '💨', 14)),

  // 🔁 一個人走在沒有路燈的暗路上
  'gate.bad': SVG('天黑後一個人走在沒有路燈的路上',
    BG('#2e2745', '#463d63') +
    '<circle cx="170" cy="24" r="11" fill="#fff3b0" opacity=".8"/>' +
    STREETLAMP(40, 118, 1, false) + STREETLAMP(168, 118, 0.9, false) +
    GIRL(86, 118, 0.92, { pose: 'stand', mood: 'flat' }) +
    '<g class="dragonMiss" opacity=".55"><path d="M132 118 q7 -38 15 -38 q8 0 15 38 Z" fill="#1a1630"/></g>' +
    EMO(56, 58, '💦', 13) + EMO(112, 52, '👣', 14, 'dash')),
});

