# 讓 Claude 寫、Gemini（Neon）審：電腦上的用法

> 來源：Threads 上的討論，說明怎麼一起用 Claude 和 Gemini，而且不會被停權。
> 用途：Claude 提出計畫，Gemini 幫忙挑毛病，兩邊對照之後再決定要不要做。

## 一、先記住：什麼不能做
- **不要**把 Google（Antigravity／Gemini 訂閱）的登入帳號接到 Claude Code 這類別家的工具，做成 MCP、plugin 或 proxy 也一樣。
  - 網友整理的說法：抓到會停 Antigravity，不會連坐整個 Google 帳號，但條款沒有放寬。
- Claude 的帳號也一樣，不要接到第三方工具。
- 安全的做法只有兩種：**A. 檔案交接**、**B. 走 API key**。

## 二、做法 A：檔案交接（推薦先用這個，不用額外花錢）

### 第一次準備（只做一次）
1. 電腦裝好兩個**官方**工具：
   - Claude Code（Desktop App 或終端機版）
   - Antigravity（Google 官方）
2. 把這個專案抓到電腦上（GitHub：`heyucpa/fuyugame`）。
   這套流程目前放在分支 `claude/oauth-review-workflow-anodrf`，還沒合併到 `main`。可以請 Claude 幫你合併。
3. Claude Code 跟 Antigravity **打開同一個資料夾**。

### 每次要用
| 步驟 | 在哪裡 | 你要說的話 |
|---|---|---|
| 1 | Claude Code | 「先寫計畫：（你的需求）」→ Claude 寫進 `review/plan.md`，還不會動程式 |
| 2 | Antigravity | 「照 AGENTS.md 審 review/plan.md」→ Gemini 把意見寫進 `review/review.md` |
| 3 | Claude Code | 「看 review.md」→ Claude 一條一條回應，修改計畫後才開始寫程式 |

意見的標記：🔴 一定要改／🟡 建議／🟢 沒問題。

### 這個資料夾裡的檔案
| 檔案 | 用途 |
|---|---|
| `review/plan.md` | Claude 寫的計畫書 |
| `review/review.md` | Gemini 寫的批改單 |
| `AGENTS.md` | 給 Gemini 的規則：只能審，不能改程式 |
| `CLAUDE.md` | 給 Claude 的規則：先寫計畫、看完意見再動手 |

## 三、做法 B：走 API key（全自動，要花一點錢）
- 到 Google AI Studio 申請 **API key**（不是用訂閱帳號登入）。
- 在 Claude Code 裡掛一個 Gemini 的 MCP，用這把 key，Claude 就能自己叫 Gemini 審稿。
- 網友的說法：Pro 訂閱每月送大約 10 美元的 API 額度，審一次大約台幣 1～2 元。實際額度請以 Google 官網為準。
- 要用的時候，請 Claude Code 帶你一步步設定。key 不要貼在對話裡，也不要 commit 進專案。

## 四、雲端的 Claude Code（手機／網頁）
雲端的資料夾不在你的電腦上，所以 Antigravity 看不到，只能靠 git 傳檔案（push／pull），比較麻煩。
**建議在電腦上用。**
