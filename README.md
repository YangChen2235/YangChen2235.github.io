# YangChen2235.github.io

个人主页，用 GitHub Pages 托管：**<https://yangchen2235.github.io/>**

整站是手写的 HTML + CSS + 原生 JS，没有框架、没有构建步骤 —— 改完文件直接推上来就是线上。

## 站点内容

| 板块 | 说明 |
|---|---|
| Hero | 头像、名字、一句自我介绍、下载 / 网页版两个主入口 |
| 关于我 | 4 年编程、2 年信息学奥赛、人与 AI 协作、转型做游戏（右侧配一个 C++ 版的 profile.cpp 卡片） |
| 在做的项目 | 《班级抽卡 · 重置版》《骰子对决》和练手合集 |
| 下载 | 最新发行版按钮（自动探测）+ 「不用会 GitHub」的三步图解 |

## 目录结构

```
index.html              主页
assets/css/style.css    全部样式（蓝白配色、响应式）
assets/js/codes.js      背景代码墙的数据：从游戏源码里抽出来的真实代码
assets/js/code-wall.js  把代码画成会向上滚的「胶片」
assets/js/site.js       导航吸顶、入场动画、打字机、发行版自动探测
assets/img/avatar.png   导航栏左上角的头像
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

## 下载按钮怎么指向「最新发行版」

GitHub Pages 没有服务端，所以 `site.js` 在浏览器里调 GitHub 的公开接口
`/repos/YangChen2235/<repo>/releases/latest`，查到就把按钮指到最新的
zip 资产并显示体积、下载次数、发布时间；查不到（还没有发行版、被限流、
断网）就保持指向 `releases/latest` 这个兜底地址，并把提示换成「先玩网页版」。

要发新版：在这个仓库建一个 Release 并上传 zip，页面下次刷新会自动跟上，
**不需要改代码**。

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
