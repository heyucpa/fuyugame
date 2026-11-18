// 📐 外面的地方都是 12×12（家長：14×14 太大）（寵物屋除外）：每個房間東西不重疊、不超出、牆上的東西掛得下、空地都連在一起、可以用的東西都走得到
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(() => {
    const bad = [], sizes = [];
    Object.entries(PLACES).forEach(([pid, pl]) => pl.rooms.forEach((room, ri) => {
      const tag = `${pid}:${room.name}`; if (pid !== 'pethouse') sizes.push(room.w + 'x' + room.d);
      room.items.forEach(it => {
        const def = FURN_BY_ID[it.id]; if (!def) { bad.push(tag + ' 沒有這件 ' + it.id); return; }
        const others = Object.assign({}, room, { items: room.items.filter(x => x.uid !== it.uid) });
        if (!canPlace(others, def, it.x, it.y, it.rot, null)) bad.push(`${tag} 放不下 ${it.id}@${it.x},${it.y}`);
      });
      room.wallItems.forEach(wi => { const def = FURN_BY_ID[wi.id]; if (!def || !canPlaceWall(room, def, wi.side, wi.pos, wi.uid)) bad.push(`${tag} 牆上掛不下 ${wi.id}@${wi.side}${wi.pos}`); });
      // 空地連在一起
      const blk = blockedGrid(room); let start = null, free = 0;
      for (let i = 0; i < room.w; i++) for (let j = 0; j < room.d; j++) if (!blk[i][j]) { free++; if (!start) start = [i, j]; }
      const seen = new Set([start.join()]), q = [start];
      while (q.length) { const [i, j] = q.shift(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, c]) => { const ni = i + a, nj = j + c; if (ni >= 0 && nj >= 0 && ni < room.w && nj < room.d && !blk[ni][nj] && !seen.has(ni + ',' + nj)) { seen.add(ni + ',' + nj); q.push([ni, nj]); } }); }
      if (seen.size !== free) bad.push(`${tag} 有 ${free - seen.size} 格空地走不到`);
      room.items.filter(it => canUse(it)).forEach(it => { if (!findPathToItem(room, start[0], start[1], it)) bad.push(`${tag} 走不到 ${it.id}@${it.x},${it.y}`); });
    }));
    return { bad, allBig: sizes.every(s => { const [w, d] = s.split('x').map(Number); return w >= 12 && d >= 12 && w <= 13 && d <= 13; })   /* 12×12；本來就 13 格寬的那一間維持 13 */, sizes: [...new Set(sizes)] };
  });
  const ok = !o.bad.length && o.allBig && !errs.length;
  console.log(JSON.stringify(o, null, 1), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
