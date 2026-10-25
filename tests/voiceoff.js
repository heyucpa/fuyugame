// 🔇 自動念出來可以關掉：關了遊戲不會自己念；自己按 🔊／長按／試聽還是會念；設定頁有開關；英文單字不受影響
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.addInitScript(() => {
    window.__said = [];
    const fake = { speaking: false, cancel() {}, getVoices() { return [{ name: 'Mei-Jia', lang: 'zh-TW', voiceURI: 'mj', localService: true }, { name: 'Samantha', lang: 'en-US', voiceURI: 'sam', localService: true }]; }, speak(u) { window.__said.push(u.text); }, addEventListener() {} };
    Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; $('#modal').hidden = true;
    o.defaultOn = voiceOn();
    __said.length = 0; speak('自動念'); o.onSays = __said.length === 1;
    openTab('save'); await wait(100);
    const btn = [...document.querySelectorAll('#tabBody button')].find(x => /自動念出來/.test(x.textContent)); o.hasToggle = !!btn;
    btn.click(); await wait(100); o.off = !voiceOn();
    o.label = [...document.querySelectorAll('#tabBody button')].find(x => /自動念出來/.test(x.textContent)).textContent;
    __said.length = 0; speak('自動念'); o.offSilent = __said.length === 0;
    speakPlain('她自己按的'); o.askedSays = __said.includes('她自己按的');
    __said.length = 0; enSpeak('apple'); o.english = __said.length === 1;
    o.saved = localStorage.getItem('myHouse_voiceOn') === '0';
    [...document.querySelectorAll('#tabBody button')].find(x => /自動念出來/.test(x.textContent)).click(); o.backOn = voiceOn();
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = out.defaultOn && out.onSays && out.hasToggle && out.off && /關/.test(out.label) && out.offSilent && out.askedSays && out.english && out.saved && out.backOn && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
