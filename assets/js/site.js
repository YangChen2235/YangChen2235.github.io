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
			"4 年编程 · 2 年信息学奥赛",
			"Godot + GDScript 重度使用者",
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

	/* ---------- 最新发行版自动检测 ----------
	   GitHub Pages 上没有服务端，所以用 GitHub 的公开 API 找「最新发行版」。
	   查到了就把下载按钮指到发行版资产（优先 zip），查不到就保持指向
	   releases/latest 这个兜底链接。 */

	var RELEASE_REPOS = ["YangChen2235.github.io", "banjichouka"];
	var OWNER = "YangChen2235";

	var primary = document.getElementById("dl-primary");
	var primaryLabel = document.getElementById("dl-primary-label");
	var metaEl = document.getElementById("dl-meta-text");
	var releasesLink = document.getElementById("dl-releases");

	function pickAsset(rel) {
		var assets = Array.isArray(rel.assets) ? rel.assets : [];
		if (!assets.length) return null;
		var zip = assets.filter(function (a) {
			return /\.(zip|7z|rar)$/i.test(a.name);
		});
		var pool = zip.length ? zip : assets;
		pool.sort(function (a, b) {
			return (b.download_count || 0) - (a.download_count || 0) || b.size - a.size;
		});
		return pool[0];
	}

	function humanSize(bytes) {
		if (!bytes) return "";
		var mb = bytes / (1024 * 1024);
		if (mb >= 1024) return (mb / 1024).toFixed(1) + " GB";
		if (mb >= 1) return Math.round(mb) + " MB";
		return Math.max(1, Math.round(bytes / 1024)) + " KB";
	}

	function fetchLatest(repo) {
		var url = "https://api.github.com/repos/" + OWNER + "/" + repo + "/releases/latest";
		return fetch(url, {
			headers: { Accept: "application/vnd.github+json" },
			cache: "no-store"
		}).then(function (res) {
			if (!res.ok) throw new Error("no release");
			return res.json();
		});
	}

	function applyRelease(rel, repo) {
		var asset = pickAsset(rel);
		var tag = rel.tag_name || rel.name || "最新版";
		if (asset && primary) {
			primary.href = asset.browser_download_url;
			primary.setAttribute("download", "");
			if (primaryLabel) primaryLabel.textContent = "下载 " + tag;
		} else if (primary) {
			primary.href = rel.html_url;
			if (primaryLabel) primaryLabel.textContent = "前往发行版页面";
		}
		if (releasesLink) releasesLink.href = rel.html_url;

		if (metaEl) {
			var bits = ["最新发行版 " + tag];
			if (asset && asset.size) bits.push(humanSize(asset.size));
			if (asset && asset.download_count) bits.push(asset.download_count + " 次下载");
			if (rel.published_at) {
				bits.push(String(rel.published_at).slice(0, 10));
			}
			metaEl.textContent = bits.join(" · ");
		}
	}

	if (primary && window.fetch) {
		var chain = Promise.reject();
		RELEASE_REPOS.forEach(function (repo) {
			chain = chain.catch(function () {
				return fetchLatest(repo).then(function (rel) {
					applyRelease(rel, repo);
				});
			});
		});
		chain.catch(function () {
			// 没有发行版 / 被限流 / 断网：保持兜底链接不变，只把提示换成网页版引导
			if (metaEl) {
				metaEl.textContent = "发行版还在路上 —— 先玩网页版最快，打开就能玩";
			}
		});
	}

	/* ---------- 年份 ---------- */

	var yearEls = document.querySelectorAll("[data-year]");
	if (yearEls.length) {
		var y = String(new Date().getFullYear());
		yearEls.forEach(function (el) {
			el.textContent = y;
		});
	}
})();
