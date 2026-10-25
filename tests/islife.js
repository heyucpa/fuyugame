// 🐻 小島更生動：動物朋友會做事（釣魚、澆花、看書…）、走近會打招呼、對話框聊天、請她幫忙→拿到→交給牠拿錢（一天有上限）、表情旁邊的朋友會跟著做、沙灘腳印
// 🏝️ 新小島出現動畫、打開小島鏡頭飛過去；👑 大魔王打輸可以從魔王那裡重來而且變弱
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
    G.guide = 'done'; $('#modal').hidden = true;
    openIsland(); await wait(300);
    const q = isl.npcs[0];
    // 動物朋友會換事情做
    const seen = new Set(); for (let i = 0; i < 40; i++) { q.doUntil = 0; q.path = []; q.goTo = null; islNpcLife(q, .016, isl.m); seen.add(q.goTo || q.doing); } o.acts = seen.size;
    // 走近打招呼
    q.doing = 'walk'; q.greetAt = 0; q.say = null; isl.x = q.x + 1; isl.y = q.y; islNpcLife(q, .016, isl.m); o.greet = !!(q.say && q.say.text);
    // 對話框
    islTalkOpen(q); await wait(200); o.talkBox = !!document.querySelector('.isl-talk') && [...document.querySelectorAll('.isl-talk-opts button')].length >= 3;
    G.islReq = null; G.islReqDay = null; const b0 = G.bells;
    [...document.querySelectorAll('.isl-talk-opts button')].find(x => /幫忙/.test(x.textContent)).click(); await wait(100);
    o.asked = !!(G.islReq && G.islReq.npc === q.n.id);
    islReqHit(G.islReq.kind); o.have = G.islReq.have === true;
    islTalkClose(); islTalkOpen(q); await wait(100);
    const give = [...document.querySelectorAll('.isl-talk-opts button')].find(x => /給你/.test(x.textContent)); o.giveBtn = !!give; if (give) give.click(); await wait(100);
    o.paid = G.bells === b0 + 80 && G.islReq.done;
    G.islReqDay.n = 3; [...document.querySelectorAll('.isl-talk-opts button')].find(x => /幫忙/.test(x.textContent)).click(); await wait(100);
    o.dayLimit = G.islReq.done === true;
    // 走開就收起來
    isl.x = q.x + 6; islNpcLife(q, .016, isl.m); o.closedAway = !document.querySelector('.isl-talk');
    // 表情
    const q2 = isl.npcs[1]; q2.x = isl.x + 1; q2.y = isl.y; q2.emote = null; islDoEmote('dance'); await wait(1100); o.emoteReact = !!(q2.emote && q2.emote.e) && islEmoteHop() >= 0;
    // 腳印
    const m = isl.m; let bt = null; for (let y = 0; y < m.H && !bt; y++) for (let x = 0; x < m.W; x++) if (m.beach[y][x] && m.land[y][x] && !m.path[y][x] && !m.block[y][x]) { bt = [x, y]; break; }
    isl.x = bt[0] + .5; isl.y = bt[1] + .5; isl.foot = []; islFootStep(); o.foot = isl.foot.length === 1;
    closeIsland();
    // 新小島：動畫＋打開小島鏡頭飛過去
    questState().clear['1-3'] = 1; questState().newIsle = 'flower'; islMapCache = null;
    playIsletAppear(QUEST_ISLETS[0]); await wait(4800); o.anim = !!document.getElementById('isleAnim') && [...document.querySelectorAll('#isleAnim button')].every(x => x.style.visibility !== 'hidden');
    document.querySelector('#isleAnim button').click(); await wait(600);
    o.pan = !!(isl && isl.pan && isl.pan.x === QUEST_ISLETS[0].cx) && !questState().newIsle; closeIsland();
    // 大魔王：從魔王開始、變弱
    questState().mode = 'normal'; playQuest('1-3', { bossStart: true, weak: 2 }); const T = playQuest.test, bs = T.ents.find(e => e.k === 'boss');
    o.bossStart = T.P.x > bs.x - 10 * 18 && T.P.x < bs.x; o.weak = bs.hp === 1 && bs.slow > 0;
    closeGameWindow(); $('#modal').hidden = true;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = out.acts >= 4 && out.greet && out.talkBox && out.asked && out.have && out.giveBtn && out.paid && out.dayLimit && out.closedAway && out.emoteReact && out.foot && out.anim && out.pan && out.bossStart && out.weak && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
