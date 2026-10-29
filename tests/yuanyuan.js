// 🛋️ 新家大採購：在小屋裡用 iframe 打開（寵物名字、存檔格傳進去）、玩完傳星星回來給錢（每天 5 場）、點裡面算認真玩、入口、單獨打開照舊
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = {};
  for (const g1 of [false, true]) {   // 姊姊版、妹妹小一版都要接得好
    const t = g1 ? 'g1' : '';
    const o1 = await p.evaluate(async g1 => { G.guide = 'done'; $('#modal').hidden = true; G.pet.name = '咪咪'; if (!g1) G.yy = null; openYuanyuan(g1); await new Promise(r => setTimeout(r, 1500)); const fr = document.querySelector('.yy-frame'); return { frame: !!fr, src: !!fr && fr.src.includes('pet=%E5%92%AA%E5%92%AA') && fr.src.includes(g1 ? 'yuanyuan_shopping_g1.html' : 'yuanyuan_shopping.html?') }; }, g1);
    Object.entries(o1).forEach(([k, v]) => { o[k + t] = v; });
    const fr = p.frames().find(f => (g1 ? /yuanyuan_shopping_g1/ : /yuanyuan_shopping\.html/).test(f.url()));
    o['loaded' + t] = !!fr;
    if (fr) {
      o['petName' + t] = /咪咪的新家/.test(await fr.locator('.top').innerText());
      // 一直點還能點的答案，全部關卡玩完（關數照遊戲本身）
      for (let k = 0; k < 900; k++) { const st = await fr.evaluate(() => { if (document.getElementById('end').style.display === 'block') return 'end'; const b = [...document.querySelectorAll('.opt')].find(x => !x.disabled && x.offsetParent); if (b) b.click(); else { const nx = [...document.querySelectorAll('button')].find(x => x.offsetParent && /下一關|看結果|繼續|下一題/.test(x.textContent)); if (nx) nx.click(); } return 'go'; }); if (st === 'end') break; await fr.waitForTimeout(250); }
      await p.waitForTimeout(800);
      o['ended' + t] = await fr.evaluate(() => document.getElementById('end').style.display === 'block');
      o['ownKey' + t] = await fr.evaluate(g1 => Object.keys(localStorage).some(k => (g1 ? /^yuanyuan1_p1_/ : /^yuanyuan_p1_/).test(k)), g1);
    }
    const r = await p.evaluate(() => ({ status: document.querySelector('.game-status').textContent, n: G.yy && G.yy.n, played: gamePlay.last > 0 }));
    o['paid' + t] = /顆星/.test(r.status) && /💰/.test(r.status) && r.n === (g1 ? 2 : 1); o['tapCounts' + t] = r.played;
  }
  const r2 = await p.evaluate(() => { closeGameWindow(); host.n = HOSTS.teacher; G.away = { place: 'school', idx: 0 }; const t = hostMenuEntries().filter(e => /新家大採購/.test(e[0])).length === 2; G.away = null; const q = allQuickGames().filter(g => /新家大採購/.test(g.name)).length === 2; saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY)); const bad = normalizeSave(Object.assign({}, raw, { yy: { d: 3, n: 'x' } })).yy == null; return { t, q, saved: raw.yy && raw.yy.n === 2, bad }; });
  Object.assign(o, r2);
  // 單獨打開（不在小屋裡）照舊：叫圓圓、用原本的存檔 key
  const p2 = await (await b.newContext()).newPage(); await p2.goto('file://' + path.resolve(__dirname, '../yuanyuan_shopping.html')); await p2.waitForTimeout(500);
  o.alone = /圓圓的新家/.test(await p2.locator('.top').innerText());
  await p2.goto('file://' + path.resolve(__dirname, '../yuanyuan_shopping_g1.html')); await p2.waitForTimeout(500);
  o.aloneG1 = /圓圓的新家/.test(await p2.locator('.top').innerText()) && /小一版/.test(await p2.locator('.top').innerText());
  console.log(JSON.stringify(o));
  const ok = Object.values(o).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
