
/* ===== 小鎮地圖 =====
   俯視感的小鎮，六個地點。跟結局插圖不同，這張圖是「可以點的」：
   每個地點包在 <g class="spot" data-spot="..."> 裡，由 app 掛事件。

   天色不畫進圖裡，改用一層半透明遮罩，
   這樣同一張圖早中晚看起來是同一個鎮，只是光線不同。
   晚上窗戶會亮燈——這是最有「這個鎮住著人」感覺的一個細節。

   畫面 320×200，比結局插圖（200×130）寬，因為要放得下六個地點。
*/

// 房子：牆 + 屋頂 + 門 + 兩扇窗。lit = 晚上亮燈
const HOUSE = (x, y, w, h, wall, roof, lit) => {
  const half = w / 2, win = lit ? '#ffdf8a' : '#cfe6ff';
  return '<g transform="translate(' + x + ',' + y + ')">' +
    '<rect x="' + (-half) + '" y="' + (-h) + '" width="' + w + '" height="' + h + '" rx="2" ' +
    'fill="' + wall + '" stroke="#33224a" stroke-width="2"/>' +
    '<path d="M' + (-half - 5) + ' ' + (-h) + ' L0 ' + (-h - 14) + ' L' + (half + 5) + ' ' + (-h) + ' Z" ' +
    'fill="' + roof + '" stroke="#33224a" stroke-width="2" stroke-linejoin="round"/>' +
    '<rect x="-5" y="-13" width="10" height="13" rx="1.5" fill="#c98f52" stroke="#33224a" stroke-width="1.5"/>' +
    '<rect x="' + (-half + 5) + '" y="' + (-h + 6) + '" width="9" height="9" rx="1" fill="' + win + '" stroke="#33224a" stroke-width="1.3"/>' +
    '<rect x="' + (half - 14) + '" y="' + (-h + 6) + '" width="9" height="9" rx="1" fill="' + win + '" stroke="#33224a" stroke-width="1.3"/>' +
    '</g>';
};

// 學校：長一點、平屋頂、有鐘塔，一眼看得出跟住家不一樣
const SCHOOL = (x, y, lit) => {
  const win = lit ? '#ffdf8a' : '#cfe6ff';
  return '<g transform="translate(' + x + ',' + y + ')">' +
    '<rect x="-38" y="-30" width="76" height="30" rx="2" fill="#ffe9c9" stroke="#33224a" stroke-width="2"/>' +
    '<rect x="-38" y="-34" width="76" height="5" fill="#e07a5f" stroke="#33224a" stroke-width="1.6"/>' +
    // 鐘塔壓低一點，不然會被畫面上緣切掉
    '<rect x="-7" y="-37" width="14" height="12" fill="#fff4d6" stroke="#33224a" stroke-width="1.6"/>' +
    '<circle cx="0" cy="-31" r="3.6" fill="#fff" stroke="#33224a" stroke-width="1.3"/>' +
    '<path d="M0 -33 v2.2 h1.8" stroke="#33224a" stroke-width="1" fill="none"/>' +
    '<rect x="-6" y="-13" width="12" height="13" rx="1.5" fill="#c98f52" stroke="#33224a" stroke-width="1.5"/>' +
    [-30, -16, 12, 26].map(wx =>
      '<rect x="' + wx + '" y="' + -24 + '" width="10" height="9" rx="1" fill="' + win +
      '" stroke="#33224a" stroke-width="1.3"/>').join('') + '</g>';
};

const TREE = (x, y, s, c) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<rect x="-2" y="-8" width="4" height="8" fill="#8a6a45"/>' +
  '<circle cx="0" cy="-14" r="9" fill="' + (c || '#7cc9a0') + '" stroke="#33224a" stroke-width="1.6"/></g>';

