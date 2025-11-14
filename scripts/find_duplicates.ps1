$path = 'c:\Users\Administrator\Desktop\gocartlovm-main - v1\supabase\migrations\20250114_populate_all_site_texts.sql'
$text = Get-Content -Raw -Path $path -Encoding UTF8
# Find all ('key', 'lang'
$matches = [regex]::Matches($text, "\('([^']+)',\s*'([a-z]{2})'", [System.Text.RegularExpressions.RegexOptions]::None)
$pairs = @()
foreach ($m in $matches) { $pairs += "$($m.Groups[1].Value)|$($m.Groups[2].Value)" }
$counts = @{}
foreach ($p in $pairs) { if ($counts.ContainsKey($p)) { $counts[$p]++ } else { $counts[$p] = 1 } }
Write-Host "Total distinct (key,lang) pairs found: $($counts.Count)"
$dups = $counts.GetEnumerator() | Where-Object { $_.Value -gt 1 }
if (-not $dups) { Write-Host 'No duplicates found across whole file.' } else { Write-Host 'Duplicates across file:'; $dups | Sort-Object Name | ForEach-Object { Write-Host "  $($_.Name) : $($_.Value) occurrences" } }

# Also check per INSERT ... ON CONFLICT block
$blocks = [regex]::Matches($text, "INSERT INTO site_texts \(key, language_code, value, type, namespace, context\) VALUES\s*(.*?)ON CONFLICT", [System.Text.RegularExpressions.RegexOptions]::Singleline)
for ($i = 0; $i -lt $blocks.Count; $i++) {
    $blk = $blocks[$i].Groups[1].Value
    $m = [regex]::Matches($blk, "\('([^']+)',\s*'([a-z]{2})'")
    $c = @{}
    foreach ($mm in $m) { $k = "$($mm.Groups[1].Value)|$($mm.Groups[2].Value)"; if ($c.ContainsKey($k)) { $c[$k]++ } else { $c[$k] = 1 } }
    $d = $c.GetEnumerator() | Where-Object { $_.Value -gt 1 }
    Write-Host "`nBlock $($i+1) duplicates:"
    if (-not $d) { Write-Host '  None' } else { $d | Sort-Object Name | ForEach-Object { Write-Host "  $($_.Name) : $($_.Value) occurrences" } }
}
