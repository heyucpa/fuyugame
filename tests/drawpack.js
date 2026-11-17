// 💾 畫的省空間寫法：存檔變小、存回來一模一樣、舊存檔（數字陣列）照樣讀得懂、卡片連結也通
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {};
    // 像小朋友畫的：手指一段一段小小移動，偶爾跳一大段
    const draw = n => { const s = []; let k = 0; while (k < n) { const st = [k % 8, k % 3, 20 + (k * 7) % 200, 20 + (k * 13) % 120]; let x = st[2], y = st[3]; for (let i = 0; i < 40; i++) { let dx = (i % 5) - 2, dy = (i % 3) - 1; if (i === 20) dx = 40; if (x + dx < 0 || x + dx > 240) dx = 0; if (y + dy < 0 || y + dy > 160) dy = 0; x += dx; y += dy; st.push(dx, dy); } s.push(st); k += 40; } return { s }; };
    const raw = draw(6000), oldTxt = JSON.stringify(raw);
    const d = cleanDrawing(raw, PAD_BIG), newTxt = JSON.stringify(d);
    o.smaller = newTxt.length * 3 < oldTxt.length; o.sizes = [oldTxt.length, newTxt.length];
    const back = cleanDrawing(JSON.parse(newTxt), PAD_BIG);
    o.same = JSON.stringify(back.s) === JSON.stringify(d.s) && JSON.stringify(d.s) === JSON.stringify(raw.s.filter(Boolean));
    // 舊存檔（數字陣列）→ 讀進來 → 存成新寫法 → 再讀一次，畫都一樣
    G.artWall = [raw]; G.schoolFlags = [raw]; G.artCup = { frame: raw };
    const n1 = normalizeSave(JSON.parse(JSON.stringify(G)));
    o.oldLoads = padPoints(n1.artWall[0]) === padPoints(raw) && padPoints(n1.schoolFlags[0]) === padPoints(raw) && padPoints(n1.artCup.frame) === padPoints(raw);
    const txt = JSON.stringify(n1); o.savedPacked = /"artWall":\[\{"z":/.test(txt);
    const n2 = normalizeSave(JSON.parse(txt)); o.reload = JSON.stringify(n2.artWall[0].s) === JSON.stringify(n1.artWall[0].s);
    // 畫得出來
    const c = document.createElement('canvas'); c.width = 240; c.height = 160; drawCardStrokes(c.getContext('2d'), n2.artWall[0], 1); o.draws = c.getContext('2d').getImageData(0, 0, 240, 160).data.some((v, i) => i % 4 === 0 && v < 200);
    // 卡片連結：畫跟著卡片走，收到的人讀得回來
    const card = cleanDrawing(draw(800)); const code = encodeInvitePlain({ d: card }); const back2 = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(code.slice(1).replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0))));
    o.cardOk = padPoints(cleanDrawing(back2.d)) === padPoints(card);
    // 壞掉的字串不會讓遊戲當掉
    o.badSafe = cleanDrawing({ z: '!!!!,zz' }) === null || Array.isArray(cleanDrawing({ z: '!!!!,zz' }).s);
    return o;
  });
  const ok = Object.entries(o).every(([k, v]) => v === true || k === 'sizes') && !errs.length;
  console.log(JSON.stringify(o), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
