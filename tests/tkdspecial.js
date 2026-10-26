// 💥 跆拳道必殺技：對練集滿氣放必殺技（得 2 分、招式名字有她的名字）；腰帶越高學越多招、輪流用；考上腰帶會播學到新招
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; $('#modal').hidden = true; G.tkd = { belt: 0, prac: 0 };
    o.learned0 = tkdLearned().length === 1 && tkdSpecialName(TKD_SPECIALS[5]) === charName() + '黑龍波';
    openSparGame(); document.querySelectorAll('.lv-row button')[0].click();
    for (let i = 0; i < 40 && playSpar.test.state() !== 'fight'; i++) await wait(100);
    const S = playSpar.test; o.btnOff = document.querySelector('.spar-sp').disabled;
    S.special(); o.notYet = S.state() === 'fight';
    S.setKi(100); await wait(50); o.btnOn = !document.querySelector('.spar-sp').disabled;
    const me0 = S.score()[0]; S.special(); o.cut = S.state() === 'special' && S.mv().name === '旋風踢';
    await wait(2300); o.two = S.score()[0] >= me0 + 2 || S.state() === 'end'; o.kiReset = S.ki() < 100;
    closeGameWindow();
    // 黑帶：學會 6 招，輪流用
    G.tkd.belt = 5; o.learned5 = tkdLearned().length === 6;
    openSparGame(); document.querySelectorAll('.lv-row button')[0].click();
    for (let i = 0; i < 40 && playSpar.test.state() !== 'fight'; i++) await wait(100);
    const names = []; for (let k = 0; k < 2; k++) { playSpar.test.setKi(100); playSpar.test.special(); names.push(playSpar.test.mv().name); await wait(2200); if (playSpar.test.state() === 'end') break; }
    o.rotate = names.length < 2 || names[0] !== names[1]; closeGameWindow();
    // 考腰帶畫面列出學會的招
    G.tkd = { belt: 2, prac: 0 }; openBeltExam(); o.examList = /彩虹迴旋踢/.test($('#modalCard').innerText) && /下一招/.test($('#modalCard').innerText); closeGameWindow();
    // 升段後播新招
    G.tkd = { belt: 0, prac: 3 }; const w = openGameWindow('t', ''); examEnd(w, true);
    for (let i = 0; i < 120 && !/學會新的必殺技/.test(w.status.textContent); i++) await wait(100);
    o.learnShow = /流星百裂拳/.test(w.status.textContent);
    for (let i = 0; i < 80 && !/考過了/.test(w.status.textContent); i++) await wait(100); o.examDone = /考過了/.test(w.status.textContent) && G.tkd.belt === 1;
    closeGameWindow(); G.tkd = { belt: 0, prac: 0 };
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