// 地點的名牌。點得到的區域就是這一塊，所以要夠大
const PLATE = (x, y, txt, mark) =>
  '<g transform="translate(' + x + ',' + y + ')">' +
  '<rect x="-29" y="-10" width="58" height="19" rx="9.5" fill="#fff" stroke="#33224a" stroke-width="1.8"/>' +
  '<text x="0" y="4.5" font-size="10.5" fill="#33224a" text-anchor="middle" font-weight="bold">' + txt + '</text>' +
  /* ❗ 和 💭 會輕輕上下浮動，✓ 和 💬 不會。
     六個名牌都在動會很吵，而且就看不出哪一個才是現在要點的。
     動畫掛在多包的那一層 <g>，那一層沒有自己的 transform（外層才有）， 
     所以不會被 CSS 的 transform 蓋掉。 */
  (mark ? (mark === '❗' || mark === '💭' ? '<g class="bob">' : '<g>') +
          '<circle cx="27" cy="-8" r="8.5" fill="#fff" stroke="#33224a" stroke-width="1.6"/>' +
          '<text x="27" y="-4" font-size="10" text-anchor="middle">' + mark + '</text></g>' : '') +
  '</g>';

const HIDE_R = 14;   // 藏的東西的點擊半徑（在 320 寬的畫面裡，手機上大約 31px）
/* 那顆透明圈是點擊範圍——字只有 11 大，小孩的手指點不到那麼準。
   fill 要 transparent 不能 none，none 不吃點擊。
   圈放大就會開始搶名牌的點擊，所以 HIDE_SPOTS 跟名牌的距離有走查在擋。 */
const hideArt = (hide, blink) => hide
  ? (blink ? '<g class="twinkle">' : '<g>') +
    '<circle cx="' + hide.at[0] + '" cy="' + hide.at[1] + '" r="' + HIDE_R + '" fill="transparent"/>' +
    '<text x="' + hide.at[0] + '" y="' + (hide.at[1] + 4) + '" font-size="11" ' +
    'text-anchor="middle">' + hide.emoji + '</text></g>'
  : '';

/* 天色與雨都是蓋在最上層的整張遮罩，一定要 pointer-events="none"。
   沒有的話，它會把底下六個地點的點擊全部吃掉——
   早上、傍晚、晚上整張地圖都變成點不動的，只有白天玩得了。 */
const TOWN_TINT = {
  morning: '<rect width="320" height="200" fill="#ffb46b" opacity=".13" pointer-events="none"/>',
  day:     '',
  dusk:    '<rect width="320" height="200" fill="#d4622a" opacity=".2" pointer-events="none"/>',
  night:   '<rect width="320" height="200" fill="#1b2450" opacity=".34" pointer-events="none"/>',
};

/* 每個地點：畫什麼、名牌放哪、小人站哪。
   鎮上的居民除了家人以外都是動物（見 art_animals.js）。
   衣服顏色維持原本那五個人的顏色——她是靠顏色認人的。

   stand 都刻意閃開名牌與房子，免得人疊在字上面——但不能閃太遠。
   家本來是 [246,186]，離名牌 88（其他地方都是 45～59），
   按了「家」她會走到畫面的右下角，看起來像跑掉不像回家。
   走查有在擋這個距離。 */
