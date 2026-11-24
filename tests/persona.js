// 台詞變多、有個性：每位主人（爸媽以外）至少 10 句個性台詞＋自我介紹、每位動物朋友都有自己的話；主人會說個性台詞、朋友和路人也會；看時間說話；長的話分兩行
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
      const hosts = Object.keys(HOSTS).filter(k => !['mom', 'dad'].includes(k));
      o.hostPersona = hosts.every(k => (HOST_PERSONA[k] || []).length >= 10) || hosts.filter(k => !(HOST_PERSONA[k] || []).length).join(',');
      o.hostIntro = hosts.every(k => !!HOST_INTRO[k] || ['uncle', 'grandma'].includes(k)) || hosts.filter(k => !HOST_INTRO[k]).join(',');
      o.nbPersona = NEIGHBORS.every(n => (NB_PERSONA[n.id] || []).length >= 6) || NEIGHBORS.filter(n => !NB_PERSONA[n.id]).map(n => n.id).join(',');
      o.noBadEmoji = !/[\u{1FA70}-\u{1FAFF}\u{1F9A5}-\u{1F9FF}]/u.test(JSON.stringify(HOST_PERSONA) + JSON.stringify(NB_PERSONA));
      G.guide = 'done'; travelArrive('fireman' in HOSTS ? 'firestation' : 'park', 0); await w(600);
      host.introduced = host.n.id; let per = 0; for (let i = 0; i < 100; i++) { const t = hostChatLine(); if (HOST_PERSONA.fireman.some(x => personaFill(x) === t)) per++; }
      o.usesPersona = per > 30 && per < 90;
      o.nbLine = !!nbPersonaLine(NEIGHBOR_BY_ID.dudu) && NB_PERSONA.dudu.map(personaFill).includes(nbPersonaLine(NEIGHBOR_BY_ID.dudu));
      o.filled = !/\{名字\}/.test(personaFill('{名字}你好'));
      G.realClock = 1; o.timeLine = hostTimeLine('curator') === null || typeof hostTimeLine('curator') === 'string'; delete G.realClock;
      const cv = document.createElement('canvas').getContext('2d'); let ok2 = true; try { drawNeighborBubble(cv, { x: 3, y: 3, z: 0 }, { short: '館員' }, HOST_INTRO.librarian, 1); } catch (e) { ok2 = false; } o.bubble2 = ok2;
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
