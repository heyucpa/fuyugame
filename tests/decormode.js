// 🛠️ 佈置模式：平常點家具沒有「搬動／收起來」、沒得用的會走過去不會被拿起來、右鍵不會收；按「佈置」後才有搬動、收起來、牆上的東西拿得下來；出門到別人家按鈕藏起來
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await (await b.newContext({ viewport: { width: 1100, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../house.html')); await p.waitForTimeout(1200);
  try { await p.getByText('跳過').click({ timeout: 1500 }); } catch (e) {}
  const o = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), o = {}, menu = () => [...document.querySelectorAll('#itemMenu button')].map(x => x.textContent).join('|');
    G.guide = 'done'; G.guideAsked = true; $('#modal').hidden = true; try { localStorage.setItem('myHouse_decorHint', '1'); } catch (e) {}
    const room = curRoom(); room.items = []; const ev = { clientX: 400, clientY: 300 };
    const add = (id, x, y) => { const it = { uid: ++G.uid || Date.now(), id, x, y, rot: 0 }; room.items.push(it); return it; };
    const bed = add('wood_bed', 1, 1), table = add('wood_table', 5, 5); commit(); await wait(50);
    o.btn = !$('#btnDecorMode').hidden && /佈置/.test($('#btnDecorMode').textContent);
    showItemMenu(bed, ev); await wait(30); o.normalMenu = /躺下|睡/.test(menu()) && !/搬動|收起來/.test(menu()); hideItemMenu();
    showItemMenu(table, ev); await wait(30); o.noUseNoHold = !hold && $('#itemMenu').hidden;
    const n0 = room.items.length; canvas.dispatchEvent(new MouseEvent('contextmenu', { clientX: 400, clientY: 300, bubbles: true })); o.noRightStore = room.items.length === n0;
    $('#btnDecorMode').click(); await wait(30); o.on = decorMode && /完成/.test($('#btnDecorMode').textContent);
    showItemMenu(bed, ev); await wait(30); o.decorMenu = /搬動/.test(menu()) && /收起來/.test(menu()) && !/躺下|睡/.test(menu());
    [...document.querySelectorAll('#itemMenu button')].find(x => /搬動/.test(x.textContent)).click(); await wait(30); o.canMove = !!hold && hold.fromUid === bed.uid; cancelHold();
    showItemMenu(table, ev); await wait(30); [...document.querySelectorAll('#itemMenu button')].find(x => /收起來/.test(x.textContent)).click(); await wait(30); o.canStore = !room.items.some(x => x.uid === table.uid);
    $('#btnDecorMode').click(); await wait(30); o.off = !decorMode;
    G.away = { place: 'school', idx: 0 }; refreshDecorBtn(); o.hiddenAway = $('#btnDecorMode').hidden; G.away = null; refreshDecorBtn();
    return o;
  });
  console.log(JSON.stringify(o));
  console.log(Object.values(o).every(Boolean) && !errs.length ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