const PLACES = [
  { key: 'school', name: '學校',  emoji: '🏫', plate: [56, 48],   stand: [108, 76],
    npc: [102, 36], npcArt: () => RABBIT(102, 36, 0.4),        // 兔子老師
    art: lit => SCHOOL(56, 38, lit) },
  { key: 'dojo',   name: '道館',  emoji: '🥋', plate: [258, 48],  stand: [212, 76],
    npc: [226, 36], npcArt: () => LION(226, 36, 0.4),          // 獅子教練
    art: lit => HOUSE(258, 38, 48, 28, '#e8e0f5', '#7d6aa8', lit) },
  { key: 'shop',   name: '商店街', emoji: '🛒', plate: [44, 122],  stand: [96, 140],
    npc: [80, 108], npcArt: () => CAT(80, 108, 0.4),           // 貓店長
    art: lit => HOUSE(44, 112, 54, 26, '#fff4d6', '#e8a33d', lit) },
  { key: 'park',   name: '公園',  emoji: '🌳', plate: [158, 108], stand: [200, 124],
    // 熊伯伯本來站在 (196,96)，池塘正好蓋掉他的頭，變成一個沒有頭的身體
    npc: [218, 100], npcArt: () => BEAR(218, 100, 0.4),        // 熊伯伯
    // 中間那棵本來在 (180,102)，樹冠會蓋到池塘，往左下挪了一點
    art: () => TREE(136, 104, 1.5) + TREE(176, 106, 1.2, '#a8e6c0') + TREE(158, 112, 1.1) },
  { key: 'pool',   name: '泳池',  emoji: '🏊', plate: [266, 122], stand: [224, 140],
    npc: [238, 90], npcArt: () => PENGUIN(238, 90, 0.4),       // 企鵝救生員
    art: () => '<rect x="240" y="96" width="52" height="24" rx="4" fill="#7fc1ed" stroke="#33224a" stroke-width="2"/>' +
               '<path d="M244 104 q6 -3 12 0 q6 3 12 0 q6 -3 12 0" stroke="#a8d8f5" stroke-width="2.4" fill="none"/>' },
  { key: 'home',   name: '家',    emoji: '🏠', plate: [158, 178], stand: [210, 168],
    npc: [122, 168],
    npcArt: () => ADULT(116, 164, 0.4, { color: '#9b59b6' }) +        // 媽媽
                  ADULT(96, 182, 0.4, { color: '#5b7fa8', hair: '#2a1a0c' }) +  // 爸爸
                  GIRL(198, 190, sibScale(0.34), { dress: SIB_DRESS }),  // 手足（顏色與高矮都跟角色走）
    art: lit => HOUSE(158, 170, 58, 30, '#ffd9e4', '#c9587f', lit) },
];

/* 小鎮會跟著她長大：走過的結局越多，鎮上的東西越多。
   stage 0 是空曠的鎮，4 是熱鬧的鎮。 */
const FLOWER = (x, y, c) =>
  '<g transform="translate(' + x + ',' + y + ')">' +
  '<rect x="-0.8" y="-5" width="1.6" height="5" fill="#5e8f78"/>' +
  '<circle cx="0" cy="-6.5" r="2.6" fill="' + (c || '#ff8fb8') + '" stroke="#33224a" stroke-width="0.8"/></g>';
const LAMP = (x, y) =>
  '<g transform="translate(' + x + ',' + y + ')">' +
  '<rect x="-1.3" y="-22" width="2.6" height="22" fill="#8a8f96"/>' +
  '<circle cx="0" cy="-24" r="4.2" fill="#ffdf8a" stroke="#33224a" stroke-width="1.3"/></g>';
const BENCH = (x, y) =>
  '<g transform="translate(' + x + ',' + y + ')">' +
  '<rect x="-9" y="-5" width="18" height="3" rx="1" fill="#c98f52" stroke="#33224a" stroke-width="1"/>' +
  '<rect x="-7" y="-2" width="2" height="4" fill="#8a6a45"/><rect x="5" y="-2" width="2" height="4" fill="#8a6a45"/></g>';
const SWING = (x, y) =>
  '<g transform="translate(' + x + ',' + y + ')">' +
  '<path d="M-10 0 L0 -16 L10 0" stroke="#8a8f96" stroke-width="2" fill="none"/>' +
  '<path d="M-4 -15 v9 M4 -15 v9" stroke="#8a8f96" stroke-width="1.2"/>' +
  '<rect x="-5" y="-6.5" width="10" height="2" fill="#c98f52" stroke="#33224a" stroke-width="0.8"/></g>';
const FLAG = (x, y) =>
  '<g transform="translate(' + x + ',' + y + ')">' +
  '<rect x="-0.9" y="-18" width="1.8" height="18" fill="#8a8f96"/>' +
  '<path d="M1 -18 L12 -14 L1 -10 Z" fill="#ff8fb8" stroke="#33224a" stroke-width="1"/></g>';

