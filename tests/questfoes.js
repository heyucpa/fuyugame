// 👾 闖關每個世界有兩三種小怪物輪流出現（第一隻還是原本那種）、青蛙會跳、蝸牛慢；每個世界的大魔王樣子不同、血量不變；畫得出來不會出錯
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(() => {
    const o = {}; G.guide = 'done'; $('#modal').hidden = true;
    const start = id => { questState().mode = 'normal'; playQuest(id); return playQuest.test; };
    const kinds = new Set(); let firstOk = true;
    QUEST_IDS.forEach(id => { const T = start(id), w = +id[0], es = T.ents.filter(e => (QUEST_FOES[w] || []).includes(e.k) && e.k !== 'turtle'); es.forEach(e => kinds.add(e.k)); for (let i = 0; i < 4; i++) T.frameStep(1 / 60); closeGameWindow(); $('#modal').hidden = true; });
    o.variety = ['slime', 'mush', 'frog', 'crab', 'snail', 'penguin', 'snowman', 'bird', 'imp'].filter(k => kinds.has(k)).length >= 8;
    let T = start('1-1'); o.firstSlime = T.ents.filter(e => ['slime', 'mush', 'frog'].includes(e.k))[0].k === 'slime';
    const fr = T.ents.find(e => e.k === 'frog'); if (fr) { fr.hopT = 0; let up = false; for (let i = 0; i < 90; i++) { T.step(1 / 60); if (fr.vy < -100) up = true; } o.frogHop = up; } else o.frogHop = false;
    closeGameWindow(); $('#modal').hidden = true;
    T = start('2-1'); const cr = T.ents.find(e => e.k === 'crab'), sn = T.ents.find(e => e.k === 'snail'); o.snailSlow = !!sn && Math.abs(sn.vx) < Math.abs(cr.vx); closeGameWindow(); $('#modal').hidden = true;
    o.bossHp = ['1-5', '2-5', '4-5', '6-5'].every(id => { const T2 = start(id), bo = T2.ents.find(e => e.k === 'boss'); for (let i = 0; i < 4; i++) T2.frameStep(1 / 60); closeGameWindow(); $('#modal').hidden = true; return bo && bo.hp >= 3; });
    o.looks = new Set(Object.values(QUEST_BOSS_LOOK)).size >= 5;
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
