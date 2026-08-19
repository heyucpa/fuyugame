#!/usr/bin/env python3
"""fuyugame 改動後的自我檢查。核心檢查純 Python 標準庫，劇本圖走查需要 node。

檢查五件事，都是這個 repo 真的出過的問題：

1. 呼叫了不存在的函式（會讓整頁白掉）
   歷史案例：commit 55e9d61 誤刪 theater.html 的 loadProgress，
   下一個 commit 標題就是「修好上一版打不開的問題」。

2. theater.html 與 map.html 的 SCENARIOS 不同步
   兩檔各存一份完全相同的劇本資料（74KB），改一邊忘了另一邊，
   分支圖就會跟實際劇情不一致。

3. 括號 / 引號結構不平衡（大改動後最常見的低級失誤）

4. 劇本圖走查：選項指向不存在的節點、孤兒結局、結局標題撞名（需要 node）

5. 改了頁面卻沒更新 <meta name="build"> 版本號
   小孩的瀏覽器會吃到舊快取，你以為修好了但她那邊沒變。

用法:
    python3 .claude/skills/fuyugame-dev/scripts/check.py              # 檢查全部
    python3 .claude/skills/fuyugame-dev/scripts/check.py theater.html # 只檢查一個檔
    python3 .claude/skills/fuyugame-dev/scripts/check.py --no-build   # 跳過版本號檢查

離開碼 0 = 全部通過，1 = 有問題。
"""

import re
import subprocess
import sys
from pathlib import Path

GAME_FILES = ["index.html", "theater.html", "map.html", "kids.html"]

# ---------------------------------------------------------------------------
# 已知全域：JS 內建 + DOM + 這個 repo 用到的瀏覽器 API。
# 寧可多列，也不要製造假警報 —— 一支會喊狼來了的檢查腳本沒人會理它。
# ---------------------------------------------------------------------------
KNOWN_GLOBALS = set("""
Array ArrayBuffer Atomics BigInt Boolean DataView Date Error EvalError Float32Array
Float64Array Function Infinity Int8Array Int16Array Int32Array Intl JSON Map Math
NaN Number Object Promise Proxy RangeError ReferenceError Reflect RegExp Set String
Symbol SyntaxError TypeError URIError Uint8Array Uint8ClampedArray Uint16Array
Uint32Array WeakMap WeakSet BigInt64Array BigUint64Array FinalizationRegistry WeakRef
decodeURI decodeURIComponent encodeURI encodeURIComponent escape eval globalThis
isFinite isNaN parseFloat parseInt unescape structuredClone queueMicrotask
alert atob btoa blur cancelAnimationFrame clearInterval clearTimeout close confirm
fetch focus getComputedStyle getSelection matchMedia open postMessage print prompt
requestAnimationFrame requestIdleCallback scroll scrollBy scrollTo setInterval
setTimeout stop
document window navigator location history screen console localStorage sessionStorage
performance crypto customElements indexedDB caches
Audio AudioContext webkitAudioContext Image Option AbortController Blob
BroadcastChannel CustomEvent Event EventTarget File FileReader FormData Headers
IntersectionObserver MutationObserver Notification ResizeObserver Request Response
Text TextDecoder TextEncoder URL URLSearchParams Worker XMLHttpRequest
DocumentFragment Element HTMLElement Node NodeList SVGElement Range
CSS DOMParser XMLSerializer OffscreenCanvas Path2D
speechSynthesis SpeechSynthesisUtterance
""".split())

# JS 關鍵字：`if (`、`for (`、`switch (` 這些不是函式呼叫
KEYWORDS = set("""
if else for while do switch case default break continue return function var let const
new delete typeof instanceof in of void this super class extends static get set
try catch finally throw yield await async import export from as with debugger
true false null undefined
""".split())


# ---------------------------------------------------------------------------
# 取出 inline <script>，並把字串內容清空（但保留樣板字串裡的 ${...} 運算式，
# 因為這個 repo 大量用 `${pIcon(p, '46px')}` 這種寫法呼叫函式）
# ---------------------------------------------------------------------------
def extract_scripts(html: str) -> str:
    out = []
    for m in re.finditer(r"<script\b([^>]*)>(.*?)</script>", html, re.S | re.I):
        if re.search(r"\bsrc\s*=", m.group(1), re.I):
            continue  # 外部檔，不是我們要檢查的 inline 程式碼
        out.append(m.group(2))
    return "\n;\n".join(out)


