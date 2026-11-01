// 🗣️ 念中文／念英文：預設中文；設定可以切換、記在這台機器；英文模式常用的話（稱讚、名次、分數、必殺技、學新招、腰帶、對決）改用英文念；
// 注音、國字、表裡沒有的句子照樣念中文；中文模式完全不變
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {}, E = toEnglishSay;
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true;
    o.default = voiceLang() === 'zh';
    const cases = [['好棒！', 'Great job!'], [charName() + '旋風踢！', 'Special move! Whirlwind Kick!'], [charName() + '黑龍波！', 'Special move! Black Dragon Wave!'], ['一共12分！', '12 points in total!'], ['第2名！', '2nd place!'], ['第1名！', '1st place!'],
      ['學會了兔兔米米的月亮跳跳踢！', 'New move! Moon Bounce Kick!'], [`學會新的必殺技，${charName()}彩虹迴旋踢！`, 'New special move! Rainbow Spin Kick!'], ['恭喜！升上黑帶！', 'Congratulations! Black belt!'], ['3.5公尺！', '3.5 meters!'],
      ['答對7題，好棒！', '7 correct! Great job!'], ['你贏了！', 'You win!'], ['偷跑了！', 'False start!'], ['小可愛，來對決吧！看誰比較厲害！', "Let's have a duel! Who is stronger?"], ['贏了！下一場是決賽！', 'You won! Next is the final!']];
    o.bad = cases.filter(([zh, en]) => E(zh) !== en).map(c => c[0] + ' → ' + E(c[0]));
    o.cases = o.bad.length === 0;
    o.keepZh = ['ㄊ，兔子的ㄊ', '山，高山的山', '從前從前，有一隻小熊', '主題是溫馨木屋！'].every(t => E(t) === null);
    // speak：英文模式用英文念、中文模式照舊
    const said = []; const realEn = enSpeak; window.enSpeak = t => { said.push('EN:' + t); return true; };
    const realSS = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => { said.push('ZH:' + u.text); };
    setVoiceLang('en'); speak('好棒！', null, true); speak('山，高山的山', null, true); o.enMode = said[0] === 'EN:Great job!' && said[1] === 'ZH:山，高山的山';
    setVoiceLang('zh'); said.length = 0; speak('好棒！', null, true); o.zhMode = said[0] === 'ZH:好棒！';
    window.enSpeak = realEn; speechSynthesis.speak = realSS;
    // 設定按鈕
    openTab('save'); await wait(200); const btn = [...document.querySelectorAll('#tabBody button')].find(x => /常用的話念/.test(x.textContent)); btn.click(); await wait(100); o.toggle = voiceLang() === 'en' && localStorage.getItem(VOICE_LANG_KEY) === 'en';
    [...document.querySelectorAll('#tabBody button')].find(x => /常用的話念/.test(x.textContent)).click(); o.toggleBack = voiceLang() === 'zh'; openTab('inv');
    return o;
  });
  console.log(JSON.stringify(o));
  const ok = Object.entries(o).every(([k, v]) => k === 'bad' || Boolean(v)) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
