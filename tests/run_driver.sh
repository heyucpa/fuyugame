#!/bin/sh
cd "$(dirname "$0")/.."
CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome
python3 - <<'PY'
import io
b=io.open('house.html',encoding='utf-8').read(); d=io.open('house_driver.js',encoding='utf-8').read()
io.open('housewalk.html','w',encoding='utf-8').write(b.replace('</body>', d+'</body>'))
PY
$CHROME --headless --disable-gpu --no-sandbox --virtual-time-budget=40000 \
  --dump-dom "file://$PWD/housewalk.html" 2>/dev/null | python3 -c "
import sys,re
m=re.findall(r'<pre id=\"R\">(.*?)</pre>', sys.stdin.read(), re.S)
print(m[-1].strip() if m else 'NO-RESULT')
"
