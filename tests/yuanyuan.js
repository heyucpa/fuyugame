// 🛋️ 新家大採購：在小屋裡用 iframe 打開（寵物名字、存檔格傳進去）、玩完傳星星回來給錢（每天 5 場）、點裡面算認真玩、入口、單獨打開照舊
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => { G.guide = 'done'; $('#modal').hidden = true; G.pet.name = '咪咪'; G.yy = null; openYuanyuan(); await new Promise(r => setTimeout(r, 1500)); const fr = document.querySelector('.yy-frame'); return { frame: !!fr, src: fr && fr.src.includes('pet=%E5%92%AA%E5%92%AA') && fr.src.includes('slot=') }; });
  const fr = p.frames().find(f => /yuanyuan_shopping/.test(f.url()));
  o.loaded = !!fr;
  if (fr) {
    o.petName = /咪咪的新家/.test(await fr.locator('.top').innerText());
    // 一直點還能點的答案，全部關卡玩完（關數照遊戲本身，現在是 8 關）
    for (let k = 0; k < 200; k++) { const st = await fr.evaluate(() => { if (document.getElementById('end').style.display === 'block') return 'end'; const b = [...document.querySelectorAll('.opt')].find(x => !x.disabled); if (b) b.click(); return 'go'; }); if (st === 'end') break; await fr.waitForTimeout(350); }

    await p.waitForTimeout(800);
    o.ended = await fr.evaluate(() => document.getElementById('end').style.display === 'block');
    o.ownKey = await fr.evaluate(() => Object.keys(localStorage).some(k => /^yuanyuan_p1_/.test(k)));
  }
  const r = await p.evaluate(() => ({ status: document.querySelector('.game-status').textContent, n: G.yy && G.yy.n, played: gamePlay.last > 0 }));
  o.paid = /顆星/.test(r.status) && /💰/.test(r.status) && r.n === 1; o.tapCounts = r.played;
  const r2 = await p.evaluate(() => { closeGameWindow(); host.n = HOSTS.teacher; G.away = { place: 'school', idx: 0 }; const t = hostMenuEntries().some(e => /新家大採購/.test(e[0])); G.away = null; const q = allQuickGames().some(g => /新家大採購/.test(g.name)); saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); const bad = normalizeSave(Object.assign({}, raw, { yy: { d: 3, n: 'x' } })).yy == null; return { t, q, saved: raw.yy && raw.yy.n === 1, bad }; });
  Object.assign(o, r2);
  // 單獨打開（不在小屋裡）照舊：叫圓圓、用原本的存檔 key
  const p2 = await (await b.newContext()).newPage(); await p2.goto('file://' + path.resolve(__dirname, '../yuanyuan_shopping.html')); await p2.waitForTimeout(500);
  o.alone = /圓圓的新家/.test(await p2.locator('.top').innerText());
  console.log(JSON.stringify(o));
  const ok = Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
