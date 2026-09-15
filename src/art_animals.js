/* ===== 小鎮的動物居民 =====
   除了家人（媽媽、爸爸、手足）以外，鎮上的五個居民都是動物。

   為什麼家人不換：那三個對應的是她生活裡真正的人，
   而且「妹妹被欺負了」「妹妹不見了」那兩篇劇本裡也是同一個人。

   幾件刻意的事：
   1. 身體的幾何完全沿用 ADULT（身體 -42、頭心 -54、半徑 13），
      所以動物站進小鎮地圖時跟人一樣高、一樣的地平線，不用重排座標。
   2. 衣服顏色維持原本那五個人的顏色（綠老師、橘店員、藍灰警衛、
      深色教練、粉紅救生員）——她是靠顏色認人的，換了臉不能連顏色也換。
   3. 全部原創：不參考任何現成遊戲的角色設計。
*/

// 動物的手腳：跟 LIMB 一樣，但外層用毛色而不是膚色
const FLIMB = (x1, y1, x2, y2, w, c) =>
  '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" stroke="#33224a" stroke-width="' + (w + 2.6) + '" stroke-linecap="round"/>' +
  '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>';

/* 動物的共用身體。耳朵畫在頭之前，頭才會蓋住耳朵的根部；
   尾巴那一類要畫在身體之前，用 behind 傳進來。 */
const BEAST = (x, y, s, o) => {
  o = o || {};
  const coat = o.coat, cloth = o.cloth;
  const arms = o.pose === 'reachL' ? FLIMB(-10, -30, -30, -24, 6, coat)
             : o.pose === 'reachR' ? FLIMB(10, -30, 30, -24, 6, coat)
             : FLIMB(-11, -30, -16, -14, 6, coat) + FLIMB(11, -30, 16, -14, 6, coat);
  return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
    (o.behind || '') + arms +
    '<path d="M-14 0 L-10 -42 L10 -42 L14 0 Z" fill="' + cloth +
    '" stroke="#33224a" stroke-width="1.7" stroke-linejoin="round"/>' +
    (o.chest || '') + (o.ears || '') +
    // 頭可以跟四肢不同色（企鵝的鰭要比頭亮，不然看起來沒有手）
    '<circle cx="0" cy="-54" r="13" fill="' + (o.head || coat) + '" stroke="#33224a" stroke-width="1.7"/>' +
    (o.face || '') + '</g>';
};

// 兩顆眼睛，所有動物共用
const EYES2 = '<circle cx="-5" cy="-56" r="1.9" fill="#33224a"/>' +
              '<circle cx="5" cy="-56" r="1.9" fill="#33224a"/>';
// 鬍鬚（貓、兔子用）
const WHISK = '<g stroke="#33224a" stroke-width="0.9" stroke-linecap="round" opacity=".7">' +
  '<path d="M-8 -48 h-8 M-8 -45 h-7"/><path d="M8 -48 h8 M8 -45 h7"/></g>';

/* 🐰 兔子老師 —— 學校 */
const RABBIT = (x, y, s, pose) => BEAST(x, y, s, {
  coat: '#f3ece4', cloth: '#5e8f78', pose: pose,
  ears: '<g transform="rotate(-9 -6 -64)"><ellipse cx="-6" cy="-76" rx="4.6" ry="13.5" fill="#f3ece4" stroke="#33224a" stroke-width="1.6"/>' +
        '<ellipse cx="-6" cy="-77" rx="2.1" ry="8.6" fill="#ffc6d9"/></g>' +
        '<g transform="rotate(9 6 -64)"><ellipse cx="6" cy="-76" rx="4.6" ry="13.5" fill="#f3ece4" stroke="#33224a" stroke-width="1.6"/>' +
        '<ellipse cx="6" cy="-77" rx="2.1" ry="8.6" fill="#ffc6d9"/></g>',
  face: EYES2 + WHISK +
        '<path d="M-2.6 -50 h5.2 L0 -46.6 Z" fill="#e8909a" stroke="#33224a" stroke-width="0.9" stroke-linejoin="round"/>' +
        '<path d="M0 -46.6 q-3.4 3 -6.4 0.6 M0 -46.6 q3.4 3 6.4 0.6" stroke="#33224a" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
});

