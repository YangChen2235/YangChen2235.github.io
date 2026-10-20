/* ============================================================
   页面交互：导航状态 / 入场动画 / 打字机 / 最新发行版自动检测
   ============================================================ */

(function () {
	"use strict";

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	/* ---------- 导航吸顶状态 ---------- */

	var nav = document.querySelector(".nav");
	if (nav) {
		var onScroll = function () {
			nav.classList.toggle("is-stuck", window.scrollY > 12);
		};
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
	}

	/* ---------- 入场动画 ---------- */

	var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
	if (reveals.length) {
		if (reduceMotion || !("IntersectionObserver" in window)) {
			reveals.forEach(function (el) {
				el.classList.add("is-in");
			});
		} else {
			var ioWorks = false;
			var io = new IntersectionObserver(
				function (entries) {
					ioWorks = true;
					entries.forEach(function (entry) {
						if (!entry.isIntersecting) return;
						var el = entry.target;
						var delay = parseFloat(el.getAttribute("data-delay") || "0");
						window.setTimeout(function () {
							el.classList.add("is-in");
						}, delay * 1000);
						io.unobserve(el);
					});
				},
				// threshold 用 0：某些块（移动端的长卡片）比视口还高，
				// 用比例阈值会永远达不到而一直空着
				{ rootMargin: "0px 0px -8% 0px", threshold: 0 }
			);
			reveals.forEach(function (el) {
				io.observe(el);
			});

			// 兜底：万一观察器没回调（老浏览器 / 页面被嵌进 iframe / 打印），
			// 把已经落在视口里的块直接点亮 —— 宁可没有动画，也不要一片空白
			var sweep = function () {
				reveals.forEach(function (el) {
					if (el.classList.contains("is-in")) return;
					var r = el.getBoundingClientRect();
					if (r.top < window.innerHeight && r.bottom > 0) {
						el.classList.add("is-in");
					}
				});
			};
			window.setTimeout(sweep, 1500);
			window.addEventListener("load", function () {
				window.setTimeout(sweep, 400);
			});
			window.addEventListener(
				"scroll",
				function () {
					if (!ioWorks) sweep();
				},
				{ passive: true }
			);
		}
	}

	/* ---------- 打字机副标题 ---------- */

	var typedEl = document.getElementById("typed");
	if (typedEl) {
		var phrases = [
			"个人开发者 / 游戏开发中",
			"C++ 信奥 · 4 年编程",
			"Python 与 GDScript 都在用",
			"和 AI 一起写代码的人"
		];

		if (reduceMotion) {
			typedEl.textContent = phrases[0];
		} else {
			var pi = 0;
			// 首屏不从空白开始：直接处于「第一句已经打完」的状态
			var ci = phrases[0].length;
			var deleting = true;
			typedEl.textContent = phrases[0];

			var step = function () {
				var word = phrases[pi];
				if (!deleting) {
					ci++;
					typedEl.textContent = word.slice(0, ci);
					if (ci >= word.length) {
						deleting = true;
						window.setTimeout(step, 1900);
						return;
					}
					window.setTimeout(step, 62);
				} else {
					ci--;
					typedEl.textContent = word.slice(0, ci);
					if (ci <= 0) {
						deleting = false;
						pi = (pi + 1) % phrases.length;
						window.setTimeout(step, 320);
						return;
					}
					window.setTimeout(step, 26);
				}
			};
			window.setTimeout(step, 2100);
		}
	}

	/* ---------- 代码墙数据说明 ---------- */

	var wallStatEls = document.querySelectorAll("[data-wall-stat]");
	if (wallStatEls.length && window.CODE_WALL_DATA) {
		var d = window.CODE_WALL_DATA;
		var text =
			(d.lines ? d.lines.length : 0) +
			" 行代码 · " +
			(d.fileCount || 0) +
			" 个脚本 · " +
			(d.generated || "");
		wallStatEls.forEach(function (el) {
			el.textContent = text;
		});
	}

	/* ---------- 发行版 / 平台下载 ----------
	   GitHub Pages 没有服务端，所以用 GitHub 的公开 API 读游戏仓库的发行版：
	   主按钮和四个平台卡片都按「最新的、确实带这个平台的包」去连，
	   查不到就退回 releases/latest。 */

	var OWNER = "YangChen2235";
	var GAME_REPO = "---";
	var RELEASES_API = "https://api.github.com/repos/" + OWNER + "/" + GAME_REPO + "/releases?per_page=20";

	var primary = document.getElementById("dl-primary");
	var primaryLabel = document.getElementById("dl-primary-label");
	var metaEl = document.getElementById("dl-meta-text");
	var releasesLink = document.getElementById("dl-releases");

	function humanSize(bytes) {
		if (!bytes) return "";
		var mb = bytes / (1024 * 1024);
		if (mb >= 1024) return (mb / 1024).toFixed(1) + " GB";
		if (mb >= 1) return Math.round(mb) + " MB";
		return Math.max(1, Math.round(bytes / 1024)) + " KB";
	}

	function findAsset(rel, name) {
		var assets = Array.isArray(rel.assets) ? rel.assets : [];
		for (var i = 0; i < assets.length; i++) {
			if (String(assets[i].name).toLowerCase() === name.toLowerCase()) return assets[i];
		}
		return null;
	}

	function applyLatest(rel) {
		var tag = rel.tag_name || rel.name || "最新版";
		var windows = findAsset(rel, "Windows.zip");
		var pack = windows;
		if (!pack) {
			var pool = (rel.assets || []).filter(function (a) {
				return /\.(zip|7z|rar)$/i.test(a.name);
			});
			pack = pool[0] || null;
		}
		if (primary) {
			if (pack) {
				primary.href = pack.browser_download_url;
				if (primaryLabel) primaryLabel.textContent = "下载最新发行版";
			} else {
				primary.href = rel.html_url;
				if (primaryLabel) primaryLabel.textContent = "前往发行版页面";
			}
		}
		if (releasesLink) releasesLink.href = rel.html_url;
		if (metaEl) {
			var bits = ["最新发行版 " + tag];
			if (pack && pack.size) bits.push(humanSize(pack.size));
			if (pack && pack.download_count) bits.push(pack.download_count + " 次下载");
			if (rel.published_at) bits.push(String(rel.published_at).slice(0, 10));
			metaEl.textContent = bits.join(" · ");
		}
	}

	function applyPlatforms(list) {
		var cards = document.querySelectorAll(".plat[data-asset]");
		for (var c = 0; c < cards.length; c++) {
			(function (el) {
				var name = el.getAttribute("data-asset");
				var hint = el.getAttribute("data-hint") || "";
				for (var i = 0; i < list.length; i++) {
					var a = findAsset(list[i], name);
					if (!a) continue;
					el.href = a.browser_download_url;
					var sizeEl = el.querySelector(".plat-size");
					if (sizeEl) sizeEl.textContent = a.size ? humanSize(a.size) + " · " + hint : hint;
					return;
				}
			})(cards[c]);
		}
	}

	function fetchReleases() {
		return fetch(RELEASES_API, {
			headers: { Accept: "application/vnd.github+json" },
			cache: "no-store"
		}).then(function (res) {
			if (!res.ok) throw new Error("http " + res.status);
			return res.json();
		});
	}

	if (window.fetch) {
		fetchReleases()
			.then(function (list) {
				if (!Array.isArray(list) || !list.length) throw new Error("empty");
				var stable = list.filter(function (r) {
					return !r.draft && !r.prerelease;
				});
				list = stable.length ? stable : list;
				applyLatest(list[0]);
				applyPlatforms(list);
			})
			.catch(function () {
				// 查不到（断网 / 限流 / 还没发版）：什么都不改。
				// 链接是 HTML 里写死的真实直链，提示保持默认文案，页面照样能用。
			});
	}

	/* ---------- 年份 ---------- */

	/* ---------- 画廊：点开看大图 ---------- */

	(function () {
		var links = document.querySelectorAll(".gallery-grid .art-link");
		if (!links.length) return;

		var box = document.createElement("div");
		box.className = "lightbox";
		box.setAttribute("aria-hidden", "true");
		box.innerHTML =
			'<button class="lightbox-close" type="button" aria-label="关闭">&times;</button><img alt="" />';
		document.body.appendChild(box);

		var bigImg = box.querySelector("img");

		function closeBox() {
			box.classList.remove("is-open");
			box.setAttribute("aria-hidden", "true");
			document.body.style.overflow = "";
		}

		function openBox(src, alt) {
			bigImg.src = src;
			bigImg.alt = alt || "";
			box.classList.add("is-open");
			box.setAttribute("aria-hidden", "false");
			document.body.style.overflow = "hidden";
		}

		box.addEventListener("click", function (e) {
			if (e.target !== bigImg) closeBox();
		});

		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape") closeBox();
		});

		Array.prototype.forEach.call(links, function (link) {
			link.addEventListener("click", function (e) {
				if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
				var img = link.querySelector("img");
				e.preventDefault();
				openBox(link.getAttribute("href"), img ? img.alt : "");
			});
		});
	})();
	var yearEls = document.querySelectorAll("[data-year]");
	if (yearEls.length) {
		var y = String(new Date().getFullYear());
		yearEls.forEach(function (el) {
			el.textContent = y;
		});
	}
})();
