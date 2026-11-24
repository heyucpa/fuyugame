// 銀行的行員是媽媽：穿深藍色 OL 套裝（天空島的媽媽還是原本的衣服）、自我介紹說平常在這裡上班、存錢功能一樣、對話框放在大人頭上
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
      G.guide = 'done'; travelArrive('bank', 0); await w(800);
      o.isMom = host.n && host.n.id === 'banker' && host.n.name === '媽媽' && host.n.parentOf === 0;
      const bm = bankMom(); o.olSuit = bm.outfit.top === 'ol_blazer' && bm.outfit.bottom === 'ol_skirt' && !!PARENT_CLOTHES.ol_blazer;
      o.skyMomSame = PARENTS[0].outfit.top === 'pink_tee';
      host.introduced = null; o.intro = /平常就在這裡上班/.test(hostChatLine());
      o.noSquirrel = !/松鼠行員/.test(document.documentElement.innerHTML);
      o.bankMenu = hostMenuEntries().some(e => /存錢/.test(e[0]));
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
