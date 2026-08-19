---
name: fuyugame-dev
description: 開發「帆帆安安大冒險」(fuyugame) 這個給小孩玩的網頁遊戲專案時必須使用。涵蓋 index.html（姊妹大冒險桌遊）、theater.html（情境劇場）、map.html（分支圖）、kids.html（妹妹版）四個獨立單檔 HTML 遊戲。內含這個 repo 特有的陷阱與工具：repo 裡沒有它自己的工具鏈（art_lib.js、theater_art.js、verify.sh、build.sh 都從未提交，HTML 是產出物）、theater.html 與 map.html 各存一份必須完全同步的 SCENARIOS 劇本資料、附帶兩支已用真實歷史 bug 驗證過的檢查腳本（誤刪函式導致整頁打不開、選項指向不存在的節點導致玩家卡住、結局標題撞名）、劇本規模不變量 20 劇本/147 節點/363 選項/101 結局、localStorage 進度 key 不可改名、PWA 版本號快取機制、以及「錯誤選擇不能給正向回饋」等兒童內容原則。只要是要修改、新增、除錯、重構這四個 HTML 檔中的任何一個，或是要加新劇情、新關卡、新角色、新成就、新結局，都必須先讀本 skill。即使用戶只說「幫我改一下情境劇場」、「加一個新故事」、「這個選項怪怪的」、「妹妹版加個東西」、「分支圖怪怪的」，也應主動啟用。
---

# fuyugame 開發規範

這是一個爸爸做給兩個女兒玩的網頁遊戲。**玩家是小孩，而且是在你看不到的裝置上玩**——她的瀏覽器裡存著她累積的進度和成就。這一點決定了下面所有規則：改壞了不只是 bug，是她的東西不見了，或是她打開來一片白。

## 最重要的一件事：repo 裡沒有它自己的工具鏈

commit 訊息和程式註解裡提到四個開發用檔案，**全部從未進入 repo**（`git log --all -- <檔名>` 都是空的）：

| 檔案 | 在哪被提到 | 它原本做什麼 |
|---|---|---|
| `art_lib.js`、`theater_art.js` | commit `14050d7` 訊息：「共用姊姊版的零件庫」 | 插圖零件庫，SVG 從這裡產生後內嵌進 HTML |
| `verify.sh` | commit `d0ed3c6`、`14050d7` 訊息：「verify.sh 全過：101 條結局 0 失敗 0 錯誤」 | 走查所有結局的驗證腳本 |
| `build.sh` | `theater.html` 程式註解：「版本號由 build.sh 在打包時填進」 | 填版本號、打包 |

意思是：**committed 的 HTML 是產出物，產生它的東西只存在作者本機。** 從乾淨 clone 出發（包含每一個新的 Claude session）看到的是沒有工具鏈的成品。

所以：

- 不要假設可以重新產生插圖或跑 `verify.sh`——它們不在。
- 直接編輯 HTML 就是這個環境下唯一的做法，不要去找「原始檔」。
- 本 skill 附的 `scripts/` 是在補這個缺口（見「工作流程」），不是要取代作者本機的工具。如果用戶手上其實有那些檔案，以他的為準。

## 專案結構

四個**彼此獨立**的單檔 HTML，執行期沒有共用檔案、沒有 build 步驟、沒有 package.json、沒有測試框架。每個檔案自己帶完整的 CSS + JS + 內嵌 SVG。

| 檔案 | 標題 | 規模 | 內容 | localStorage 前綴 |
|---|---|---|---|---|
| `index.html` | 姊妹大冒險 🏰 | ~3,600 行 | 多人桌遊：擲骰、角色能力、注音/安全問答、成就系統 | `mb-` |
| `theater.html` | 情境劇場 🎭 | ~4,000 行 | 分支劇情：情境選擇題，練習判斷（防詐、人身安全） | `theater-` |
| `map.html` | 情境劇場 分支圖 🗺️ | ~2,000 行 | 把 theater.html 的劇本畫成分支圖，給大人看的檢視工具 | 無 |
| `kids.html` | 小小冒險 🌈 | ~730 行 | 妹妹版原型，**前提是「不認得字也能玩」** | 無 |

檔案之間沒有 `<a href>` 互連——每個都是各自打開的獨立頁面。

### 劇本資料的規模不變量

`theater.html` 的 `SCENARIOS` 目前是：

| 劇本 | 決策節點 | 選項 | 結局 |
|---|---|---|---|
| 20 | 147 | 363 | 101 |

這個 repo 的 commit 習慣會在訊息裡記這些數字（例：「決策點 147（不變）、選項 362 → 363、結局 101（不變）」）。改劇情後跑 `scripts/scenario_check.js` 會印出當下的數字，直接拿去寫 commit 訊息。

