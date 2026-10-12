# Complete Mulero Analytics GitHub repository metadata from the VS Code PowerShell terminal.
# No extra downloads, no Python, no source-code edits, no forced pushes, no stash deletion.
# GitHub does not currently expose a supported API for changing pinned profile repositories.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$owner = 'tosinmulero'
$website = 'https://tosinmulero.github.io/data-analytics-portfolio/'
$projectsUrl = $website + 'projects.html'

function Resolve-GitHubCli {
    $cmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
        throw 'GitHub CLI is missing and winget is unavailable. Install GitHub CLI from https://cli.github.com then rerun this script.'
    }
    Write-Host 'Installing GitHub CLI with winget...' -ForegroundColor Yellow
    & winget install --id GitHub.cli --exact --source winget --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) {
        throw 'GitHub CLI installation failed. Check the winget output.'
    }
    $paths = @(
        (Join-Path $env:ProgramFiles 'GitHub CLI\gh.exe'),
        (Join-Path $env:ProgramFiles 'GitHub CLI\bin\gh.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\GitHub CLI\gh.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\GitHub CLI\bin\gh.exe')
    )
    foreach ($p in $paths) {
        if (Test-Path -LiteralPath $p) {
            $env:PATH = (Split-Path $p -Parent) + ';' + $env:PATH
            return $p
        }
    }
    $cmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    throw 'GitHub CLI was installed but is not yet visible. Open a fresh VS Code terminal and rerun the SAME command.'
}

function Invoke-Gh {
    param([string]$Endpoint, [string]$Method = 'GET', $Body = $null)
    $temp = $null
    try {
        $argsGh = @('api', $Endpoint, '--method', $Method,
                    '-H', 'Accept: application/vnd.github+json')
        if ($null -ne $Body) {
            $temp = [System.IO.Path]::GetTempFileName()
            $encoded = ConvertTo-Json -InputObject $Body -Depth 15 -Compress
            [System.IO.File]::WriteAllText(
                $temp, $encoded, (New-Object System.Text.UTF8Encoding($false))
            )
            $argsGh += @('--input', $temp)
        }
        $out = @(& gh @argsGh 2>&1)
        if ($LASTEXITCODE -ne 0) {
            throw "GitHub $Method $Endpoint failed: $($out -join ' ')"
        }
        $joined = (($out | Out-String).Trim())
        if ($joined) { return ($joined | ConvertFrom-Json) }
        return $null
    }
    finally {
        if ($temp -and (Test-Path -LiteralPath $temp)) {
            Remove-Item -LiteralPath $temp -Force
        }
    }
}

$root = (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent)
if (-not (Test-Path -LiteralPath (Join-Path $root '.git'))) {
    throw "Expected Git repository was not found at $root"
}
$origin = (& git -C $root remote get-url origin | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or
    $origin -notmatch '^(https://github[.]com/|git@github[.]com:|\bssh://git@github[.]com/)(tosinmulero/data-analytics-portfolio)([.]git)?$') {
    throw "Unexpected repository remote: $origin"
}

Write-Host ''
Write-Host 'MULERO ANALYTICS | ONE-RUN GITHUB OPTIMISATION' -ForegroundColor Cyan
$null = Resolve-GitHubCli
& gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Sign in to GitHub in the browser that opens...' -ForegroundColor Yellow
    & gh auth login --hostname github.com --web --git-protocol https --scopes 'repo,user'
    if ($LASTEXITCODE -ne 0) { throw 'GitHub sign-in was not completed.' }
}
$me = Invoke-Gh -Endpoint 'user'
if ($me.login -ne $owner) {
    throw "Authenticated GitHub account is '$($me.login)', not '$owner'. No settings were changed."
}

