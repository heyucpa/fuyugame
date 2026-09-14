
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
  (mark ? '<circle cx="27" cy="-8" r="8.5" fill="#fff" stroke="#33224a" stroke-width="1.6"/>' +
          '<text x="27" y="-4" font-size="10" text-anchor="middle">' + mark + '</text>' : '') +
  '</g>';

const TOWN_TINT = {
  morning: '<rect width="320" height="200" fill="#ffb46b" opacity=".13"/>',
  day:     '',
  dusk:    '<rect width="320" height="200" fill="#d4622a" opacity=".2"/>',
  night:   '<rect width="320" height="200" fill="#1b2450" opacity=".34"/>',
};

/* 每個地點：畫什麼、名牌放哪、小人站哪。
   stand 都刻意閃開名牌與房子，免得人疊在字上面。 */
const PLACES = [
  { key: 'school', name: '學校',  emoji: '🏫', plate: [56, 48],   stand: [108, 76],
    npc: [102, 36], npcArt: () => ADULT(102, 36, 0.4, { color: '#5e8f78' }),
    art: lit => SCHOOL(56, 38, lit) },
  { key: 'dojo',   name: '道館',  emoji: '🥋', plate: [258, 48],  stand: [212, 76],
    npc: [226, 36], npcArt: () => ADULT(226, 36, 0.4, { color: '#33224a' }),
    art: lit => HOUSE(258, 38, 48, 28, '#e8e0f5', '#7d6aa8', lit) },
  { key: 'shop',   name: '商店街', emoji: '🛒', plate: [44, 122],  stand: [96, 140],
    npc: [80, 108], npcArt: () => ADULT(80, 108, 0.4, { color: '#e8a33d' }),
    art: lit => HOUSE(44, 112, 54, 26, '#fff4d6', '#e8a33d', lit) },
  { key: 'park',   name: '公園',  emoji: '🌳', plate: [158, 108], stand: [200, 124],
    npc: [196, 96], npcArt: () => ADULT(196, 96, 0.4, { color: '#7f9ab8' }),
    art: () => TREE(136, 104, 1.5) + TREE(180, 102, 1.2, '#a8e6c0') + TREE(158, 112, 1.1) },
  { key: 'pool',   name: '泳池',  emoji: '🏊', plate: [266, 122], stand: [224, 140],
    npc: [238, 90], npcArt: () => ADULT(238, 90, 0.4, { color: '#e85a92' }),
    art: () => '<rect x="240" y="96" width="52" height="24" rx="4" fill="#7fc1ed" stroke="#33224a" stroke-width="2"/>' +
               '<path d="M244 104 q6 -3 12 0 q6 3 12 0 q6 -3 12 0" stroke="#a8d8f5" stroke-width="2.4" fill="none"/>' },
  { key: 'home',   name: '家',    emoji: '🏠', plate: [158, 178], stand: [212, 192],
    npc: [122, 168], npcArt: () => ADULT(122, 168, 0.4, { color: '#9b59b6' }),
    art: lit => HOUSE(158, 170, 58, 30, '#ffd9e4', '#c9587f', lit) },
];

function townBase() {
  const road = 'M158 200 L158 140 M158 140 L56 86 M158 140 L258 86 M158 140 L44 130 M158 140 L266 130';
  return '<rect width="320" height="200" fill="#c8e6c0"/>' +
    '<path d="' + road + '" stroke="#d9cdb4" stroke-width="13" stroke-linecap="round" fill="none"/>' +
    '<path d="' + road + '" stroke="#efe6d4" stroke-width="9" stroke-linecap="round" fill="none"/>' +
    TREE(10, 96, 1) + TREE(304, 160, 1.1, '#a8e6c0') + TREE(100, 186, 0.9) +
    TREE(252, 186, 1, '#a8e6c0') + TREE(304, 30, 0.9);
}

/* marks: { 地點key: '❗' | '💬' | '✓' }　standAt: 小人站在哪個地點 */
function townSVG(tod, marks, standAt) {
  const lit = tod === 'night';
  // 記號掛在名牌上。試過掛在人頭上，六個泡泡會把畫面擠爆。
  const spots = PLACES.map(p =>
    '<g class="spot" data-spot="' + p.key + '">' +
    p.art(lit) + p.npcArt() +
    PLATE(p.plate[0], p.plate[1], p.emoji + ' ' + p.name, marks[p.key] || '') +
    '</g>').join('');
  const here = PLACES.find(p => p.key === standAt) || PLACES[PLACES.length - 1];
  return '<svg viewBox="0 0 320 200" width="100%" role="img" aria-label="小鎮地圖">' +
    townBase() + spots +
    GIRL(here.stand[0], here.stand[1], 0.55) +
    (TOWN_TINT[tod] || '') + '</svg>';
}
