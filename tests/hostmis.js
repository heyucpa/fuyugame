// 📜 老師、館員、教練的任務：選單有、六個任務都能做完（找東西：好冷好熱→找到；一步一步：選錯被提醒、選對才往下）；一天一個；離開就取消；存檔驗證
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const o = await p.evaluate(async () => {
    const o = {}, w = ms => new Promise(r => setTimeout(r, ms)), bar = () => document.getElementById('vevBar'), sc = () => { const s = document.getElementById('vevScene'); if (s) vevScene.test.close(); };
    const clean = () => { document.getElementById('modal').hidden = true; document.querySelectorAll('#showcase,#tripLayer').forEach(x => x.remove()); };
    try {
    G.guide = 'done'; G.hmis = {}; clean();
    const PL = { teacher: 'school', librarian: 'library', tkd: 'dojo' };
    o.all = true;
    for (const hid of Object.keys(HOST_MIS)) {
      travelArrive(PL[hid]); await w(400); clean(); host.n = HOSTS[hid];
      o['menu_' + hid] = hostMenuEntries().some(e => /📜/.test(e[0]));
      for (const M of HOST_MIS[hid]) {
        G.hmis = { d: today(), done: {}, last: {}, pick: { d: today(), [hid]: M.id } };
        const b0 = G.bells; if (!hmisStart(hid)) { o.all = false; o['start_' + M.id] = false; continue; }
        const intro = !!document.getElementById('vevScene'); sc(); sc(); await w(50);
        if (M.kind === 'find') { const room = curRoom(), wrong = vevHideSpots(room).find(x => x.uid !== vev.hide); vevFindTap(wrong); if (!/好冷|溫溫|好熱/.test(vev.last)) o['hot_' + M.id] = false; const tgt = room.items.find(x => x.uid === vev.hide); vevFindTap(tgt); }
        else { let guard = 0; while (vev && vev.step === 'chain' && guard++ < 12) { const bs = [...bar().querySelectorAll('.vev-act')]; const ci = vev.ci;
            if (M.id === 'shelf' && guard === 1) { bs[1].click(); await w(30); if (vev.ci !== ci) o.shelfWrongAdvanced = true; continue; }
            vevKeyUse(); await w(40); } await w(1000); }
        await w(100); const endScene = !!document.getElementById('vevScene'); sc(); sc(); await w(80);
        const ok = intro && endScene && !vev && G.hmis.done[hid] === 1 && G.bells === b0 + 120;
        if (!ok) { o.all = false; o['fail_' + M.id] = [intro, endScene, !vev, G.hmis.done[hid], G.bells - b0].join(); }
      }
      o['once_' + hid] = hmisStart(hid) === false;
    }
    o.shelfWrongAdvanced = !o.shelfWrongAdvanced;
    // 離開就取消
    G.hmis = {}; travelArrive('school'); await w(300); clean(); hmisPick('teacher'); hmisStart('teacher'); sc(); sc(); await w(50); homeArrive(); await w(400); clean(); vevTick(performance.now()); o.cancel = !vev;
    const n = normalizeSave(Object.assign(JSON.parse(JSON.stringify(G)), { hmis: { d: '2026-11-22', done: { teacher: 1, boss: 1 }, last: { tkd: 'belt' }, junk: 1 } }));
    o.save = JSON.stringify(n.hmis) === JSON.stringify({ d: '2026-11-22', done: { teacher: 1 }, last: { tkd: 'belt' } });
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
