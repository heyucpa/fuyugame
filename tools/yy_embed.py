#!/usr/bin/env python3
"""把「圓圓的新家大採購」接進小屋（家長每次換新版的 yuanyuan_shopping*.html 之後跑一次）。

用法：python3 tools/yy_embed.py yuanyuan_shopping.html yuanyuan_shopping_g1.html
做的事（玩法完全不動）：
  ・?embed=1 打開時：背景透明、寵物名字換掉「圓圓」、每個存檔格分開記家具（slot）
  ・玩完 postMessage 告訴小屋幾顆星（yuanyuan-done），點畫面告訴小屋有在玩（yuanyuan-tap）
  ・單獨打開照舊：叫圓圓、用原本的 localStorage key
已經接過的檔案會跳過。找不到要改的地方會停下來說是哪一個。
"""
import re, sys

def patch(path):
    s = open(path, encoding='utf-8').read()
    if 'yuanyuan-done' in s:
        print(f'{path}: 已經接過了，跳過'); return
    m = re.search(r"localStorage\.getItem\('(yuanyuan\w*_)'\+k\)", s)
    if not m: sys.exit(f'{path}: 找不到存檔的 key')
    pre = m.group(1)
    def rep(a, b):
        nonlocal s
        if s.count(a) != 1: sys.exit(f'{path}: 找不到（或不只一個）：{a[:60]}')
        s = s.replace(a, b)
    rep('#mute.off{', 'html.embed body{padding:0;background:transparent}html.embed #app{width:100%;border:none;border-radius:0}\n#mute.off{')
    rep("  var pick=function(a){return a[rnd(a.length)]};\n", "  var pick=function(a){return a[rnd(a.length)]};\n"
        "  // ---- 放在「我的小屋」裡玩（?embed=1）：寵物名字跟著小屋、每個存檔分開記、玩完把星星告訴小屋；單獨打開照舊 ----\n"
        "  var QS={};try{location.search.slice(1).split('&').forEach(function(kv){var p=kv.split('=');if(p[0])QS[decodeURIComponent(p[0])]=decodeURIComponent(p[1]||'')})}catch(e){}\n"
        "  var EMBED=QS.embed==='1'&&window.parent&&window.parent!==window;\n"
        "  var PET=String(QS.pet||'').replace(/[<>&\"]/g,'').slice(0,8)||'圓圓';\n"
        f"  var NS=QS.slot?('{pre}'+String(QS.slot).replace(/[^a-z0-9]/gi,'').slice(0,12)+'_'):'{pre}';\n"
        "  function nm(t){return PET==='圓圓'?t:String(t).replace(/圓圓/g,PET)}\n"
        "  function tell(o){if(EMBED)try{window.parent.postMessage(o,'*')}catch(e){}}\n"
        "  if(EMBED)document.documentElement.className='embed';\n"
        "  document.addEventListener('pointerdown',function(){tell({type:'yuanyuan-tap'})},true);\n")
    rep(f"localStorage.getItem('{pre}'+k)", "localStorage.getItem(NS+k)")
    rep(f"localStorage.setItem('{pre}'+k,v)", "localStorage.setItem(NS+k,v)")
    rep("function say(t){$('say').textContent=t}", "function say(t){$('say').textContent=nm(t)}")
    for key in ('story', 'endsay', 'endstory'):
        mm = re.findall(r"\$\('" + key + r"'\)\.textContent=(pick\((?:[^()]|\([^()]*\))*\)(?:\.replace\('\{f\}',furn\[round\]\[1\]\))?);", s)
        if len(mm) != 1: sys.exit(f'{path}: 找不到 {key}')
        s = s.replace(f"$('{key}').textContent={mm[0]};", f"$('{key}').textContent=nm({mm[0]});")
    rep("SFX.end(st);", "SFX.end(st);tell({type:'yuanyuan-done',stars:st,wrong:wrong,combo:maxCombo});   // 告訴小屋：玩完了、幾顆星\n    ")
    rep("\n  reset();\n})();", "\n  if(PET!=='圓圓'){var tt=document.querySelector('.top>span');if(tt&&tt.firstChild&&tt.firstChild.nodeType===3)tt.firstChild.nodeValue='🏡 '+PET+'的新家';document.title=document.title.replace(/圓圓/g,PET)}\n  reset();\n})();")
    open(path, 'w', encoding='utf-8').write(s)
    print(f'{path}: 接好了（存檔 key：{pre}）')

for f in sys.argv[1:]: patch(f)
