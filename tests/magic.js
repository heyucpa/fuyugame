// 🔮 神奇魔法藥水：每次隨機（不跟上一瓶一樣）、10 種都畫得出來、收集圖鑑、睡一覺／時間到變回來、存檔讀回來不壞
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; $('#modal').hidden = true;
    const clear = () => { SC_QUEUE.length = 0; const s = document.getElementById('showcase'); if (s) s.remove(); };
    o.name = KID_FOOD_BY_ID.shrink.name;
    G.kidFood.shrink = 60; const seq = [];
    for (let i = 0; i < 40; i++) { kidEat('shrink', 'kid'); seq.push(G.kid.lastMagic); clear(); await wait(30); }
    o.noRepeat = seq.every((x, i) => i === 0 || x !== seq[i - 1]);
    o.kinds = new Set(seq).size; o.dex = G.kid.magicDex.length; o.left = G.kidFood.shrink;
    // 每一種都畫一下（不出錯）
    o.drawn = [];
    for (const m of magicFxList()) { magicForce = m.id; delete G.kid.small; delete G.kid.magic; G.kid.lastMagic = null; G.kidFood.shrink = 1; kidEat('shrink', 'kid'); clear(); fufuWalkTo(2, 2); await wait(250); o.drawn.push(m.id + ':' + (m.id === 'small' ? !!kidSmall() : kidMagic() === m.id)); }
    magicForce = 'giant'; G.kidFood.shrink = 1; G.kid.lastMagic = null; kidEat('shrink', 'kid'); clear(); o.giant = kidHeightScale() > 1.4;
    // 存檔讀回來還在；亂掉的資料會被清掉
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    o.saved = raw.kid.magic && raw.kid.magic.id === 'giant';
    const bad = normalizeSave(Object.assign({}, raw, { kid: Object.assign({}, raw.kid, { magic: { id: 'zzz', until: 5 }, magicDex: 'x', lastMagic: 3 }) }));
    o.badCleaned = !bad.kid.magic && !bad.kid.magicDex && bad.kid.lastMagic == null;
    const good = normalizeSave(raw); o.goodKept = good.kid.magic && good.kid.magic.id === 'giant' && good.kid.magicDex.length === raw.kid.magicDex.length;
    // 時間到變回來
    G.kid.magic.until = Date.now() - 1; smallTick(); o.timeBack = !G.kid.magic && kidHeightScale() < 1.4;
    // 小寶寶時喝：會變成別的魔法（小寶寶結束）
    magicForce = null; G.kid.small = { until: Date.now() + 60000, baby: true }; G.kid.lastMagic = null; G.kidFood.shrink = 1;
    kidEat('shrink', 'kid'); clear(); o.babyDrink = !kidBaby() && !!kidMagic();
    return o;
  });
  console.log(JSON.stringify(out));
  const bad = [];
  if (out.name !== '神奇魔法藥水') bad.push('名字');
  if (!out.noRepeat) bad.push('連續喝到一樣的');
  if (out.kinds < 6) bad.push('種類太少 ' + out.kinds);
  if (out.dex !== out.kinds) bad.push('圖鑑數不對');
  if (!out.drawn.every(x => /:true$/.test(x))) bad.push('有效果沒出來 ' + out.drawn);
  if (!out.giant || !out.saved || !out.badCleaned || !out.goodKept || !out.timeBack || !out.babyDrink) bad.push('其他');
  if (errs.length) bad.push('JS 錯誤 ' + errs.join(' | '));
  console.log(bad.length ? '❌ ' + bad.join('、') : '✅ 全部通過');
  await b.close();
})();
