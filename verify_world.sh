#!/bin/sh
# 平安的一天的驗證。跟 verify.sh 同一套精神：
# 每次都從剛建好的 world.html 重組測試檔，不吃舊快照。
set -e
cd "$(dirname "$0")"
CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome

./build_world.sh

echo
echo "=== ⓪ 情境劇場有沒有被動到（不該被動到）==="
if ! git diff --quiet -- theater.html src/theater_head.html src/theater_app.js; then
  echo "✗ theater 那邊被改到了"; git diff --stat -- theater.html src/theater_head.html src/theater_app.js; exit 1
fi
echo "✓ theater.html 與它的原始檔都沒有變動"

echo
echo "=== ① 單純打開有沒有 JS 錯誤 ==="
ERR=$($CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 \
      --enable-logging=stderr --log-level=0 --dump-dom "file://$PWD/world.html" 2>&1 >/dev/null \
      | grep -i "uncaught\|SyntaxError\|ReferenceError\|TypeError" || true)
if [ -n "$ERR" ]; then echo "✗ $ERR"; exit 1; fi
echo "✓ 開得起來，沒有 JS 錯誤"

echo
echo "=== ② 自動過 120 天 ==="
python3 - <<'PYEOF'
import io
b = io.open('world.html', encoding='utf-8').read()
d = io.open('world_driver.js', encoding='utf-8').read()
io.open('worldwalk.html', 'w', encoding='utf-8').write(b.replace('</body>', d + '</body>'))
PYEOF
$CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=90000 \
  --dump-dom "file://$PWD/worldwalk.html" 2>/dev/null | python3 -c "
import sys, re
s = sys.stdin.read()
m = re.findall(r'<pre id=\"R\">(.*?)</pre>', s, re.S)
if not m: print('✗ 沒跑完'); raise SystemExit(1)
t = m[-1].strip(); print(t)
if '失敗 0' not in t or 'JS 錯誤 0' not in t or '21 篇都遇到過 是' not in t: raise SystemExit(1)
"

echo
echo "=== ③ 有沒有東西撐破畫面 ==="
python3 - <<'PYEOF'
import io
src = io.open('world.html', encoding='utf-8').read()
tail = '</body>\n</html>\n'
body = '''
localStorage.clear();
var doc=document.documentElement, res={};
function scan(name){ var bad=[];
  document.querySelectorAll('*').forEach(function(el){
    if(el.getBoundingClientRect().right > doc.clientWidth+0.5)
      bad.push(el.tagName.toLowerCase()+(typeof el.className==='string'&&el.className?'.'+el.className:'')); });
  if(bad.length) res[name]=bad.slice(0,3); }
view='title'; render(); scan('封面');
newDay();
day[0]={stop:STOPS[0], calm:null, scenarioId:'breakfast', result:null};
at=0; view='route'; render(); scan('路線圖');
day[1].calm='測試'; day[1].scenarioId=null; at=1; render(); scan('平順路段');
at=0; cur=byId('breakfast'); nodeId=null; view='story'; render(); scan('開場白');
nodeId=cur.start; render(); scan('故事中');
var k=Object.keys(cur.endings)[0]; ending=cur.endings[k]; endingKey=k; view='end'; render(); scan('結局頁');
day.forEach(function(d){ if(!d.calm) d.result={scenarioId:'breakfast',title:'測試',grade:'best'}; });
at=4; view='tally'; render(); scan('結算頁');
parent.postMessage(JSON.stringify({w:window.innerWidth, over: doc.scrollWidth>doc.clientWidth, pages:res}),'*');
'''
io.open('wov.html','w',encoding='utf-8').write(src[:-len(tail)]+'<script>(function(){\n'+body+'\n})();</script>\n'+tail)
for W in (360, 390, 430, 560, 900, 1200):
    io.open('wov_%d.html' % W, 'w', encoding='utf-8').write(
      '<!DOCTYPE html><meta charset="utf-8"><title>wait</title>'
      '<script>window.addEventListener("message",function(e){document.title="R:"+e.data;});</script>'
      '<iframe src="wov.html" style="width:%dpx;height:1100px;border:0"></iframe>' % W)
PYEOF
OVFAIL=0
for W in 360 390 430 560 900 1200; do
  R=$($CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 \
      --allow-file-access-from-files --dump-dom "file://$PWD/wov_$W.html" 2>/dev/null \
      | grep -o '<title>R:[^<]*' | sed 's/<title>R://')
  case "$R" in
    *'"over":false'*'"pages":{}'*) echo "✓ ${W}px 沒有溢出" ;;
    *) echo "✗ ${W}px $R"; OVFAIL=1 ;;
  esac
done
[ "$OVFAIL" = 0 ] || exit 1

echo
echo "✅ 全部通過"
