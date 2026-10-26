// 🏎️ 小可愛賽車：選車（只有買過的）、倒數起跑、跑 3 圈、名次、道具（香蕉丟在後面、火箭加速、無敵星星）、壓到香蕉打滑（重的車不會）、結算給錢；叔叔家和快速選單都是這個
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
    G.guide = 'done'; $('#modal').hidden = true; G.vehicles = ['bus'];
    openKart(); document.querySelectorAll('.lv-btn')[0].click(); await wait(100);
    o.pick = [...document.querySelectorAll('.lv-btn')].map(x => x.innerText).join('|'); o.pickOk = /卡丁車/.test(o.pick) && /公車/.test(o.pick) && !/跑車/.test(o.pick);
    document.querySelectorAll('.lv-btn')[0].click(); await wait(200);
    const K = playKart.test; o.ready = K.st().state === 'ready'; await wait(500); o.noMoveBefore = K.st().z === 0;
    K.go(); await wait(1500); o.moving = K.st().state === 'race' && K.st().z > 0;
    const ap = setInterval(() => K.setPx(K.st().px * .5), 80);   // 自動駕駛：一直回到路中間
    K.giveItem('rocket'); const s0 = K.st().speed; K.useItem(); await wait(600); o.rocket = K.st().speed > s0 && !K.st().item;
    K.giveItem('banana'); K.useItem(); o.banana = K.bananas().length >= 1;
    K.giveItem('star'); K.useItem(); o.star = !K.st().item;
    // 壓到別人丟的香蕉：卡丁車會滑
    await wait(6000); const b0 = K.bananas(); b0.length = 0; const st = K.st(); b0.push({ z: (st.z + 1000 + 300) % st.LEN, x: st.px }); for (let i = 0; i < 30 && K.st().spin <= 0; i++) await wait(50); o.slip = K.st().spin > 0;
    K.lastLap(); for (let i = 0; i < 100 && K.st().state !== 'done'; i++) await wait(100); o.finished = K.st().state === 'done' && K.st().place >= 1;
    for (let i = 0; i < 40 && !/名/.test(document.querySelector('.game-status').textContent); i++) await wait(100);
    clearInterval(ap); o.status = /名！.*💰/.test(document.querySelector('.game-status').textContent); closeGameWindow();
    // 重的車（公車）壓到香蕉不會滑
    openKart(); document.querySelectorAll('.lv-btn')[0].click(); await wait(100); [...document.querySelectorAll('.lv-btn')].find(x => /公車/.test(x.innerText)).click(); await wait(200);
    const K2 = playKart.test; K2.go(); await wait(2500); const s2 = K2.st(); K2.bananas().push({ z: (s2.z + 1000 + 300) % s2.LEN, x: s2.px }); await wait(1500); o.heavy = K2.st().spin === 0; closeGameWindow();
    // 選單
    host.n = HOSTS.uncle; o.uncle = hostMenuEntries().some(e => e[1] === openKart); o.quick = allQuickGames().some(g => g.name === '賽車' && g.where === 'uncle');
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = Object.entries(out).filter(([k]) => k !== 'pick').every(([, v]) => v) && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
