// 🌙 家裡跟著時間變天色：白天照舊、傍晚變橘、晚上變暗有星星；晚上燈附近比較亮；設定可以關；天空的爸爸媽媽家不變；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true; G.guide = 'done'; vis.who = null; delete G.noDayNight;
    const r = curRoom(); r.items = [{ uid: 9101, id: 'lamp', x: 1, y: 1, rot: 0 }]; r.wallItems = []; fufu.x = r.w - .5; fufu.y = r.d - .5; fufu.idleUntil = performance.now() + 1e7;
    const g = canvas.getContext('2d');
    const px = (x, y, z) => { const q = iso(x, y, z || 0), d = viewDpr; const c = g.getImageData(Math.round((q.x * view.scale + view.ox) * d), Math.round((q.y * view.scale + view.oy) * d), 1, 1).data; return c[0] + c[1] + c[2]; };
    const scr = (sx, sy) => { const d = viewDpr, c = g.getImageData(Math.round((sx * view.scale + view.ox) * d), Math.round((sy * view.scale + view.oy) * d), 1, 1).data; return c[0] + c[1] + c[2]; };
    const L = iso(1.5, 1.5, itemHeight(FURN_BY_ID.lamp) * .8), F = iso(r.w - 1.5, 1.5, itemHeight(FURN_BY_ID.lamp) * .8);
    const at = async h => { ISL_HOUR_TEST = h; roomBaseKey = ''; draw(); draw(); await w(50); draw(); return { floor: px(r.w - 2, 2), lamp: scr(L.x + 34, L.y), far: scr(F.x - 34, F.y) }; };
    const noon = await at(12), dusk = await at(18.5), night = await at(22);
    o.noonUnchanged = roomTint(12)[3] === 0;
    const tintAt = async h => { ISL_HOUR_TEST = h; draw(); await w(30); const d = document.getElementById('dayTint'); return d.hidden ? '' : d.style.backgroundColor; };
    o.nightDarker = !!(await tintAt(22)) && (await tintAt(12)) === '';   // 天色是蓋在畫布上面的一層（瀏覽器自己疊，不用每格重畫）
    o.duskWarm = (() => { const t = roomTint(18.5); return t[0] > t[2] && t[3] > .05; })();
    const keep = DN_LIGHTS; DN_LIGHTS = /^$/; const noGlow = await at(22); DN_LIGHTS = keep; o.lampGlows = night.lamp - noGlow.lamp > 40;
    o.smooth = Math.abs(roomTint(19.9)[3] - roomTint(20.1)[3]) < .05 && Math.abs(roomTint(16.6)[3] - roomTint(16.4)[3]) < .05;
    G.noDayNight = 1; const off = await at(22); o.canTurnOff = Math.abs(off.floor - noon.floor) < 6 && document.getElementById('dayTint').hidden; delete G.noDayNight;
    G.away = { place: 'sky', idx: 0 }; ISL_HOUR_TEST = 22; draw(); o.skyNoTint = document.getElementById('dayTint').hidden; G.away = null;
    o.settingsBtn = (() => { openTab('save'); return [...document.querySelectorAll('#tabBody button')].some(x => /變天色/.test(x.textContent)); })();
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { noDayNight: 7 })); o.saveSafe = !('noDayNight' in n);
    ISL_HOUR_TEST = null; o.info = JSON.stringify({ noon, dusk, night, off });
    return o;
  });
  const info = o.info; delete o.info;
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), info, errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
