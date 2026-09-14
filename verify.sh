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
localStorage.clear(); localStorage.setItem('theater-guess:p1','off');
var e={}; SCENARIOS.forEach(function(sc){ e[sc.id]={};
  Object.keys(sc.endings).forEach(function(k,i){ if(i%2===0) e[sc.id][k]=1; }); });
localStorage.setItem('theater-ends:p1', JSON.stringify(e));
var doc=document.documentElement, res={};
function scan(name){ var bad=[];
  document.querySelectorAll('*').forEach(function(el){
    if(el.getBoundingClientRect().right > doc.clientWidth+0.5)
      bad.push(el.tagName.toLowerCase()+(typeof el.className==='string'&&el.className?'.'+el.className:'')); });
  if(bad.length) res[name]=bad.slice(0,3); }
view='menu'; render(); scan('首頁');
view='who'; render(); scan('換人');
view='gallery'; render(); scan('圖鑑');
view='check'; render(); scan('判斷紀錄');
view='town'; render(); scan('小鎮');
document.querySelector('.spot[data-spot="school"]').onclick(); scan('小鎮・有人講話');
townMsg=null;
var sc=SCENARIOS.find(function(s){return s.id==='online';}), f=null;
(function w(k,seen,ch){ if(f) return; if(k==='best'){f=ch;return;}
  if(sc.endings[k]||seen.indexOf(k)>=0) return;
  sc.nodes[k].choices.forEach(function(c,i){ w(c.to,seen.concat([k]),ch.concat([i])); }); })(sc.start,[],[]);
startScenario('online'); scan('開場白');
nodeId=sc.start; render(); scan('故事中');
f.forEach(function(i){choose(i);}); scan('結局頁');
parent.postMessage(JSON.stringify({w:window.innerWidth,
  over: doc.scrollWidth > doc.clientWidth, pages: res}), '*');
'''
io.open('ovcheck.html','w',encoding='utf-8').write(src[:-len(tail)]+'<script>(function(){\n'+body+'\n})();</script>\n'+tail)
for W in (360, 390, 430, 560, 900):
    io.open('ovcheck_%d.html' % W, 'w', encoding='utf-8').write(
      '<!DOCTYPE html><meta charset="utf-8"><title>wait</title>'
      '<script>window.addEventListener("message",function(e){document.title="R:"+e.data;});</script>'
      '<iframe src="ovcheck.html" style="width:%dpx;height:1000px;border:0"></iframe>' % W)
PYEOF
OVFAIL=0
for W in 360 390 430 560 900; do
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
echo "✅ 全部通過"