function townGrowth(stage) {
  let g = '';
  if (stage >= 1) g += FLOWER(96, 126) + FLOWER(104, 130, '#ffd23f') + FLOWER(112, 124, '#c9a2e8') +
                        BENCH(176, 132) + FLOWER(196, 60, '#ff8fb8');
  if (stage >= 2) g += LAMP(118, 150) + LAMP(206, 150) + SWING(146, 86) +
                        FLOWER(56, 148, '#ffd23f') + FLOWER(64, 152);
  if (stage >= 3) g += TREE(70, 156, 1.1) + TREE(250, 66, 1, '#a8e6c0') + LAMP(88, 72) +
                        FLOWER(232, 158, '#c9a2e8') + FLOWER(240, 162, '#ff8fb8') + BENCH(36, 76);
  if (stage >= 4) g += FLAG(30, 40) + FLAG(292, 60) + FLAG(186, 148) +
                        TREE(120, 60, 0.85, '#a8e6c0') + TREE(276, 178, 0.9) +
                        FLOWER(150, 194, '#ffd23f') + FLOWER(160, 196) + FLOWER(170, 194, '#c9a2e8');
  return g;
}

/* ===== 兩個動手做的地方：公園的池塘、家門口的花圃 =====
   藏的東西是「找」，這兩個是「做」——她知道東西一定在那裡，
   按下去一定有收穫，只是要等。兩件事給的感覺不一樣，所以都留著。

   跟藏的東西一樣自己一個 <g>，刻意不放進 .spot 裡面：
   放進去的話點池塘會變成跟熊伯伯講話，她會以為池塘沒反應。

   座標是量過的，離最近的名牌與 HIDE_SPOTS 都大於兩個半徑相加
   （不然它會把名牌或寶物的點擊吃掉），走查有在擋。
   為了讓出池塘的位置，HIDE_SPOTS 原本的 [176,70] 已經搬到 [124,64]。 */
const ACT_R = 13;   // 點擊半徑，跟 HIDE_R 同一個量級

const POND = (x, y) =>
  // 先鋪一圈深一點的草，池塘才像陷在地裡，不然是一顆藍色的東西浮在草皮上
  '<ellipse cx="' + x + '" cy="' + y + '" rx="16" ry="10" fill="#a8d6a0"/>' +
  '<ellipse cx="' + x + '" cy="' + y + '" rx="13" ry="7.5" fill="#7fc1ed" stroke="#33224a" stroke-width="1.6"/>' +
  '<path d="M' + (x - 7) + ' ' + (y - 1) + ' q3 -2.4 6 0 q3 2.4 6 0" stroke="#a8d8f5" stroke-width="1.5" fill="none"/>' +
  '<path d="M' + (x - 6) + ' ' + (y + 3) + ' q3 -2.4 6 0" stroke="#a8d8f5" stroke-width="1.5" fill="none"/>' +
  // 兩根蘆葦，不然一顆藍色橢圓看起來像水窪不像池塘
  '<path d="M' + (x - 12) + ' ' + (y - 1) + ' q-1.5 -7 1 -11" stroke="#5e8f78" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
  '<ellipse cx="' + (x - 11) + '" cy="' + (y - 13) + '" rx="1.5" ry="3" fill="#8a6a45"/>' +
  '<path d="M' + (x + 12) + ' ' + (y - 1) + ' q1.5 -5 -0.5 -8" stroke="#5e8f78" stroke-width="1.4" fill="none" stroke-linecap="round"/>';

/* 翻過的土要用直的犁溝，不能用兩道弧線——
   弧線配上兩朵花，整塊看起來會像一張臉。 */
