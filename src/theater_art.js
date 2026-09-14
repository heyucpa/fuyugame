/* ===== 結局插圖（inline SVG，動畫在 CSS） ===== */

// 共用零件
const GIRL_FACE = (cx, cy, r, mood) => {
  const eyes = mood === 'happy'
    ? '<path d="M' + (cx - r * .42) + ' ' + (cy - r * .1) + ' q ' + (r * .18) + ' ' + (-r * .28) + ' ' + (r * .36) + ' 0" stroke="#33224a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M' + (cx + r * .06) + ' ' + (cy - r * .1) + ' q ' + (r * .18) + ' ' + (-r * .28) + ' ' + (r * .36) + ' 0" stroke="#33224a" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    : '<circle cx="' + (cx - r * .34) + '" cy="' + (cy - r * .12) + '" r="' + (r * .13) + '" fill="#33224a"/>' +
      '<circle cx="' + (cx + r * .34) + '" cy="' + (cy - r * .12) + '" r="' + (r * .13) + '" fill="#33224a"/>';
  const mouth = mood === 'flat'
    ? '<path d="M' + (cx - r * .22) + ' ' + (cy + r * .42) + ' h ' + (r * .44) + '" stroke="#33224a" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    : mood === 'sad'   // 妹妹版要看得出難過，嘴角往下
    ? '<path d="M' + (cx - r * .26) + ' ' + (cy + r * .52) + ' q ' + (r * .26) + ' ' + (-r * .34) + ' ' + (r * .52) + ' 0" stroke="#33224a" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
    : '<path d="M' + (cx - r * .26) + ' ' + (cy + r * .3) + ' q ' + (r * .26) + ' ' + (r * .34) + ' ' + (r * .52) + ' 0" stroke="#33224a" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
  return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fde2c5" stroke="#33224a" stroke-width="1.6"/>' +
    '<path d="M' + (cx - r) + ' ' + (cy - r * .25) + ' q 0 ' + (-r * 1.2) + ' ' + r + ' ' + (-r * 1.2) + ' q ' + r + ' 0 ' + r + ' ' + (r * 1.2) + ' q ' + (-r * .3) + ' ' + (-r * .55) + ' ' + (-r) + ' ' + (-r * .55) + ' q ' + (-r * .7) + ' 0 ' + (-r) + ' ' + (r * .55) + ' Z" fill="#5d3a1f"/>' +
    eyes +
    '<circle cx="' + (cx - r * .62) + '" cy="' + (cy + r * .2) + '" r="' + (r * .16) + '" fill="#ff8fb8" opacity=".7"/>' +
    '<circle cx="' + (cx + r * .62) + '" cy="' + (cy + r * .2) + '" r="' + (r * .16) + '" fill="#ff8fb8" opacity=".7"/>' +
    mouth;
};

const CROWN = (cx, y, w) =>
  '<path d="M' + (cx - w) + ' ' + y + ' L' + (cx - w * .55) + ' ' + (y - w * .9) + ' L' + cx + ' ' + (y - w * .3) +
  ' L' + (cx + w * .55) + ' ' + (y - w * .9) + ' L' + (cx + w) + ' ' + y + ' Z" fill="#ffd23f" stroke="#33224a" stroke-width="1.4" stroke-linejoin="round"/>' +
  '<circle cx="' + cx + '" cy="' + (y - w * .42) + '" r="' + (w * .17) + '" fill="#ff5a8a"/>';

const CASTLE = (x, y, s, fill) =>
  '<g fill="' + fill + '">' +
  '<rect x="' + x + '" y="' + (y - 26 * s) + '" width="' + (12 * s) + '" height="' + (26 * s) + '"/>' +
  '<rect x="' + (x + 16 * s) + '" y="' + (y - 34 * s) + '" width="' + (14 * s) + '" height="' + (34 * s) + '"/>' +
  '<rect x="' + (x + 34 * s) + '" y="' + (y - 24 * s) + '" width="' + (12 * s) + '" height="' + (24 * s) + '"/>' +
  '<path d="M' + x + ' ' + (y - 26 * s) + ' l' + (6 * s) + ' ' + (-8 * s) + ' l' + (6 * s) + ' ' + (8 * s) + ' Z"/>' +
  '<path d="M' + (x + 16 * s) + ' ' + (y - 34 * s) + ' l' + (7 * s) + ' ' + (-10 * s) + ' l' + (7 * s) + ' ' + (10 * s) + ' Z"/>' +
  '<path d="M' + (x + 34 * s) + ' ' + (y - 24 * s) + ' l' + (6 * s) + ' ' + (-8 * s) + ' l' + (6 * s) + ' ' + (8 * s) + ' Z"/>' +
  '</g>';

