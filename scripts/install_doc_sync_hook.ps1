# Pasang hook pre-commit yang memanggil scripts\check_doc_sync.ps1.
# File .git\hooks\pre-commit bersifat lokal (tidak ikut ke git), jadi jalankan
# sekali setelah clone/pull:
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\install_doc_sync_hook.ps1

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$hookDir = Join-Path $root '.git\hooks'

if (-not (Test-Path $hookDir)) {
    throw "Tidak ditemukan folder hook git: $hookDir"
}

$hook = Join-Path $hookDir 'pre-commit'
$markerStart = '# >>> inventory-doc-sync >>>'
$markerEnd = '# <<< inventory-doc-sync <<<'

$block = @(
    '#!/bin/sh',
    $markerStart,
    'cd "$(git rev-parse --show-toplevel)" || exit 1',
    'powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/check_doc_sync.ps1',
    $markerEnd
) -join "`n"

if (Test-Path $hook) {
    $existing = [IO.File]::ReadAllText($hook)
    if ($existing -match [regex]::Escape($markerStart)) {
        Write-Host "Hook sudah terpasang: $hook" -ForegroundColor Green
        exit 0
    }
    $content = $existing.TrimEnd([char]13, [char]10) + "`n`n" + $block + "`n"
} else {
    $content = $block + "`n"
}

[IO.File]::WriteAllText($hook, $content, [Text.UTF8Encoding]::new($false))

# Git for Windows butuh bit executable. Kalau sh.exe tersedia, set di sini.
$sh = @(
    'C:\Program Files\Git\bin\sh.exe',
    'C:\Program Files\Git\usr\bin\sh.exe'
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($sh) {
    $posix = $hook.Replace('\', '/')
    $posix = [regex]::Replace($posix, '^([A-Za-z]):', {
        param($m)
        '/' + $m.Groups[1].Value.ToLowerInvariant()
    })
    & $sh -c "chmod +x '$posix'" 2>$null | Out-Null
}

Write-Host "Terpasang: $hook" -ForegroundColor Green
Write-Host 'Cek manual: powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\check_doc_sync.ps1' -ForegroundColor Cyan
