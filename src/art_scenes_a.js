/* ===== 每個結局的專屬畫面（前 8 個劇本） ===== */
const STORE = (x) =>
  '<rect x="' + x + '" y="14" width="86" height="18" rx="4" fill="#27ae60" stroke="#33224a" stroke-width="1.8"/>' +
  '<text x="' + (x + 43) + '" y="27" font-size="10" fill="#fff" text-anchor="middle" font-weight="bold">OPEN 24H</text>' +
  '<rect x="' + (x + 6) + '" y="36" width="74" height="82" fill="#eafaf1" stroke="#33224a" stroke-width="1.6"/>';

const ART_SCENES = {
  /* ---------- 1. 放學路上 ---------- */
  'road.best': SVG('小女生在便利商店裡打電話給媽媽，車子開走了',
    BG('#fff6e6', '#c8c0b0') + STORE(96) + CAR(24, 112, 0.8, true) + EMO(6, 92, '💨', 14) +
    GIRL(133, 116, 0.95, { pose: 'reachR' }) + '<rect x="150" y="60" width="9" height="16" rx="3" fill="#33224a"/>' +
    EMO(160, 56, '📞', 14, 'zzz') + SUNBURST(133, 70)),
  'road.good': SVG('小女生跑進便利商店，店員出來看',
    BG('#fff6e6', '#c8c0b0') + STORE(90) + CAR(30, 112, 0.8, true) +
    HELPER(120, 76, 0.82, '#27ae60', true) + GIRL(150, 116, 0.9, { pose: 'run' }) + EMO(168, 60, '💨', 14)),
  'road.escape': SVG('小女生大喊，路人回頭看，車子開走了',
    BG('#fff6e6', '#c8c0b0') +
    '<g opacity=".5" fill="#6b5a7e"><circle cx="26" cy="66" r="9"/><rect x="18" y="76" width="16" height="42" rx="4"/>' +
    '<circle cx="52" cy="72" r="8"/><rect x="45" y="81" width="14" height="37" rx="4"/></g>' +
    CAR(168, 112, 0.8, false) + EMO(186, 88, '💨', 13) +
    GIRL(102, 118, 1, { pose: 'shout' }) +
    '<g class="dash" stroke="#e85a92" stroke-width="3" fill="none" stroke-linecap="round">' +
    '<path d="M122 58 q8 8 0 16"/><path d="M130 52 q13 14 0 28"/><path d="M138 46 q19 20 0 40"/></g>'),
  'road.bad': SVG('車子把小女生載走了',
    BG('#e6e2f5', '#8f83b3') + '<circle cx="168" cy="26" r="12" fill="#fff3b0"/>' + CAUGHT(74, 96)),

  /* ---------- 2. 網路上的新朋友 ---------- */
  'online.best': SVG('小女生把手機拿給爸爸看',
    BG('#f3f0ff', '#c9bfe0') + SUNBURST(100, 66) +
    DAD(72, 118, 0.92, 'reachR') +
    GIRL(128, 118, 0.92, { pose: 'reachL' }) +
    '<rect x="94" y="76" width="14" height="24" rx="4" fill="#33224a"/>' + EMO(140, 46, '✨', 15, 'twinkle')),
  'online.good': SVG('把對方封鎖了，畫面上出現禁止符號',
    BG('#eefaf0') + PHONE(138, 64, 1.1) + EMO(120, 76, '🚫', 30, 'clash') +
    GIRL(62, 118, 0.95, { pose: 'reachR' }) + EMO(30, 50, '✨', 14, 'twinkle')),
  'online.escape': SVG('小女生舉起盾牌，擋下從手機伸出來的爪子',
    BG('#e9fbf0') + PHONE(163, 62, 0.95) +
    '<g class="clawPush"><path d="M152 58 q-16 6 -26 6" stroke="#4caf7d" stroke-width="9" stroke-linecap="round"/>' +
    '<path d="M128 64 l-8 -5 M128 64 l-8 5 M128 64 l-9 0" stroke="#2a6b4f" stroke-width="3" stroke-linecap="round"/></g>' +
    EMO(104, 52, '💥', 20, 'clash') +
    '<g class="bob">' + GIRL(76, 118, 0.98, { pose: 'reachR' }) +
    '<path d="M110 44 L126 50 L126 74 q0 12 -16 18 q-16 -6 -16 -18 L94 50 Z" fill="#7fc1ed" stroke="#33224a" stroke-width="2" stroke-linejoin="round"/>' +
    '<path d="M110 52 L110 82 M100 62 L120 62" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>'),
  'online.bad': SVG('手機螢幕裡伸出爪子，把小女生往裡面拖',
    BG('#e6e2f5', '#8f83b3') + PHONE(140, 64, 1.15) +
    '<g class="swirl" style="transform-origin:140px 64px"><path d="M140 34 q26 30 0 60 q-26 -30 0 -60" fill="#7ed6a5" opacity=".55"/></g>' +
    '<g class="pull"><path d="M124 66 q-22 2 -34 2" stroke="#4caf7d" stroke-width="10" stroke-linecap="round"/>' +
    '<path d="M92 68 l-9 -6 M92 68 l-9 6" stroke="#2a6b4f" stroke-width="3.4" stroke-linecap="round"/>' +
    '<g class="dangle" style="transform-origin:74px 70px">' + GIRL(72, 106, 0.82, { pose: 'hang', mood: 'flat' }) +
    EMO(46, 56, '💦', 13) + '</g></g>'),

  /* ---------- 3. 班上的事 ---------- */
  'bully.best': SVG('兩個女生手牽手站在一起，其他同學在後面',
    BG('#fff0f6') + BOARD(12, 16) +
    '<g opacity=".35" fill="#b6a7d6"><circle cx="176" cy="74" r="9"/><rect x="168" y="84" width="16" height="34" rx="4"/></g>' +
    GIRL(78, 118, 0.95, { pose: 'reachR' }) + GIRL(124, 118, 0.95, { pose: 'reachL', dress: '#7fc1ed' }) +
    '<g class="hearts">' + EMO(92, 42, '💖', 16) + EMO(72, 34, '💕', 12) + EMO(116, 34, '💗', 12) + '</g>'),
  'bully.escape': SVG('老師蹲下來，認真聽小女生說話',
    BG('#f2f7ff', '#c8dcf0') + BOARD(14, 16) +
    ADULT(66, 116, 0.78, { color: '#5e8f78' }) + GIRL(126, 118, 0.92, { pose: 'reachL' }) +
    SPEECH(140, 40, '💬')),
  'bully.bad': SVG('放學後的空教室，只剩一張空位子',
    BG('#e6e2f5', '#8f83b3') + BOARD(14, 16) +
    '<g opacity=".5">' + DESK(70, 112, 0.5) + DESK(140, 112, 0.5) + '</g>' +
    GIRL(100, 118, 0.9, { pose: 'sit', mood: 'flat' }) + EMO(128, 60, '💭', 18, 'zzz')),

  /* ---------- 4. 地震來了 ---------- */
  'quake.best': SVG('小女生躲在桌子底下抓住桌腳，旁邊的櫃子倒下來了',
    BG('#fff6e6', '#d8c3a0') +
    '<g class="tilt" style="transform-origin:34px 118px"><rect x="6" y="72" width="30" height="46" rx="2" fill="#c49a6c" stroke="#33224a" stroke-width="1.6" transform="rotate(-22 34 118)"/></g>' +
    '<g class="shakeBits" fill="#c49a6c"><circle cx="52" cy="112" r="3"/><circle cx="60" cy="116" r="2.2"/></g>' +
    DESK(128, 118, 1) + '<g class="crouch">' + GIRL(120, 118, 0.72, { pose: 'reachL' }) + '</g>' + EMO(150, 100, '👌', 15)),
  'quake.escape': SVG('全班排隊走樓梯疏散到操場',
    BG('#eafaf1') +
    '<path d="M0 118 L40 118 L40 96 L80 96 L80 74 L120 74 L120 52 L160 52" stroke="#b6a7d6" stroke-width="10" fill="none"/>' +
    ADULT(150, 52, 0.62, { color: '#5e8f78' }) + GIRL(112, 74, 0.6) + GIRL(74, 96, 0.6, { dress: '#7fc1ed' }) +
    GIRL(36, 118, 0.6, { dress: '#ffd23f' }) + EMO(166, 30, '🏫', 16)),
  'quake.bad': SVG('地震時站在窗邊，東西掉下來了',
    BG('#e6e2f5', '#8f83b3') + '<rect x="130" y="24" width="52" height="60" fill="#cfe6ff" stroke="#33224a" stroke-width="2"/>' +
    '<g class="shakeBits" fill="#c49a6c"><circle cx="96" cy="40" r="5"/><circle cx="112" cy="28" r="4"/><circle cx="80" cy="30" r="3.4"/></g>' +
    GIRL(100, 118, 0.95, { pose: 'hang', mood: 'flat' }) + EMO(64, 52, '💦', 14)),

  /* ---------- 5. 一個人在家 ---------- */
  'home.best': SVG('小女生沒有開門，隔著門打電話給爸媽',
    BG('#fff6e6', '#d8c3a0') + DOOR(135, 118, 1) +
    '<g class="fadeDanger"><path d="M176 118 q6 -34 14 -34 q8 0 14 34 Z" fill="#6b5a7e" opacity=".45"/></g>' +
    GIRL(54, 118, 0.98, { pose: 'reachR' }) + '<rect x="70" y="60" width="9" height="16" rx="3" fill="#33224a"/>' +
    EMO(80, 48, '📞', 14, 'zzz')),
  'home.escape': SVG('小女生大聲說爸爸快到家了，門外的人離開了',
    BG('#fff6e6', '#d8c3a0') + DOOR(135, 118, 1) +
    '<g class="dragonMiss" opacity=".5"><path d="M180 118 q6 -32 12 -32 q7 0 12 32 Z" fill="#6b5a7e"/></g>' + EMO(186, 74, '💨', 13) +
    GIRL(56, 118, 0.98, { pose: 'shout' }) + SPEECH(84, 40, '📢')),
  'home.bad': SVG('門被打開了，惡龍在門口',
    BG('#e6e2f5', '#8f83b3') +
    '<g transform="translate(140,118) scale(1)"><rect x="-35" y="-104" width="70" height="104" rx="4" fill="#3d3357" stroke="#33224a" stroke-width="2.4"/></g>' +
    '<g class="snore" style="transform-origin:140px 84px">' + DRAGON(140, 84, 0.8, -1) + '</g>' +
    GIRL(58, 118, 0.92, { pose: 'hang', mood: 'flat' }) + EMO(28, 56, '💦', 14)),

  /* ---------- 6. 手機裡的訊息 ---------- */
  'scam.best': SVG('小女生把假中獎的視窗關掉，比出讚',
    BG('#eefaf0') + PHONE(148, 64, 1.05) + EMO(130, 78, '🚫', 28, 'clash') +
    GIRL(66, 118, 1, { pose: 'reachR' }) + EMO(96, 62, '👍', 20, 'bob') + SUNBURST(66, 66)),
  'scam.escape': SVG('小女生把平板拿給爸爸媽媽看，他們打電話查證',
    BG('#f3f0ff', '#c9bfe0') + DAD(38, 118, 0.86, 'reachR') + MOM(82, 118, 0.9, 'reachR') +
    GIRL(136, 118, 0.9, { pose: 'reachL' }) + '<rect x="94" y="74" width="16" height="26" rx="4" fill="#33224a"/>' +
    EMO(140, 44, '165', 13) + EMO(28, 48, '📞', 14, 'zzz')),
  'scam.bad': SVG('信用卡被刷走，錢飛出手機',
    BG('#e6e2f5', '#8f83b3') + PHONE(140, 60, 1.05) +
    '<g class="hearts">' + EMO(96, 46, '💸', 18) + EMO(74, 34, '💸', 15) + EMO(112, 30, '💸', 14) + '</g>' +
    GIRL(58, 118, 0.92, { pose: 'hang', mood: 'flat' }) + EMO(26, 58, '💦', 14)),

  /* ---------- 7. 廚房起火了 ---------- */
  'fire.best': SVG('開窗通風並關掉瓦斯，消防員來檢查',
    BG('#eafaf1') + '<rect x="10" y="24" width="52" height="46" fill="#cfe6ff" stroke="#33224a" stroke-width="2"/>' +
    '<path d="M14 28 h20 M14 40 h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
    HELPER(96, 78, 1, '#e74c3c', true) + '<path d="M107 84 L126 92" stroke="#fde2c5" stroke-width="6" stroke-linecap="round"/>' +
    GIRL(140, 118, 0.92) + EMO(168, 46, '✨', 15, 'twinkle')),
  'fire.escape': SVG('小女生退到門口大聲叫媽媽，火被撲滅了',
    BG('#fff4e0', '#d8c3a0') + FLAME(26, 118, 0.7) +
    '<rect x="60" y="70" width="46" height="8" rx="2" fill="#9aa4ad" stroke="#33224a" stroke-width="1.6"/>' +
    ADULT(84, 118, 0.86, { color: '#9b59b6', pose: 'reachL' }) +
    GIRL(150, 118, 0.95, { pose: 'shout' }) + SPEECH(120, 36, '📢')),
  'fire.bad': SVG('往油鍋潑水，火焰竄得更大',
    BG('#3d3357', '#5a4a72') + FLAME(88, 112, 1.5) + FLAME(120, 116, 1.1) +
    '<rect x="70" y="76" width="46" height="8" rx="2" fill="#9aa4ad" stroke="#33224a" stroke-width="1.6"/>' +
    GIRL(40, 118, 0.9, { pose: 'hang', mood: 'flat' }) + EMO(12, 56, '💦', 14)),

  /* ---------- 8. 泳池邊 ---------- */
  'pool.best': SVG('小女生大喊救生員，並把浮板丟給同學',
    BG('#e8f6ff', '#dbe8f0') + WATER(84) +
    '<circle cx="128" cy="92" r="11" fill="none" stroke="#ff5a4a" stroke-width="5" class="bob"/>' +
    HELPER(170, 84, 0.86, '#e74c3c', false) +
    GIRL(56, 84, 0.95, { pose: 'shout' }) +
    '<g class="dash" stroke="#e85a92" stroke-width="3" fill="none" stroke-linecap="round"><path d="M74 44 q8 8 0 16"/><path d="M82 38 q13 14 0 28"/></g>'),
  'pool.good': SVG('小女生跑去找大人幫忙',
    BG('#e8f6ff', '#dbe8f0') + WATER(96) + HELPER(158, 96, 0.86, '#e74c3c', false) +
    GIRL(76, 96, 0.95, { pose: 'run' }) + EMO(96, 46, '💨', 14) + EMO(178, 60, '❗', 16, 'clash')),
  'pool.escape': SVG('小女生放鬆浮起來，把頭仰高呼吸',
    BG('#e8f6ff') + WATER(60) +
    '<g class="bob"><ellipse cx="100" cy="72" rx="30" ry="9" fill="#a8d8f5"/>' +
    GIRL_FACE(100, 62, 13, 'happy') +
    LIMB(84, 74, 66, 68, 6) + LIMB(116, 74, 134, 68, 6) + '</g>' +
    EMO(150, 44, '😮‍💨', 16)),
  'pool.bad': SVG('在深水區沉下去了',
    BG('#cfe6ff') + WATER(28) +
    '<g class="fly">' + GIRL(100, 108, 0.9, { pose: 'hang', mood: 'flat' }) + '</g>' +
    '<g class="puff" fill="#fff" opacity=".7"><circle cx="118" cy="60" r="5"/><circle cx="128" cy="46" r="3.6"/><circle cx="136" cy="34" r="2.6"/></g>'),
};

