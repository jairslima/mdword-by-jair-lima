<#
Automatiza o fluxo repetitivo de release do MDWord by Jair Lima:
build -> smoke test local -> commit/tag/push -> release no GitHub -> manifesto winget -> PR no winget-pkgs.

Pressupostos (fazer ANTES de rodar):
  - "version" em package.json ja atualizado para o valor de -Version.
  - CHANGELOG.md ja tem uma entrada nova descrevendo a mudanca.
  - PROJECT.md, se precisar de atualizacao de conteudo, e responsabilidade separada (nao mexido aqui).

Por padrao o script so builda e testa localmente (nao publica nada). Passe -Publish para
commitar/taguear/enviar/criar release, e -WingetPR (junto com -Publish) para tambem criar
o manifesto e abrir o PR no winget-pkgs.

Exemplos:
  # so builda e testa localmente, nao mexe em git/GitHub/winget
  .\scripts\release.ps1 -Version 0.1.3 -CommitMessage "fix: ..." -ReleaseNotes "..."

  # builda, testa, commita, cria tag+release no GitHub (sem winget)
  .\scripts\release.ps1 -Version 0.1.3 -CommitMessage "fix: ..." -ReleaseNotes "..." -Publish

  # fluxo completo, incluindo PR novo no winget-pkgs
  .\scripts\release.ps1 -Version 0.1.3 -CommitMessage "fix: ..." -ReleaseNotes "..." -Publish -WingetPR -WingetPRBody "..."
#>

param(
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$CommitMessage,
    [Parameter(Mandatory = $true)][string]$ReleaseNotes,
    [string]$WingetPRBody,
    [switch]$SkipBuild,
    [switch]$SkipSmokeTest,
    [switch]$Publish,
    [switch]$WingetPR
)

$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $PSScriptRoot
$RepoSlug = "jairslima/mdword-by-jair-lima"
$WingetForkSlug = "jairslima/winget-pkgs"
$PackageIdentifier = "JairLima.MDWord"
$InstallerName = "MDWord-$Version-Setup.exe"
$InstallerPath = Join-Path $ProjectDir "release\$InstallerName"

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# --- 1. Confere que package.json bate com -Version ---
Step "Verificando package.json"
$pkg = Get-Content (Join-Path $ProjectDir "package.json") -Raw | ConvertFrom-Json
if ($pkg.version -ne $Version) {
    throw "package.json tem version '$($pkg.version)', esperado '$Version'. Atualize o package.json antes de rodar o script."
}

# --- 2. Build ---
if (-not $SkipBuild) {
    Step "Build (npm run dist)"
    Push-Location $ProjectDir
    try {
        $log = Join-Path $env:TEMP "mdword-build-$Version.log"
        # NUNCA usar pipe (| tail) aqui - ja mascarou build quebrado 2x. Redirecionar direto pra arquivo.
        & npm run dist *> $log
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) {
            throw "npm run dist falhou (exit $exitCode). Log completo: $log"
        }
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path $InstallerPath)) {
    throw "Instalador nao encontrado em $InstallerPath apos o build."
}
Write-Host "Instalador OK: $InstallerPath"

# --- 3. Smoke test local (/S instala e fecha sozinho, app abre sem crash) ---
if (-not $SkipSmokeTest) {
    Step "Smoke test: instalacao silenciosa"
    $proc = Start-Process -FilePath $InstallerPath -ArgumentList "/S" -PassThru
    $waited = 0
    while ((Get-Process -Id $proc.Id -ErrorAction SilentlyContinue) -and $waited -lt 180) {
        Start-Sleep -Seconds 3
        $waited += 3
    }
    if (Get-Process -Id $proc.Id -ErrorAction SilentlyContinue) {
        Write-Warning "Instalador nao fechou sozinho em 180s (janela residual conhecida em alguns runs). Encerrando manualmente."
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }

    $installDir = "$env:LOCALAPPDATA\Programs\$($pkg.name)"
    $exePath = Join-Path $installDir "MDWord.exe"
    if (-not (Test-Path $exePath)) {
        throw "Instalacao silenciosa nao produziu $exePath."
    }
    $installedVersion = (Get-Item $exePath).VersionInfo.FileVersion
    Write-Host "App instalado, versao reportada: $installedVersion"

    Start-Process $exePath
    Start-Sleep -Seconds 6
    $running = Get-Process | Where-Object { $_.ProcessName -eq "MDWord" }
    if (-not $running) {
        throw "App nao abriu apos instalacao silenciosa."
    }
    $running | Stop-Process -Force

    # limpa o teste (desinstala, best-effort - desinstalador tem historico de janela residual)
    $uninstaller = Get-ChildItem $installDir -Filter "Uninstall*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($uninstaller) {
        $uproc = Start-Process -FilePath $uninstaller.FullName -ArgumentList "/S" -PassThru
        $waited = 0
        while ((Get-Process -Id $uproc.Id -ErrorAction SilentlyContinue) -and $waited -lt 60) {
            Start-Sleep -Seconds 3
            $waited += 3
        }
        Get-Process -Id $uproc.Id -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $installDir -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "$env:USERPROFILE\Desktop\MDWord.lnk" -Force -ErrorAction SilentlyContinue
    Write-Host "Smoke test OK, ambiente de teste limpo."
}

