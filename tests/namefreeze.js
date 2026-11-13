// 🏷️ 取名字不當機：玩過的小遊戲沒關乾淨（「遊戲中」標記、搶空白鍵），取名字還是能打字、能存
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  p.setDefaultTimeout(15000);
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  await p.evaluate(async () => {
    document.getElementById('modal').hidden = true;
    openFishing(); await new Promise(r => setTimeout(r, 300));
    document.getElementById('modal').hidden = true;                       // 小遊戲直接藏起來，沒走 closeGameWindow
    document.addEventListener('keydown', e => { if (e.code === 'Space') e.preventDefault(); });   // 留下來的遊戲按鍵
    openPetNamer(G.activePet || 0);
  });
  await p.waitForTimeout(200);
  const inp = p.locator('#modalCard input'); await inp.fill(''); await inp.focus(); await p.keyboard.type('a b');
  const r = await p.evaluate(() => ({
    notInGame: !document.getElementById('modalCard').classList.contains('in-game'),
    canSelect: getComputedStyle(document.querySelector('#modalCard input')).userSelect !== 'none',
    typed: document.querySelector('#modalCard input').value === 'a b' }));
  await p.evaluate(() => [...document.querySelectorAll('#modalCard button')].find(x => x.textContent.includes('就叫這個')).click());
  await p.waitForTimeout(300);
  Object.assign(r, await p.evaluate(async () => {
    const o = { saved: G.pets[G.activePet || 0].name === 'a b' };
    openFishing(); await new Promise(r => setTimeout(r, 200));
    o.gameStillInGame = document.getElementById('modalCard').classList.contains('in-game');
    closeGameWindow();
    o.gameInputSelect = (() => { const c = document.getElementById('modalCard'); c.classList.add('in-game'); const i = document.createElement('input'); c.appendChild(i); const v = getComputedStyle(i).userSelect; i.remove(); c.classList.remove('in-game'); return v !== 'none'; })();
    return o;
  }));
  const ok = Object.values(r).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(r), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
