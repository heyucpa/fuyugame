/* ===== 公園兩篇的定場圖與結局圖 =====
   沿用既有零件：TREE / STREETLAMP / HELPER（警衛）/ BOY / MOM / STORE。

   兩個刻意的畫法：
   1. 受傷的人一律坐在地上、抱著腳，不畫血也不畫哭臉。
      要讓她看得出「這個人站不起來」，不是要嚇她。
   2. 天黑那一篇用「燈亮幾盞」講安全：亮的路上有店、有人；
      暗的那條只有前半段有燈。畫面本身就是那一課。

   一樣記得：動畫的 class 不能跟 transform 放在同一個元素上，
   要在外面再包一層 <g>（見 art_scenes_pd.js 的說明）。
*/

// 公園：草地 + 幾棵樹。dusk 傍晚、night 天黑
const PARKBG = (tod) => {
  const sky = tod === 'night' ? '#3b4470' : tod === 'dusk' ? '#ffd9b0' : '#dff0ff';
  const grass = tod === 'night' ? '#4a5a52' : tod === 'dusk' ? '#9fb89a' : '#a8e6c0';
  const leaf = tod === 'night' ? '#3f5a4c' : tod === 'dusk' ? '#6f9a80' : '#7cc9a0';
  return '<rect width="200" height="130" fill="' + sky + '"/>' +
    '<rect x="0" y="100" width="200" height="30" fill="' + grass + '"/>' +
    TREE(18, 100, 1.5, leaf) + TREE(186, 100, 1.3, leaf);
};

// 水泥矮牆 + 底下的沙坑
const WALL = (x, y) =>
  '<rect x="' + (x - 6) + '" y="' + (y + 4) + '" width="96" height="14" rx="4" fill="#e8d9b0"/>' +
  '<rect x="' + x + '" y="' + (y - 34) + '" width="84" height="38" rx="2" ' +
  'fill="#cfc4b4" stroke="#33224a" stroke-width="2"/>' +
  '<path d="M' + x + ' ' + (y - 20) + ' h84" stroke="#a99a88" stroke-width="1.4"/>';

// 溜滑梯
const SLIDE = (x, y, tod) => {
  const c = tod === 'night' ? '#8a7fa8' : '#e8a33d';
  return '<g transform="translate(' + x + ',' + y + ')">' +
    '<path d="M-26 0 L-26 -40 L-4 -40" fill="none" stroke="#8a8f96" stroke-width="3"/>' +
    '<path d="M-6 -42 L24 0 L14 0 L-14 -36 Z" fill="' + c + '" stroke="#33224a" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M-26 -10 h10 M-26 -22 h10 M-26 -34 h10" stroke="#8a8f96" stroke-width="2.4"/></g>';
};

/* 坐在地上抱著腳的人。不畫血、不畫哭臉——
   要讓她看得出「這個人站不起來」，不是要嚇她。 */
const HURTSIT = (x, y, s, color) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  // 兩條往前伸直的腿一定要畫，不然整個人看起來是站著的，不是坐在地上
  '<rect x="4" y="-9" width="30" height="8" rx="4" fill="#fde2c5" stroke="#33224a" stroke-width="1.5"/>' +
  '<rect x="4" y="0" width="24" height="8" rx="4" fill="#fde2c5" stroke="#33224a" stroke-width="1.5"/>' +
  // 一隻手伸過去抓住腳踝
  LIMB(8, -24, 32, -8, 5.4) + LIMB(-8, -24, -18, -8, 5.4) +
  '<path d="M-11 2 L-8 -26 L8 -26 L11 2 Z" fill="' + (color || '#9aa4ad') +
  '" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
  '<circle cx="0" cy="-37" r="11" fill="#fde2c5" stroke="#33224a" stroke-width="1.6"/>' +
  '<path d="M-11 -41 q-1 -14 11 -14 q12 0 11 14 q-3 -5 -11 -5 q-8 0 -11 5 Z" fill="#33224a"/>' +
  '<path d="M-6 -39 h4 M2 -39 h4" stroke="#33224a" stroke-width="1.6" stroke-linecap="round"/>' +
  '<path d="M-4 -31 q4 -3 8 0" stroke="#33224a" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>';

