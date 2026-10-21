/* ============================================================
   背景代码滚动墙
   ------------------------------------------------------------
   数据来自 window.CODE_WALL_DATA（assets/js/codes.js），
   内容是从游戏 GDScript 源码里抽出的真实代码行。

   做法：每一列先离屏画成一条长「代码胶片」，再按不同速度向上
   平移、循环贴回去 —— 每帧只做 drawImage，开销极低。
   列宽内放不下的长行会被跳过，所以不会出现半截被切断的代码。
   ============================================================ */

(function () {
	"use strict";

	var canvas = document.getElementById("code-wall");
	if (!canvas) return;

	var ctx = canvas.getContext("2d", { alpha: true });
	if (!ctx) return;

	var data = window.CODE_WALL_DATA || {};
	var allLines = Array.isArray(data.lines) ? data.lines : [];
	if (!allLines.length) {
		canvas.style.display = "none";
		return;
	}

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	var FONT_PX = 12;
	var LINE_H = 20;
	var COL_W = 246;
	var GAP = 16;
	var PAD_X = 14;
	var MONO_FONT =
		'12px "JetBrains Mono", "Cascadia Code", "SF Mono", Consolas, "Liberation Mono", "Courier New", monospace';

	var dpr = 1;
	var W = 0;
	var H = 0;
	var columns = [];
	var rafId = 0;
	var lastTs = 0;
	var resizeTimer = 0;
	var running = false;

	var measureCanvas = document.createElement("canvas");
	var measureCtx = measureCanvas.getContext("2d");
	measureCtx.font = MONO_FONT;

	var COMMENT = "rgba(31, 111, 235, 0.30)";
	var KEYWORD = "rgba(11, 63, 143, 0.50)";
	var PLAIN = "rgba(44, 96, 158, 0.36)";

	var KEYWORD_RE =
		/^(?:#include|#define|#pragma|template|struct|class|namespace|using|typedef|constexpr|const|static|inline|virtual|public|private|protected|int|long|short|double|float|char|bool|void|auto|unsigned|signed|vector|string|pair|map|set|queue|stack|priority_queue|for|while|do|if|else|switch|case|default|return|break|continue|goto|new|delete|sizeof)\b/;

	function colorFor(line) {
		var t = line.replace(/^\s+/, "");
		if (t.slice(0, 2) === "//") return COMMENT;
		if (KEYWORD_RE.test(t)) return KEYWORD;
		return PLAIN;
	}

	function pickLines(offset, maxWidth, need) {
		var out = [];
		var i = 0;
		var total = allLines.length;
		var scanned = 0;
		while (out.length < need && scanned < total * 4) {
			var line = allLines[(offset + i) % total];
			i++;
			scanned++;
			if (measureCtx.measureText(line).width > maxWidth) continue;
			out.push(line);
		}
		if (!out.length) out.push(allLines[offset % total]);
		return out;
	}

	function buildStrip(lines, width, alpha) {
		var height = lines.length * LINE_H;
		var strip = document.createElement("canvas");
		strip.width = Math.max(1, Math.ceil(width));
		strip.height = Math.max(1, Math.ceil(height));
		var g = strip.getContext("2d");
		g.font = MONO_FONT;
		g.textBaseline = "top";
		g.globalAlpha = alpha;
		for (var i = 0; i < lines.length; i++) {
			g.fillStyle = colorFor(lines[i]);
			g.fillText(lines[i], PAD_X, i * LINE_H + 3);
		}
		return strip;
	}

	function rand(seed) {
		// 稳定的伪随机，保证每次刷新排布一致但看起来杂乱
		var x = Math.sin(seed * 12.9898) * 43758.5453;
		return x - Math.floor(x);
	}

	function layout() {
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		W = canvas.clientWidth || window.innerWidth;
		H = canvas.clientHeight || window.innerHeight;

		canvas.width = Math.round(W * dpr);
		canvas.height = Math.round(H * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		var count = Math.max(3, Math.ceil(W / COL_W) + 1);
		var innerW = COL_W - GAP;
		var need = Math.ceil(H / LINE_H) + 3;

		columns = [];
		for (var i = 0; i < count; i++) {
			var offset = Math.floor(rand(i + 1) * allLines.length);
			var lines = pickLines(offset, innerW - PAD_X * 2, need);
			var alpha = 0.55 + rand(i + 7) * 0.5;
			var strip = buildStrip(lines, innerW, alpha);
			var speed = 9 + rand(i + 13) * 16; // px / 秒
			columns.push({
				x: i * COL_W + GAP / 2,
				strip: strip,
				h: strip.height,
				y: -rand(i + 23) * strip.height,
				speed: speed
			});
		}
		drawFrame(0);
	}

	function drawFrame(dt) {
		ctx.clearRect(0, 0, W, H);
		for (var i = 0; i < columns.length; i++) {
			var c = columns[i];
			c.y -= c.speed * dt;
			if (c.y <= -c.h) c.y += c.h;
			ctx.drawImage(c.strip, c.x, c.y);
			ctx.drawImage(c.strip, c.x, c.y + c.h);
		}
	}

	function tick(ts) {
		if (!lastTs) lastTs = ts;
		var dt = Math.min((ts - lastTs) / 1000, 0.05);
		lastTs = ts;
		drawFrame(dt);
		rafId = window.requestAnimationFrame(tick);
	}

	function start() {
		if (reduceMotion || running) return;
		running = true;
		lastTs = 0;
		rafId = window.requestAnimationFrame(tick);
	}

	function stop() {
		running = false;
		if (rafId) window.cancelAnimationFrame(rafId);
		rafId = 0;
	}

	function relayout() {
		stop();
		layout();
		start();
	}

	layout();
	start();

	window.addEventListener("resize", function () {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(relayout, 180);
	});

	document.addEventListener("visibilitychange", function () {
		if (document.hidden) stop();
		else start();
	});
})();
