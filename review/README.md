# Claude 寫、Neon 審：不用手貼的交接流程

兩邊都用**官方工具**（Claude Code、Antigravity 或 agy CLI），各自用自己的帳號登入。
不要把訂閱的 OAuth 接到第三方工具或 proxy 上，Google 跟 Anthropic 的條款都不允許，抓到會鎖帳號。

## 檔案
| 檔案 | 誰寫 | 內容 |
|---|---|---|
| `review/plan.md` | Claude | 這次要改什麼、為什麼、動到哪些地方、怎麼測 |
| `review/review.md` | Neon | 審稿意見，每一條標上 🔴 一定要改／🟡 建議／🟢 沒問題 |

## 一輪的流程
1. 跟 Claude 說需求 → Claude 寫好 `review/plan.md`（先不動程式）。
2. 到 Antigravity（同一個資料夾）說：「審 review/plan.md」→ Neon 照 `AGENTS.md` 的規則寫好 `review/review.md`。
3. 回到 Claude 說：「看 review.md」→ Claude 回應每一條意見、修改計畫，或直接開始寫程式。
4. 寫完程式還想讓 Neon 再看一次，就請 Claude 把這次的改動（diff）摘要更新進 plan.md，再回到第 2 步。

## 雲端的 Claude Code（claude.ai/code）
雲端的工作資料夾跟你電腦上的不是同一個，交接要靠 git：
Claude 推上分支 → 你在電腦上 `git pull` → Antigravity 審 → 把 review.md commit 再 push → 跟 Claude 說「拉一下再看 review.md」。
