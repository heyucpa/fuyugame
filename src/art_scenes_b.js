/* ===== 每個結局的專屬畫面（後 8 個劇本） ===== */
Object.assign(ART_SCENES, {
  /* ---------- 9. 賣場走失 ---------- */
  'lost.best': SVG('服務台廣播後，媽媽跑過來抱住小女生',
    BG('#eafaf1') +
    '<rect x="8" y="82" width="74" height="36" rx="3" fill="#d9c8a8" stroke="#33224a" stroke-width="1.8"/>' +
    '<text x="45" y="76" font-size="11" fill="#6b4a9e" text-anchor="middle" font-weight="bold">服務台</text>' +
    EMO(30, 52, '📢', 16, 'ring') +
    ADULT(112, 118, 0.88, { color: '#9b59b6', pose: 'reachR' }) + GIRL(156, 118, 0.8, { pose: 'reachL' }) +
    '<g class="hearts">' + EMO(128, 46, '💖', 15) + '</g>'),
  'lost.good': SVG('小女生待在原地等，爸爸自己找回來了',
    BG('#eafaf1') + SHELF(150, 118, 0.9) + SHELF(30, 118, 0.9) +
    DAD(72, 118, 0.88, 'reachR') + GIRL(112, 118, 0.85) +
    EMO(94, 40, '💕', 15, 'twinkle')),
  'lost.escape': SVG('小女生甩開陌生人的手，跑回人多的地方',
    BG('#eafaf1') + SHELF(24, 118, 0.85) +
    '<g class="dragonMiss" opacity=".75" style="transform-origin:66px 90px">' +
    ADULT(66, 118, 0.86, { color: '#8a8f96', pose: 'reachR' }) + '</g>' +
    GIRL(132, 118, 0.95, { pose: 'run' }) + EMO(154, 52, '💨', 14) +
    '<rect x="160" y="84" width="34" height="34" rx="3" fill="#d9c8a8" stroke="#33224a" stroke-width="1.6"/>'),
  'lost.bad': SVG('跟著陌生人走進沒有人的通道',
    BG('#e6e2f5', '#8f83b3') +
    '<path d="M60 30 L140 30 L164 118 L36 118 Z" fill="#544a70"/>' +
    ADULT(84, 112, 0.78, { color: '#6b5a7e', pose: 'reachR' }) +
    GIRL(116, 112, 0.7, { pose: 'hang', mood: 'flat' }) + EMO(136, 62, '💦', 13)),

  /* ---------- 10. 同學的請求 ---------- */
  'money.best': SVG('小女生抱著存錢筒，推開伸過來要錢的手',
    BG('#fffbe6') +
    '<g class="clawPush">' +
    '<path d="M198 78 h-38" stroke="#c9a98a" stroke-width="11" stroke-linecap="round"/>' +
    '<ellipse cx="152" cy="78" rx="12" ry="10" fill="#e0bfa0" stroke="#33224a" stroke-width="1.5"/>' +
    '<path d="M141 72 h-9 M140 78 h-11 M141 84 h-9" stroke="#e0bfa0" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M141 72 h-9 M140 78 h-11 M141 84 h-9" stroke="#33224a" stroke-width="0.9" fill="none" opacity=".5"/>' +
    '</g>' +
    EMO(120, 66, '🚫', 18, 'clash') +
    '<g class="bob">' + GIRL(72, 118, 0.98, { pose: 'reachR' }) +
    '<ellipse cx="96" cy="100" rx="19" ry="14" fill="#ffb7d8" stroke="#33224a" stroke-width="1.8"/>' +
    '<circle cx="106" cy="97" r="1.8" fill="#33224a"/>' +
    '<path d="M90 87 h12" stroke="#33224a" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M84 112 l0 5 M104 112 l0 5" stroke="#33224a" stroke-width="2.6" stroke-linecap="round"/>' +
    EMO(88, 80, '🪙', 13) + '</g>'),
  'money.escape': SVG('小女生把事情老實告訴爸爸',
    BG('#f3f0ff', '#c9bfe0') + DAD(70, 118, 0.92, 'reachR') +
    GIRL(128, 118, 0.92, { pose: 'reachL' }) + SPEECH(140, 38, '💬') + EMO(30, 46, '💕', 14, 'twinkle')),
  'money.bad': SVG('空空的錢包，小女生低著頭',
    BG('#e6e2f5', '#8f83b3') +
    '<g class="bob"><rect x="112" y="60" width="46" height="32" rx="4" fill="#8a6a4a" stroke="#33224a" stroke-width="1.8"/>' +
    '<path d="M112 72 h46" stroke="#33224a" stroke-width="1.5"/></g>' +
    '<g class="hearts">' + EMO(124, 46, '💸', 15) + EMO(146, 40, '💸', 13) + '</g>' +
    GIRL(60, 118, 0.92, { pose: 'hang', mood: 'flat' })),

  /* ---------- 11. 考試那天 ---------- */
  'exam.best': SVG('小女生舉起自己努力考到的考卷',
    BG('#eefaf0') + BOARD(12, 14) +
    '<g class="bob"><g transform="rotate(-7 142 62)">' +
    '<rect x="116" y="30" width="52" height="64" rx="3" fill="#fff" stroke="#33224a" stroke-width="2"/>' +
    '<path d="M124 44 h22 M124 52 h30" stroke="#c8c8d8" stroke-width="2.4" stroke-linecap="round"/>' +
    '<text x="142" y="86" font-size="24" fill="#e85a92" text-anchor="middle" font-weight="bold">100</text></g></g>' +
    GIRL(84, 118, 0.98, { pose: 'reachR' }) + EMO(40, 44, '✨', 15, 'twinkle')),
  'exam.escape': SVG('小女生舉手向老師承認，老師點點頭',
    BG('#f2f7ff', '#c8dcf0') + BOARD(14, 16) +
    ADULT(150, 118, 0.9, { color: '#5e8f78' }) + GIRL(90, 118, 0.95, { pose: 'cheer' }) +
    SPEECH(104, 34, '🙋')),
  'exam.bad': SVG('老師打電話給爸媽，事情變得更大',
    BG('#e6e2f5', '#8f83b3') + BOARD(14, 16) +
    ADULT(146, 118, 0.88, { color: '#5e8f78', pose: 'reachL' }) +
    '<rect x="120" y="56" width="10" height="18" rx="3" fill="#33224a"/>' + EMO(104, 46, '📞', 14, 'ring') +
    GIRL(58, 118, 0.9, { pose: 'hang', mood: 'flat' })),

  /* ---------- 12. 不能說的秘密 ---------- */
  'secret.best': SVG('媽媽緊緊抱住小女生說這不是你的錯',
    BG('#fff0f6') + SUNBURST(100, 68) +
    ADULT(86, 118, 0.95, { color: '#9b59b6', pose: 'reachR' }) +
    GIRL(124, 118, 0.8, { pose: 'reachL' }) +
    '<g class="hearts">' + EMO(96, 40, '💖', 17) + EMO(76, 32, '💕', 13) + EMO(120, 30, '💗', 13) + '</g>'),
  'secret.escape': SVG('爸爸媽媽站在小女生兩邊，支持她',
    BG('#f3f0ff', '#c9bfe0') +
    DAD(52, 118, 0.92, 'reachR') + MOM(150, 118, 0.92, 'reachL') +
    GIRL(101, 118, 0.82) + EMO(88, 36, '💖', 15, 'twinkle') + EMO(112, 30, '💕', 12, 'twinkle')),
  'secret.bad': SVG('小女生一個人把事情放在心裡，旁邊有 113 的提示',
    BG('#e6e2f5', '#8f83b3') +
    GIRL(84, 118, 0.95, { pose: 'sit', mood: 'flat' }) +
    '<g class="zzz">' + EMO(122, 62, '💭', 20) + '</g>' +
    '<g class="bob"><rect x="132" y="72" width="52" height="26" rx="6" fill="#fff" stroke="#33224a" stroke-width="1.8"/>' +
    '<text x="158" y="90" font-size="15" fill="#e85a92" text-anchor="middle" font-weight="bold">113</text></g>'),

  /* ---------- 13. 自稱警察的電話 ---------- */
  'fakecop.best': SVG('小女生掛掉電話，改打給媽媽，爸爸好好的在上班',
    BG('#eefaf0') + SUNBURST(70, 66) +
    GIRL(70, 118, 0.98, { pose: 'reachR' }) + '<rect x="88" y="58" width="10" height="18" rx="3" fill="#33224a"/>' +
    EMO(100, 46, '📞', 14, 'zzz') +
    '<g class="bob"><rect x="126" y="56" width="56" height="40" rx="5" fill="#fff" stroke="#33224a" stroke-width="1.8"/>' +
    '<text x="154" y="74" font-size="11" fill="#6b4a9e" text-anchor="middle" font-weight="bold">爸爸</text>' +
    '<text x="154" y="88" font-size="11" fill="#27ae60" text-anchor="middle" font-weight="bold">沒事 ✓</text></g>'),
  'fakecop.escape': SVG('爸爸媽媽報警處理這通詐騙電話',
    BG('#f2f7ff', '#c8dcf0') + HELPER(150, 118, 0.88, '#3f6bb5', true) +
    ADULT(60, 118, 0.9, { color: '#9b59b6', pose: 'reachR' }) + GIRL(104, 118, 0.82) +
    EMO(30, 44, '110', 13) + EMO(172, 48, '🚔', 16, 'bob')),
  'fakecop.bad': SVG('把家裡的錢放在門口，被拿走了',
    BG('#e6e2f5', '#8f83b3') + DOOR(150, 118, 0.9) +
    '<g class="fly"><rect x="96" y="92" width="30" height="20" rx="3" fill="#8a6a4a" stroke="#33224a" stroke-width="1.6"/>' +
    EMO(100, 82, '💸', 15) + '</g>' +
    GIRL(50, 118, 0.9, { pose: 'hang', mood: 'flat' }) + EMO(22, 58, '💦', 13)),

  /* ---------- 14. 便宜的遊戲點數 ---------- */
  'shop.best': SVG('小女生把假特價的頁面關掉',
    BG('#eefaf0') + PHONE(150, 64, 1.05) + EMO(132, 78, '🚫', 26, 'clash') +
    GIRL(64, 118, 1, { pose: 'reachR' }) + EMO(94, 60, '👍', 20, 'bob') + SUNBURST(64, 66)),
  'shop.escape': SVG('爸爸媽媽帶小女生打 165 報案',
    BG('#f3f0ff', '#c9bfe0') + DAD(40, 118, 0.86, 'reachR') + MOM(84, 118, 0.9, 'reachR') +
    GIRL(132, 118, 0.88, { pose: 'reachL' }) +
    '<g class="bob"><rect x="140" y="42" width="52" height="26" rx="6" fill="#fff" stroke="#33224a" stroke-width="1.8"/>' +
    '<text x="166" y="60" font-size="15" fill="#e85a92" text-anchor="middle" font-weight="bold">165</text></g>'),
  'shop.bad': SVG('一直匯錢出去，對方消失了',
    BG('#e6e2f5', '#8f83b3') + PHONE(146, 62, 1.0) +
    '<g class="hearts">' + EMO(104, 48, '💸', 17) + EMO(84, 36, '💸', 14) + EMO(122, 32, '💸', 13) + '</g>' +
    GIRL(56, 118, 0.92, { pose: 'hang', mood: 'flat' }) + EMO(24, 58, '💦', 14)),

  /* ---------- 15. 好朋友傳來的訊息 ---------- */
  'imposter.best': SVG('打電話確認後發現是假的，兩個好朋友都沒被騙',
    BG('#eefaf0') + SUNBURST(100, 66) +
    GIRL(72, 118, 0.92, { pose: 'reachR' }) + GIRL(128, 118, 0.92, { pose: 'reachL', dress: '#7fc1ed' }) +
    '<rect x="94" y="70" width="12" height="20" rx="4" fill="#33224a"/>' +
    EMO(96, 42, '📞', 15, 'ring') + EMO(150, 42, '✨', 14, 'twinkle')),
  'imposter.escape': SVG('把事情告訴老師，老師提醒全班',
    BG('#f2f7ff', '#c8dcf0') + BOARD(14, 16) +
    ADULT(60, 118, 0.9, { color: '#5e8f78', pose: 'reachR' }) + GIRL(116, 118, 0.9, { pose: 'reachL' }) +
    SPEECH(132, 36, '📢') + EMO(166, 96, '👥', 16)),
  'imposter.bad': SVG('點數卡序號被拿走，對方不見了',
    BG('#e6e2f5', '#8f83b3') + PHONE(146, 62, 1.0) +
    '<g class="fly"><rect x="88" y="52" width="34" height="22" rx="3" fill="#ffd23f" stroke="#33224a" stroke-width="1.6"/>' +
    '<path d="M92 62 h26" stroke="#33224a" stroke-width="1.6"/></g>' +
    GIRL(56, 118, 0.92, { pose: 'hang', mood: 'flat' }) + EMO(24, 58, '💦', 14)),

  /* ---------- 16. 去買早餐 ---------- */
  'breakfast.best': SVG('早餐店老闆讓小女生待在店裡，打電話請媽媽來接',
    BG('#fff6e6', '#c8c0b0') + STORE(96) + HELPER(126, 108, 0.8, '#e8a33f', true) +
    GIRL(160, 118, 0.88) + EMO(60, 46, '🥟', 20, 'bob') + EMO(112, 52, '📞', 14, 'ring') + SUNBURST(160, 70)),
  'breakfast.good': SVG('小女生沒有回家，轉進便利商店請店員幫忙',
    BG('#fff6e6', '#c8c0b0') + STORE(88) + HELPER(118, 78, 0.82, '#27ae60', true) +
    GIRL(154, 118, 0.9, { pose: 'run' }) +
    '<g class="dragonMiss" opacity=".45"><path d="M22 118 q6 -34 13 -34 q7 0 13 34 Z" fill="#6b5a7e"/></g>' +
    EMO(40, 60, '👣', 14)),
  'breakfast.escape': SVG('小女生大喊，路人回頭，跟蹤的人跑掉了',
    BG('#fff6e6', '#c8c0b0') +
    '<g opacity=".5" fill="#6b5a7e"><circle cx="26" cy="66" r="9"/><rect x="18" y="76" width="16" height="42" rx="4"/>' +
    '<circle cx="52" cy="72" r="8"/><rect x="45" y="81" width="14" height="37" rx="4"/></g>' +
    '<g class="dragonMiss" opacity=".8"><path d="M164 118 L168 84 L182 84 L186 118 Z" fill="#8a8f96" stroke="#33224a" stroke-width="1.5" stroke-linejoin="round"/>' +
    '<circle cx="175" cy="74" r="10" fill="#c9a98a" stroke="#33224a" stroke-width="1.5"/></g>' + EMO(186, 68, '💨', 12) +
    GIRL(102, 118, 1, { pose: 'shout' }) +
    '<g class="dash" stroke="#e85a92" stroke-width="3" fill="none" stroke-linecap="round">' +
    '<path d="M122 58 q8 8 0 16"/><path d="M130 52 q13 14 0 28"/><path d="M138 46 q19 20 0 40"/></g>'),
  'breakfast.bad': SVG('被跟到家門口，對方看著門牌',
    BG('#e6e2f5', '#8f83b3') + DOOR(58, 118, 0.9) +
    '<rect x="86" y="30" width="30" height="16" rx="3" fill="#fff" stroke="#33224a" stroke-width="1.6"/>' +
    '<text x="101" y="42" font-size="10" fill="#33224a" text-anchor="middle" font-weight="bold">12</text>' +
    '<g class="snore" style="transform-origin:158px 90px">' + DRAGON(158, 90, 0.78, -1) + '</g>' +
    GIRL(30, 118, 0.8, { pose: 'hang', mood: 'flat' }) + EMO(118, 60, '👀', 15, 'clash')),
});

/* 依「劇本.結局」挑圖，找不到就退回該等級的通用圖 */
function sceneFor(scenarioId, key, grade) {
  return ART_SCENES[scenarioId + '.' + key] ||
         ART_SCENES[scenarioId + '.' + grade] ||
         SCENE[grade] || SCENE.escape;
}

