// 🌋 恐龍島的危險：島主選單有入口；三關（躲岩漿球、撿隕石碎片、澆熄火山）真的玩得過（模擬會躲、會撿的小朋友）；
//    （第二關：救 5 隻嚇壞的小恐龍，帶到安全區）三關過了送🦕恐龍坐騎、小島上的石像變綠；存檔驗證；商店不賣
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.vehicles = (G.vehicles || []).filter(v => v !== 'dino'); G.dinoQ = { s: 0 };
    openIsleMenu('dino'); o.menuEntry = /解除恐龍島的危險（0 \/ 3）/.test(document.getElementById('modalCard').textContent);
    openDinoDanger(); o.locked = [...document.querySelectorAll('#modalCard .lv-btn')].filter(x => /🔒/.test(x.textContent)).length === 2;
    // 模擬小朋友：看到紅圈就往反方向走；有碎片就去撿；有水去火山、沒水去池塘
    const play = async (step, maxMs) => {
      dinoPlay(step); const T = dinoPlay.test; let res = null; const st0 = performance.now();
      const iv = setInterval(() => { const me = T.me; let tx = me.x, ty = me.y;
        const warn = T.drops.filter(d => !d.hit && Math.hypot(d.x - me.x, d.y - me.y) < 40);
        if (warn.length) { const d = warn[0], L = Math.hypot(me.x - d.x, me.y - d.y) || 1; tx = me.x + (me.x - d.x) / L * 60; ty = me.y + (me.y - d.y) / L * 60; if (tx < 20 || tx > 300) tx = 160; if (ty < 90 || ty > 225) ty = 160; }
        else if (step === 1) { const sc = T.babies.filter(bb => bb.st === 'scared').sort((p1, p2) => Math.hypot(p1.x - me.x, p1.y - me.y) - Math.hypot(p2.x - me.x, p2.y - me.y)); const fol = T.babies.some(bb => bb.st === 'follow'); if (sc.length && !(fol && sc.length === 0)) { tx = sc[0].x; ty = sc[0].y; } else { tx = T.SAFE.x - 10; ty = T.SAFE.y; } if (fol && T.babies.filter(bb => bb.st === 'follow').length >= 2) { tx = T.SAFE.x - 10; ty = T.SAFE.y; } }
        else if (step === 2) { const wt = T.state().water; tx = wt ? T.volc.x : T.pond.x; ty = wt ? T.volc.y + 34 : T.pond.y; }
        const dx = tx - me.x, dy = ty - me.y, L = Math.hypot(dx, dy); if (L > 2) { me.x += dx / L * 92 * .05; me.y += dy / L * 92 * .05; } }, 50);
      for (let k = 0; k < maxMs / 200; k++) { await w(200); const t = document.querySelector('#modalCard .game-status').textContent; if (/過關了/.test(t)) { res = true; break; } if (/再試一次/.test(t)) { res = false; break; } }
      clearInterval(iv); return { res, sec: Math.round((performance.now() - st0) / 1000) };
    };
    const r1 = await play(0, 40000); o.lavaPass = r1.res === true;
    const r2 = await play(1, 95000); o.meteorPass = r2.res === true;
    const r3 = await play(2, 125000); o.waterPass = r3.res === true;
    o.info = JSON.stringify([r1, r2, r3]);
    await w(500);
    o.dinoMount = (G.vehicles || []).includes('dino') && dinoSafe() && G.ride === 'dino';
    o.draws = (() => { try { vehicleCanvas('dino', 120, 90); return true; } catch (e) { return e.message; } })() === true;
    o.saveSafe = (() => { const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { dinoQ: { s: 9 }, vehicles: ['dino', 'ufo'] })); const bad = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { dinoQ: 'x' })); return n.dinoQ.s === 3 && n.vehicles.join() === 'dino' && !('dinoQ' in bad); })();
    o.notInShop = !shopCatalog().some(([k]) => k === 'v:dino');
    // 失敗：岩漿打到 5 次 → 再試一次（進度不倒退）
    G.dinoQ = { s: 1 }; dinoPlay(0); dinoPlay.test.hurt(); await w(200); o.failRetry = /再試一次/.test(document.querySelector('#modalCard .game-status').textContent) && dinoQ().s === 1;
    G.dinoQ = { s: 3 }; closeGameWindow();
    return o;
  });
  const info = o.info; delete o.info;
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), info, errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