Object.assign(ART_SCENES, {
  /* ---------- 28. 「大家都跳下去了」 ---------- */
  'parkdare.intro': SVG('同學站在矮牆上準備往沙坑跳，小女生站在下面往上看',
    PARKBG() + WALL(64, 96) +
    BOY(84, 62, 0.5, '#8a9bb0') +
    '<g opacity=".5">' + BOY(150, 100, 0.56, '#b3a8c4') + '</g>' +
    GIRL(44, 118, 0.88) + EMO(30, 56, '👆', 13, 'bob')),

  'parkdare.best': SVG('警衛伯伯過來看受傷的同學，小女生把其他人擋在後面',
    PARKBG() + WALL(92, 96) +
    HURTSIT(58, 120, 0.8) +
    HELPER(120, 120, 0.86, '#27ae60', true) +
    GIRL(170, 120, 0.9, { pose: 'reachL' }) + EMO(150, 56, '✋', 14) +
    SUNBURST(100, 40)),

  'parkdare.down': SVG('小女生從矮牆上慢慢爬下來',
    PARKBG() + WALL(70, 96) +
    '<g class="bob">' + GIRL(112, 96, 0.8, { pose: 'hang' }) + '</g>' +
    '<g opacity=".45">' + BOY(160, 118, 0.6, '#8a9bb0') + BOY(182, 118, 0.56, '#b3a8c4') + '</g>' +
    EMO(140, 50, '💧', 13)),

  'parkdare.escape': SVG('警衛伯伯幫小女生沖洗膝蓋的傷口',
    PARKBG() + WALL(120, 96) +
    HELPER(48, 118, 0.84, '#27ae60', true) +
    GIRL(104, 118, 0.88, { pose: 'sit', mood: 'flat' }) +
    '<rect x="96" y="106" width="9" height="6" rx="2" fill="#e8909a" stroke="#33224a" stroke-width="1.2"/>' +
    '<g class="ring">' + EMO(70, 52, '💧', 14) + '</g>' +
    EMO(140, 46, '🩹', 14)),

  'parkdare.lift': SVG('小女生扶著同學走，他又痛得坐回地上',
    PARKBG('dusk') + WALL(24, 96) +
    HURTSIT(106, 120, 0.82) +
    GIRL(74, 120, 0.88, { pose: 'reachR', mood: 'flat' }) +
    '<g class="clash">' + EMO(92, 52, '❗', 16) + '</g>'),

  'parkdare.hide': SVG('回到家才發現傷口裡還有沙子',
    BG('#e6e2f5', '#8f83b3') + DOOR(30, 118, 0.9) +
    GIRL(104, 118, 0.88, { pose: 'sit', mood: 'flat' }) +
    '<g class="fadeDanger">' +
    '<ellipse cx="96" cy="108" rx="8" ry="5.6" fill="#c96a6a" stroke="#33224a" stroke-width="1.3"/>' +
    '<circle cx="93" cy="107" r="1" fill="#8a6a45"/><circle cx="98" cy="109" r="1" fill="#8a6a45"/>' +
    '<circle cx="100" cy="106" r="0.9" fill="#8a6a45"/></g>' +
    EMO(140, 50, '🤫', 15)),

  'parkdare.ignore': SVG('同學一跛一跛地走掉了，隔天沒有來上學',
    PARKBG('dusk') + WALL(24, 96) +
    '<g class="fadeDanger" opacity=".75">' + BOY(146, 118, 0.74, '#9aa4ad') +
    '<path d="M152 122 l10 6" stroke="#33224a" stroke-width="2" stroke-linecap="round"/></g>' +
    GIRL(72, 118, 0.86, { mood: 'flat' }) +
    EMO(104, 48, '💭', 15, 'bob')),

  /* ---------- 29. 「再玩一下下就好」 ---------- */
  'parkdark.intro': SVG('傍晚的公園，同學還在溜滑梯那邊玩',
    PARKBG('dusk') + SLIDE(132, 100, 'dusk') +
    '<g opacity=".8">' + BOY(114, 100, 0.56, '#8a9bb0') + BOY(160, 100, 0.54, '#b3a8c4') + '</g>' +
    GIRL(46, 118, 0.9) +
    '<g class="bob">' + EMO(64, 46, '🕔', 15) + '</g>'),

  'parkdark.best': SVG('兩個人一起走到路口，路燈剛好亮了',
    PARKBG('dusk') + STREETLAMP(160, 118, 0.9, true) +
    GIRL(74, 118, 0.92, { pose: 'reachR' }) +
    BOY(112, 118, 0.74, '#8a9bb0') +
    '<g class="hearts">' + EMO(94, 44, '💖', 14) + '</g>' + SUNBURST(120, 52)),

  'parkdark.good': SVG('小女生準時到家，同學一個人在後面跑',
    PARKBG('dusk') + STREETLAMP(46, 118, 0.85, true) +
    DOOR(170, 118, 0.86) +
    GIRL(136, 118, 0.88) +
    '<g class="fadeDanger" opacity=".6">' + BOY(74, 118, 0.7, '#8a9bb0') +
    EMO(92, 52, '💨', 13) + '</g>'),

  'parkdark.lightpath': SVG('小女生走在有路燈、有店家的大馬路上',
    '<rect width="200" height="130" fill="#3b4470"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#5b6478"/>' +
    '<rect x="0" y="104" width="200" height="2.5" fill="#7a8494"/>' +
    STREETLAMP(36, 104, 0.9, true) + STREETLAMP(168, 104, 0.9, true) +
    '<rect x="78" y="42" width="60" height="62" fill="#fff6d6" stroke="#33224a" stroke-width="1.8"/>' +
    '<rect x="78" y="30" width="60" height="14" rx="3" fill="#27ae60" stroke="#33224a" stroke-width="1.6"/>' +
    '<text x="108" y="41" font-size="8.5" fill="#fff" text-anchor="middle" font-weight="bold">OPEN</text>' +
    GIRL(56, 104, 0.88)),

  'parkdark.escape': SVG('小女生站在公園門口那盞燈下面等媽媽',
    PARKBG('night') + STREETLAMP(66, 118, 0.95, true) +
    GIRL(88, 118, 0.88, { mood: 'flat' }) +
    '<g class="ring">' + PHONE(132, 50, 0.5) + '</g>' +
    '<g class="fly">' + MOM(174, 118, 0.7, 'reachL') + '</g>'),

  'parkdark.bad': SVG('只有前半段有燈的小路，後面全黑',
    '<rect width="200" height="130" fill="#2b3150"/>' +
    '<rect x="0" y="104" width="200" height="26" fill="#3c4258"/>' +
    STREETLAMP(30, 104, 0.85, true) +
    '<g opacity=".45">' + STREETLAMP(96, 104, 0.85, false) + '</g>' +
    '<path d="M126 20 h74 v110 h-74 Z" fill="#1d2138"/>' +
    GIRL(58, 104, 0.88, { pose: 'run', mood: 'flat' }) +
    EMO(84, 48, '💨', 13) +
    '<g class="fadeDanger">' + EMO(146, 60, '👣', 15) + '</g>'),
});
