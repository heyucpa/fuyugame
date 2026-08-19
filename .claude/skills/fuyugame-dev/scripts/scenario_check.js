#!/usr/bin/env node
/**
 * 情境劇場的劇本圖走查。
 *
 * 這支腳本補的是 check.py 抓不到的一類問題：程式語法完全正確、
 * 頁面也打得開，但玩家點下去會卡住或走不到某些結局。對小孩來說，
 * 「按了沒反應」跟整頁白掉一樣都是不能玩。
 *
 * 這也是在補回一個失落的工具：commit 訊息裡多次提到「verify.sh 全過：
 * 101 條結局 0 失敗 0 錯誤」，但 verify.sh 從來沒有進到 repo。
 *
 * 檢查項目：
 *   1. 每個 choices[].to 都指得到同劇本的 node 或 ending
 *   2. start 指到真的存在的 node
 *   3. 沒有從 start 走不到的孤兒 node / ending
 *   4. 同一個劇本裡沒有兩個結局同名（commit d0ed3c6 修過這個 bug：
 *      「一毛都沒損失」同時是 good 和 best 的標題，玩家只看到徽章顏色不同）
 *   5. ending.grade 只能是 good / best / escape / bad
 *   6. 印出劇本 / 節點 / 選項 / 結局的數量，方便寫 commit 訊息時對照
 *      （這個 repo 的 commit 習慣會記「決策點 147、選項 363、結局 101」）
 *
 * 用法: node .claude/skills/fuyugame-dev/scripts/scenario_check.js [theater.html]
 * 離開碼 0 = 通過，1 = 有問題。
 */

const fs = require("fs");
const path = require("path");

const GRADES = new Set(["good", "best", "escape", "bad"]);

function findRepoRoot() {
  let d = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, "theater.html"))) return d;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  // 退而求其次：從腳本位置往上找
  d = __dirname;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, "theater.html"))) return d;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return process.cwd();
}

/** 從 HTML 裡切出 const SCENARIOS = [...] 的完整區塊（含括號配對、跳過字串） */
function extractScenarios(html) {
  const i = html.indexOf("const SCENARIOS");
  if (i < 0) return null;
  let j = i;
  while (j < html.length && html[j] !== "[" && html[j] !== "{") j++;
  if (j >= html.length) return null;
  let depth = 0;
  let inStr = null;
  for (let k = j; k < html.length; k++) {
    const c = html[k];
    if (inStr) {
      if (c === "\\") { k++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") { inStr = c; continue; }
    if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) return html.slice(j, k + 1);
    }
  }
  return null;
}

function main() {
  const root = findRepoRoot();
  const target = process.argv[2] || path.join(root, "theater.html");
  const file = path.isAbsolute(target) ? target : path.join(root, target);

  if (!fs.existsSync(file)) {
    console.error(`找不到 ${file}`);
    return 1;
  }

  const block = extractScenarios(fs.readFileSync(file, "utf8"));
  if (!block) {
    console.error(`在 ${path.basename(file)} 裡找不到 const SCENARIOS`);
    return 1;
  }

  let SCENARIOS;
  try {
    // 這是我們自己 repo 裡的資料，不是外部輸入
    SCENARIOS = new Function(`return ${block};`)();
  } catch (e) {
    console.error(`SCENARIOS 無法求值（可能有語法錯誤）：${e.message}`);
    return 1;
  }

  const problems = [];
  let nNodes = 0, nChoices = 0, nEndings = 0;

  for (const sc of SCENARIOS) {
    const id = sc.id || "(無 id)";
    const nodes = sc.nodes || {};
    const endings = sc.endings || {};
    const nodeKeys = new Set(Object.keys(nodes));
    const endKeys = new Set(Object.keys(endings));

    nNodes += nodeKeys.size;
    nEndings += endKeys.size;

    // --- start 要存在 ---
    if (!sc.start) {
      problems.push(`[${id}] 沒有 start`);
    } else if (!nodeKeys.has(sc.start)) {
      problems.push(`[${id}] start 指向不存在的節點 "${sc.start}"`);
    }

    // --- 每個選項的 to 都要指得到東西 ---
    for (const key of nodeKeys) {
      const node = nodes[key];
      const choices = (node && node.choices) || [];
      nChoices += choices.length;
      if (!choices.length) {
        problems.push(`[${id}] 節點 "${key}" 沒有任何選項，玩家會卡在這裡`);
      }
      choices.forEach((ch, idx) => {
        if (!ch.to) {
          problems.push(`[${id}] 節點 "${key}" 的第 ${idx + 1} 個選項沒有 to`);
        } else if (!nodeKeys.has(ch.to) && !endKeys.has(ch.to)) {
          problems.push(
            `[${id}] 節點 "${key}" 的選項「${ch.label || "?"}」指向不存在的 "${ch.to}"　→ 玩家按下去會卡住`
          );
        }
      });
    }

    // --- 從 start 做可達性走查 ---
    const seen = new Set();
    const queue = sc.start ? [sc.start] : [];
    while (queue.length) {
      const cur = queue.pop();
      if (seen.has(cur)) continue;
      seen.add(cur);
      const node = nodes[cur];
      if (!node) continue; // ending，不再往下
      for (const ch of node.choices || []) {
        if (ch.to && !seen.has(ch.to)) queue.push(ch.to);
      }
    }
    for (const key of nodeKeys) {
      if (!seen.has(key)) problems.push(`[${id}] 節點 "${key}" 從 start 走不到（孤兒）`);
    }
    for (const key of endKeys) {
      if (!seen.has(key)) problems.push(`[${id}] 結局 "${key}" 從 start 走不到（玩家永遠看不到）`);
    }

    // --- 同劇本內結局標題不能撞名 ---
    const titleOwner = new Map();
    for (const key of endKeys) {
      const e = endings[key];
      const t = e && e.title;
      if (t) {
        if (titleOwner.has(t)) {
          problems.push(
            `[${id}] 結局 "${titleOwner.get(t)}" 和 "${key}" 標題都叫「${t}」` +
            `，玩家分不出差別（commit d0ed3c6 修過同一類問題）`
          );
        } else {
          titleOwner.set(t, key);
        }
      }
      if (e && e.grade && !GRADES.has(e.grade)) {
        problems.push(`[${id}] 結局 "${key}" 的 grade 是 "${e.grade}"，不在 good/best/escape/bad 之內`);
      }
    }
  }

  console.log(
    `劇本 ${SCENARIOS.length}　決策節點 ${nNodes}　選項 ${nChoices}　結局 ${nEndings}`
  );

  if (problems.length) {
    console.log(`\n✗ 劇本圖有 ${problems.length} 個問題：`);
    for (const p of problems) console.log(`  - ${p}`);
    return 1;
  }
  console.log("✓ 劇本圖走查通過：每個選項都指得到、沒有孤兒節點、結局標題不撞名。");
  return 0;
}

process.exit(main());