劇本的資料結構：

```js
{ id, emoji, title, tag, intro, talk,
  start: 'n1',                                   // 起始節點的 key
  nodes:   { <key>: { text, hint, choices: [ { label, to } ] } },
  endings: { <key>: { grade, title, emoji, text, lesson } } }
```

`choices[].to` 指向**同一個劇本內**的 node key 或 ending key。`grade` 只有四種：`good`、`best`、`escape`、`bad`。

## 改動前必讀的三個陷阱

### 陷阱 1：SCENARIOS 劇本資料存了兩份，必須完全同步

`theater.html` 和 `map.html` **各自帶一份 `const SCENARIOS`，內容位元組完全相同（目前 74,079 字元、20 個節點）**。

- `theater.html` 約第 321 行
- `map.html` 約第 65 行

改劇情、加故事、修錯字——**只改一邊，分支圖就會跟實際劇情不一致**，而分支圖正是你檢查劇情有沒有漏洞的工具，它一旦失真，你就失去了唯一的檢查手段。

改完務必兩邊同步。`scripts/check.py` 會逐位元組比對這件事。

> 為什麼不抽成共用的 `.js` 檔？這四個檔案是**嚴格自包含**的：所有圖示、manifest 都內嵌成 `data:` URI，全專案零 `fetch`／零 `XMLHttpRequest`、零外部資源。抽出共用檔會破壞這個性質（也會讓 `file://` 直接開啟踩到 CORS）。所以資料重複是這個架構的代價，不是疏忽——同步的責任只能落在流程上，這也是檢查腳本存在的理由。

### 陷阱 2：誤刪函式會讓整頁一片白，而且靜態看不出來

這個 repo 真的發生過：commit `55e9d61` 大改 theater.html 時誤刪了 `loadProgress`、`loadPredict`、`recordResult`、`recordPredict`、`predictOutcome` 五個函式，但呼叫的地方還在。下一個 commit 的標題就是「修好上一版打不開的問題」。

單檔 4,000 行、沒有 linter、沒有模組邊界，做大範圍搬移或刪除時特別容易發生。**每次改完都要跑檢查腳本**（下面「工作流程」）。

### 陷阱 3：版本號是手動維護的，忘了改小孩就吃到舊快取

`theater.html` 和 `kids.html` 有版本號：

```html
<meta name="build" content="2026.08.18-b07382" />
```

`theater.html` 讀它顯示在首頁，並提供「點一下檢查更新」，做法是 `location.href = location.pathname + '?v=' + 時間戳` 來破快取。

**注意：程式裡的註解說版本號「由 build.sh 在打包時填進」，但 `build.sh` 從來沒有進到這個 repo**（`git log --all -- build.sh` 是空的）。也就是說沒有自動化，版本號是手改的。改了頁面內容就要一起改版本號，否則她的瀏覽器會拿舊的，你以為修好了但她那邊沒變。

這件事在這裡比一般網站更嚴重：`index.html` 和 `theater.html` 都內嵌了 PWA manifest（`display: standalone`），小孩可能是把它**加到主畫面當 app 在開**。裝到桌面的 PWA 快取比一般分頁更黏，沒有版本號變動就更不容易更新。

格式沿用 `YYYY.MM.DD-<6位隨機碼>`。

`index.html` 和 `map.html` 目前沒有版本號機制——這是已知缺口，不是要你順手補上，但如果用戶抱怨「改了沒反應」，這是第一個要懷疑的地方。

## localStorage：不要改 key 的名字

小孩的進度、成就、設定全在她自己的瀏覽器裡，**沒有備份、沒有伺服器**。改掉 key 名稱等於把她的東西清掉，而且無法復原。

目前在用的 key：

```
index.html   mb-savegame  mb-achv  mb-stats  mb-lineup  mb-ability-choice
             mb-muted  mb-bgm  mb-bgm-track  mb-speed  mb-theme
theater.html theater-players  theater-who  theater-muted  theater-bgm  theater-track
             theater-progress:<角色>   theater-seen:<角色>
```

要調整存檔結構時，用「舊 key 照樣讀得進來」的方式往前相容，不要換名字。讀取端都已經包在 `try/catch` 裡回傳預設值，維持這個習慣——存檔格式變動時，寧可讓她從預設值開始，也不要讓整頁因為 JSON parse 失敗而打不開。

## 內容原則（從實際修過的問題累積下來的）

這些不是風格偏好，是這個專案踩過的坑：

