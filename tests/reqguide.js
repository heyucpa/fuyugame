// 👆 小島任務小幫手：請她幫忙的朋友一定在島上、上方有提示條、「帶我去」會走到目標（貝殼、蝴蝶、池塘、花、朋友），目標頭上有手指
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
    const who = NEIGHBORS.filter(Boolean)[NEIGHBORS.filter(Boolean).length - 1].id;   // 排在最後、平常不一定出現的那位
    for (const kind of ['shell', 'bug', 'fish', 'flower']) {
      G.islReq = { d: today(), npc: who, kind, have: false };
      openIsland(); await wait(300);
      o['in_' + kind] = isl.npcs.some(q => q.n.id === who);
      o['bar_' + kind] = !!document.getElementById('islReqBar');
      document.querySelector('#islReqBar button').click(); await wait(100);
      o['go_' + kind] = isl.path.length > 0 || !!isl.pending;
      closeIsland(); await wait(100);
    }
    G.islReq = { d: today(), npc: who, kind: 'shell', have: true };
    openIsland(); await wait(300);
    o.barGive = /拿去給/.test(document.getElementById('islReqBar').textContent);
    document.querySelector('#islReqBar button').click(); await wait(100); o.goNpc = isl.pending && isl.pending.type === 'talk' && isl.pending.npc.n.id === who;
    o.target = !!islReqTarget();
    G.islReq.done = true; await wait(200); o.barGone = !document.getElementById('islReqBar');
    closeIsland();
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
