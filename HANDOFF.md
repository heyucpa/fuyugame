# 交接：我的小屋（fuyugame）——要設計新小遊戲的人先看這份

> 給另一個對話（或另一個人）接手用。最新的程式永遠在 GitHub `heyucpa/fuyugame` 的 `main` 分支，
> 推上去 GitHub Pages 就會更新（沒有建置步驟）。

## 1. 這是什麼、給誰玩
- 單一檔案的網頁遊戲 `house.html`（約 2 萬行、十幾個 `<script>`，純 JavaScript，沒有任何外部套件、外部圖檔；圖是用程式畫的、音樂音效是合成的）。
- **妹妹（六歲）**：還不識字，用 **Windows 10 電腦**（LG 超寬螢幕）+ 滑鼠。需要大圖示、語音念出來、不要有失敗的壓力。
- **姊姊（小四）**：用 **iPad**，玩的是「加到主畫面的小屋 App」（跟 Safari 的存檔是分開的）。
- 兩個人各自一個存檔、各自一台機器，互相用「邀請卡」連結（Email）拜訪對方的家。
- 溝通用繁體中文（台灣用語）。家長會在對話裡直接提需求、貼照片。

## 2. 最重要的規矩（踩過的坑）
1. **原本的遊玩進度不能受影響**。存檔在 localStorage（`myHouseGame_v1:p1` 之類）。新功能盡量不加存檔欄位；要加就一定要在 `normalizeSave` 裡驗證型態、壞掉就用預設，而且**不能讓舊存檔讀不出來**。
2. **多個 `<script>` 的執行順序**：`let G = loadGame()` 在比較前面的 script 就會跑，所以 `loadGame / normalizeSave / newGame` 會用到的東西必須是「`function` 宣告」，不能是後面才出現的 `const` / `let`（會整頁打不開，這個出過事）。放在後面 script 的函式，從前面的程式呼叫時要用 `typeof xxx === 'function'` 檢查。
3. **Windows 10 顯示不出新的表情符號**：不要用 U+1FA70～U+1FAFF（例如 🪓 🫙 🪿）。測試會擋。
4. **一個小遊戲玩到一半離開，不能還給錢**（計時器要在 `gameCleanup` 取消、或在結算前檢查 `ended`）。
5. **看不懂字的妹妹**：重要的資訊要有大圖示＋語音；按鈕要大；點錯不要扣分、不要出現「失敗」。
6. 不要 `force push`、不要動別人的存檔；刪東西、重新開始、還原備份都有確認／家長密碼流程，新功能不要繞過。

## 3. 怎麼寫一個小遊戲（照著現有的抄）
位置：`house.html` 裡搜尋 `openEnglishGame`（英文單字）、`openLetterGame`（字母找找看）、`openMemoryGame`（翻牌配對）。

共用的函式：
| 函式 | 用途 |
|---|---|
| `openGameWindow(title, howTo)` | 開遊戲視窗，回傳 `w = { card, stage, status, btns }`；`w.stage` 放遊戲畫面、`w.status` 一行狀態、`w.btns` 底下按鈕 |
| `pickLevelRow(w, levels, subFn, playFn)` | 三種難度的選單（⭐ 星星）。`levels` 裡的 `mul` 是獎金倍率 |
| `gameCanvas(stage, w, h)` | 做一個跟著螢幕解析度的畫布，回傳 `{ c, g, pos }`（`pos(e)` 把滑鼠／手指換成畫布座標） |
| `payReward(w, bells, extra)` | **結算獎金一定要走這個**：會加錢、記「玩過小遊戲」（每日三件事）、樹長一顆果子、**每天第一場自動雙倍**。要用它回傳的數字顯示給玩家 |
| `gameButtons(w, again)` | 結算後的「再玩一次／回家」按鈕 |
| `leaveButton(w)` | 玩的時候的「不想玩了，回家」（離開不給錢） |
| `gameCleanup` | 全域變數，放一個函式：視窗被關掉時會呼叫。**取消計時器、移除事件監聽、`Sound.duck(false)`、`stopSpeak()`** |
| `Sound.play('perfect'/'miss'/'coin'/'click'/'fanfare'/'boing'/…)` | 音效 |
| `Sound.duck(true/false)` | 背景音樂暫時靜音（要聽語音的遊戲用；不改玩家設定） |
| `speak(text)`（中文）、`enSpeak(word)`（英文）、`canSpeak()`、`stopSpeak()` | 語音。沒有語音的機器要有備案 |
| `fufuSay(text, ms)`、`toast(msg)`、`fufuBurst('🎉')` | 小可愛說話、提示、飄出表情 |
| `el(tag, class, text)`、`note(text)`、`$('#id')` | 小工具 |

