// 百貨公司熱鬧起來：每層有店員、逛街的客人提購物袋、沙發可以坐、展示的吊燈泰迪熊等按了會介紹也能買
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), close = () => { closeGameWindow(); document.getElementById('modal').hidden = true; };
    try {
      G.guide = 'done'; G.bells = 20000;
      travelArrive('dept', 1); await w(800);
      o.clerk2 = host.n && host.n.id === 'clerk_furn';
      o.shoppers = (host.crowd || []).length >= 3 && host.crowd.every(c => !!c.bag);
      o.sofa = !!FURNITURE_USE.dept_sofa;
      const it = curRoom().items.find(q => q.id === 'dept_chandelier');
      o.lookMap = FURNITURE_ACT.dept_chandelier === 'dept_look' && FURNITURE_ACT.dept_teddy === 'dept_look';
      fufuStartAct('dept_look', performance.now(), it, false); await w(1500);
      const md = document.getElementById('modal');
      o.lookOpen = !md.hidden && /水晶吊燈/.test(md.textContent);
      const before = G.bells, cnt = (G.items || []).length;
      const buy = [...md.querySelectorAll('button')].find(b => /帶回家/.test(b.textContent)); buy && buy.click(); await w(300);
      o.bought = G.bells < before; close();
      travelArrive('dept', 2); await w(600); o.clerk3 = host.n && host.n.id === 'clerk_toy';
      travelArrive('dept', 3); await w(600); o.chef = host.n && host.n.id === 'chef_food';
      o.save = !!normalizeSave(JSON.parse(JSON.stringify(G)));
      closeGameWindow(); document.getElementById('modal').hidden = true;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
