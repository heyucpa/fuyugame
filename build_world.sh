#!/bin/sh
# 平安的一天：跟情境劇場共用劇本與插圖，只有 head 與 app 是自己的。
# 順序跟 build.sh 一樣：art_scenes_h 要在 intro 之前，art_scenes_b 一定要最後。
set -e
cd "$(dirname "$0")"

cat src/world_head.html \
    src/scenarios.js \
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
    src/art_scenes_b.js \
    src/world_app.js > world.html
printf '</script>\n</body>\n</html>\n' >> world.html

BUILD="$(date +%Y.%m.%d)-$(cat src/scenarios.js src/world_app.js src/world_head.html | md5sum | cut -c1-6)"
sed -i "s/__BUILD__/$BUILD/" world.html
echo "平安的一天 版本 $BUILD"
