#!/bin/sh
# 從 src/ 串出 theater.html。
# 順序有講究：
#   - art_scenes_h.js 要在 intro 之前（intro 用到裡面的 BOY）
#   - art_scenes_b.js 一定要最後，因為 sceneFor() 定義在裡面
set -e
cd "$(dirname "$0")"

cat src/theater_head.html \
    src/scenarios.js \
    src/moments.js \
    src/theater_art.js \
    src/art_lib.js \
    src/art_scenes_a.js \
    src/art_scenes_c.js \
    src/art_scenes_d.js \
    src/art_scenes_e.js \
    src/art_scenes_f.js \
    src/art_scenes_g.js \
    src/art_scenes_h.js \
    src/art_scenes_i.js \
    src/art_scenes_intro.js \
    src/art_town.js \
    src/art_scenes_sis.js \
    src/art_scenes_pd.js \
    src/art_scenes_park.js \
    src/art_scenes_b.js \
    src/theater_app.js > theater.html
printf '</script>\n</body>\n</html>\n' >> theater.html

BUILD="$(date +%Y.%m.%d)-$(cat src/scenarios.js src/moments.js src/theater_app.js src/theater_head.html | md5sum | cut -c1-6)"
sed -i "s/__BUILD__/$BUILD/" theater.html
echo "版本 $BUILD"
