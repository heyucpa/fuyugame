#!/bin/sh
# 每次都從「剛剛建好的 theater.html」重組測試檔，
# 免得又拿舊的快照去驗證新的程式（踩過一次）
set -e
cd "$(dirname "$0")"
CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome

./build.sh

echo
echo "=== ① 單純打開有沒有 JS 錯誤 ==="
ERR=$($CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 \
      --enable-logging=stderr --log-level=0 --dump-dom "file://$PWD/theater.html" 2>&1 >/dev/null \
      | grep -i "uncaught\|SyntaxError\|ReferenceError\|TypeError" || true)
if [ -n "$ERR" ]; then echo "✗ $ERR"; exit 1; fi
MENU=$($CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 \
      --dump-dom "file://$PWD/theater.html" 2>/dev/null | grep -c "pick-grid\|map-area" || true)
if [ "$MENU" -lt 1 ]; then echo "✗ 首頁沒有渲染出來"; exit 1; fi
echo "✓ 開得起來，首頁有渲染，沒有 JS 錯誤"

echo
echo "=== ② 走完全部結局 ==="
python3 - <<'PYEOF'
import io
body = io.open('theater.html', encoding='utf-8').read()
drv  = io.open('walk_driver.js', encoding='utf-8').read()
io.open('walk.html', 'w', encoding='utf-8').write(body.replace('</body>', drv + '</body>'))
PYEOF
$CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=60000 \
  --dump-dom "file://$PWD/walk.html" 2>/dev/null | python3 -c "
import sys, re
s = sys.stdin.read()
m = re.findall(r'<pre id=\"R\">(.*?)</pre>', s, re.S)
if not m:
    print('✗ 走查沒有跑完'); print(s[s.find('THROW'):s.find('THROW')+400]); raise SystemExit(1)
t = m[-1].strip()
print(t)
if '失敗 0' not in t or 'JS 錯誤 0' not in t: raise SystemExit(1)
"

echo
echo "=== ③ 小鎮：每天一件事 ==="
python3 - <<'PYEOF'
import io
b = io.open('theater.html', encoding='utf-8').read()
d = io.open('town_driver.js', encoding='utf-8').read()
io.open('townwalk.html', 'w', encoding='utf-8').write(b.replace('</body>', d + '</body>'))
PYEOF
$CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=40000 \
  --dump-dom "file://$PWD/townwalk.html" 2>/dev/null | python3 -c "
import sys, re
s = sys.stdin.read()
m = re.findall(r'<pre id=\"R\">(.*?)</pre>', s, re.S)
if not m: print('✗ 沒跑完'); raise SystemExit(1)
t = m[-1].strip(); print(t)
if '失敗 0' not in t or 'JS 錯誤 0' not in t: raise SystemExit(1)
"

