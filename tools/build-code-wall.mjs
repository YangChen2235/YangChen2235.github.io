/* 生成背景代码墙的数据文件
   ------------------------------------------------------------
   输入：tools/luogu-records.json（洛谷提交记录的抓取结果，见 fetch 说明）
   输出：assets/js/codes.js（window.CODE_WALL_DATA）

   处理要点：
   - 去掉 C++ 注释（// 与 /* *\/），字符串里的东西原样保留
   - 制表符换成两个空格，去掉行尾空白
   - 只留能塞进一列宽度的短行（墙本身也会按字体宽度再筛一遍）
   - 各份代码轮流取行，避免整面墙全是同一题
*/

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const IN = resolve(root, "tools/luogu-records.json");
const OUT = resolve(root, "assets/js/codes.js");

const MAX_CHARS = 34; // 一列大约放得下的字符数（墙再按真实像素宽度筛一次）
const TARGET_LINES = 460;
const PER_FILE_CAP = 24; // 单份代码最多贡献多少行
const MAX_REPEAT = 2; // 同一行最多出现几次（避免整面墙全是 #include）

// 每份代码都有的样板行，全剔掉，否则墙上重复得太明显
const BOILERPLATE = new Set([
	"#include <bits/stdc++.h>",
	"#include<bits/stdc++.h>",
	"using namespace std;",
	"int main() {",
	"int main(){",
	"return 0;",
	"}",
	"};",
	"{",
	"ios::sync_with_stdio(false);",
	"ios::sync_with_stdio(0);",
	"cin.tie(0);",
	"cin.tie(0), cout.tie(0);",
	"cin.tie(0),cout.tie(0);",
	"typedef long long ll;",
	"typedef long long LL;",
	"using ll = long long;",
]);

const PUNCT_ONLY = /^[{}()[\];,.<>+\-*/=&|!?:%^~]+$/;

function stripComments(src) {
	let out = "";
	let i = 0;
	const n = src.length;
	let state = "code"; // code | line | block | str | chr
	while (i < n) {
		const c = src[i];
		const c2 = src[i + 1];
		if (state === "code") {
			if (c === "/" && c2 === "/") {
				state = "line";
				i += 2;
				continue;
			}
			if (c === "/" && c2 === "*") {
				state = "block";
				i += 2;
				continue;
			}
			if (c === '"') {
				state = "str";
				out += c;
				i++;
				continue;
			}
			if (c === "'") {
				state = "chr";
				out += c;
				i++;
				continue;
			}
			out += c;
			i++;
			continue;
		}
		if (state === "line") {
			if (c === "\n") {
				state = "code";
				out += c;
			}
			i++;
			continue;
		}
		if (state === "block") {
			if (c === "*" && c2 === "/") {
				state = "code";
				i += 2;
				continue;
			}
			if (c === "\n") out += c; // 保留行结构，方便后面按行裁掉空行
			i++;
			continue;
		}
		if (state === "str" || state === "chr") {
			if (c === "\\") {
				out += c + (c2 || "");
				i += 2;
				continue;
			}
			if ((state === "str" && c === '"') || (state === "chr" && c === "'")) {
				state = "code";
			}
			out += c;
			i++;
			continue;
		}
	}
	return out;
}

function toLines(src) {
	return stripComments(src)
		.replace(/\r\n/g, "\n")
		.replace(/\t/g, "  ")
		.split("\n")
		.map((l) => l.replace(/\s+$/, ""))
		.filter((l) => l.trim().length > 0);
}

const records = JSON.parse(readFileSync(IN, "utf8"));
console.log("读入提交:", records.length, "份");

// 每份预处理成「可用的短行」队列
const queues = records.map((rec) => {
	const lines = toLines(rec.code).filter(
		(l) => l.length <= MAX_CHARS && !BOILERPLATE.has(l.trim()) && !PUNCT_ONLY.test(l.trim()),
	);
	// 随机打散，避免整段连着出现
	const picked = lines.slice();
	for (let i = picked.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[picked[i], picked[j]] = [picked[j], picked[i]];
	}
	return {
		pid: rec.pid,
		name: rec.name,
		lines: picked.slice(0, PER_FILE_CAP),
	};
});

const usable = queues.filter((q) => q.lines.length > 0);
console.log("有可用短行的提交:", usable.length, "/", queues.length);

// 轮询取名，保持来源分散；同一行出现太多次就跳过
const out = [];
const seen = new Map();
let round = 0;
while (out.length < TARGET_LINES && round < PER_FILE_CAP) {
	for (const q of usable) {
		const line = q.lines[round];
		if (!line) continue;
		const used = seen.get(line) || 0;
		if (used >= MAX_REPEAT) continue;
		seen.set(line, used + 1);
		out.push(line);
		if (out.length >= TARGET_LINES) break;
	}
	round++;
}

const stamp = new Date().toISOString().slice(0, 10);
const body = out.map((l) => "    " + JSON.stringify(l)).join(",\n");
const header = [
	"/* 自动生成，请勿手改 —— 由 tools/build-code-wall.mjs 生成。",
	"   内容是从洛谷提交记录（YangChen2235）的 C++ AC 代码里抽出的真实代码行，",
	"   用作首页背景滚动墙。注释已去掉，只保留能塞进一列宽度的短行。*/",
].join("\n");

const js = `${header}
window.CODE_WALL_DATA = {
  generated: ${JSON.stringify(stamp)},
  source: "洛谷提交记录（YangChen2235）的 C++ AC 代码",
  fileCount: ${usable.length},
  lineCount: ${out.length},
  statText: ${JSON.stringify(`${out.length} 行代码 · ${usable.length} 份 AC 提交 · ${stamp}`)},
  lines: [
${body}
  ]
};
`;

writeFileSync(OUT, js, "utf8");
console.log("写出", OUT);
console.log("行数:", out.length, "来源提交:", usable.length);
