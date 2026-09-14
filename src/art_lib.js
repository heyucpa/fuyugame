/* ===== 組合式插圖：零件庫 =====
   每張結局圖 = 佈景 + 人物 + 效果
   人物以「腳底為原點」的區域座標繪製，再用 transform 擺到定位
*/

// 女孩：pose = stand / cheer / run / reachR / reachL / hang / shout / sit
const GIRL = (x, y, s, o) => {
  o = o || {};
  const mood = o.mood || 'happy', dress = o.dress || '#ff8fb8', pose = o.pose || 'stand';
  let arms = '', legs = '', bottom = 0;
  if (pose === 'cheer')       arms = LIMB(-8, -26, -21, -47, 6) + LIMB(8, -26, 21, -47, 6);
  else if (pose === 'run')  { arms = LIMB(-8, -26, -19, -14, 6) + LIMB(8, -26, 21, -38, 6);
                              legs = LIMB(-3, -6, -15, -10, 6) + LIMB(4, -6, 9, 2, 6); bottom = -6; }
  else if (pose === 'reachR') arms = LIMB(-9, -26, -14, -12, 6) + LIMB(8, -26, 27, -31, 6);
  else if (pose === 'reachL') arms = LIMB(9, -26, 14, -12, 6) + LIMB(-8, -26, -27, -31, 6);
  else if (pose === 'hang')  { arms = LIMB(-8, -30, -17, -19, 5) + LIMB(8, -30, 17, -19, 5);
                              legs = LIMB(-5, -2, -8, 10, 5) + LIMB(5, -2, 8, 10, 5); bottom = -2; }
  else if (pose === 'sit')   { arms = LIMB(-9, -26, -18, -18, 6) + LIMB(9, -26, 18, -18, 6);
                              legs = LIMB(-5, -4, -16, 0, 6) + LIMB(5, -4, 16, 0, 6); bottom = -4; }
  else                        arms = LIMB(-9, -26, -14, -12, 6) + LIMB(9, -26, 14, -12, 6);
  const head = pose === 'shout'
    ? '<circle cx="0" cy="-46" r="13" fill="#fde2c5" stroke="#33224a" stroke-width="1.6"/>' +
      '<path d="M-13 -50 q0 -16 13 -16 q13 0 13 16 q-4 -7 -13 -7 q-9 0 -13 7 Z" fill="#5d3a1f"/>' +
      '<circle cx="-5" cy="-48" r="1.7" fill="#33224a"/><circle cx="5" cy="-48" r="1.7" fill="#33224a"/>' +
      '<ellipse cx="0" cy="-38" rx="5" ry="6" fill="#33224a"/>'
    : GIRL_FACE(0, -46, 13, mood);
  return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' + arms +
    '<path d="M-13 ' + bottom + ' L-8 -34 L8 -34 L13 ' + bottom + ' Z" fill="' + dress +
    '" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' + legs + head +
    (o.crown ? CROWN(0, -58, 11) : '') + '</g>';
};

// 大人：kind = mom / dad / man / teacher
const ADULT = (x, y, s, o) => {
  o = o || {};
  const c = o.color || '#9b59b6', hair = o.hair || '#3a2510';
  const arms = o.pose === 'reachL' ? LIMB(-10, -30, -30, -24, 6)
             : o.pose === 'reachR' ? LIMB(10, -30, 30, -24, 6)
             : LIMB(-11, -30, -16, -14, 6) + LIMB(11, -30, 16, -14, 6);
  return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
    (o.cape ? '<g class="cape" style="transform-origin:0px -40px"><path d="M-10 -40 q-24 24 -16 40 q16 -10 28 -6 Z" fill="#e74c3c" stroke="#33224a" stroke-width="1.5" stroke-linejoin="round"/></g>' : '') +
    arms +
    '<path d="M-14 0 L-10 -42 L10 -42 L14 0 Z" fill="' + c + '" stroke="#33224a" stroke-width="1.7" stroke-linejoin="round"/>' +
    '<circle cx="0" cy="-54" r="13" fill="#fde2c5" stroke="#33224a" stroke-width="1.7"/>' +
    '<path d="M-13 -56 q-1 -18 13 -18 q14 0 13 18 q-3 -8 -13 -8 q-10 0 -13 8 Z" fill="' + hair + '"/>' +
    '<circle cx="-5" cy="-55" r="1.6" fill="#33224a"/><circle cx="5" cy="-55" r="1.6" fill="#33224a"/>' +
    '<path d="M-5 -48 q5 4 10 0" stroke="#33224a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    (o.beard ? '<path d="M-8 -47 q8 5 16 0 q-3 7 -8 7 q-5 0 -8 -7 Z" fill="' + hair + '"/>' : '') +
    '</g>';
};