# Topic additions are merged with existing topics, never blindly overwritten.
# Existing descriptions remain untouched except where explicitly improved below.
$settings = @(
    @{name='tosinmulero'; description='Oluwatosin Mulero: Data Analyst, BI Analyst and Data Scientist. SQL, Python, Power BI and analytics engineering.'; topics=@('github-profile','portfolio','data-analytics','data-science','power-bi','sql','python')},
    @{name='data-analytics-portfolio'; description='Mulero Analytics website: 11 independently documented data analytics, BI and data science portfolio projects.'; topics=@('github-pages','portfolio-website','html','css','javascript')},
    @{name='nhs-primary-care-intelligence-platform'; topics=@('healthcare-analytics','synthetic-data','data-quality','power-bi','dbt','postgresql','sql','python')},
    @{name='railnexus-b2b-product-growth-intelligence'; topics=@('product-analytics','experimentation','machine-learning','network-analysis','python','fastapi','docker','b2b')},
    @{name='railpartner-360'; description='B2B rail analytics platform using PostgreSQL, dbt, Python and Power BI for partner performance, conversion and commercial intelligence.'; topics=@('analytics-engineering','rail-analytics','postgresql','dbt','python','power-bi','b2b')},
    @{name='railflow-ml-data-platform'; topics=@('portfolio')},
    @{name='railsearch-customer-journey-intelligence'; topics=@('product-analytics','customer-journey','conversion-analytics','machine-learning','duckdb','fastapi','python')},
    @{name='credit-risk-explainable-ai'; topics=@('credit-risk','explainable-ai','xgboost','shap','mlflow','model-governance','python')},
    @{name='customer-360-revenue-growth-analytics'; topics=@('portfolio')},
    @{name='nhs-hospital-performance-analysis'; topics=@('portfolio')},
    @{name='olist-ecommerce-analysis'; topics=@('portfolio')},
    @{name='cyclistic-rider-behaviour-analysis'; topics=@('portfolio')},
    @{name='bellabeat-wellness-analysis'; topics=@('portfolio')}
)
$backups = Join-Path (Split-Path $root -Parent) ('mulero-site-backups\github-settings-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backups -Force | Out-Null

# Capture all settings before making any API changes.
Write-Host 'Backing up current profile and all 13 repository settings...' -ForegroundColor Cyan
$old = @{}
foreach ($item in $settings) {
    $name = $item.name
    $repoInfo = Invoke-Gh -Endpoint "repos/$owner/$name"
    $repoTopics = Invoke-Gh -Endpoint "repos/$owner/$name/topics"
    $old[$name] = @{
        description = $repoInfo.description
        homepage = $repoInfo.homepage
        visibility = $repoInfo.visibility
        topics = @($repoTopics.names)
    }
}
$backupData = @{profile=@{login=$me.login;blog=$me.blog;bio=$me.bio}; repositories=$old}
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText(
    (Join-Path $backups 'github-settings-before.json'),
    (ConvertTo-Json -InputObject $backupData -Depth 20),
    $utf8
)

# Preserve the user's previously stashed changes.
$stashes = @(& git -C $root stash list)
[System.IO.File]::WriteAllLines(
    (Join-Path $backups 'stash-list.txt'), [string[]]$stashes, $utf8
)
if ($stashes.Count -gt 0) {
    $diff = @(& git -C $root --no-pager diff --unified=2 'stash@{0}' HEAD -- about.html style.css)
    if ($LASTEXITCODE -eq 0) {
        [System.IO.File]::WriteAllLines(
            (Join-Path $backups 'stash-vs-current.txt'), [string[]]$diff, $utf8
        )
    }
}

$failures = New-Object 'System.Collections.Generic.List[string]'
$successes = 0
foreach ($item in $settings) {
    $name = [string]$item.name
    $original = $old[$name]
    try {
        $homepage = $website
        if ($name -ne 'tosinmulero' -and $name -ne 'data-analytics-portfolio') {
            $homepage = $projectsUrl + '?project=' + [uri]::EscapeDataString($name)
        }
        $changes = @{}
        if ([string]$original.homepage -ne $homepage) {
            $changes['homepage'] = $homepage
        }
        if ($item.ContainsKey('description')) {
            if ($name -eq 'data-analytics-portfolio' -or
                [string]::IsNullOrWhiteSpace([string]$original.description)) {
                if ([string]$original.description -ne [string]$item.description) {
                    $changes['description'] = [string]$item.description
                }
            }
        }
        if ($changes.Count -gt 0) {
            $null = Invoke-Gh -Endpoint "repos/$owner/$name" -Method 'PATCH' -Body $changes
        }

        $merged = @(
            @($original.topics) + @($item.topics) |
                Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } |
                ForEach-Object { ([string]$_).ToLowerInvariant() } |
                Sort-Object -Unique
        )
        if ($merged.Count -gt 20) {
            throw "GitHub allows at most 20 topics; this repository has $($merged.Count)."
        }
        $currentTopics = @($original.topics | Sort-Object) -join ','
        $desiredTopics = @($merged | Sort-Object) -join ','
        if ($desiredTopics -ne $currentTopics) {
            $null = Invoke-Gh -Endpoint "repos/$owner/$name/topics" -Method 'PUT' -Body @{names=@($merged)}
        }
        Write-Host "OK: $name" -ForegroundColor Green
        $successes++
    }
    catch {
        $msg = "FAILED: $name | $($_.Exception.Message)"
        $failures.Add($msg)
        Write-Host $msg -ForegroundColor Yellow
    }
}

