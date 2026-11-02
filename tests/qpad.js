// 闖關右手虛擬鍵：360／390／430 寬，只有跳、加火、加必殺、加水管、全部一起，跳躍鍵都要完整留在畫面裡
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/google/chrome/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'));
  await p.waitForTimeout(800);
  try { await p.getByText('跳過').click({ timeout: 1200 }); } catch (e) {}
  const modes = ['jump', 'fire', 'pet', 'glow', 'down', 'all'];
  const widths = [360, 390, 430];
  const bad = [];
  for (const w of widths) {
    await p.setViewportSize({ width: w, height: 844 });
    const rows = await p.evaluate((modes) => {
      G.guide = 'done';
      if (!(G.pet && G.pet.stage && G.pet.stage !== 'egg')) G.pet = { species: 'bunny', stage: 'kid', hunger: 80, clean: 100, mood: 80 };
      questState().mode = 'easy';
      try { gameCleanup && gameCleanup(); } catch (e) {}
      $('#modal').hidden = true;
      playQuest('1-1');
      const T = playQuest.test;
      const q = s => document.querySelector(s);
      const show = (el, on) => { if (el) el.style.display = on ? '' : 'none'; };
      const out = [];
      modes.forEach(mode => {
        const fire = mode === 'fire' || mode === 'all';
        const pet = mode === 'pet' || mode === 'glow' || mode === 'all';
        const glow = mode === 'glow' || mode === 'all';
        const down = mode === 'down' || mode === 'all';
        show(q('.qb-fire'), fire); show(q('.qb-dn'), down); show(q('.qb-pet'), pet);
        const bp = q('.qb-pet');
        if (bp) { bp.classList.toggle('glow', glow); bp.textContent = glow ? '🐾 必殺技' : '🐾'; }
        const j = q('.qpad-split .qb-j').getBoundingClientRect();
        const card = document.querySelector('.modal-card').getBoundingClientRect();
        const others = [...document.querySelectorAll('.qpad-split .qb-l, .qpad-split .qb-r, .qpad-split .qb-dn, .qpad-split .qb-fire, .qpad-split .qb-pet')]
          .filter(el => el.getBoundingClientRect().width > 0);
        const vw = innerWidth;
        const jumpOk = j.width >= 64 && j.left >= card.left - 1 && j.right <= card.right + 1 && j.right <= vw + 1 && j.bottom <= innerHeight + 1;
        const rightmost = others.every(el => el.getBoundingClientRect().right <= j.right + 1);
        out.push({ mode, jumpOk, rightmost, w: Math.round(j.width), right: Math.round(j.right), cardRight: Math.round(card.right), vw });
      });
      try { gameCleanup && gameCleanup(); } catch (e) {}
      return out;
    }, modes);
    rows.forEach(r => { if (!r.jumpOk || !r.rightmost) bad.push(w + ' ' + r.mode + ' w=' + r.w + ' right=' + r.right + ' card=' + r.cardRight + ' vw=' + r.vw); });
  }
  console.log(bad.length ? bad.join('\n') : '✅ 跳躍鍵都在畫面裡');
  if (errs.length) console.log('錯誤 ' + errs.slice(0, 3).join(' | '));
  const ok = !bad.length && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
