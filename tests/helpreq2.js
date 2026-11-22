// 📬 求救信第二批：23 封信每一封都能從頭做到結局（選好的方法）；優先寄很久沒去／沒去過的地方；去過的地方會記日期；同一個地方信箱裡不會有兩封；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), sc = () => { const s = document.getElementById('vevScene'); if (s) vevScene.test.close(); };
    try {
    document.getElementById('modal').hidden = true; G.guide = 'done'; G.help = { list: [], done: {} };
    const ids = Object.keys(HELP_REQS); o.count = ids.length === 23;
    o.places = ids.every(k => { const R = HELP_REQS[k]; return R.dest ? !!WORLD_VENUES[R.dest] : !!PLACES[R.place]; });
    o.allRun = true;
    for (const id of ids) { const R = HELP_REQS[id]; G.help.list = [id]; const d0 = G.help.done[id] || 0;
      helpRun(id); for (let s = 0; s < R.steps.length; s++) { const gi = R.steps[s].opts.findIndex(op => !op[2]); helpRun.test.pick(gi); await w(s < R.steps.length - 1 ? 950 : 1500); }
      const endOk = !!document.getElementById('vevScene'); sc(); sc(); await w(30);
      if (!endOk || (G.help.done[id] || 0) !== d0 + 1 || G.help.list.includes(id)) { o.allRun = false; o['fail_' + id] = true; } }
    // 優先很久沒去的地方
    const t = today(); G.visitAt = {}; ids.forEach(k => { const R = HELP_REQS[k]; G.visitAt[R.place || R.dest] = t; }); G.visitAt['pool'] = '2026-01-01'; delete G.visitAt['星星國'];
    G.help = { list: [], done: Object.fromEntries(ids.map(k => [k, 1])) }; let hits = 0;
    // 直接檢查排序
    const stale = k => { const R = HELP_REQS[k], at = G.visitAt[R.place || R.dest]; return at ? Math.round((Date.parse(today()) - Date.parse(at)) / 864e5) : 99; };
    o.staleOrder = stale('fallstar') === 99 && stale('ring') > 100 - 100 && stale('ring') > stale('books');
    let picks = {}; const realRandom = Math.random;
    for (let i = 0; i < 30; i++) { G.help.d = null; G.help.list = []; const orig = helpAsk; let pid = null; helpAsk = id2 => { pid = id2; }; helpNew(); sc(); sc(); helpAsk = orig; picks[pid] = (picks[pid] || 0) + 1; }
    o.picksStale = Object.keys(picks).every(k => ['ring', 'fallstar'].includes(k) || HELP_REQS[k]) && (picks.ring || 0) + (picks.fallstar || 0) >= 12;
    o.picks = JSON.stringify(picks).slice(0, 200);
    // 去過會記日期
    G.visitAt = {}; travelArrive('gym'); await w(300); o.visitRec = G.visitAt.gym === today(); homeArrive(); await w(300);
    // 同一個地方不會有兩封
    G.help = { list: ['ice'], done: {} }; o.noSamePlace = (() => { for (let i = 0; i < 30; i++) { G.help.d = null; const orig = helpAsk; let pid = null; helpAsk = x => { pid = x; }; helpNew(); sc(); sc(); helpAsk = orig; if (HELP_REQS[pid].dest === '冰雪國') return false; } return true; })();
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { help: { list: ['ring', 'xx'], done: { fallstar: 1 } }, visitAt: { pool: '2026-11-01', bad: 5 } }));
    o.save = JSON.stringify(n.help.list) === '["ring"]' && n.help.done.fallstar === 1 && JSON.stringify(n.visitAt) === JSON.stringify({ pool: '2026-11-01' });
    delete o.picks;
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