echo
echo "=== ④ 有沒有東西撐破畫面 ==="
# headless Chrome 的版面寬度最小只到 500px，所以手機寬度要放進固定寬的 iframe 量
python3 - <<'PYEOF'
import io
src = io.open('theater.html', encoding='utf-8').read()
tail = '</body>\n</html>\n'
body = '''
localStorage.clear();
var e={}; SCENARIOS.forEach(function(sc){ e[sc.id]={};
  Object.keys(sc.endings).forEach(function(k,i){ if(i%2===0) e[sc.id][k]=1; }); });
localStorage.setItem('theater-ends:p1', JSON.stringify(e));
var doc=document.documentElement, res={};
function scan(name){ var bad=[];
  document.querySelectorAll('*').forEach(function(el){
    if(el.getBoundingClientRect().right > doc.clientWidth+0.5)
      bad.push(el.tagName.toLowerCase()+(typeof el.className==='string'&&el.className?'.'+el.className:'')); });
  if(bad.length) res[name]=bad.slice(0,3); }
var sc=SCENARIOS.find(function(s){return s.id==='online';}), f=null;
(function w(k,seen,ch){ if(f) return; if(k==='best'){f=ch;return;}
  if(sc.endings[k]||seen.indexOf(k)>=0) return;
  sc.nodes[k].choices.forEach(function(c,i){ w(c.to,seen.concat([k]),ch.concat([i])); }); })(sc.start,[],[]);
function sweep(pfx){
  view='menu'; render(); scan(pfx+'首頁');
  view='who'; render(); scan(pfx+'換人');
  view='gallery'; render(); scan(pfx+'圖鑑');
  view='town'; render(); scan(pfx+'小鎮');
  document.querySelector('.spot[data-spot="school"]').onclick(); scan(pfx+'小鎮・有人講話');
  townMsg=null;
  startScenario('online'); scan(pfx+'開場白');
  nodeId=sc.start; render(); scan(pfx+'故事中');
  f.forEach(function(i){choose(i);}); scan(pfx+'結局頁');
  fromTown=false;
}
sweep('');
/* 妹妹版的字比較大（.narr 19→22、.choice 17），字一大就可能撐破窄畫面，
   所以兩種角色都要量一次。只量姊姊版等於沒驗到放大的那一套。 */
savePlayers(players().map(function(p){
  return p.id===whoId() ? Object.assign({}, p, {role:'little'}) : p; }));
sweep('妹妹版・');
parent.postMessage(JSON.stringify({w:window.innerWidth,
  over: doc.scrollWidth > doc.clientWidth, pages: res}), '*');
'''
io.open('ovcheck.html','w',encoding='utf-8').write(src[:-len(tail)]+'<script>(function(){\n'+body+'\n})();</script>\n'+tail)
# 平板是主要玩的機器，所以 iPad 直向（768）與橫向（1180）一定要量：
# >=700 跟 >=1000 各有一套版面，900 以下量不到它們
for W in (360, 390, 430, 560, 768, 900, 1180):
    io.open('ovcheck_%d.html' % W, 'w', encoding='utf-8').write(
      '<!DOCTYPE html><meta charset="utf-8"><title>wait</title>'
      '<script>window.addEventListener("message",function(e){document.title="R:"+e.data;});</script>'
      '<iframe src="ovcheck.html" style="width:%dpx;height:1200px;border:0"></iframe>' % W)
PYEOF
OVFAIL=0
for W in 360 390 430 560 768 900 1180; do
  R=$($CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 \
      --allow-file-access-from-files --dump-dom "file://$PWD/ovcheck_$W.html" 2>/dev/null \
      | grep -o '<title>R:[^<]*' | sed 's/<title>R://')
  case "$R" in
    *'"over":false'*'"pages":{}'*) echo "✓ ${W}px 沒有溢出" ;;
    '') echo "✗ ${W}px 量不到（頁面沒跑完）"; OVFAIL=1 ;;
    *) echo "✗ ${W}px $R"; OVFAIL=1 ;;
  esac
done
[ "$OVFAIL" = 0 ] || exit 1

echo
echo "=== ⑤ 會暈的人：動畫關掉之後提示還在嗎 ==="
# 藏東西最後兩分鐘會一閃一閃。那不是裝飾，是找不到時的提示。
# 動畫關掉之後那個字不會變暗，但它就完全不顯眼了，提示等於沒有了，
# 所以要改用一圈靜態的光暈；同時平常那個動畫不能被順手一起關掉。
python3 - <<'PYEOF'
import io
src = io.open('theater.html', encoding='utf-8').read()
tail = '</body>\n</html>\n'
body = '''
localStorage.clear();
todayStamp=function(){return '2026-10-7';}; nowMin=function(){return 9*60+9;};
view='town'; render();
var t = document.querySelector('.twinkle text'), out={};
out.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!t) out.missing = true;
else { out.op = getComputedStyle(t).opacity;
       out.dur = getComputedStyle(t).animationDuration;
       out.glow = getComputedStyle(t.parentNode).filter !== 'none'; }
document.title = 'R:' + JSON.stringify(out);
'''
io.open('rmcheck.html','w',encoding='utf-8').write(src[:-len(tail)]+'<script>(function(){\n'+body+'\n})();</script>\n'+tail)
PYEOF
RM_FAIL=0
R_ON=$($CHROME --headless --disable-gpu --no-sandbox --force-prefers-reduced-motion \
  --virtual-time-budget=6000 --dump-dom "file://$PWD/rmcheck.html" 2>/dev/null \
  | grep -o '<title>R:[^<]*' | sed 's/<title>R://')