if (-not $Publish) {
    Write-Host "`n-Publish nao foi passado: build e teste concluidos, nada foi commitado/publicado." -ForegroundColor Yellow
    return
}

# --- 4. Git commit + tag + push ---
Step "Git: commit, tag v$Version, push"
Push-Location $ProjectDir
try {
    git add package.json CHANGELOG.md
    git commit -m $CommitMessage
    git tag -a "v$Version" -m "v$Version"
    git push origin HEAD
    git push origin "v$Version"
} finally {
    Pop-Location
}

# --- 5. Release no GitHub ---
Step "GitHub release v$Version"
gh release create "v$Version" $InstallerPath --repo $RepoSlug --title "v$Version" --notes $ReleaseNotes

if (-not $WingetPR) {
    Write-Host "`n-WingetPR nao foi passado: release publicada, manifesto winget nao foi tocado." -ForegroundColor Yellow
    return
}

# --- 6. Manifesto winget: descobrir versao anterior como template ---
Step "Winget: montando manifesto $Version"
$versions = gh api "repos/$WingetForkSlug/contents/manifests/j/JairLima/MDWord" --jq '.[].name' |
    Where-Object { $_ -match '^\d+\.\d+\.\d+$' } |
    Sort-Object { [version]$_ }
$prevVersion = $versions | Select-Object -Last 1
if (-not $prevVersion) { throw "Nenhuma versao anterior encontrada em manifests/j/JairLima/MDWord no fork." }
Write-Host "Usando $prevVersion como template."

$tmpDir = Join-Path $env:TEMP "mdword-winget-$Version"
Remove-Item $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $tmpDir | Out-Null

$sha256 = (Get-FileHash $InstallerPath -Algorithm SHA256).Hash
$installerUrl = "https://github.com/$RepoSlug/releases/download/v$Version/$InstallerName"

$files = @("$PackageIdentifier.yaml", "$PackageIdentifier.installer.yaml", "$PackageIdentifier.locale.en-US.yaml")
foreach ($f in $files) {
    $b64 = gh api "repos/$WingetForkSlug/contents/manifests/j/JairLima/MDWord/$prevVersion/${f}?ref=master" --jq '.content'
    $content = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64))
    $content = $content -replace "PackageVersion: $prevVersion", "PackageVersion: $Version"
    $content = $content -replace "InstallerUrl:.*", "InstallerUrl: $installerUrl"
    $content = $content -replace "InstallerSha256:.*", "InstallerSha256: $sha256"
    Set-Content -Path (Join-Path $tmpDir $f) -Value $content -NoNewline
}

winget validate --manifest $tmpDir
if ($LASTEXITCODE -ne 0) { throw "winget validate falhou para o manifesto $Version." }

# --- 7. Branch + commit no fork via Contents API, depois PR ---
Step "Winget: branch, commit e PR"
$branch = "$PackageIdentifier-$Version"
$baseSha = gh api "repos/$WingetForkSlug/git/refs/heads/master" --jq '.object.sha'
gh api "repos/$WingetForkSlug/git/refs" -f ref="refs/heads/$branch" -f sha="$baseSha" | Out-Null

foreach ($f in $files) {
    $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content (Join-Path $tmpDir $f) -Raw)))
    gh api --method PUT "repos/$WingetForkSlug/contents/manifests/j/JairLima/MDWord/$Version/$f" `
        -f message="Add $PackageIdentifier version $Version" `
        -f content="$b64" `
        -f branch="$branch" | Out-Null
}

if (-not $WingetPRBody) { $WingetPRBody = $ReleaseNotes }
$prUrl = gh pr create --repo microsoft/winget-pkgs --head "jairslima:$branch" `
    --title "New version: $PackageIdentifier version $Version" --body $WingetPRBody
Write-Host "`nPR criado: $prUrl" -ForegroundColor Green