// 惡龍（卡通、不恐怖）：dir = 1 朝右, -1 朝左
const DRAGON = (x, y, s, dir) => {
  const f = 'transform="translate(' + x + ',' + y + ') scale(' + (s * dir) + ',' + s + ')"';
  return '<g ' + f + '>' +
    // 尾巴
    '<path d="M-2 6 q-22 4 -30 -8 q10 8 26 0 Z" fill="#4caf7d" stroke="#2a6b4f" stroke-width="1.4" stroke-linejoin="round"/>' +
    // 尾鰭
    '<path d="M-31 -2 l-9 -7 l3 8 l-8 4 l10 2 Z" fill="#ffd23f" stroke="#2a6b4f" stroke-width="1.3" stroke-linejoin="round"/>' +
    // 背刺
    '<path d="M-14 -10 l3 -7 l4 6 l4 -8 l4 7 l4 -6 l3 6 Z" fill="#ffd23f" stroke="#2a6b4f" stroke-width="1.3" stroke-linejoin="round"/>' +
    // 翅膀（會拍動）
    '<g class="wing"><path d="M-4 -8 q-16 -26 -34 -20 q10 6 12 16 q-8 -2 -12 2 q14 10 34 8 Z" fill="#7ed6a5" stroke="#2a6b4f" stroke-width="1.4" stroke-linejoin="round"/></g>' +
    // 身體
    '<ellipse cx="0" cy="4" rx="20" ry="15" fill="#4caf7d" stroke="#2a6b4f" stroke-width="1.6"/>' +
    '<ellipse cx="2" cy="8" rx="12" ry="9" fill="#bff0d4"/>' +
    // 頭
    '<circle cx="17" cy="-9" r="12" fill="#4caf7d" stroke="#2a6b4f" stroke-width="1.6"/>' +
    '<path d="M26 -5 q10 1 11 5 q-9 3 -13 -1 Z" fill="#4caf7d" stroke="#2a6b4f" stroke-width="1.4" stroke-linejoin="round"/>' +
    // 角
    '<path d="M13 -19 l-3 -8 l7 5 Z" fill="#ffd23f" stroke="#2a6b4f" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<path d="M21 -20 l2 -8 l4 7 Z" fill="#ffd23f" stroke="#2a6b4f" stroke-width="1.2" stroke-linejoin="round"/>' +
    // 眼睛（斜斜的，有點壞但不兇）
    '<ellipse cx="19" cy="-11" rx="3.4" ry="3.8" fill="#fff"/>' +
    '<circle cx="20" cy="-10.5" r="1.9" fill="#33224a"/>' +
    '<path d="M15 -16 l8 3" stroke="#2a6b4f" stroke-width="1.6" stroke-linecap="round"/>' +
    // 牙齒
    '<path d="M24 -3 l2 3 l2 -3 Z" fill="#fff"/>' +
    // 腳
    '<path d="M-8 17 l0 5 l7 0" stroke="#2a6b4f" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
    '<path d="M6 18 l0 4 l7 0" stroke="#2a6b4f" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
    '</g>';
};

// 膚色的手腳畫在淺色背景上會看不見，先描一層深色外框
const LIMB = (x1, y1, x2, y2, w) =>
  '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" stroke="#33224a" stroke-width="' + (w + 2.6) + '" stroke-linecap="round"/>' +
  '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" stroke="#fde2c5" stroke-width="' + w + '" stroke-linecap="round"/>';