// 爸爸／媽媽的固定樣式（爸爸沿用骰子遊戲「爸比戰士」的紅披風，孩子認得出來）
const DAD = (x, y, s, pose) => ADULT(x, y, s, { color: '#9aa4ad', beard: 1, cape: 1, pose: pose });
const MOM = (x, y, s, pose) => ADULT(x, y, s, { color: '#9b59b6', pose: pose });

// 佈景：背景色 + 地面
const BG = (sky, ground) =>
  '<rect width="200" height="130" fill="' + sky + '"/>' +
  '<rect x="0" y="118" width="200" height="12" fill="' + (ground || '#a8e6c0') + '"/>';

/* ---- 道具 ---- */
// 大手機（網路／詐騙類）
const PHONE = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<rect x="-26" y="-42" width="52" height="84" rx="8" fill="#33224a"/>' +
  '<rect x="-22" y="-37" width="44" height="70" rx="3" fill="#cfe6ff"/>' +
  '<circle cx="0" cy="37" r="3.5" fill="#6b5a7e"/></g>';

// 制服大人（救生員／消防員／店員／警察）
const HELPER = (x, y, s, color, hat) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<path d="M-11 40 L-8 -6 L8 -6 L11 40 Z" fill="' + color + '" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
  '<circle cx="0" cy="-18" r="12" fill="#fde2c5" stroke="#33224a" stroke-width="1.6"/>' +
  (hat
    ? '<path d="M-14 -24 q0 -12 14 -12 q14 0 14 12 Z" fill="' + color + '" stroke="#33224a" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<rect x="-16" y="-25" width="32" height="4" rx="2" fill="' + color + '" stroke="#33224a" stroke-width="1.2"/>'
    : '<path d="M-12 -20 q-1 -16 12 -16 q13 0 12 16 q-3 -7 -12 -7 q-9 0 -12 7 Z" fill="#3a2510"/>') +
  '<circle cx="-4" cy="-19" r="1.5" fill="#33224a"/><circle cx="4" cy="-19" r="1.5" fill="#33224a"/>' +
  '<path d="M-5 -13 q5 4 10 0" stroke="#33224a" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>';

const CAR = (x, y, s, flip) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + (s * (flip ? -1 : 1)) + ',' + s + ')">' +
  '<path d="M-34 0 L-30 -14 L-10 -22 L14 -22 L30 -12 L34 0 Z" fill="#b9c3cc" stroke="#33224a" stroke-width="1.8" stroke-linejoin="round"/>' +
  '<path d="M-24 -14 L-8 -19 L-8 -14 Z M-2 -19 L12 -19 L24 -13 L-2 -13 Z" fill="#cfe6ff"/>' +
  '<circle cx="-18" cy="1" r="6" fill="#33224a"/><circle cx="18" cy="1" r="6" fill="#33224a"/>' +
  '</g>';
const DESK = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<rect x="-52" y="-52" width="104" height="8" rx="2" fill="#e0a76a" stroke="#33224a" stroke-width="1.8"/>' +
  '<rect x="-46" y="-44" width="7" height="44" fill="#c98f52" stroke="#33224a" stroke-width="1.5"/>' +
  '<rect x="39" y="-44" width="7" height="44" fill="#c98f52" stroke="#33224a" stroke-width="1.5"/></g>';
const BOARD = (x, y) =>
  '<rect x="' + x + '" y="' + y + '" width="76" height="42" rx="3" fill="#3f6b53" stroke="#33224a" stroke-width="2"/>' +
  '<path d="M' + (x + 10) + ' ' + (y + 16) + ' h40 M' + (x + 10) + ' ' + (y + 27) + ' h26" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>';