R_OFF=$($CHROME --headless --disable-gpu --no-sandbox \
  --virtual-time-budget=6000 --dump-dom "file://$PWD/rmcheck.html" 2>/dev/null \
  | grep -o '<title>R:[^<]*' | sed 's/<title>R://')
case "$R_ON" in
  *'"op":"1"'*'"glow":true'*) echo "✓ 關掉動畫之後，藏的東西還是看得見（改用光暈）" ;;
  *) echo "✗ 關掉動畫之後提示不見了：$R_ON"; RM_FAIL=1 ;;
esac
case "$R_OFF" in
  *'"dur":"1.6s"'*) echo "✓ 平常還是會一閃一閃" ;;
  *) echo "✗ 連平常的閃爍都被關掉了：$R_OFF"; RM_FAIL=1 ;;
esac
[ "$RM_FAIL" = 0 ] || exit 1

echo
echo "=== ⑥ 我的小屋 ==="
# house.html 不是從 src/ 組起來的（整份從 Artifact 搬過來的單檔），
# 所以走查是直接插進那個檔案裡跑
python3 - <<'PYEOF'
import io
b = io.open('house.html', encoding='utf-8').read()
d = io.open('house_driver.js', encoding='utf-8').read()
io.open('housewalk.html', 'w', encoding='utf-8').write(b.replace('</body>', d + '</body>'))
PYEOF
$CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=40000 \
  --dump-dom "file://$PWD/housewalk.html" 2>/dev/null | python3 -c "
import sys, re
s = sys.stdin.read()
m = re.findall(r'<pre id=\"R\">(.*?)</pre>', s, re.S)
if not m: print('✗ 沒跑完'); raise SystemExit(1)
t = m[-1].strip(); print(t)
if '失敗 0' not in t or 'JS 錯誤 0' not in t: raise SystemExit(1)
"

echo
echo "=== ⑥.5 我的小屋：有沒有東西撐破畫面 ==="
# 分頁加了圖示、家具加了新品項，窄畫面最容易爆版。
# headless 的版面寬度最小只到約 500px，所以一樣要放進固定寬的 iframe 量。
python3 - <<'PYEOF'
import io
src = io.open('house.html', encoding='utf-8').read()
tail = '</body>\n</html>\n'
body = '''
localStorage.clear(); G = newGame();
G.pets = PET_SPECIES.slice(0, 6).map(function(sp, i){ return newPet(sp.id, i ? 'kid' : 'adult', sp.name); });
G.activePet = 0; G.pet = G.pets[0]; G.companions = [];
G.rooms = [G.rooms[0], JSON.parse(JSON.stringify(G.rooms[0]))];
G.hairOwned = HAIR_STYLES.map(function(h){ return h.id; });
FURNITURE.forEach(function(f){ G.seen[f.id] = true; });
FISH.forEach(function(f){ G.fish[f.name] = 1; });
saveGame();
var tabs = ['inv','shop','dress','pets','deco','build','earn','book','talk','save'];
var doc = document.documentElement, bad = {};
function scan(name){
  var tb = document.querySelector('.tabbody');
  var pr = tb ? tb.getBoundingClientRect() : null;
  function note(t){ (bad[name] = bad[name] || []); if (bad[name].indexOf(t) < 0) bad[name].push(t); }
  if (tb && tb.scrollWidth > tb.clientWidth + 0.5) note('面板被撐出橫向捲軸');
  document.querySelectorAll('*').forEach(function(el){
    var r = el.getBoundingClientRect();
    if (r.width <= 0) return;
    var t = el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '');
    if (r.right > doc.clientWidth + 0.5) note(t);
    else if (pr && tb.contains(el) && r.right > pr.right + 0.5) note(t);
  });
}
tabs.forEach(function(t){ openTab(t); scan(t); });
Object.keys(bad).forEach(function(k){ bad[k] = bad[k].slice(0, 3); });
parent.postMessage(JSON.stringify({ w: window.innerWidth,
  over: doc.scrollWidth > doc.clientWidth, pages: bad }), '*');
'''
io.open('hovcheck.html','w',encoding='utf-8').write(src[:-len(tail)]+'<script>(function(){\n'+body+'\n})();</script>\n'+tail)
for W in (360, 390, 430, 768, 1180):
    io.open('hovcheck_%d.html' % W, 'w', encoding='utf-8').write(
      '<!DOCTYPE html><meta charset="utf-8"><title>wait</title>'
      '<script>window.addEventListener("message",function(e){document.title="R:"+e.data;});</script>'
      '<iframe src="hovcheck.html" style="width:%dpx;height:1000px;border:0"></iframe>' % W)