const SCENE = {
  /* 🌟 完美：加冕，站在陽光裡 */
  best:
    '<svg viewBox="0 0 200 130" role="img" aria-label="小女生戴著皇冠，在陽光下舉起雙手歡呼">' +
    '<g class="rays" style="transform-origin:100px 62px">' +
    Array.from({ length: 12 }, (_, i) =>
      '<path d="M100 62 L94 -40 L106 -40 Z" fill="#ffe9a8" opacity=".8" transform="rotate(' + (i * 30) + ' 100 62)"/>').join('') +
    '</g>' +
    '<circle cx="100" cy="62" r="46" fill="#fff8dc" opacity=".75"/>' +
    CASTLE(58, 118, 1, '#d9c8f0') +
    '<rect x="0" y="118" width="200" height="12" fill="#a8e6c0"/>' +
    '<g class="bob">' +
    // 手臂舉高
    LIMB(92, 86, 74, 56, 7) + LIMB(108, 86, 126, 56, 7) +
    // 裙子
    '<path d="M86 118 L92 82 L108 82 L114 118 Z" fill="#ff8fb8" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M100 92 q-4 5 0 9 q4 -4 0 -9" fill="#fff"/>' +
    GIRL_FACE(100, 66, 15, 'happy') +
    CROWN(100, 52, 11) +
    '</g>' +
    '<g class="twinkle">' +
    '<text x="36" y="34" font-size="16">✨</text><text x="152" y="46" font-size="14">⭐</text>' +
    '<text x="30" y="88" font-size="13">💛</text><text x="160" y="96" font-size="15">✨</text>' +
    '</g></svg>',

  /* 👍 不錯：爸爸媽媽來接（爸爸帥氣登場） */
  good:
    '<svg viewBox="0 0 200 130" role="img" aria-label="小女生牽著帥氣的爸爸和媽媽的手">' +
    '<circle cx="100" cy="58" r="52" fill="#e8f6ff"/>' +
    '<rect x="0" y="118" width="200" height="12" fill="#a8e6c0"/>' +
    // 爸爸（左）：飄動的紅披風 + 佩劍
    '<g class="sway">' +
    '<g class="cape" style="transform-origin:52px 62px">' +
    '<path d="M40 60 q-22 22 -14 52 q16 -12 30 -8 Z" fill="#e74c3c" stroke="#33224a" stroke-width="1.5" stroke-linejoin="round"/>' +
    '</g>' +
    '<path d="M60 92 L74 100" stroke="#fde2c5" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M42 118 L46 76 L62 76 L66 118 Z" fill="#9aa4ad" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M46 82 h16" stroke="#33224a" stroke-width="1.4"/>' +
    // 佩劍
    '<path d="M64 92 L74 116" stroke="#cfd6dc" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M61 90 l8 4" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="54" cy="62" r="12" fill="#fde2c5" stroke="#33224a" stroke-width="1.6"/>' +
    '<path d="M42 60 q0 -14 12 -14 q12 0 12 14 q-4 -6 -12 -6 q-8 0 -12 6 Z" fill="#3a2510"/>' +
    '<circle cx="50" cy="61" r="1.5" fill="#33224a"/><circle cx="58" cy="61" r="1.5" fill="#33224a"/>' +
    '<path d="M49 68 q5 4 10 0" stroke="#33224a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '<text x="30" y="46" font-size="13" class="sparkle">✨</text>' +
    '</g>' +
    // 媽媽（右）
    '<g class="sway2">' +
    '<path d="M140 92 L126 100" stroke="#fde2c5" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M134 118 L138 78 L154 78 L158 118 Z" fill="#9b59b6" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<circle cx="146" cy="64" r="12" fill="#fde2c5" stroke="#33224a" stroke-width="1.6"/>' +
    '<path d="M133 66 q-1 -18 13 -18 q14 0 13 18 q-3 -8 -13 -8 q-10 0 -13 8 Z" fill="#3a2510"/>' +
    '<circle cx="142" cy="63" r="1.5" fill="#33224a"/><circle cx="150" cy="63" r="1.5" fill="#33224a"/>' +
    '<path d="M141 70 q5 4 10 0" stroke="#33224a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '</g>' +
    // 女孩（中，被牽著）
    '<g class="bob">' +
    '<path d="M88 100 L76 100" stroke="#fde2c5" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M112 100 L124 100" stroke="#fde2c5" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M88 118 L92 94 L108 94 L112 118 Z" fill="#ff8fb8" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
    GIRL_FACE(100, 84, 11, 'happy') +
    '</g>' +
    '<g class="hearts"><text x="86" y="40" font-size="14">💖</text><text x="112" y="30" font-size="12">💕</text><text x="70" y="26" font-size="11">💗</text></g>' +
    '</svg>',

  /* 😮‍💨 驚險：從惡龍手中跑掉 */
  escape:
    '<svg viewBox="0 0 200 130" role="img" aria-label="小女生成功從惡龍旁邊跑走">' +
    '<circle cx="100" cy="58" r="54" fill="#fff2e0"/>' +
    '<rect x="0" y="118" width="200" height="12" fill="#a8e6c0"/>' +
    // 惡龍在左後方（撲空）
    '<g class="dragonMiss" style="transform-origin:52px 70px">' + DRAGON(52, 74, 0.92, 1) + '</g>' +
    // 速度線
    '<g class="dash" stroke="#ff8c42" stroke-width="3" stroke-linecap="round" opacity=".8">' +
    '<path d="M96 66 h-18"/><path d="M100 80 h-26"/><path d="M98 94 h-16"/></g>' +
    // 女孩奔跑（右）：裙襬提高，腿在地面之上，才看得出來是在跑
    '<g class="run">' +
    LIMB(142, 88, 129, 97, 6) +
    LIMB(156, 88, 171, 75, 6) +
    '<path d="M140 106 L143 82 L157 82 L160 106 Z" fill="#ff8fb8" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
    LIMB(146, 104, 136, 117, 6) +
    LIMB(154, 104, 166, 112, 6) +
    GIRL_FACE(150, 68, 13, 'wide') +
    '<text x="166" y="50" font-size="13">💨</text>' +
    '</g>' +
    '<g class="puff" fill="#d8cbb8" opacity=".75">' +
    '<circle cx="128" cy="122" r="6"/><circle cx="116" cy="124" r="4.5"/><circle cx="106" cy="125" r="3.5"/></g>' +
    '</svg>',

  /* 🔁 再試一次：被惡龍抓去城堡（卡通化，不恐怖） */
  bad:
    '<svg viewBox="0 0 200 130" role="img" aria-label="惡龍抓著小女生飛向遠方的城堡">' +
    '<rect width="200" height="130" fill="#e6e2f5"/>' +
    '<circle cx="168" cy="26" r="13" fill="#fff3b0"/>' +
    '<g fill="#fff" opacity=".9"><circle cx="30" cy="22" r="1.8"/><circle cx="58" cy="14" r="1.4"/><circle cx="120" cy="18" r="1.6"/><circle cx="88" cy="30" r="1.2"/></g>' +
    // 遠方城堡
    CASTLE(132, 118, 1.0, '#a99ac9') +
    '<rect x="0" y="118" width="200" height="12" fill="#8f83b3"/>' +
    // 惡龍抓著女孩飛行
    '<g class="fly">' +
    '<g style="transform-origin:74px 44px">' + DRAGON(74, 44, 1.0, 1) + '</g>' +
    // 女孩被拎在爪子下（表情是無奈，不是恐懼）
    '<g class="dangle" style="transform-origin:66px 62px">' +
    '<path d="M64 56 L64 72" stroke="#2a6b4f" stroke-width="3.4" stroke-linecap="round"/>' +'<path d="M60 70 q4 6 8 0" stroke="#2a6b4f" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    LIMB(61, 79, 53, 91, 5) +
    LIMB(71, 79, 79, 91, 5) +
    '<path d="M58 96 L61 74 L71 74 L74 96 Z" fill="#ff8fb8" stroke="#33224a" stroke-width="1.5" stroke-linejoin="round"/>' +
    LIMB(63, 95, 60, 108, 5) +
    LIMB(70, 95, 73, 108, 5) +
    GIRL_FACE(66, 66, 10, 'flat') +
    '<text x="80" y="58" font-size="12">💦</text>' +
    '</g></g>' +
    '</svg>',
};