const PATCH = (x, y) =>
  '<ellipse cx="' + x + '" cy="' + y + '" rx="12" ry="6.5" fill="#b08a6a" stroke="#33224a" stroke-width="1.6"/>' +
  '<path d="M' + (x - 5) + ' ' + (y - 3) + ' v6 M' + x + ' ' + (y - 4) + ' v8 M' + (x + 5) + ' ' + (y - 3) + ' v6"' +
  ' stroke="#8a6a45" stroke-width="1.2" stroke-linecap="round"/>' +
  FLOWER(x - 8, y - 1, '#ffd23f') + FLOWER(x + 8, y - 1, '#c9a2e8');

const ACT_SPOTS = [
  { key: 'fish', place: 'park', at: [194, 70],  emoji: '🎣', art: POND },
  // 花圃本來在房子左邊的 [94,152]，正好蓋住爸爸的頭，看起來像他戴了一頂土色的帽子。
  // 改到房子右邊、小人回家站的位置旁邊——那一角本來就是空的。
  { key: 'dig',  place: 'home', at: [232, 186], emoji: '⛏️', art: PATCH },
];

/* ready 是「現在可以做」。做完的那幾分鐘整組壓暗、圖示也不再浮動——
   按下去沒東西的話要先看得出來，不然她會一直按。
   浮動的 class 掛在沒有自己 transform 的那一層（同 PLATE）。 */
const actArt = (a, ready) =>
  '<g class="act" data-act="' + a.key + '"' + (ready ? '' : ' opacity=".5"') + '>' +
  a.art(a.at[0], a.at[1]) +
  (ready ? '<g class="bob">' : '<g>') +
  '<text x="' + a.at[0] + '" y="' + (a.at[1] - 11) + '" font-size="12" text-anchor="middle">' + a.emoji + '</text></g>' +
  // 跟藏的東西同一招：字太小，點擊範圍要自己放大一圈
  '<circle cx="' + a.at[0] + '" cy="' + a.at[1] + '" r="' + ACT_R + '" fill="transparent"/></g>';

// 雨：斜線 + 壓一層灰藍
const RAIN ='<g opacity=".55" pointer-events="none">' +
  Array.from({ length: 26 }, (_, i) => {
    const x = (i * 37 % 320), y = (i * 53 % 190);
    return '<path d="M' + x + ' ' + y + ' l-3 9" stroke="#eaf4ff" stroke-width="1.6" stroke-linecap="round"/>';
  }).join('') + '</g>' +
  '<rect width="320" height="200" fill="#7f93b8" opacity=".2" pointer-events="none"/>';

function townBase() {
  const road = 'M158 200 L158 140 M158 140 L56 86 M158 140 L258 86 M158 140 L44 130 M158 140 L266 130';
  return '<rect width="320" height="200" fill="#c8e6c0"/>' +
    '<path d="' + road + '" stroke="#d9cdb4" stroke-width="13" stroke-linecap="round" fill="none"/>' +
    '<path d="' + road + '" stroke="#efe6d4" stroke-width="9" stroke-linecap="round" fill="none"/>' +
    TREE(10, 96, 1) + TREE(304, 160, 1.1, '#a8e6c0') + TREE(100, 186, 0.9) +
    TREE(252, 186, 1, '#a8e6c0') + TREE(304, 30, 0.9);
}

/* marks: { 地點key: '❗' | '💬' | '✓' }　standAt: 小人站在哪個地點
   hide: 這一輪藏的東西 { emoji, at:[x,y] }，已經找到就傳 null
   blink: 最後兩分鐘還沒找到，讓它一閃一閃 */
