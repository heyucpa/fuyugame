/* 離線用的 service worker。
   遊戲本身一個外部檔案都沒有（圖是畫的、音樂是合成的），
   所以只要把那幾個 .html 存下來，沒有網路也玩得完整。

   策略是「先連網、連不到才用存的」，不是反過來。
   反過來（先用快取）會變成：我改了東西她永遠看不到，
   那比不能離線更糟——這個遊戲還在一直改。

   同一個資源每次連得上就順手更新一份，所以她離線時拿到的
   一定是「最後一次有網路時的版本」。 */
const CACHE = 'fuyugame-v1';
const FILES = ['./house.html', './theater.html', './index.html', './'];

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
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // 只管自己網站的 GET；其他一律不插手
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
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
