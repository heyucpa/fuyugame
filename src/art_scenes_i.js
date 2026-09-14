/* ===== 第 21 篇：同學賣的幸運手鍊 =====
   刻意不畫任何真實的宗教或信仰物品，只畫一條普通的串珠手鍊。
   也刻意不畫任何「靈異」元素——這篇的傷害是花錢、害怕、不敢說，不是超自然。
*/

// 一條普通的串珠手鍊
const BAND = (x, y, s, dim) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" opacity="' + (dim ? .5 : 1) + '">' +
  '<ellipse cx="0" cy="0" rx="14" ry="9" fill="none" stroke="#c9a227" stroke-width="3.2"/>' +
  Array.from({ length: 6 }, (_, i) => {
    const a = i / 6 * Math.PI * 2;
    return '<circle cx="' + (Math.cos(a) * 14).toFixed(1) + '" cy="' + (Math.sin(a) * 9).toFixed(1) +
      '" r="3.4" fill="' + ['#ff8fb8', '#7fc1ed', '#ffd23f', '#a8e6c0', '#c9a2e8', '#ffb37f'][i] +
      '" stroke="#33224a" stroke-width="1.1"/>';
  }).join('') + '</g>';

// 垃圾桶
const BIN = (x, y, s) =>
  '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
  '<path d="M-16 -34 L-13 0 L13 0 L16 -34 Z" fill="#9aa4ad" stroke="#33224a" stroke-width="2"/>' +
  '<rect x="-19" y="-40" width="38" height="7" rx="2.5" fill="#7d868f" stroke="#33224a" stroke-width="1.8"/>' +
  '<path d="M-7 -28 v18 M0 -28 v18 M7 -28 v18" stroke="#7d868f" stroke-width="1.6"/></g>';

Object.assign(ART_SCENES, {
  // 🌟 把訊息拿給媽媽看，媽媽陪你把手鍊丟掉，什麼事都沒發生
  'wish.best': SVG('媽媽陪著小女生把手鍊丟進垃圾桶，天氣很好，什麼事都沒有發生',
    BG('#eafaf1', '#bfe6cf') + SUNBURST(104, 52) +
    BIN(148, 118, 1.0) +
    '<g class="bob">' + BAND(148, 62, 0.8) + '</g>' +
    MOM(46, 118, 1.0, 'reachR') +
    GIRL(96, 118, 1.0, { pose: 'cheer' }) +
    '<g class="twinkle">' + EMO(66, 44, '✨', 16) + EMO(124, 36, '✨', 13) + '</g>'),

  // 👍 自己沒買，但手鍊還在班上傳
  'wish.good': SVG('小女生沒有買，但手鍊在班上同學之間傳來傳去',
    BG('#f2f7ff', '#c8dcf0') +
    GIRL(38, 118, 0.94, { pose: 'reachR' }) + EMO(66, 66, '🚫', 18, 'clash') +
    '<g class="fadeDanger">' +
    GIRL(118, 118, 0.78, { dress: '#a8e6c0', mood: 'flat' }) +
    BOY(154, 118, 0.74, '#b6a7d6') +
    GIRL(184, 118, 0.7, { dress: '#ffd23f', mood: 'flat' }) +
    BAND(136, 74, 0.62) + EMO(160, 52, '💸', 14) + EMO(180, 40, '💸', 12) + '</g>'),

  // 😮‍💨 花過錢了，但停下來去找媽媽
  'wish.escape': SVG('小女生把手鍊放在桌上，轉身走向媽媽',
    BG('#fff6e6', '#d8c3a0') +
    DESK(44, 118, 0.72) +
    BAND(44, 60, 0.78, true) +
    GIRL(96, 118, 1.0, { pose: 'reachR' }) +
    MOM(160, 118, 1.0, 'reachL') +
    EMO(126, 44, '💬', 18)),

  // 👍 沒回訊息，但手鍊不敢丟
  'wish.slip': SVG('抽屜半開著，手鍊放在最裡面，小女生在旁邊看著',
    BG('#f4f0fb', '#cbbce0') +
    '<rect x="104" y="58" width="88" height="60" rx="4" fill="#e0a76a" stroke="#33224a" stroke-width="2.2"/>' +
    '<rect x="112" y="66" width="72" height="44" rx="3" fill="#3b3352"/>' +
    '<rect x="132" y="52" width="32" height="8" rx="3" fill="#c98f52" stroke="#33224a" stroke-width="1.6"/>' +
    BAND(158, 96, 0.72, true) +
    GIRL(48, 118, 0.98, { mood: 'flat' }) +
    EMO(76, 56, '💭', 17)),

  // 🔁 一個人擔心很久，晚上睡不好
  'wish.bad': SVG('深夜的房間，小女生坐在床上睡不著，手鍊在手上',
    BG('#2e2745', '#463d63') +
    '<circle cx="168" cy="30" r="12" fill="#ffeec2" opacity=".85"/>' +
    '<rect x="30" y="92" width="140" height="26" rx="5" fill="#5b5080" stroke="#33224a" stroke-width="2"/>' +
    '<rect x="30" y="82" width="34" height="14" rx="5" fill="#e9e3f5" stroke="#33224a" stroke-width="1.6"/>' +
    GIRL(88, 92, 0.9, { pose: 'sit', mood: 'sad' }) +
    BAND(146, 84, 0.62) +
    '<g class="fadeDanger">' + EMO(38, 56, '💭', 18) + EMO(150, 60, '💭', 14) + '</g>'),
});