function townSVG(tod, marks, standAt, weather, stage, hide, blink, actReady) {
  const lit = tod === 'night';
  // 記號掛在名牌上。試過掛在人頭上，六個泡泡會把畫面擠爆。
  const spots = PLACES.map(p =>
    '<g class="spot" data-spot="' + p.key + '">' +
    p.art(lit) + p.npcArt() +
    PLATE(p.plate[0], p.plate[1], p.emoji + ' ' + p.name, marks[p.key] || '') +
    '</g>').join('');
  const here = PLACES.find(p => p.key === standAt) || PLACES[PLACES.length - 1];
  return '<svg viewBox="0 0 320 200" width="100%" role="img" aria-label="小鎮地圖">' +
    townBase() + townGrowth(stage || 0) + spots +
    // 小人包起來並給 id，點地點時用 transform 讓她「走過去」
    '<g id="walker" style="transition: transform .75s ease-in-out;">' +
      GIRL(here.stand[0], here.stand[1], 0.55) + '</g>' +
    /* 藏的東西畫在最後、遮罩之前：畫太早會被小人或房子蓋住。
       這個 <g> 一定要「永遠存在、裡面可能是空的」——十分鐘換一次東西的時候
       才能只換這一塊，不用重畫整張地圖（重畫會閃）。順序也才固定，
       不會變成畫在天色遮罩上面。 */
    /* 池塘與花圃跟藏的東西一樣，放在小人之後：一樣要永遠存在、
       裡面可能整組是暗的，做完一次才能只換這一塊。 */
    '<g class="acts">' +
      ACT_SPOTS.map(a => actArt(a, !actReady || actReady(a.key))).join('') + '</g>' +
    '<g class="hide">' + hideArt(hide, blink) + '</g>' +
    (TOWN_TINT[tod] || '') +
    (weather === 'rain' ? RAIN : '') + '</svg>';
}

/* ===== 小事的定場圖 =====
   不另外畫，直接把小鎮的那一角放大。這樣她一眼認得出「這是公園」，
   因為那就是地圖上的同一棵樹、同一個人——24 則小事一張新圖都不用畫。

   裁切框會超出小鎮那張 320×200（例如學校上方、泳池右邊），
   所以要自己先鋪一層草地，不能只靠 townBase()。
   數字是量出來的：[x, y, 寬, 高, 她站的位置, 妹妹站的位置]，
   她站的位置都刻意閃開房子跟鎮民，改動請跟著截圖看一次。
  第六欄是妹妹站的位置（跟妹妹一起的小事才畫）。
   家沒有，因為家的 npcArt 本來就有畫她了，再畫一個會變兩個妹妹。 */
const CLOSEUP = {
  school: [ 10, -10, 112, 70, [ 94, 54], [ 70, 56]],
  dojo:   [202, -10, 112, 70, [258, 54], [236, 56]],
  shop:   [  6,  68, 112, 70, [ 98, 132], [ 76, 134]],
  park:   [118,  60, 112, 70, [170, 126], [148, 126]],
  pool:   [214,  58, 112, 70, [306, 124], [232, 124]],
  home:   [ 84, 120, 132, 82, [152, 198], null],
};
function placeCloseup(place, tod, weather, withSis) {
  const p = PLACES.find(x => x.key === place), b = CLOSEUP[place];
  if (!p || !b) return '';
  const box = b[0] + ' ' + b[1] + ' ' + b[2] + ' ' + b[3];
  const cover = '<rect x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '"';
  const tint = { morning: ['#ffb46b', '.13'], dusk: ['#d4622a', '.2'], night: ['#1b2450', '.34'] }[tod];
  return '<svg viewBox="' + box + '" width="100%" role="img" aria-label="' + p.name + '">' +
    cover + ' fill="#c8e6c0"/>' + townBase() +
    p.art(tod === 'night') + p.npcArt() + GIRL(b[4][0], b[4][1], 0.55) +
    // 妹妹：黃裙子，跟小鎮地圖上家門口那個是同一個人
    (withSis && b[5] ? GIRL(b[5][0], b[5][1], sibScale(0.4), { dress: SIB_DRESS }) : '') +
    (tint ? cover + ' fill="' + tint[0] + '" opacity="' + tint[1] + '"/>' : '') +
    (weather === 'rain' ? RAIN + cover + ' fill="#7f93b8" opacity=".2"/>' : '') + '</svg>';
}
