// ✏️ 收到的朋友家可以改名字（姊姊做卡時寫成妹妹）：改了以後出門選單、小島上的房子都顯示新名字；同一個人再寄新卡還是新名字；不改到存檔
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const c1 = await b.newContext({ viewport: { width: 1100, height: 820 } }); const p1 = await c1.newPage();
  await p1.goto('file://' + path.resolve(__dirname, '../house.html')); await p1.waitForTimeout(1500);
  const code = await p1.evaluate(async () => { G.inviteFrom = '妹妹'; return encodeInvite(makeInvite()); });   // 姊姊不小心選了「妹妹」
  const code2 = await p1.evaluate(async () => encodeInvite(makeInvite()));
  await c1.close();
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const out = await p.evaluate(async ([code, code2]) => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
    G.guide = 'done'; $('#modal').hidden = true; G.fIsle = 1;
    const inv = await decodeInvite(code); saveInvite(inv);
    o.before = inviteWho(loadInvites()[0]) === '妹妹';
    const save0 = localStorage.getItem(SAVE_KEY);
    openInviteRename(); await wait(100);
    [...document.querySelectorAll('.rename-b button')].find(x => x.textContent === '姊姊').click(); await wait(100);
    o.after = inviteWho(loadInvites()[0]) === '姊姊';
    o.saveSame = localStorage.getItem(SAVE_KEY) === save0;
    $('#modal').hidden = true;
    openIsland(); await wait(300); o.islandLabel = isl.invites.length === 1 && inviteWho(isl.invites[0]) === '姊姊'; closeIsland();
    // 同一個人寄新卡：還是「姊姊」
    saveInvite(await decodeInvite(code2)); o.newCard = loadInvites().length === 1 && inviteWho(loadInvites()[0]) === '姊姊';
    // 改回去
    openInviteRename(); await wait(100); [...document.querySelectorAll('.rename-b button')].find(x => x.textContent === '妹妹').click(); await wait(100);
    o.back = inviteWho(loadInvites()[0]) === '妹妹'; $('#modal').hidden = true;
    return o;
  }, [code, code2]);
  console.log(JSON.stringify(out));
  const ok = Object.values(out).every(Boolean) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
