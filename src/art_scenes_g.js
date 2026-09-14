/* ===== 新增的「👍 不錯」結局插圖：做對了主要的事，但少了一步 =====
   共同語彙：畫面右側留一個「還沒完成的那一步」（虛線框／淡出的人）
*/
const TODO = (x, y, w, h, label) =>
  '<g class="fadeDanger">' +
  '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="none" ' +
  'stroke="#a07a00" stroke-width="2.4" stroke-dasharray="6 5"/>' +
  '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 4) + '" font-size="11" fill="#a07a00" ' +
  'text-anchor="middle" font-weight="bold">' + label + '</text></g>';

Object.assign(ART_SCENES, {
  // 沒跟著排擠，但小柔還是轉學了
  'bully.good': SVG('小女生陪著被排擠的同學，但同學最後還是轉學了',
    BG('#f2f7ff', '#c8dcf0') + BOARD(12, 14) +
    GIRL(64, 118, 0.9, { pose: 'reachR' }) +
    '<g class="fadeDanger">' + GIRL(104, 118, 0.9, { pose: 'reachL', dress: '#7fc1ed' }) + '</g>' +
    EMO(84, 44, '💕', 14, 'twinkle') + TODO(136, 62, 56, 34, '告訴老師')),

  // 躲得好，但自己先跑到操場
  'quake.good': SVG('小女生自己先跑到操場，老師在後面清點人數',
    BG('#eafaf1') + EMO(166, 30, '🏫', 16) +
    GIRL(52, 118, 0.92, { pose: 'run' }) + EMO(28, 56, '💨', 13) +
    '<g class="fadeDanger">' + ADULT(146, 118, 0.72, { color: '#5e8f78', pose: 'reachL' }) + '</g>' +
    TODO(96, 40, 60, 32, '跟著老師')),

  // 沒開門，但也沒打電話
  'home.good': SVG('小女生沒有開門，門外的人走掉了，但她沒有打電話',
    BG('#fff6e6', '#d8c3a0') + DOOR(140, 118, 0.95) +
    '<g class="dragonMiss" opacity=".4"><path d="M184 118 q6 -30 12 -30 q7 0 12 30 Z" fill="#6b5a7e"/></g>' +
    GIRL(48, 118, 0.95) + EMO(72, 96, '📺', 16) +
    TODO(60, 34, 62, 32, '打給爸媽')),

  // 自己關掉了，但妹妹的平板也跳出來
  'scam.good': SVG('小女生關掉了假中獎視窗，但妹妹的平板也跳出一樣的東西',
    BG('#eefaf0') + PHONE(52, 66, 0.8) + EMO(40, 76, '🚫', 20, 'clash') +
    GIRL(104, 118, 0.85) +
    '<g class="fadeDanger">' + GIRL(154, 118, 0.66, { dress: '#ffd23f' }) +
    '<rect x="146" y="60" width="16" height="26" rx="4" fill="#33224a"/>' + EMO(160, 52, '❗', 13) + '</g>' +
    TODO(96, 28, 64, 30, '跟爸媽說')),

  // 火滅了，但沒說瓦斯味
  'fire.good': SVG('火滅了，小女生回客廳看電視，廚房還有瓦斯味',
    BG('#fff6e6', '#d8c3a0') +
    '<rect x="118" y="66" width="70" height="52" fill="#efe6d4" stroke="#33224a" stroke-width="1.6"/>' +
    '<rect x="128" y="76" width="50" height="10" rx="2" fill="#9aa4ad" stroke="#33224a" stroke-width="1.4"/>' +
    '<g class="fadeDanger"><circle cx="150" cy="56" r="7" fill="#a8e6c0"/><circle cx="164" cy="46" r="5" fill="#a8e6c0"/>' +
    '<circle cx="138" cy="44" r="4" fill="#a8e6c0"/></g>' +
    GIRL(44, 118, 0.9, { pose: 'sit' }) + EMO(72, 92, '📺', 18) +
    TODO(96, 20, 66, 30, '說有味道')),

  // 拒絕了，但他改去找別人
  'money.good': SVG('小女生拒絕借錢，那位同學改去找別的同學',
    BG('#fffbe6') +
    GIRL(50, 118, 0.92, { pose: 'reachR' }) + EMO(82, 66, '🚫', 18, 'clash') +
    '<g class="fadeDanger">' +
    '<circle cx="140" cy="72" r="10" fill="#c9a98a" stroke="#33224a" stroke-width="1.5"/>' +
    '<path d="M128 118 L132 82 L148 82 L152 118 Z" fill="#8a8f96" stroke="#33224a" stroke-width="1.5"/>' +
    GIRL(178, 118, 0.72, { dress: '#a8e6c0' }) + EMO(154, 60, '💸', 13) + '</g>' +
    TODO(96, 24, 62, 30, '讓大人知道')),

  // 沒作弊，但下次還是一樣的分數
  'exam.good': SVG('小女生沒有作弊，但下次考試分數還是差不多',
    BG('#f2f7ff', '#c8dcf0') + BOARD(12, 14) +
    '<g class="bob"><rect x="112" y="42" width="48" height="58" rx="3" fill="#fff" stroke="#33224a" stroke-width="2"/>' +
    '<path d="M120 56 h20 M120 64 h26" stroke="#c8c8d8" stroke-width="2.4" stroke-linecap="round"/>' +
    '<text x="136" y="92" font-size="20" fill="#8a8f96" text-anchor="middle" font-weight="bold">72</text></g>' +
    GIRL(66, 118, 0.92, { pose: 'reachR' }) +
    TODO(106, 106, 84, 22, '找出哪裡不會')),

  // 跟朋友說了，但還沒跟大人說
  'secret.good': SVG('小女生把事情告訴最好的朋友，朋友抱著她',
    BG('#fff0f6') +
    GIRL(70, 118, 0.92, { pose: 'reachR' }) +
    GIRL(112, 118, 0.92, { pose: 'reachL', dress: '#7fc1ed' }) +
    '<g class="hearts">' + EMO(84, 40, '💕', 15) + EMO(106, 30, '💗', 12) + '</g>' +
    TODO(142, 66, 52, 40, '再告訴一個大人')),

  // 掛掉了，但沒說，阿嬤被騙
  'fakecop.good': SVG('小女生掛掉詐騙電話，但沒告訴大人，隔壁阿嬤接到同一通',
    BG('#eefaf0') +
    GIRL(48, 118, 0.92, { pose: 'reachR' }) +
    '<rect x="66" y="60" width="10" height="18" rx="3" fill="#33224a"/>' + EMO(78, 50, '🚫', 16, 'clash') +
    '<g class="fadeDanger">' + ADULT(150, 118, 0.78, { color: '#b6a7d6', hair: '#cfd6dc' }) +
    EMO(168, 52, '📞', 14) + EMO(126, 46, '💸', 13) + '</g>' +
    TODO(94, 20, 62, 28, '打 165')),

  // 沒買，但同學買了
  'shop.good': SVG('小女生沒有買假特價的點數，但同學買了',
    BG('#eefaf0') + PHONE(46, 66, 0.78) + EMO(36, 78, '🚫', 20, 'clash') +
    GIRL(98, 118, 0.88) +
    '<g class="fadeDanger">' + GIRL(160, 118, 0.8, { dress: '#a8e6c0', mood: 'flat' }) +
    EMO(146, 52, '💸', 14) + '</g>' +
    TODO(92, 24, 68, 30, '提醒同學')),

  // 沒被騙，但沒通知小美
  'imposter.good': SVG('小女生沒有被騙，但小美的帳號還被盜用著',
    BG('#eefaf0') + PHONE(150, 64, 0.9) + EMO(132, 78, '🚫', 22, 'clash') +
    GIRL(52, 118, 0.9, { pose: 'reachR' }) +
    '<g class="fadeDanger">' + GIRL(96, 118, 0.72, { dress: '#7fc1ed', mood: 'flat' }) + '</g>' +
    TODO(30, 22, 78, 28, '打電話通知小美')),

  // 離開了，但沒去找老師
  'knife.good': SVG('小女生躲到別的樓層，但沒有去找老師',
    BG('#f2f7ff', '#c8dcf0') +
    '<path d="M0 118 L44 118 L44 92 L92 92 L92 66 L140 66" stroke="#b6a7d6" stroke-width="10" fill="none"/>' +
    GIRL(40, 92, 0.7, { pose: 'sit', mood: 'flat' }) +
    '<g class="fadeDanger">' + EMO(158, 46, '💢', 20) +
    ADULT(172, 118, 0.66, { color: '#5e8f78' }) + '</g>' +
    TODO(78, 16, 74, 28, '快去找老師')),
});