PYEOF
HOVFAIL=0
for W in 360 390 430 768 1180; do
  R=$($CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=9000 \
      --allow-file-access-from-files --dump-dom "file://$PWD/hovcheck_$W.html" 2>/dev/null \
      | grep -o '<title>R:[^<]*' | sed 's/<title>R://')
  case "$R" in
    *'"over":false'*'"pages":{}'*) echo "✓ ${W}px 沒有溢出" ;;
    '') echo "✗ ${W}px 量不到（頁面沒跑完）"; HOVFAIL=1 ;;
    *) echo "✗ ${W}px $R"; HOVFAIL=1 ;;
  esac
done
[ "$HOVFAIL" = 0 ] || exit 1

echo
echo "=== ⑦ 首頁的入口按鈕 ==="
# 首頁連到劇場與小屋。連結打錯不會有任何錯誤訊息，
# 要等小孩按下去才會發現，所以這裡直接檢查檔案在不在。
python3 - <<'PYEOF'
import io, os, re, sys
src = io.open('index.html', encoding='utf-8').read()
targets = re.findall(r"location\.href\s*=\s*'\./([^']+)'", src)
if not targets:
    print('✗ 首頁上找不到任何入口按鈕'); sys.exit(1)
bad = [t for t in targets if not os.path.exists(t)]
for t in targets:
    print(('✓ ' if t not in bad else '✗ ') + t + (' 檔案不存在' if t in bad else ''))
for want in ('theater.html', 'house.html'):
    if want not in targets:
        print('✗ 首頁沒有連到 ' + want); bad.append(want)
sys.exit(1 if bad else 0)
PYEOF

echo
echo "=== ⑧ 全面掃描（她真實的舊備份、完整還原、亂按、模擬玩三小時） ==="
# 這一關專門找「上面幾關沒想到的」。第一次跑就抓到一個真的 bug：
# 新開的存檔沒有補償旗標，第二次打開會被補回 10 萬（每開一間白送一次錢）。
python3 -c "
import io
b = io.open('house.html', encoding='utf-8').read()
d = io.open('sweep_driver.js', encoding='utf-8').read()
io.open('sweepwalk.html', 'w', encoding='utf-8').write(b.replace('</body>', d + '</body>'))
"
timeout 150 $CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=40000 \
  --dump-dom "file://$PWD/sweepwalk.html" 2>/dev/null > sweep_out.txt
python3 - sweep_out.txt <<'SWEEPPY'
import io, re, sys
s = io.open(sys.argv[1], encoding='utf-8').read()
m = re.findall(r'<pre id="R">(.*?)</pre>', s, re.S)
if not m:
    print('✗ 沒跑完（可能卡住了）'); raise SystemExit(1)
t = m[-1].strip(); print(t)
if '失敗 0' not in t or 'JS 錯誤 0' not in t: raise SystemExit(1)
SWEEPPY
rm -f sweep_out.txt sweepwalk.html

echo
echo "✅ 全部通過"