try {
    if ([string]$me.blog -ne $website) {
        $updateProfile = @{blog=$website}
        if ([string]::IsNullOrWhiteSpace([string]$me.bio)) {
            $updateProfile['bio'] = 'Data Analyst | BI & Data Scientist | SQL, Python, Power BI | MSc Data Science | Mulero Analytics'
        }
        $null = Invoke-Gh -Endpoint 'user' -Method 'PATCH' -Body $updateProfile
    }
    Write-Host 'OK: GitHub profile website' -ForegroundColor Green
}
catch {
    $msg = "FAILED: GitHub profile website | $($_.Exception.Message)"
    $failures.Add($msg)
    Write-Host $msg -ForegroundColor Yellow
}

# Verify the external changes through GitHub again.
Write-Host ''
Write-Host 'Verification sample:' -ForegroundColor Cyan
foreach ($name in @('data-analytics-portfolio','railpartner-360','nhs-primary-care-intelligence-platform')) {
    try {
        $check = Invoke-Gh -Endpoint "repos/$owner/$name"
        Write-Host ($name + ': ' + [string]$check.homepage)
    }
    catch {
        Write-Host "Unable to verify $name now." -ForegroundColor Yellow
    }
}
try {
    $v=Invoke-Gh -Endpoint 'user'
    Write-Host ('Public profile website: ' + [string]$v.blog)
}
catch { Write-Host 'Unable to verify profile website now.' -ForegroundColor Yellow }

[System.IO.File]::WriteAllLines(
    (Join-Path $backups 'results.txt'),
    [string[]]@("Repositories succeeded: $successes", "Failures: $($failures.Count)") + [string[]]$failures,
    $utf8
)
Write-Host ''
Write-Host "Repository metadata updated: $successes/13." -ForegroundColor Cyan
Write-Host "Backups and stash comparison: $backups"
Write-Host 'Git stash retained; no website source code was modified.'
Write-Host 'Profile pins must be selected in GitHub > Your profile > Customize your pins.'
Write-Host 'Pin: nhs-primary-care-intelligence-platform, railnexus-b2b-product-growth-intelligence, railpartner-360, credit-risk-explainable-ai, customer-360-revenue-growth-analytics, data-analytics-portfolio.'
if ($failures.Count -gt 0) {
    throw "$($failures.Count) GitHub setting(s) could not be updated. Review results.txt in the backup folder."
}
Write-Host 'MULERO GITHUB METADATA OPTIMISATION COMPLETE' -ForegroundColor Green
