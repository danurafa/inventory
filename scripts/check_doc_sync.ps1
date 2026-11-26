# Cek sinkronisasi docs terhadap git HEAD dan cache-buster di index.html.
# Dipanggil manual:
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\check_doc_sync.ps1
# Dipanggil otomatis oleh .git/hooks/pre-commit (lihat scripts\install_doc_sync_hook.ps1).

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$indexFile = Join-Path $root 'index.html'
$docs = @(
    (Join-Path $root 'docs\SESSION-HANDOVER.md'),
    (Join-Path $root 'docs\TABEL-PAGINATION-ALAMAT.md')
)

$cachePattern = 'assets/(styles\.css|app\.js)\?v=([^"''``\s<>]+)'
$headPattern = 'HEAD\s*`?([0-9a-f]{7,40})`?'

function Get-CachePairs {
    param([string]$Text)

    $found = @()
    foreach ($match in [regex]::Matches($Text, $cachePattern)) {
        $pair = "assets/$($match.Groups[1].Value)?v=$($match.Groups[2].Value)"
        if ($found -notcontains $pair) {
            $found += $pair
        }
    }
    return $found
}

$errors = New-Object 'System.Collections.Generic.List[string]'

$head = ''
try {
    $head = (& git -C $root rev-parse --short HEAD 2>$null).Trim()
} catch {
    $head = ''
}
if (-not $head) {
    Write-Host '[GAGAL] Tidak bisa membaca HEAD git. Pastikan Jalankan dari repo yang valid.' -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $indexFile)) {
    Write-Host "[GAGAL] Tidak ditemukan: $indexFile" -ForegroundColor Red
    exit 1
}

$indexText = [IO.File]::ReadAllText($indexFile)
$expectedCache = Get-CachePairs $indexText
if ($expectedCache.Count -eq 0) {
    [void]$errors.Add('index.html: tidak ada query ?v= untuk styles.css/app.js')
}

foreach ($doc in $docs) {
    if (-not (Test-Path $doc)) {
        [void]$errors.Add("File docs tidak ditemukan: $doc")
        continue
    }

    $text = [IO.File]::ReadAllText($doc)
    $name = Split-Path -Leaf $doc

    $headMatch = [regex]::Match($text, $headPattern)
    if (-not $headMatch.Success) {
        [void]$errors.Add("$($name): tidak ada marker HEAD di dekat bagian cache/header")
    } elseif ($headMatch.Groups[1].Value -ne $head) {
        [void]$errors.Add("$($name): HEAD ``$($headMatch.Groups[1].Value)`` != git ``$head``")
    }

    $actualCache = Get-CachePairs $text
    foreach ($pair in $expectedCache) {
        if ($actualCache -notcontains $pair) {
            [void]$errors.Add("$($name): cache ketinggalan -> $pair")
        }
    }
    foreach ($pair in $actualCache) {
        if ($expectedCache -notcontains $pair) {
            [void]$errors.Add("$($name): cache lama masih ada -> $pair")
        }
    }

    if ($text -match 'belum di-commit') {
        [void]$errors.Add("$($name): masih ada catatan 'belum di-commit'")
    }
}

if ($errors.Count -gt 0) {
    Write-Host "[GAGAL] Docs belum sinkron dengan HEAD $head." -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "  - $err" -ForegroundColor Yellow
    }
    exit 1
}

Write-Host "[OK] HEAD $head; cache docs == index.html; tidak ada catatan 'belum di-commit'." -ForegroundColor Green
exit 0
