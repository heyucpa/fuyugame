/* 離線用的 service worker。
   遊戲本身一個外部檔案都沒有（圖是畫的、音樂是合成的），
   所以只要把那幾個 .html 存下來，沒有網路也玩得完整。

   策略是「先連網、連不到才用存的」，不是反過來。
   反過來（先用快取）會變成：我改了東西她永遠看不到，
   那比不能離線更糟——這個遊戲還在一直改。

   同一個資源每次連得上就順手更新一份，所以她離線時拿到的
   一定是「最後一次有網路時的版本」。 */
const CACHE = 'fuyugame-v6';   // v5：開網頁一律跟網站確認最新版；v6：從舊版換過來時，把開著的遊戲自動重新載入成新版
const FILES = ['./house.html', './theater.html', './index.html', './yuanyuan_shopping.html', './yuanyuan_shopping_g1.html', './'];

self.addEventListener('install', e => {
  // 先把主要的幾頁抓起來；抓不到也不要讓安裝失敗（例如當下就沒網路）
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(FILES.map(f => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // 舊版的快取清掉，不然改了名字之後會留著永遠用不到的東西
  /* 家長：學校的小朋友只會玩、不會按重新整理。
     舊版的遊戲網頁自己不會檢查新版，但瀏覽器每次打開網頁都會順便看這個 sw.js 有沒有換新；
     換新了就裝這個新的，裝好的時候把開著的遊戲網頁自動重新載入一次 → 直接變成新版（新版之後會自己檢查更新）。
     只有「從舊版換過來」才重新載入；第一次裝（本來就是新的）不動。 */
  e.waitUntil(
    caches.keys()
      .then(ks => { const old = ks.filter(k => k !== CACHE); return Promise.all(old.map(k => caches.delete(k))).then(() => old.length > 0); })
      .then(hadOld => self.clients.claim().then(() => hadOld))
      .then(hadOld => { if (!hadOld) return; return self.clients.matchAll({ type: 'window' }).then(cs => Promise.all(cs.map(c => (c.navigate ? c.navigate(c.url).catch(() => {}) : null)))); })
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // 只管自己網站的 GET；其他一律不插手
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // 打開網頁（navigate）：跟網站確認有沒有新版，不要直接用瀏覽器存著的那份（家長：學校的電腦一直是舊版）
  const fresh = req.mode === 'navigate' ? fetch(req, { cache: 'no-cache' }) : fetch(req);
  e.respondWith(
    fresh
      .then(res => {
        // 連得上就順便更新存的那一份（只存成功的回應）
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./house.html')))
  );
});
