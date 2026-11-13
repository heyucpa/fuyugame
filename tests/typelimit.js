// ⌨️ iPad 注音打字：名字格子（門牌、寵物名字、小島名字…）不用 maxLength，打注音時不會卡住；選好字之後才剪到最多幾個字
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html'), { timeout: 90000 }); await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    const w = ms => new Promise(r => setTimeout(r, ms)), o = {};
    const ime = (i, composing, final) => {   // 模擬 iPad 注音：先出現ㄅㄆㄇ（還在選字），選好才變成國字
      i.dispatchEvent(new CompositionEvent('compositionstart'));
      i.value = composing; i.dispatchEvent(new InputEvent('input', { isComposing: true }));
      const kept = i.value === composing;
      i.value = final; i.dispatchEvent(new CompositionEvent('compositionend')); i.dispatchEvent(new InputEvent('input'));
      return kept;
    };
    document.getElementById('modal').hidden = true; homeTab = 'sign'; openHomeLook();
    const i = document.querySelector('.home-sign input');
    o.noMaxLen = i.maxLength < 0 && !i.hasAttribute('maxlength');
    o.composingKept = ime(i, '書房的家我的ㄒㄧㄠˇ', '書房的家我的小');   // 還在選字時 10 個符號，不能被剪掉
    await w(20);
    o.afterPick = i.value === '書房的家我的小';
    ime(i, '書房的家我的小屋ㄗ˙', '書房的家我的小屋子'); await w(20);
    o.cut8 = i.value === '書房的家我的小屋';
    i.value = '一二三四五六七八九十'; i.dispatchEvent(new InputEvent('input')); o.pasteCut = i.value === '一二三四五六七八';
    [...document.querySelectorAll('#modalCard button')].find(x => x.textContent.includes('掛上門牌')).click();
    o.saved = homeState().sign === '一二三四五六七八';
    o.canSelect = getComputedStyle(document.querySelector('.home-sign input')).userSelect !== 'none';
    closeGameWindow();
    openPetNamer(G.activePet || 0); const n = document.querySelector('#modalCard input');
    o.petNoMax = n.maxLength < 0; n.value = '一二三四五六七八九十十一'; n.dispatchEvent(new InputEvent('input')); o.petCut10 = Array.from(n.value).length === 10;
    document.getElementById('modal').hidden = true;
    return o;
  });
  const ok = Object.values(r).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(r), errs);
  console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
