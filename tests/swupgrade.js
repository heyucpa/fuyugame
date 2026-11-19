// 🔄 學校的舊版：小朋友什麼都不用按。瀏覽器每次打開網頁會看 sw.js 有沒有換新；新的 sw.js 裝好時（activate），
//    如果是從舊版換過來（有舊的快取），就把開著的遊戲網頁自動重新載入成新版。第一次裝的不動。
//    （Playwright 的瀏覽器遇到 service worker 叫網頁重新載入會卡住，所以這裡用模擬的瀏覽器環境直接跑 sw.js 的程式）
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.resolve(__dirname, '../sw.js'), 'utf8');
async function run(existingCaches) {
  const handlers = {}, deleted = [], navigated = []; let claimed = false;
  const store = new Set(existingCaches);
  const self = {
    addEventListener: (k, f) => { handlers[k] = f; }, location: { origin: 'https://x' }, skipWaiting: () => Promise.resolve(),
    clients: { claim: () => { claimed = true; return Promise.resolve(); }, matchAll: () => Promise.resolve([{ url: 'https://x/house.html?v=1', navigate: u => { navigated.push(u); return Promise.resolve(); } }]) }
  };
  const caches = { keys: () => Promise.resolve([...store]), delete: k => { deleted.push(k); store.delete(k); return Promise.resolve(true); }, open: () => Promise.resolve({ add: () => Promise.resolve(), put: () => Promise.resolve() }), match: () => Promise.resolve(null) };
  vm.runInNewContext(src, { self, caches, fetch: () => Promise.reject(new Error('x')), URL, Promise, console });
  const CACHE = /const CACHE = '([^']+)'/.exec(src)[1];
  let p = null; handlers.activate({ waitUntil: x => { p = x; } }); await p;
  return { CACHE, deleted, navigated, claimed };
}
(async () => {
  const o = {};
  const up = await run(['fuyugame-v4']);
  o.newVersion = up.CACHE !== 'fuyugame-v4' && up.CACHE !== 'fuyugame-v5';
  o.oldCacheGone = up.deleted.includes('fuyugame-v4');
  o.claimed = up.claimed;
  o.reloadsOldPage = up.navigated.length === 1 && /house\.html/.test(up.navigated[0]);
  const fromV5 = await run(['fuyugame-v5']); o.reloadsFromV5 = fromV5.navigated.length === 1;
  const fresh = await run([]); o.firstInstallNoReload = fresh.navigated.length === 0;
  // 開網頁一律跟網站確認新版
  o.navigateNoCache = /req\.mode === 'navigate' \? fetch\(req, \{ cache: 'no-cache' \}\)/.test(src);
  const ok = Object.values(o).every(v => v === true);
  console.log(JSON.stringify(o)); console.log(ok ? '✅ 全部通過' : '❌ 有問題');
  process.exit(ok ? 0 : 1);
})();
