// 新電影、新書定期上映：上映日期到了才出現、童話電影不算原本集章、童話書不蓋閱讀護照、上映通知只跳一次、館員選單有童話書架、存檔檢查
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
      G.guide = 'done';
      const fm = MOVIES.filter(m => m.fairy);
      o.fiveMovies = fm.length === 5 && fm.every(m => m.scenes.length === 6 && m.rel);
      o.relFilter = relOk('2026-11-24', new Date(2026, 10, 24, 9).getTime()) && !relOk('2026-11-27', new Date(2026, 10, 24, 9).getTime()) && relOk('2026-11-27', new Date(2026, 10, 27, 0, 1).getTime());
      o.nowList = moviesNow().every(m => relOk(m.rel));
      o.regularSame = MOVIE_REGULAR.length === 5 && !MOVIE_REGULAR.some(id => MOVIE_BY_ID[id].fairy);
      o.scenesDraw = fm.every(m => m.scenes.every(sc => { try { const c = document.createElement('canvas').getContext('2d'); sc.draw(c, 2, { tapped: true, tt: 1 }); if (sc.tapFx) sc.tapFx(c, 1, 2); return true; } catch (e) { return false; } }));
      o.english = fm.every(m => !!MOVIE_TITLE_EN[m.title] && m.scenes.every(sc => !!MOVIE_EN[sc.say]));
      o.books = FAIRY_BOOKS.length === 8 && FAIRY_BOOKS.every(b => b.rel && b.pages.length >= 5);
      o.fridayRel = FAIRY_BOOKS.concat(fm).filter(x => x.rel !== '2026-11-24').every(x => [5, 0].includes(new Date(x.rel + 'T00:00:00').getDay()));
      const pass0 = JSON.stringify(G.passport || {}); const fb = FAIRY_BOOKS[0];
      finishBook(fb, {}); await w(200);
      o.fairyNotPassport = JSON.stringify(G.passport || {}) === pass0 && fairyReadState()[fb.id] === 1 && !document.getElementById('modal').hidden;
      document.getElementById('modal').hidden = true;
      window.__mediaTest = 1; delete G.mediaNote; document.querySelectorAll('#showcase').forEach(e => e.remove()); SC_QUEUE.length = 0;
      const n1 = mediaNotify(), n2 = mediaNotify();
      o.notifyOnce = n1 >= 2 && n2 === 0 && !!G.mediaNote['m:redhood'] && !!G.mediaNote['b:tortoise'];
      document.querySelectorAll('#showcase').forEach(e => e.remove()); SC_QUEUE.length = 0; delete window.__mediaTest;
      travelArrive('library', 0); await w(600);
      o.shelfMenu = hostMenuEntries().some(e => /童話書架/.test(e[0]));
      openFairyShelf(); await w(100); o.shelfShows = /龜兔賽跑/.test(document.getElementById('modalCard').textContent) && !/傑克與魔豆<\/span>/.test(document.getElementById('modalCard').innerHTML.replace(/下一本.*$/, '')); document.getElementById('modal').hidden = true;
      const bad = JSON.parse(JSON.stringify(G)); bad.mediaNote = { 'm:x': 'bad' }; bad.fairyRead = 5; const nn = normalizeSave(bad);
      o.saveClean = nn.fairyRead === undefined && !('m:x' in (nn.mediaNote || {}));
      o.saveKeep = normalizeSave(JSON.parse(JSON.stringify(G))).fairyRead[fb.id] === 1;
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
