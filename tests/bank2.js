// 銀行熱鬧起來：大廳有客人、號碼牌機叫號到櫃台、提款機、沙發可坐、金庫房間（警衛、金條、保管箱、沒有客人）；後來加的主人說自己的話，不再說阿婆的話
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
      G.guide = 'done'; G.bells = 1000;
      travelArrive('bank', 0); await w(800);
      o.lobbyHost = host.n && host.n.id === 'banker';
      o.customers = (host.crowd || []).length === 3;
      const items = curRoom().items.map(q => q.id);
      o.lobbyItems = ['bank_atm', 'bank_ticket', 'sofa', 'bank_counter'].every(id => items.includes(id));
      o.sofaSit = !!FURNITURE_USE.sofa;
      bankTicket(); await w(4800);
      o.ticketCalls = !document.getElementById('modal').hidden && /銀行存錢筒/.test(document.getElementById('modal').textContent); close();
      o.atm = ACTIVITIES[FURNITURE_ACT.bank_atm].open && FURNITURE_ACT.bank_atm === 'bank_atm';
      travelArrive('bank', 1); await w(800);
      o.vaultHost = host.n && host.n.id === 'bank_guard';
      o.vaultNoCrowd = !(host.crowd || []).length;
      o.vaultItems = curRoom().items.some(q => q.id === 'bank_gold') && curRoom().items.some(q => q.id === 'bank_boxes');
      o.vaultIcon = roomIcon(PLACES.bank.rooms[1], 1) === '💰';
      let grandmaTalk = 0; for (let i = 0; i < 30; i++) if (/吃水果|果園/.test(hostChatLine())) grandmaTalk++;
      o.ownLines = grandmaTalk === 0;
      travelArrive('firestation', 0); await w(500); let g2 = 0; for (let i = 0; i < 30; i++) if (/吃水果|果園/.test(hostChatLine())) g2++; o.fireLines = g2 === 0;
      travelArrive('grandma', 0); await w(500); o.grandmaStill = typeof hostChatLine() === 'string';
      o.save = !!normalizeSave(JSON.parse(JSON.stringify(G)));
      close();
    } catch (e) { o.err = String(e.stack).slice(0, 300); }
    return o;
  });
  const ok = Object.values(o).every(v => v === true) && !errs.length;
  console.log(JSON.stringify(o), errs.slice(0, 3)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  await b.close(); process.exit(ok ? 0 : 1);
})();