def strip_literals(src: str) -> str:
    """移除註解、清空字串與正規表達式，但保留樣板字串的 ${...} 運算式。

    為什麼要保留 ${...}：這個 repo 大量用 `${renderModal()}` 這種寫法在
    樣板字串裡呼叫函式。如果連 ${} 一起丟掉，就會誤判成「這個函式沒被用到」。

    為什麼要自己掃而不用 regex：樣板字串在這裡巢套得很深
    （`${cond ? `${inner()}` : ''}`），regex 一定會斷。用狀態堆疊才正確。

    輸出會保留原本的換行數，這樣回報的行號才對得上。
    """
    out = []
    stack = []  # 'tmpl' = 在樣板文字裡；['expr', depth] = 在 ${} 運算式裡
    i, n = 0, len(src)
    prev_significant = ""  # 前一個有意義的字元，用來判斷 / 是除號還是正規式

    def in_tmpl_text():
        return bool(stack) and stack[-1] == "tmpl"

    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ""

        # ---- 樣板字串的文字部分：丟掉內容，只認 ${ 和收尾的 ` ----
        if in_tmpl_text():
            if c == "\\":
                out.append("  ")
                i += 2
                continue
            if c == "$" and nxt == "{":
                stack.append(["expr", 0])
                out.append("  ")
                i += 2
                continue
            if c == "`":
                stack.pop()
                out.append(" ")
                i += 1
                continue
            out.append("\n" if c == "\n" else " ")
            i += 1
            continue

        # ---- 以下都是「程式碼」狀態（頂層，或在 ${} 運算式內）----

        # 註解
        if c == "/" and nxt == "/":
            j = src.find("\n", i)
            j = n if j < 0 else j
            out.append(" " * (j - i))
            i = j
            continue
        if c == "/" and nxt == "*":
            j = src.find("*/", i + 2)
            j = n if j < 0 else j + 2
            seg = src[i:j]
            out.append("\n" * seg.count("\n") or " ")
            i = j
            continue

        # 一般字串
        if c in "'\"":
            quote = c
            j = i + 1
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == quote:
                    break
                j += 1
            out.append("''")
            out.append("\n" * src.count("\n", i, min(j + 1, n)))
            i = min(j + 1, n)
            prev_significant = "'"
            continue

        # 正規表達式字面值：/[{]/ 這種東西裡的括號不能算進平衡檢查。
        # 靠前一個有意義字元判斷 —— 是運算子或開括號就是正規式，是值就是除法。
        if c == "/" and (prev_significant == "" or prev_significant in "(,=:[!&|?{};+-*%~^<>" ):
            j = i + 1
            in_class = False
            closed = False
            while j < n:
                d = src[j]
                if d == "\\":
                    j += 2
                    continue
                if d == "\n":
                    break  # 正規式不能跨行，判斷錯了
                if d == "[":
                    in_class = True
                elif d == "]":
                    in_class = False
                elif d == "/" and not in_class:
                    closed = True
                    break
                j += 1
            if closed:
                while j + 1 < n and src[j + 1].isalpha():  # 吃掉 gimsuy 等旗標
                    j += 1
                out.append("/RE/")
                i = j + 1
                prev_significant = "/"
                continue
            # 判斷錯了，當成普通除號往下走

        # 樣板字串開頭
        if c == "`":
            stack.append("tmpl")
            out.append(" ")
            i += 1
            continue

        # 在 ${} 運算式內追蹤大括號，才知道 } 是收尾還是普通物件括號
        if stack and stack[-1][0] == "expr":
            if c == "{":
                stack[-1][1] += 1
            elif c == "}":
                if stack[-1][1] == 0:
                    stack.pop()
                    out.append("  ")
                    i += 1
                    continue
                stack[-1][1] -= 1

        out.append(c)
        if not c.isspace():
            prev_significant = c
        i += 1

    return "".join(out)


# ---------------------------------------------------------------------------
# 檢查 1：呼叫了不存在的函式
# ---------------------------------------------------------------------------
IDENT = r"[A-Za-z_$][\w$]*"


