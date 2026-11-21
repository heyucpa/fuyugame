// 🍙 賣吃的東西：吃東西選單有「買太多了？賣回商店」→ 直接跳到賣東西模式的食物（排最上面、藥水在最前面）；很多個可以全部賣掉；只有一個不會出現全部賣掉；送的（0 元）不能賣
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    try {
    document.getElementById('modal').hidden = true; G.guide = 'done';
    const other = KID_FOODS.find(f => f.price > 0 && !f.potion && !f.season);
    G.kidFood = { shrink: 3, [other.id]: 1 }; G.bells = 0;
    showFoodMenu('kid'); const btn = [...document.querySelectorAll('#foodMenu button')].find(x => /賣回商店/.test(x.textContent)); o.menuBtn = !!btn;
    btn.click(); await w(200); o.jumped = sellMode === true && !!document.getElementById('sellFood') && document.getElementById('foodMenu').hidden;
    const body = document.getElementById('tabBody') || document.body, txt = body.textContent;
    o.potionFirst = txt.indexOf('神奇魔法藥水') > -1 && txt.indexOf('神奇魔法藥水') < txt.indexOf('🛋️ 家具');
    const card = [...document.querySelectorAll('.card.sellable')].find(c => /神奇魔法藥水/.test(c.textContent)); card.click(); await w(100);
    const all = [...document.querySelectorAll('#modalCard button')].find(x => /全部賣掉（3 個/.test(x.textContent)); o.allBtn = !!all;
    all.click(); await w(200); o.soldAll = !G.kidFood.shrink && G.bells === 1500;
    const c2 = [...document.querySelectorAll('.card.sellable')].find(c => c.textContent.includes(other.name)); c2.click(); await w(100);
    o.noAllForOne = ![...document.querySelectorAll('#modalCard button')].some(x => /全部賣掉/.test(x.textContent));
    [...document.querySelectorAll('#modalCard button')].find(x => /賣掉/.test(x.textContent)).click(); await w(100); o.soldOne = !G.kidFood[other.id] && G.bells === 1500 + Math.floor(other.price / 2);
    KID_FOOD_BY_ID.__free = { id: '__free', name: '送的點心', emoji: '🍬', price: 0 }; G.kidFood.__free = 2; o.freeBlocked = kidFoodSellBlock('__free') === '送的' && sellKidFood('__free') === 0 && G.kidFood.__free === 2; delete G.kidFood.__free;
    sellMode = false; $('#modal').hidden = true;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