新增一個小遊戲的步驟：
1. 寫 `openXxxGame()`（照上面的函式）。
2. 在「賺錢」分頁的小遊戲清單（搜尋 `['🔤', '英文單字', openEnglishGame]`）加一行。
3. 加 CSS（搜尋 `.en-weeks` 附近）。
4. 在 `tests/` 加一個測試（參考 `tests/english.js`、`tests/letters.js`）；`house_driver.js` 裡有個測試檢查小遊戲清單數量（搜尋「小遊戲清單有」），清單多一個就要把數字加一。
5. 如果要記進度（像「字母找找看」練過幾次）：存檔欄位放在 `G.xxx`，並在 `normalizeSave` 加驗證（搜尋 `out.abc`）。

## 4. 測試與驗證（做完一定要跑）
環境：Playwright + 內建 Chromium（路徑 `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`），執行前 `export NODE_PATH=$(npm root -g)`。
- `sh tests/run_driver.sh`：跑 `house_driver.js`（上百項功能檢查）。**現在有 8 項是「預期值過時」的舊失敗**（跑步名次、圖鑑項目數、公告圖示、漫畫格子、備份欄位、休息密碼…），不是壞掉；**不要新增失敗**（現在是「失敗 8、JS 錯誤 0」）。
- `node tests/<名字>.js`：單項測試（說明見 `tests/README.md`）。常跑的：`compat.js`（舊版存檔相容）、`roundtrip.js`、`fuzz.js`（亂按）、`layout.js`（各種螢幕）、`inv_safe.js` / `inv_fuzz.js`（邀請卡不影響對方進度）。
- 習慣：**做完一個功能 → 寫測試 → 把關鍵的限制拿掉看測試會不會抓到（突變檢查）→ 跑整套 → 截圖看畫面 → 才 commit／push**。
- 截圖：用 Playwright 開 `file:///home/user/fuyugame/house.html`，第一次開會有開場動畫，先按「跳過」；教學小手用 `G.guide='done'` 關掉。注意截圖檔不要存在 repo 根目錄。

## 5. Git
- 直接在 `main` 開發、`git push -u origin main`（失敗就等 2/4/8 秒重試）。**不要開 PR**（除非家長要求）。
- commit 訊息用中文，描述做了什麼；最後加：
  `Co-Authored-By: Claude …` 和 `Claude-Session: …` 兩行（照當下對話的指示）。
- 推上去之前先 `git pull -q origin main`（另一個對話可能也推過）。兩個對話同時改 `house.html` 容易衝突：**小遊戲盡量集中在一個新的區塊，不要到處改**。

## 6. 現在遊戲裡有的東西（簡述）
家（房間、家具、壁紙地板、一鍵佈置）、寵物（蛋、孵化、成長、圖鑑）、小可愛成長、出門（**小島地圖**，走進房子才進去；舊的清單在「快速出門」）、學校／公園／圖書館／遊樂園／親戚家、萬聖節活動（派對、南瓜燈找小幽靈、糖果收集，到 11/1）、零用錢（每週）、邀請卡（Email／複製連結）、備份（預設存本機）、約 16 個小遊戲（含英文單字 Week 2~6、字母找找看 b d p q）。

## 7. 還沒做／家長明確說不要
- 不要做：家長週報、姊妹互送寵物蛋、三款遊戲串接。
- 排定：11/20 聖誕節活動、2027/1/10 新年活動（日期到再做，不要提早）。
- 可能的下一步：小島第二階段（池塘釣魚、日夜變化）、英文單字下一週（k、l 開頭，家長會拍白板照片）、「字母找找看」穩了之後加 a 和 bat／dog／pig 之類的單字。

## 8. 給新對話的開場白（複製貼上）
> 我要在這個專案設計新的小遊戲。請先讀 repo `heyucpa/fuyugame` 根目錄的 `HANDOFF.md` 和 `tests/README.md`，
> 再看 `house.html` 裡 `openLetterGame`、`openEnglishGame` 怎麼寫。
> 先用你的話跟我說你理解的規則（尤其是不能影響存檔、script 順序、Windows 10 表情符號），
> 然後跟我討論小遊戲的點子（玩的是六歲不識字的妹妹／小四的姊姊），我決定後你再做、測試、推上去。