def collect_declared(code: str) -> set:
    """收集所有「可能是宣告」的名字。

    刻意寬鬆 —— 寧可漏報也不要誤報。一支狂喊假警報的腳本，
    下一次改動就會被直接忽略，那就完全失去意義了。
    """
    d = set()
    # function foo(...) / async function foo
    d |= set(re.findall(rf"\bfunction\s*\*?\s*({IDENT})", code))
    # class Foo
    d |= set(re.findall(rf"\bclass\s+({IDENT})", code))
    # const/let/var foo —— 只收等號左邊的綁定名稱。
    # 這裡很容易寫錯：如果連等號右邊一起收，`const p = loadProgress()` 會把
    # loadProgress 自己當成已宣告，那「函式被誤刪」就永遠檢查不出來了 ——
    # 而那正是這支腳本最主要要防的一件事。
    for m in re.finditer(r"\b(?:const|let|var)\s+([^;\n]*)", code):
        for seg in m.group(1).split(","):
            if "=" in seg:
                d |= set(re.findall(IDENT, seg.split("=", 1)[0]))
            elif "(" not in seg and ")" not in seg:
                # 沒有等號也沒有括號才收，避免把 f(a, b) 的引數當宣告
                d |= set(re.findall(IDENT, seg))
    # 解構賦值 const {a, b} = x / const [a, b] = y
    for m in re.finditer(r"[{\[]([^{}\[\]]*)[}\]]\s*=[^=]", code):
        d |= set(re.findall(IDENT, m.group(1)))
    # 函式參數（含箭頭函式）
    for m in re.finditer(rf"\bfunction\s*\*?\s*(?:{IDENT})?\s*\(([^)]*)\)", code):
        d |= set(re.findall(IDENT, m.group(1)))
    for m in re.finditer(r"\(([^()]*)\)\s*=>", code):
        d |= set(re.findall(IDENT, m.group(1)))
    d |= set(re.findall(rf"({IDENT})\s*=>", code))          # 單參數箭頭 x => ...
    d |= set(re.findall(rf"\bcatch\s*\(\s*({IDENT})", code))
    # 物件方法簡寫 { foo() {...} } 與 class 方法 —— 可能被當一般函式取用
    d |= set(re.findall(rf"^\s*(?:async\s+)?(?:get|set)?\s*({IDENT})\s*\([^)]*\)\s*\{{", code, re.M))
    # foo: function / foo: (a)=> —— 指派給屬性的函式
    d |= set(re.findall(rf"({IDENT})\s*:\s*(?:async\s*)?(?:function|\()", code))
    # window.foo = / globalThis.foo =
    d |= set(re.findall(rf"\b(?:window|globalThis)\.({IDENT})\s*=", code))
    return d


def find_undefined_calls(code: str, declared: set) -> list:
    """找出「裸呼叫」但沒有任何宣告的名字。

    只看沒有前綴 `.` 的呼叫 —— `obj.method()` 我們無從靜態驗證，
    但 `loadProgress()` 這種裸呼叫如果沒定義，載入時就會 ReferenceError。
    """
    bad = {}
    for m in re.finditer(rf"(?<![.\w$?])({IDENT})\s*\(", code):
        name = m.group(1)
        if name in KEYWORDS or name in KNOWN_GLOBALS or name in declared:
            continue
        line = code.count("\n", 0, m.start()) + 1
        bad.setdefault(name, line)
    return sorted(bad.items(), key=lambda kv: kv[1])


# ---------------------------------------------------------------------------
# 檢查 2：SCENARIOS 同步
# ---------------------------------------------------------------------------
def scenarios_block(html: str):
    """取出 const SCENARIOS = [...] 的完整區塊（含括號配對）。"""
    i = html.find("const SCENARIOS")
    if i < 0:
        return None
    j = i
    while j < len(html) and html[j] not in "[{":
        j += 1
    if j >= len(html):
        return None
    depth = 0
    in_str = None
    k = j
    while k < len(html):
        c = html[k]
        if in_str:
            if c == "\\":
                k += 2
                continue
            if c == in_str:
                in_str = None
        elif c in "'\"`":
            in_str = c
        elif c in "[{":
            depth += 1
        elif c in "]}":
            depth -= 1
            if depth == 0:
                return html[j : k + 1]
        k += 1
    return None


# ---------------------------------------------------------------------------
# 檢查 3：括號平衡
# ---------------------------------------------------------------------------
def check_balance(code: str) -> list:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    problems = []
    for idx, c in enumerate(code):
        if c in "([{":
            stack.append((c, code.count("\n", 0, idx) + 1))
        elif c in ")]}":
            if not stack:
                problems.append(f"第 {code.count(chr(10), 0, idx) + 1} 行多出一個 '{c}'")
                if len(problems) > 4:
                    return problems
            elif stack[-1][0] != pairs[c]:
                problems.append(
                    f"第 {code.count(chr(10), 0, idx) + 1} 行的 '{c}' 對不上"
                    f"第 {stack[-1][1]} 行的 '{stack[-1][0]}'"
                )
                return problems
            else:
                stack.pop()
    if stack:
        c, line = stack[-1]
        problems.append(f"第 {line} 行的 '{c}' 沒有關閉")
    return problems


# ---------------------------------------------------------------------------
# 檢查 4：版本號有沒有跟著改
# ---------------------------------------------------------------------------
def git_changed_files() -> set:
    try:
        out = subprocess.run(
            ["git", "diff", "--name-only", "HEAD", "--"],
            capture_output=True, text=True, timeout=10,
        )
        untracked = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            capture_output=True, text=True, timeout=10,
        )
        return {l.strip() for l in (out.stdout + untracked.stdout).splitlines() if l.strip()}
    except Exception:
        return set()


def build_meta(html: str):
    m = re.search(r'<meta\s+name="build"\s+content="([^"]*)"', html)
    return m.group(1) if m else None


