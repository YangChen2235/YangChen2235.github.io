# 从《班级抽卡·重置版》的 GDScript 源码里抽取真实代码行，生成首页背景代码滚动墙的数据文件。
#
# 用法：
#   pwsh -File tools/build-code-wall.ps1 -SourceDir "D:\我游戏\班级抽卡-重置版"
#   可选 -OutFile 指定输出（默认 assets/js/codes.js）
#
# 做法：在若干代表性脚本里随机取「连续窗口」，保留其中的可读行，因此成片代码是原样的，
# 而不是把散乱的单行拼在一起。

param(
    [string]$SourceDir = "D:\我游戏\班级抽卡-重置版",
    [string]$OutFile = "",
    [int]$MaxWidthUnit = 74,   # 半角字符宽度计 1，中文计 2
    [int]$TargetLines = 420,
    [int]$Seed = 20260101
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($OutFile)) {
    $OutFile = Join-Path (Split-Path -Parent $scriptDir) "assets/js/codes.js"
}

if (-not (Test-Path $SourceDir)) { throw "找不到源码目录：$SourceDir" }

# 代表性脚本：核心 / 界面 / 系统 / 规则 / 类，各自取几份
$wanted = @(
    "核心\卡牌管理.gd",
    "核心\卡组扩充数据.gd",
    "核心\战役管理.gd",
    "核心\对局状态.gd",
    "界面\主界面.gd",
    "界面\图鉴.gd",
    "界面\设置界面.gd",
    "界面\骰子对决\骰子对决战斗画面.gd",
    "系统\存档管理.gd",
    "系统\开发者指令.gd",
    "规则\校园成长模拟.gd",
    "类\学生类.gd",
    "界面\模组\制作模组工具.gd",
    "界面\战役\战役主界面.gd"
)

$files = @()
foreach ($w in $wanted) {
    $p = Join-Path $SourceDir $w
    if (Test-Path $p) { $files += (Get-Item $p) }
}
if ($files.Count -eq 0) {
    # 退路：抓所有 .gd，取最大的十几份
    $files = Get-ChildItem $SourceDir -Recurse -Include *.gd -File |
        Where-Object { $_.FullName -notmatch '\\_scratch\\|\\历史版本\\|\\.godot\\' } |
        Sort-Object Length -Descending | Select-Object -First 14
}

function Measure-Width([string]$s) {
    $w = 0
    foreach ($ch in $s.ToCharArray()) {
        if ([int]$ch -gt 0x2E80) { $w += 2 } else { $w += 1 }
    }
    return $w
}

function ConvertTo-JsonString([string]$s) {
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append('"')
    foreach ($ch in $s.ToCharArray()) {
        $code = [int]$ch
        if ($ch -eq '"') { [void]$sb.Append('\"') }
        elseif ($ch -eq '\') { [void]$sb.Append('\\') }
        elseif ($code -lt 32) { [void]$sb.Append((' ')) }
        else { [void]$sb.Append($ch) }
    }
    [void]$sb.Append('"')
    return $sb.ToString()
}

function Test-KeepLine([string]$raw) {
    $t = $raw.TrimEnd()
    if ([string]::IsNullOrWhiteSpace($t)) { return $false }
    # 去掉制表符，保留缩进信息（用 4 空格换算）
    $lead = $t.Length - $t.TrimStart().Length
    $tabs = ($t.TrimStart() -ne $t)
    $indent = 0
    $body = $t.TrimStart()
    $orig = $raw
    $leadRaw = $orig.Length - $orig.TrimStart().Length
    $indent = [math]::Min(8, $leadRaw * 2)
    if ((Measure-Width $body) + $indent -gt $MaxWidthUnit) { return $false }
    if ($body -match '^```') { return $false }
    if ($body.Length -lt 3) { return $false }
    return $true
}

$rng = New-Object System.Random($Seed)
$collected = New-Object System.Collections.Generic.List[string]
$fileCount = 0

foreach ($f in $files) {
    $lines = Get-Content -LiteralPath $f.FullName -Encoding UTF8
    if (-not $lines -or $lines.Count -lt 20) { continue }
    $fileCount++
    $contrib = 0
    $attempts = 0
    while ($contrib -lt [math]::Min(46, [math]::Ceiling($TargetLines / $files.Count) + 12) -and $attempts -lt 40) {
        $attempts++
        $winLen = $rng.Next(16, 34)
        $start = $rng.Next(0, [math]::Max(1, $lines.Count - $winLen))
        $block = New-Object System.Collections.Generic.List[string]
        for ($i = $start; $i -lt [math]::Min($start + $winLen, $lines.Count); $i++) {
            $raw = $lines[$i]
            if (-not (Test-KeepLine $raw)) { continue }
            $leadRaw = $raw.Length - $raw.TrimStart().Length
            $indent = [math]::Min(8, $leadRaw * 2)
            $block.Add((' ' * $indent) + $raw.Trim())
        }
        if ($block.Count -lt 6) { continue }
        foreach ($b in $block) { $collected.Add($b) }
        $contrib += $block.Count
    }
}

# 去重但保序
$seen = New-Object 'System.Collections.Generic.HashSet[string]'
$final = New-Object System.Collections.Generic.List[string]
foreach ($l in $collected) {
    if ($seen.Add($l)) { $final.Add($l) }
    if ($final.Count -ge $TargetLines) { break }
}

$stamp = (Get-Date).ToString("yyyy-MM-dd")

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("/* 自动生成，请勿手改 —— 由 tools/build-code-wall.ps1 生成。")
[void]$sb.AppendLine("   内容是从《班级抽卡·重置版》GDScript 源码里抽出的真实代码行，用作首页背景滚动墙。 */")
[void]$sb.AppendLine("window.CODE_WALL_DATA = {")
[void]$sb.AppendLine("  generated: " + (ConvertTo-JsonString $stamp) + ",")
[void]$sb.AppendLine("  source: " + (ConvertTo-JsonString "《班级抽卡·重置版》GDScript 源码") + ",")
[void]$sb.AppendLine("  fileCount: " + $fileCount + ",")
[void]$sb.AppendLine("  lines: [")
for ($i = 0; $i -lt $final.Count; $i++) {
    $comma = if ($i -lt $final.Count - 1) { "," } else { "" }
    [void]$sb.AppendLine("    " + (ConvertTo-JsonString $final[$i]) + $comma)
}
[void]$sb.AppendLine("  ]")
[void]$sb.AppendLine("};")

$enc = New-Object System.Text.UTF8Encoding($false)
$dir = Split-Path -Parent $OutFile
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
[System.IO.File]::WriteAllText($OutFile, $sb.ToString(), $enc)

Write-Output ("OK: {0} 行，来自 {1} 个脚本 -> {2}" -f $final.Count, $fileCount, $OutFile)
