// 🔤 電影念英文：每一部每一句都有英文、名字換成 you；預設英文、可以換回中文（記住）；英文模式字幕英文＋中文
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const o = {}, wait = ms => new Promise(r => setTimeout(r, ms)); G.guide = 'done'; $('#modal').hidden = true;
    o.allLines = MOVIES.every(m => m.scenes.every(sc => { const e = movieEn(sc.say); return e && !/[一-鿿{}]/.test(e); })) && MOVIES.every(m => MOVIE_TITLE_EN[m.title]);
    localStorage.removeItem(MOVIE_LANG_KEY); o.defaultEn = movieLang() === 'en';
    openMoviePicker(); const lb = document.querySelector('.movie-lang'); o.btn = /英文/.test(lb.textContent); lb.click(); await wait(50);
    o.switched = movieLang() === 'zh' && /中文/.test(document.querySelector('.movie-lang').textContent);
    document.querySelector('.movie-lang').click(); o.back = movieLang() === 'en';
    closeGameWindow(); $('#modal').hidden = true;
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
