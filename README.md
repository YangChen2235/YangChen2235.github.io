# YangChen2235.github.io

个人主页，用 GitHub Pages 托管：**<https://yangchen2235.github.io/>**

整站是手写的 HTML + CSS + 原生 JS，没有框架、没有构建步骤 —— 改完文件直接推上来就是线上。

## 站点内容

| 板块 | 说明 |
|---|---|
| Hero | 头像、名字、一句自我介绍、下载 / 网页版两个主入口 |
| 关于我 | 4 年编程、2 年信息学奥赛、人与 AI 协作、转型做游戏（右侧配一个 C++ 版的 profile.cpp 卡片） |
| 在做的项目 | 《班级抽卡 · 重置版》《骰子对决》和练手合集 |
| 开发历程 | 从 2026 年 2 月的牌桌原型到现在的重置版，7 个大版本的时间轴（只列大版本，细节见游戏仓库的发行版） |
| 画廊 | 两张自绘的图，点开看大图（没有 JS 的话就是直接打开图片） |
| 音乐 | 四首 Suno 生成的曲子，点播放键直接试听，点进度条能跳 |
| 制作组乐事 | 12 条真踩过的坑（横版卡片，按「前三名 / 少一个字符就全灭 / 看起来没坏其实坏了 / 差一点酿成事故 / 一行代码」分组），顶部一条淡蓝色横幅写着对 AI 协作的态度 |
| 制作组 | 三个人各自的头像和分工：蓝色大肥鱼 (DeepSeek)（代码 / 矢量图美工 / 动画 / MV 制作）、YangChen2235（代码 / 技术指导 / 框架制作 / 原型制作 / 策划 / 剧情 / 美工）、大肥龙 (ChatGPT)（AI 美工） |
| 下载 | Windows / Linux / Android / 网页版 四个平台图标（直接连到发行版资产）、三步图解、各平台最低设备建议、iOS / 32 位 Windows 的说明和网页版替代办法、最新版本的更新日志 |

## 目录结构

```
index.html              主页
assets/css/style.css    全部样式（蓝白配色、响应式）
assets/js/codes.js      背景代码墙的数据：从游戏源码里抽出来的真实代码
assets/js/code-wall.js  把代码画成会向上滚的「胶片」
assets/js/site.js       导航吸顶、入场动画、打字机、画廊大图、音乐播放器、发行版自动探测
assets/img/avatar.png   导航栏左上角的头像
assets/img/platform/    四个平台的图标（Windows / Linux / Android / 网页版）
assets/img/gallery/     画廊用的两张自绘图（WebP）
assets/audio/           音乐板块的四首曲子（mp3，Suno 生成）
assets/img/team/        制作组头像（bigfish.png / dafeilong.png，自己的复用 avatar.png）
assets/img/game/        游戏 logo.png 与两枚碎片（shard-blue / shard-red），下载区顶部那组徽记用的就是它们
assets/favicon.svg      站点图标
tools/build-code-wall.ps1  重新从游戏工程抽取背景代码
play/                   《班级抽卡 · 重置版》网页版（Godot 4.7.2 导出）
```

## 背景的代码墙是真的

页面背景那面滚动的代码墙是从《班级抽卡 · 重置版》的 Godot 工程里
随机抽出的真实 GDScript 片段（14 个脚本、420 行），连中文标识符和
`print` 里的表情都保留着。抽取时会把注释行和行尾注释一起切掉，
只留代码，小字号下才不会糊成一片。

想更新：改完游戏后跑一次

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\build-code-wall.ps1 -SourceDir "D:\我游戏\班级抽卡-重置版"
```

脚本会重新读工程里的 `.gd`，覆盖 `assets/js/codes.js`。

## 下载：四个平台，怎么连到发行版

游戏的包都发在仓库 **[YangChen2235/---](https://github.com/YangChen2235/---/releases)**
的 Releases 里，这个站点仓库本身不放包。页面上四个平台卡片各自负责一件事：

| 卡片 | 连到哪 |
|---|---|
| Windows | 发行版里最新的 `Windows.zip` |
| Linux | 最新一个带 `Linux.zip` 的发行版 |
| Android | 最新一个带 `Android.zip` 的发行版 |
| 网页版 | `play/`，不用下载 |

`index.html` 里每张卡片都写好了一条**能直接下载的真实直链**，所以就算接口
不通也点得动。`site.js` 再调 GitHub 的公开接口
`/repos/YangChen2235/---/releases?per_page=20` 做一次升级：按时间倒序找
「确实带这个平台包」的最新发行版，把卡片 href 换成那个资产，并把体积
（如 `355 MB · 解压即玩`）填进卡片副标题；主按钮和「最新发行版」那行
提示也一起更新。

接口查不到（限流、断网）时什么也不改：卡片上仍是你写死的直链和默认文案，
页面照样能用。所以发新版以后即使没人改代码，页面也会自己跟上；
要是接口长期被限流，记得手动把 `index.html` 里那几条直链更新一下。

## 音乐板块

四首曲子放在 `assets/audio/`，都是 Suno 生成的（页面上每首都标了「Suno 生成」）。

播放器是手写的，没引第三方库：`audio` 元素在 `site.js` 里建一个复用，
点哪首就换 `src`，所以永远只有一首在响；再点同一个按钮是暂停。
进度条按 `timeupdate` 更新，点进度条能跳到那个位置。

曲子是 mp3，每个 3.5–5.7 MB，浏览器会自己按需加载（`preload="none"`，
不点播放不下载），所以不会拖慢首屏。
## 网页版（play/）

网页版就是同一个游戏的 Godot Web 导出，放在 `play/` 里，入口是 `play/index.html`。

第一次打开要下载约 80 MB 的游戏包（页面上有中文进度条），之后浏览器会缓存。
存档存在浏览器本地（IndexedDB），换浏览器 / 清缓存就没了 —— 重要进度请用游戏里的
「设置 → 存档 → 导出」存出来。

那 80 MB 是这么砍下来的：`index.pck` 原本 420 MB → 图片有损压缩 159 MB →
去掉 24 首 BGM 71 MB → 切 3 片 + 自己 gzip 后传输量 **79.7 MB**。
自己压是因为 GitHub Pages 不给 `.wasm` / `.pck` 做传输压缩，得在浏览器里用
`DecompressionStream` 解开。细节都在 `play/index.html` 的启动脚本注释里。

---

作者：YangChen2235 · 更多仓库：<https://github.com/YangChen2235>