def git_show(rev: str, path: str):
    try:
        r = subprocess.run(["git", "show", f"{rev}:{path}"],
                           capture_output=True, text=True, timeout=15)
        return r.stdout if r.returncode == 0 else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
def find_repo_root() -> Path:
    """從腳本位置往上找到放遊戲 HTML 的那層，這樣搬動 skill 目錄也不會壞。"""
    for d in [Path.cwd(), *Path(__file__).resolve().parents]:
        if (d / "theater.html").exists() or (d / "index.html").exists():
            return d
    return Path.cwd()


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    skip_build = "--no-build" in sys.argv
    root = find_repo_root()

    targets = args or GAME_FILES
    targets = [t for t in targets if (root / t).exists()]
    if not targets:
        print("找不到要檢查的檔案", file=sys.stderr)
        return 1

    failures = []
    print(f"檢查 {len(targets)} 個檔案（{root}）\n")

    # --- 逐檔的靜態檢查 ---
    for name in targets:
        html = (root / name).read_text(encoding="utf-8")
        raw = extract_scripts(html)
        code = strip_literals(raw)
        declared = collect_declared(code)

        bal = check_balance(code)
        undef = find_undefined_calls(code, declared)

        status = "OK" if not bal and not undef else "問題"
        print(f"[{status}] {name}  ({len(html):,} 字元, {len(declared)} 個已宣告名稱)")

        for p in bal:
            print(f"       括號不平衡：{p}")
            failures.append(f"{name} 括號不平衡")
        for fn, line in undef:
            print(f"       呼叫了未定義的 {fn}()  約在 inline script 第 {line} 行")
            failures.append(f"{name} 呼叫未定義的 {fn}()")

    # --- SCENARIOS 同步 ---
    if (root / "theater.html").exists() and (root / "map.html").exists():
        a = scenarios_block((root / "theater.html").read_text(encoding="utf-8"))
        b = scenarios_block((root / "map.html").read_text(encoding="utf-8"))
        if a is None or b is None:
            print("\n[問題] 有一邊找不到 const SCENARIOS")
            failures.append("SCENARIOS 區塊找不到")
        elif a != b:
            print(f"\n[問題] SCENARIOS 不同步：theater.html {len(a):,} 字元 vs map.html {len(b):,} 字元")
            print("       兩檔必須各存一份完全相同的劇本資料，改一邊就要同步另一邊")
            failures.append("SCENARIOS 不同步")
        else:
            print(f"\n[OK] SCENARIOS 同步（兩邊都是 {len(a):,} 字元）")

    # --- 劇本圖走查（需要 node，沒有就跳過並說清楚） ---
    if (root / "theater.html").exists() and "map.html" not in args:
        js = Path(__file__).with_name("scenario_check.js")
        if js.exists():
            print()
            try:
                r = subprocess.run(["node", str(js), str(root / "theater.html")],
                                   capture_output=True, text=True, timeout=60)
                print(r.stdout.rstrip() or r.stderr.rstrip())
                if r.returncode != 0:
                    failures.append("劇本圖走查未通過")
            except FileNotFoundError:
                print("[跳過] 劇本圖走查需要 node，這台機器上沒有。")
                print("       靜態檢查抓不到「選項指向不存在的節點」，改過劇情的話")
                print("       請在有 node 的環境補跑：")
                print(f"       node {js.relative_to(root) if js.is_relative_to(root) else js} ")
            except subprocess.TimeoutExpired:
                print("[跳過] 劇本圖走查逾時。")

    # --- 版本號 ---
    if not skip_build:
        changed = git_changed_files()
        for name in targets:
            if name not in changed:
                continue
            html = (root / name).read_text(encoding="utf-8")
            now = build_meta(html)
            if now is None:
                print(f"\n[注意] {name} 改了，但這個檔沒有 <meta name=\"build\"> 版本號")
                print("       改完後小孩的瀏覽器可能吃到舊快取。考慮補上版本號機制。")
                continue
            old_html = git_show("HEAD", name)
            was = build_meta(old_html) if old_html else None
            if was is not None and was == now:
                print(f"\n[問題] {name} 內容改了，但版本號還是 {now}")
                print("       小孩的瀏覽器會吃到舊快取，你以為修好了但她那邊沒變。請更新版本號。")
                failures.append(f"{name} 版本號未更新")
            elif was != now:
                print(f"\n[OK] {name} 版本號已更新：{was} -> {now}")

    print()
    if failures:
        print(f"✗ {len(failures)} 個問題，先修掉再 commit：")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("✓ 靜態檢查全部通過。")
    print("  下一步：一定要在瀏覽器實際打開玩一輪 —— 靜態檢查抓不到「畫面壞掉」或「玩不下去」。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