/* 🐱 貓店長 —— 商店街。毛色刻意不用橘色，不然會跟橘色的圍裙糊在一起 */
const CAT = (x, y, s, pose) => BEAST(x, y, s, {
  coat: '#cdc3b6', cloth: '#e8a33d', pose: pose,
  behind: '<path d="M13 -8 q16 -2 13 -22" stroke="#33224a" stroke-width="7.4" fill="none" stroke-linecap="round"/>' +
          '<path d="M13 -8 q16 -2 13 -22" stroke="#cdc3b6" stroke-width="5" fill="none" stroke-linecap="round"/>',
  ears: '<path d="M-13.5 -61 L-10 -76 L-2.5 -65 Z" fill="#cdc3b6" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M-11.4 -63.6 L-9.6 -71.4 L-6 -65.6 Z" fill="#ffc6d9"/>' +
        '<path d="M13.5 -61 L10 -76 L2.5 -65 Z" fill="#cdc3b6" stroke="#33224a" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M11.4 -63.6 L9.6 -71.4 L6 -65.6 Z" fill="#ffc6d9"/>',
  face: EYES2 + WHISK +
        '<path d="M-2.4 -50 h4.8 L0 -47 Z" fill="#e8909a" stroke="#33224a" stroke-width="0.9" stroke-linejoin="round"/>' +
        '<path d="M0 -47 q-3.2 3 -6 0.6 M0 -47 q3.2 3 6 0.6" stroke="#33224a" stroke-width="1.3" fill="none" stroke-linecap="round"/>',
});

/* 🐻 熊伯伯 —— 公園。體型看起來要最可靠，所以鼻吻畫大一點 */
const BEAR = (x, y, s, pose) => BEAST(x, y, s, {
  coat: '#b08a6a', cloth: '#7f9ab8', pose: pose,
  ears: '<circle cx="-10" cy="-64" r="5.6" fill="#b08a6a" stroke="#33224a" stroke-width="1.6"/>' +
        '<circle cx="-10" cy="-64" r="2.6" fill="#d8b89a"/>' +
        '<circle cx="10" cy="-64" r="5.6" fill="#b08a6a" stroke="#33224a" stroke-width="1.6"/>' +
        '<circle cx="10" cy="-64" r="2.6" fill="#d8b89a"/>',
  face: EYES2 +
        '<ellipse cx="0" cy="-48.5" rx="7.6" ry="5.6" fill="#e3c9a8" stroke="#33224a" stroke-width="1.4"/>' +
        '<ellipse cx="0" cy="-51" rx="2.8" ry="2" fill="#33224a"/>' +
        '<path d="M0 -49 v2.4 M0 -46.6 q-2.6 2 -4.6 0 M0 -46.6 q2.6 2 4.6 0" stroke="#33224a" stroke-width="1.2" fill="none" stroke-linecap="round"/>',
});

/* 🦁 獅子教練 —— 道館。鬃毛就是一圈畫在頭後面的大圓，不用畫毛流 */
const LION = (x, y, s, pose) => BEAST(x, y, s, {
  coat: '#f0c06a', cloth: '#33224a', pose: pose,
  ears: '<circle cx="0" cy="-54" r="19" fill="#c9843f" stroke="#33224a" stroke-width="1.7"/>' +
        '<circle cx="-11" cy="-65" r="4.4" fill="#f0c06a" stroke="#33224a" stroke-width="1.5"/>' +
        '<circle cx="11" cy="-65" r="4.4" fill="#f0c06a" stroke="#33224a" stroke-width="1.5"/>',
  face: EYES2 +
        '<path d="M-3 -50 h6 L0 -46.6 Z" fill="#33224a" stroke="#33224a" stroke-width="0.9" stroke-linejoin="round"/>' +
        '<path d="M0 -46.6 q-3.6 3.2 -6.6 0.6 M0 -46.6 q3.6 3.2 6.6 0.6" stroke="#33224a" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
});

/* 🐧 企鵝救生員 —— 泳池。白肚子畫在身體上面，胸前那條粉紅是救生員背心，
   顏色沿用原本救生員的粉紅，她才認得出是同一個角色 */
const PENGUIN = (x, y, s, pose) => BEAST(x, y, s, {
  // 鰭要比身體亮一點，同色的話整隻看起來沒有手
  coat: '#5a7096', cloth: '#3a4a63', pose: pose,
  behind: '<ellipse cx="-6" cy="1" rx="6.4" ry="3" fill="#f0a33d" stroke="#33224a" stroke-width="1.3"/>' +
          '<ellipse cx="6" cy="1" rx="6.4" ry="3" fill="#f0a33d" stroke="#33224a" stroke-width="1.3"/>',
  chest: '<path d="M-9 -2 L-7 -38 q7 -4 14 0 L9 -2 Z" fill="#f5f7fa" stroke="#33224a" stroke-width="1.4" stroke-linejoin="round"/>' +
         '<path d="M-10 -26 h20" stroke="#e85a92" stroke-width="5.4" stroke-linecap="round"/>',
  head: '#3a4a63',
  face: '<circle cx="-4.6" cy="-57" r="4.4" fill="#f5f7fa" stroke="#33224a" stroke-width="1.2"/>' +
        '<circle cx="4.6" cy="-57" r="4.4" fill="#f5f7fa" stroke="#33224a" stroke-width="1.2"/>' +
        '<circle cx="-4.2" cy="-56.6" r="1.9" fill="#33224a"/>' +
        '<circle cx="4.2" cy="-56.6" r="1.9" fill="#33224a"/>' +
        '<path d="M-4 -49 h8 L0 -44 Z" fill="#f0a33d" stroke="#33224a" stroke-width="1.2" stroke-linejoin="round"/>',
});