**錯誤的選擇不能給正向回饋。** commit `d3d0966` 的標題是「情境劇場：被騙的結局不要再恭喜她」——原本被詐騙的結局畫面沿用了通用的過關樣式，等於在獎勵錯誤判斷。這款遊戲的目的就是練習判斷，這種錯誤會直接抵銷掉整個設計意圖。加新結局時，先確認結局的**情緒基調**跟它代表的判斷結果一致。

**這是公開 repo，不要放真名或可識別資訊。** commit `d0ed3c6`「去識別化網頁標題」就是在處理這件事。加新內容時不要寫入孩子的真實姓名、學校、地址、生日。角色用暱稱。

**kids.html 的前提是「不認得字也能玩」。** 妹妹還沒識字。任何加進去的東西如果需要閱讀才能操作，就違背了這個檔案存在的理由。用圖示、顏色、聲音、位置來傳達，不要用文字說明。

**進度標記的語意動過好幾次，改之前先確認現行意圖。** 相關 commit：`5478a27`（整條路都走完，入口才變灰）、`7f0693e`（選過的選項分「這次」與「以前」兩種記號）、`55e9d61`（灰色改成只記這一輪）。這一塊反覆調整過，說明它的體感很微妙——不要憑直覺改，先看現在的程式碼在做什麼。

## 工作流程

### 1. 確認要改哪一檔

四個檔案獨立，但劇情相關的改動會同時牽動 `theater.html` 和 `map.html`（陷阱 1）。

### 2. 改動

檔案很大，用精準的字串比對做局部編輯，不要整檔重寫——整檔重寫是誤刪函式的主要來源。

搬移或刪除大段程式碼時，先確認被搬走的東西還有誰在呼叫。

### 3. 跑靜態檢查（必做）

```bash
python3 .claude/skills/fuyugame-dev/scripts/check.py
```

核心檢查是純 Python 標準庫，不需要安裝任何東西。它檢查五件事：

1. **呼叫了不存在的函式**——陷阱 2 的那類 bug
2. **theater.html 與 map.html 的 SCENARIOS 是否同步**——陷阱 1
3. **括號 / 引號結構是否平衡**
4. **劇本圖走查**——會自動呼叫 `scenario_check.js`（需要 node，沒有就跳過並提示）
5. **改了內容卻沒更新版本號**——陷阱 3（用 git 比對 HEAD）

也可以只檢查單一檔案：`python3 .claude/skills/fuyugame-dev/scripts/check.py theater.html`

劇本圖走查也能單獨跑，它同時會印出規模數字給你寫 commit 訊息：

```bash
node .claude/skills/fuyugame-dev/scripts/scenario_check.js
```

它檢查的是 `check.py` 抓不到、但玩家一按就會遇到的問題：

- `choices[].to` 指向不存在的節點 → **玩家按下去卡住**
- 從 `start` 走不到的孤兒節點 / 結局 → **玩家永遠看不到**
- 同劇本內兩個結局標題撞名 → 玩家分不出差別
- `grade` 不在 `good/best/escape/bad` 之內

**兩支腳本都用這個 repo 的真實歷史 bug 驗證過：**

| 腳本 | 對現行四檔 | 對歷史壞版本 |
|---|---|---|
| `check.py` | 零誤報 | `55e9d61` 五個被誤刪的函式全部抓到 |
| `scenario_check.js` | 通過，數字 20/147/363/101 對上 commit 訊息 | `d0ed3c6^` 的「一毛都沒損失」結局撞名抓到 |

如果它們報錯，**先修掉再往下走**，不要當成雜訊略過。

### 4. 在瀏覽器實際玩一輪（必做）

靜態檢查抓不到「畫面排版壞掉」、「按了沒反應」、「玩到一半卡住」。這些只有真的打開才會發現，而且這類問題對小孩來說跟整頁白掉一樣是不能玩。

用 `/run` skill，或直接開檔案。至少確認：
- 首頁能正常顯示
- 你改動的那條路徑能實際走完
- 瀏覽器 console 沒有紅字

改到存檔 / 進度相關的程式碼時，額外確認：**帶著舊的 localStorage 資料打開也不會壞**（不要只測乾淨狀態，小孩的瀏覽器裡有舊資料）。

### 5. Commit

沿用現有的訊息風格：中文、功能區塊前綴加冒號、描述**使用者看得到的變化**而不是技術細節。

```
情境劇場：選項的灰色改成只記這一輪
情境劇場：整條路都走完，入口才變灰
新增妹妹版原型 kids.html：不認得字也能玩
去識別化網頁標題，並修掉兩個內容問題
修好上一版打不開的問題：誤刪了 loadProgress 等函式
```

不要寫 `fix: ...` 或 `feat(theater): ...` 這類英文 conventional commit——跟這個 repo 的既有風格不一致。
