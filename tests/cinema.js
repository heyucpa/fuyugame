// 🎬 電影院：進場先付錢（電影院、游泳池、遊樂園；錢不夠進不去、不要就回小島；學校不用錢）、小島上有、放映師賣票、選片（萬聖節片只在萬聖節）、錢不夠買不了、播放（倒數→每一幕→要她點的地方會停住等）、
//    看完蓋章、五部都看過送海報、存檔讀回來、壞資料清掉
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
    o.onIsland = islBuildings(0).some(b => b.id === 'cinema');
    // 🎟️ 進場先付錢：從小島門口進電影院／游泳池／遊樂園
    G.bells = 30; openIsland(); await wait(200); islEnter('pool'); await wait(150);
    o.poorPool = !$('#modal').hidden && document.querySelector('#modalCard .movie-pop button').disabled && !G.away;
    [...document.querySelectorAll('#modalCard .movie-pop button')][1].click(); await wait(300); o.backToIsland = !!document.getElementById('islandLayer'); closeIsland();
    G.bells = 500; openIsland(); await wait(200); islEnter('pool'); await wait(150); document.querySelector('#modalCard .movie-pop button').click(); await wait(300);
    o.poolPaid = G.bells === 460 && G.away && G.away.place === 'pool';
    homeArrive(); await wait(200);
    openIsland(); await wait(200); islEnter('amusement'); await wait(150); document.querySelector('#modalCard .movie-pop button').click(); await wait(300);
    o.amusePaid = G.bells === 380 && G.away && G.away.place === 'amusement';
    homeArrive(); await wait(200);
    openIsland(); await wait(200); islEnter('cinema'); await wait(150); document.querySelector('#modalCard .movie-pop button').click(); await wait(300);
    o.cinemaPaid = G.bells === 320 && G.away && G.away.place === 'cinema' && G.away.ticket === 1;
    openMoviePicker('space'); await wait(100); document.querySelector('.movie-pop .alt').click(); await wait(200);
    o.ticketUsed = G.bells === 320 && G.away.ticket === 0; closeGameWindow(); $('#modal').hidden = true;
    homeArrive(); await wait(200);
    openIsland(); await wait(200); islEnter('school'); await wait(300); o.freeSchool = G.away && G.away.place === 'school' && $('#modal').hidden; homeArrive(); await wait(200);
    // 🎟️ 進場先付錢：從小島門口進電影院／游泳池
    G.bells = 30; openIsland(); await wait(200); islEnter('pool'); await wait(150);
    o.poorPool = !$('#modal').hidden && document.querySelector('#modalCard .movie-pop button').disabled && !G.away;
    [...document.querySelectorAll('#modalCard .movie-pop button')][1].click(); await wait(300); o.backToIsland = !!document.getElementById('islandLayer'); closeIsland();
    G.bells = 500; openIsland(); await wait(200); islEnter('pool'); await wait(150); document.querySelector('#modalCard .movie-pop button').click(); await wait(300);
    o.poolPaid = G.bells === 460 && G.away && G.away.place === 'pool';
    homeArrive(); await wait(200);
    openIsland(); await wait(200); islEnter('cinema'); await wait(150); document.querySelector('#modalCard .movie-pop button').click(); await wait(300);
    o.cinemaPaid = G.bells === 400 && G.away && G.away.place === 'cinema' && G.away.ticket === 1;
    openMoviePicker('space'); await wait(100); document.querySelector('.movie-pop .alt').click(); await wait(200);
    o.ticketUsed = G.bells === 400 && G.away.ticket === 0; closeGameWindow(); $('#modal').hidden = true;
    homeArrive(); await wait(200);
    travelArrive('cinema'); await wait(300); $('#modal').hidden = true;
    o.host = host.n && host.n.id; o.menu = hostMenuEntries().some(e => /看電影/.test(e[0]));
    o.seats = curRoom().items.filter(i => i.id === 'cinema_seat').every(i => canUse(i));
    G.bells = 30; openMoviePicker(); await wait(100);
    o.posters = document.querySelectorAll('.movie-pick').length;
    o.halloween = moviesNow().some(m => m.id === 'halloween') === halloweenActive();
    document.querySelector('.movie-pick').click(); await wait(100); o.poor = !document.querySelector('.movie-sub');
    G.bells = 1000; const b0 = G.bells;
    openMoviePicker('pet'); await wait(100);
    [...document.querySelectorAll('.movie-pop button')].find(x => /爆米花|要/.test(x.textContent)).click(); await wait(200);
    o.paid = b0 - G.bells;
    // 播：倒數 → 第一幕；跳到要點的那一幕，確認會停住
    await wait(2700); o.scene0 = playMovie.test.scene(); o.sub = document.querySelector('.movie-sub').textContent;
    for (let i = 0; i < 8 && playMovie.test.scene() < 3; i++) { playMovie.test.skip(); await wait(80); }
    o.atTap = playMovie.test.scene(); await wait(2200); o.stillTap = playMovie.test.scene() === o.atTap;
    playMovie.test.tap(); await wait(200);
    for (let i = 0; i < 12 && playMovie.test.phase() !== 'end'; i++) { playMovie.test.skip(); await wait(80); }
    await wait(4800);
    o.taps = MOVIES.every(m => m.scenes.filter(sc => sc.tap).length >= 3);   // 每部電影至少三幕要她點
    o.done = /新章/.test(document.querySelector('#modal').innerText); o.seen = JSON.stringify(G.movies);
    // 其他四部也看完 → 送海報
    for (const id of ['space', 'dino', 'sea', 'funny']) { openMoviePicker(id); await wait(50); document.querySelector('.movie-pop .alt').click(); await wait(2700); for (let i = 0; i < 14 && playMovie.test.phase() !== 'end'; i++) { playMovie.test.skip(); await wait(60); } await wait(4800); }
    o.prize = G.moviePrize === 1 && (G.inventory || G.items || []).length !== undefined;
    o.hasPoster = JSON.stringify(G).includes('movie_poster_pet');
    closeGameWindow();
    saveGame(); const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
    o.saved = raw.movies && raw.movies.pet === 1 && raw.movies.funny === 1;
    const bad = normalizeSave(Object.assign({}, raw, { movies: { pet: 'x', zzz: 3, sea: 2 }, moviePrize: 'y' }));
    o.badCleaned = JSON.stringify(bad.movies) === '{"sea":2}' && bad.moviePrize == null;
    return o;
  });
  console.log(JSON.stringify(out));
  const ok = out.onIsland && out.poorPool && out.backToIsland && out.poolPaid && out.cinemaPaid && out.ticketUsed && out.host === 'cinema' && out.menu && out.seats && out.posters >= 5 && out.halloween && out.poor && out.paid === 140 &&
    out.scene0 === 0 && out.atTap === 3 && out.sub.length > 4 && out.stillTap && out.taps && out.done && out.prize && out.hasPoster && out.saved && out.badCleaned && !errs.length;
  console.log(ok ? '✅ 全部通過' : '❌ 有問題 ' + errs.join(' | '));
  await b.close();
})();