const WATER = (y) =>
  '<rect x="0" y="' + y + '" width="200" height="' + (130 - y) + '" fill="#7fc1ed"/>' +
  '<path d="M0 ' + y + ' q14 -5 28 0 q14 5 28 0 q14 -5 28 0 q14 5 28 0 q14 -5 28 0 q14 5 28 0 q14 -5 28 0 v10 H0 Z" fill="#a8d8f5"/>';
const FLAME = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" class="fadeDanger">' +
  '<path d="M0 0 q4 -20 12 -26 q-2 10 6 14 q6 -8 2 -18 q14 12 10 30 Z" fill="#ff8c42"/>' +
  '<path d="M6 0 q2 -12 8 -16 q-1 7 3 9 q3 -5 1 -11 q9 8 6 18 Z" fill="#ffd23f"/></g>';
const SHELF = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<rect x="-24" y="-60" width="48" height="60" fill="#d9c8a8" stroke="#33224a" stroke-width="1.8"/>' +
  '<path d="M-24 -42 h48 M-24 -24 h48" stroke="#33224a" stroke-width="1.5"/>' +
  '<rect x="-18" y="-56" width="10" height="12" fill="#ff8fb8"/><rect x="-4" y="-56" width="10" height="12" fill="#7fc1ed"/>' +
  '<rect x="-18" y="-38" width="10" height="12" fill="#ffd23f"/><rect x="2" y="-38" width="12" height="12" fill="#a8e6c0"/></g>';
const DOOR = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<rect x="-35" y="-104" width="70" height="104" rx="4" fill="#c98f52" stroke="#33224a" stroke-width="2.4"/>' +
  '<rect x="-27" y="-94" width="54" height="36" rx="3" fill="#b57c43"/>' +
  '<circle cx="-25" cy="-46" r="4.5" fill="#ffd23f" stroke="#33224a" stroke-width="1.6"/>' +
  '<circle cx="0" cy="-76" r="5" fill="#33224a"/><circle cx="0" cy="-76" r="2" fill="#8fd0ff"/></g>';
const SPEECH = (x, y, txt) =>
  '<g class="clash"><path d="M' + x + ' ' + y + ' q22 0 22 13 q0 13 -22 13 q-4 6 -10 7 q3 -5 2 -8 q-14 -3 -14 -12 q0 -13 22 -13 Z" fill="#fff" stroke="#33224a" stroke-width="1.6"/>' +
  '<text x="' + (x + 8) + '" y="' + (y + 18) + '" font-size="13">' + txt + '</text></g>';
const EMO = (x, y, e, size, cls) =>
  '<text x="' + x + '" y="' + y + '" font-size="' + (size || 15) + '"' + (cls ? ' class="' + cls + '"' : '') + '>' + e + '</text>';
const SVG = (label, body) =>
  '<svg viewBox="0 0 200 130" role="img" aria-label="' + label + '">' + body + '</svg>';

// 常用的「安全了」與「被抓走」收尾
const SUNBURST = (cx, cy) =>
  '<g class="rays" style="transform-origin:' + cx + 'px ' + cy + 'px">' +
  Array.from({ length: 12 }, (_, i) =>
    '<path d="M' + cx + ' ' + cy + ' L' + (cx - 6) + ' -40 L' + (cx + 6) + ' -40 Z" fill="#ffe9a8" opacity=".75" transform="rotate(' + (i * 30) + ' ' + cx + ' ' + cy + ')"/>').join('') +
  '</g>';
const CAUGHT = (gx, gy) =>
  '<g class="fly"><g style="transform-origin:' + gx + 'px ' + (gy - 34) + 'px">' + DRAGON(gx, gy - 34, 0.95, 1) + '</g>' +
  '<g class="dangle" style="transform-origin:' + (gx - 8) + 'px ' + (gy - 20) + 'px">' +
  '<path d="M' + (gx - 8) + ' ' + (gy - 24) + ' L' + (gx - 8) + ' ' + (gy - 12) + '" stroke="#2a6b4f" stroke-width="3.2" stroke-linecap="round"/>' +
  GIRL(gx - 8, gy + 30, 0.72, { pose: 'hang', mood: 'flat' }) + '</g></g>';

