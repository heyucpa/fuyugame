// 🍪 薑餅人（家長：按了沒反應）：點在旁邊一點點也貼得上、點太遠會提示、烤箱太早按會說還差幾個、選裝飾會提示點薑餅人
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
    openGingerbread(); await w(200); const T = openGingerbread.test, st = () => document.querySelector('.game-status').textContent;
    T.oven(); o.ovenEarlyTalks = /還要再貼 3 個/.test(st()) && !T.done;
    T.pick(2); o.pickHint = /點薑餅人身上/.test(st());
    T.place(160 + 31 + 12, 58); o.nearEdgeSnaps = T.dec.length === 1;
    T.place(10, 200); o.farMiss = T.dec.length === 1 && /咖啡色的薑餅人/.test(st());
    T.place(160, 120); o.twoLeft = /再貼 1 個/.test(st());
    T.place(160, 130); o.ready = /可以按「🔥 放進烤箱」/.test(st());
    T.oven(); T.skipBake(); await w(300); o.baked = T.done; close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
