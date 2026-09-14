/* ===== 第 19 個劇本：教室裡的危險 ===== */
// 危險狀況以「💢 騷動」表示，不畫武器、不畫傷害
Object.assign(ART_SCENES, {
  'knife.best': SVG('小女生跑到辦公室求救，老師們立刻趕過去',
    BG('#eefaf0') + SUNBURST(58, 66) +
    '<rect x="112" y="40" width="80" height="78" rx="3" fill="#fff6e6" stroke="#33224a" stroke-width="1.8"/>' +
    '<text x="152" y="56" font-size="10" fill="#6b4a9e" text-anchor="middle" font-weight="bold">辦公室</text>' +
    ADULT(134, 118, 0.82, { color: '#5e8f78', pose: 'reachL' }) +
    ADULT(172, 118, 0.82, { color: '#3f6bb5' }) +
    GIRL(58, 118, 0.95, { pose: 'shout' }) +
    '<g class="dash" stroke="#e85a92" stroke-width="3" fill="none" stroke-linecap="round">' +
    '<path d="M78 60 q8 8 0 16"/><path d="M86 54 q13 14 0 28"/></g>' +
    EMO(20, 50, '💨', 14)),

  'knife.escape': SVG('小女生躲進空教室，關門並用椅子頂住，安靜等待',
    BG('#f2f7ff', '#c8dcf0') +
    '<rect x="96" y="10" width="98" height="108" fill="#dfe8f5" stroke="#33224a" stroke-width="2"/>' +
    '<rect x="86" y="18" width="12" height="100" rx="2" fill="#c98f52" stroke="#33224a" stroke-width="2"/>' +
    '<circle cx="92" cy="70" r="3.4" fill="#ffd23f" stroke="#33224a" stroke-width="1.4"/>' +
    '<g class="tilt" style="transform-origin:110px 118px">' +
    '<rect x="102" y="78" width="20" height="8" rx="2" fill="#e0a76a" stroke="#33224a" stroke-width="1.5"/>' +
    '<rect x="104" y="86" width="5" height="32" fill="#c98f52" stroke="#33224a" stroke-width="1.3"/>' +
    '<rect x="116" y="86" width="5" height="32" fill="#c98f52" stroke="#33224a" stroke-width="1.3"/></g>' +
    GIRL(154, 118, 0.9, { pose: 'sit' }) +
    EMO(168, 56, '🤫', 18, 'bob') +
    '<g class="fadeDanger">' + EMO(20, 66, '💢', 20) + '</g>'),

  'knife.bad': SVG('躲在教室桌子底下，但門是開著的',
    BG('#e6e2f5', '#8f83b3') + BOARD(112, 16) +
    DESK(70, 118, 0.95) +
    '<g class="crouch">' + GIRL(62, 118, 0.7, { pose: 'sit', mood: 'flat' }) + '</g>' +
    '<rect x="160" y="20" width="10" height="98" rx="2" fill="#c98f52" stroke="#33224a" stroke-width="2"/>' +
    '<g class="fadeDanger">' + EMO(174, 70, '💢', 22) + '</g>' +
    EMO(36, 60, '💦', 14)),
});

