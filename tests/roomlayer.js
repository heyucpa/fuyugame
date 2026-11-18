// 🧱 房間分層畫：跟「整張從頭畫」比要一樣（只容許家具邊緣少數幾點的柔邊差一點點：最多 200 點、每點差不到 100）（家裡擺滿家具、每個地點、小可愛站在不同位置）
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const res = await p.evaluate(async () => {
    const out = [], w = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('modal').hidden = true; G.guide = 'done';
    // 時間停住：兩種畫法才比得出來
    let fake = performance.now(); const rp = performance.now.bind(performance), rd = Date.now; performance.now = () => fake; const d0 = rd(); Date.now = () => d0;
    const g = canvas.getContext('2d');
    const shot = () => g.getImageData(0, 0, canvas.width, canvas.height).data;
    const cmp = name => {
      USE_ROOM_LAYER = false; draw(); const a0 = shot(); draw(); const a = shot(); let noise = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - a0[i]) + Math.abs(a[i + 1] - a0[i + 1]) + Math.abs(a[i + 2] - a0[i + 2]) > 12) noise++;
      USE_ROOM_LAYER = true; roomBaseKey = ''; roomSeenKey = ''; roomViewKey = ''; draw(); draw(); draw(); const f0 = roomLayerStats.frames; draw(); const used = roomLayerStats.frames > f0; const c = shot();
      let diff = 0, max = 0, bx0 = 1e9, bx1 = -1, by0 = 1e9, by1 = -1; for (let i = 0; i < a.length; i += 4) { const d = Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2]) + Math.abs(a[i + 3] - c[i + 3]); if (d > 12) { diff++; if (d > max) max = d; const x = (i / 4) % canvas.width, y = Math.floor(i / 4 / canvas.width); bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); } }
      if (diff && !window.__dbg) { const c2 = document.createElement('canvas'); c2.width = canvas.width; c2.height = canvas.height; const g2 = c2.getContext('2d'); g2.drawImage(canvas, 0, 0); const im = g2.getImageData(0, 0, c2.width, c2.height); for (let i = 0; i < a.length; i += 4) { const d = Math.abs(a[i] - c[i]) + Math.abs(a[i + 1] - c[i + 1]) + Math.abs(a[i + 2] - c[i + 2]) + Math.abs(a[i + 3] - c[i + 3]); if (d > 12) { im.data[i] = 255; im.data[i + 1] = 0; im.data[i + 2] = 255; im.data[i + 3] = 255; } } g2.putImageData(im, 0, 0); window.__dbg = c2.toDataURL(); }
      out.push({ name, used, diff, max, noise, box: diff ? [bx0, by0, bx1, by1] : 0, layerOn: USE_ROOM_LAYER });
    };
    // 家裡：擺很多家具，小可愛站在幾個不同的地方（前面、後面、家具中間）
    const room = curRoom(); const ids = FURNITURE.filter(f => f.layer !== 'wall').map(f => f.id); let k = 0;
    for (let y = 0; y + 2 <= room.d && k < 60; y += 2) for (let x = 0; x + 2 <= room.w && k < 60; x += 2) { const def = FURN_BY_ID[ids[(k * 7) % ids.length]]; k++; if (def.w <= 2 && def.d <= 2) room.items.push({ uid: 9000 + k, id: def.id, x, y, rot: 0 }); }
    for (const [x, y] of [[.5, .5], [room.w - .5, room.d - .5], [room.w / 2, room.d / 2], [1.5, room.d - 1.2], [room.w - 1.2, 1.5]]) { fufu.x = x; fufu.y = y; pet.x = Math.max(.5, x - 1); pet.y = y; fake += 700; cmp('家 ' + x + ',' + y); }
    // 每一個地點
    for (const pl of Object.keys(PLACES)) {
      try { G.away = { place: pl, idx: 0 }; fufu.x = 2.5; fufu.y = 2.5; fake += 700; for (let i = 0; i < 3; i++) { try { gameStep(.01, fake); } catch (e) {} } fake += 700; cmp('地點 ' + pl);
        const r2 = curRoom(); fufu.x = r2.w - 1.5; fufu.y = r2.d - 1.5; fake += 700; cmp('地點 ' + pl + ' 角落'); } catch (e) { out.push({ name: '地點 ' + pl, err: String(e.message).slice(0, 80) }); }
    }
    G.away = null; performance.now = rp; Date.now = rd;
    return out;
  });
  if (process.env.DBG) { const u = await p.evaluate(() => window.__dbg); if (u) require('fs').writeFileSync(process.env.DBG, Buffer.from(u.split(',')[1], 'base64')); }
  const bad = res.filter(r => r.err || !r.layerOn || r.diff > 200 || r.max > 100), unused = res.filter(r => !r.used && !r.err).map(r => r.name);
  console.log('比了', res.length, '個畫面；有用到分層的', res.filter(r => r.used).length, '個；沒用到（整張畫）的：', unused.join('、') || '無');
  if (bad.length) console.log('不一樣的：', JSON.stringify(bad.slice(0, 12)));
  const ok = !bad.length && !errs.length && res.filter(r => r.used).length >= res.length * .7;
  console.log(errs.slice(0, 2)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
