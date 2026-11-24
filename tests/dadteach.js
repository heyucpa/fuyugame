// 爸爸在學校兼課：禮拜五、六、日教室老師換成爸爸（西裝外套、同一套老師功能、說爸爸的話），其他天是貓頭鷹老師；備份分頁最上面是強制更新
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
      o.days = dadTeachDay(new Date(2026, 10, 27)) && dadTeachDay(new Date(2026, 10, 28)) && dadTeachDay(new Date(2026, 10, 29)) && !dadTeachDay(new Date(2026, 10, 24)) && !dadTeachDay(new Date(2026, 10, 26));
      G.guide = 'done';
      const keep = dadTeachDay;
      window.dadTeachDay = () => true; travelArrive('park', 0); await w(300); travelArrive('school', 0); await w(700);
      o.dadThere = !!(host.n && host.n.dadTeach && host.n.id === 'teacher');
      o.suit = dadTeacherWho().outfit.top === 'dad_blazer' && PARENTS[1].outfit.top === 'dad_black_tee';
      host.introduced = null; o.dadIntro = /兼課/.test(hostChatLine()); o.dadLines = DAD_TEACH_LINES.map(personaFill).includes(hostChatLine());
      o.lessons = hostMenuEntries().some(e => /上課/.test(e[0])) && hostMenuEntries().some(e => /小考/.test(e[0]));
      window.dadTeachDay = () => false; travelArrive('park', 0); await w(300); travelArrive('school', 0); await w(700);
      o.owlOtherDays = host.n === HOSTS.teacher;
      window.dadTeachDay = keep;
      close(); openTab('backup'); await w(200);
      const bigs = [...document.querySelectorAll('#tabBody button.big')].map(b => b.textContent);
      o.updateTop = /強制更新/.test(bigs[0] || '') && /手動存一份/.test(bigs.filter(t => !/強制更新/.test(t))[0] || '');
      openTab('inv');
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
