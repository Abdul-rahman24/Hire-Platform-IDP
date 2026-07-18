param(
    [string]$OutputZip = "",
    [string]$BuildRoot = ".build-lambda"
)

$ErrorActionPreference = "Stop"

function Remove-WorkspaceArtifacts {
    param(
        [string]$RepoRoot
    )

    $rootCleanupPatterns = @("build*", "package*", "dist*")
    foreach ($pattern in $rootCleanupPatterns) {
        Get-ChildItem -Path $RepoRoot -Force -Directory -Filter $pattern -ErrorAction SilentlyContinue |
            ForEach-Object {
                Remove-Item -LiteralPath $_.FullName -Recurse -Force
            }
    }

    Get-ChildItem -Path $RepoRoot -Force -File -Filter "deployment*.zip" -ErrorAction SilentlyContinue |
        ForEach-Object {
            Remove-Item -LiteralPath $_.FullName -Force
        }

    Get-ChildItem -Path $RepoRoot -Recurse -Force -Directory -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Name -in @("__pycache__", ".pytest_cache")
        } |
        ForEach-Object {
            Remove-Item -LiteralPath $_.FullName -Recurse -Force
        }

    Get-ChildItem -Path $RepoRoot -Recurse -Force -File -Filter *.pyc -ErrorAction SilentlyContinue |
        ForEach-Object {
            Remove-Item -LiteralPath $_.FullName -Force
        }
}

function Find-BuildPython {
    $candidates = @()

    $commandCandidates = @(
        "python3.12",
        "python312",
        "python",
        "py"
    )

    foreach ($name in $commandCandidates) {
        $command = Get-Command $name -ErrorAction SilentlyContinue
        if ($command) {
            $candidates += $command.Source
        }
    }

    $wellKnownPaths = @(
        "$env:LocalAppData\Programs\Python\Python312\python.exe",
        "$env:LocalAppData\Programs\Python\Python313\python.exe",
        "$env:ProgramFiles\Python312\python.exe",
        "$env:ProgramFiles\Python312-32\python.exe",
        "$env:ProgramFiles\Python313\python.exe",
        "$env:ProgramFiles\Python313-32\python.exe",
        "$env:LocalAppData\Microsoft\WindowsApps\python3.12.exe"
    )

    foreach ($path in $wellKnownPaths) {
        if (Test-Path $path) {
            $candidates += $path
        }
    }

    foreach ($candidate in ($candidates | Select-Object -Unique)) {
        try {
            $versionOutput = & $candidate --version 2>&1
            if ($LASTEXITCODE -eq 0 -and $versionOutput -match "^Python 3\.(12|13)(\.|$)") {
                return $candidate
            }
        }
        catch {
        }
    }

    return $null
}

function Remove-AllowedArtifacts {
    param(
        [string]$PackageDir
    )

    $removeDirNames = @(
        "tests",
        "pytest",
        "_pytest",
        ".pytest_cache",
        "__pycache__",
        "pluggy",
        "iniconfig",
        "pygments",
        "colorama",
        "pip",
        "setuptools",
        "wheel"
    )
    foreach ($dirName in $removeDirNames) {
        Get-ChildItem -Path $PackageDir -Recurse -Directory -Filter $dirName -ErrorAction SilentlyContinue |
            ForEach-Object {
                Remove-Item -LiteralPath $_.FullName -Recurse -Force
            }
    }

    Get-ChildItem -Path $PackageDir -Recurse -File -Filter *.pyc -ErrorAction SilentlyContinue |
        ForEach-Object {
            Remove-Item -LiteralPath $_.FullName -Force
        }

    $removeFilePatterns = @(
        "pytest-*.dist-info",
        "pluggy-*.dist-info",
        "iniconfig-*.dist-info",
        "pygments-*.dist-info",
        "colorama-*.dist-info",
        "pip-*.dist-info",
        "setuptools-*.dist-info",
        "wheel-*.dist-info"
    )
    foreach ($pattern in $removeFilePatterns) {
        Get-ChildItem -Path $PackageDir -Recurse -Directory -Filter $pattern -ErrorAction SilentlyContinue |
            ForEach-Object {
                Remove-Item -LiteralPath $_.FullName -Recurse -Force
            }
    }
}

function Assert-PackageClean {
    param(
        [string]$PackageDir
    )

    $forbiddenDirectoryNames = @(
        "tests",
        "__pycache__",
        ".pytest_cache",
        "pytest",
        "_pytest",
        "pluggy",
        "pygments",
        "colorama",
        "pip",
        "setuptools",
        "wheel"
    )
    $forbiddenDistInfoPatterns = @(
        "pytest-*.dist-info",
        "pluggy-*.dist-info",
        "pygments-*.dist-info",
        "colorama-*.dist-info",
        "pip-*.dist-info",
        "setuptools-*.dist-info",
        "wheel-*.dist-info"
    )

    $violations = [System.Collections.Generic.List[string]]::new()

    foreach ($dirName in $forbiddenDirectoryNames) {
        Get-ChildItem -Path $PackageDir -Recurse -Directory -Filter $dirName -ErrorAction SilentlyContinue |
            ForEach-Object {
                $violations.Add($_.FullName)
            }
    }

    foreach ($pattern in $forbiddenDistInfoPatterns) {
        Get-ChildItem -Path $PackageDir -Recurse -Directory -Filter $pattern -ErrorAction SilentlyContinue |
            ForEach-Object {
                $violations.Add($_.FullName)
            }
    }

    Get-ChildItem -Path $PackageDir -Recurse -File -Filter *.pyc -ErrorAction SilentlyContinue |
        ForEach-Object {
            $violations.Add($_.FullName)
        }

    if ($violations.Count -gt 0) {
        $message = ($violations | Sort-Object -Unique) -join [Environment]::NewLine
        Write-Error "Package verification failed. Forbidden artifacts remain:`n$message"
    }
}

function Get-NativeLibraries {
    param(
        [string]$PackageDir
    )

    return Get-ChildItem -Path $PackageDir -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $_.Extension -in @(".pyd", ".so", ".dll")
        } |
        Select-Object -ExpandProperty FullName
}

function Assert-RepositoryMarkers {
    param(
        [string]$PackageDir
    )

    $checks = @(
        @{
            Path = Join-Path $PackageDir "app\api\router.py"
            Pattern = "question_bank_router"
            Description = "question_bank_router registration"
        },
        @{
            Path = Join-Path $PackageDir "app\utils\question_bank_client.py"
            Pattern = "MOCK_SET_001"
            Description = "MOCK_SET_001 mock question set"
        },
        @{
            Path = Join-Path $PackageDir "app\services\question_service.py"
            Pattern = "Unknown questionSetId"
            Description = "question service validation"
        },
        @{
            Path = Join-Path $PackageDir "app\services\section_service.py"
            Pattern = "Unknown questionSetId"
            Description = "section service validation"
        },
        @{
            Path = Join-Path $PackageDir "app\dependencies\providers.py"
            Pattern = "@lru_cache"
            Description = "singleton DI"
        }
    )

    foreach ($check in $checks) {
        if (-not (Test-Path $check.Path)) {
            Write-Error "Missing required file in package: $($check.Path)"
        }

        $match = Select-String -Path $check.Path -Pattern $check.Pattern -SimpleMatch -ErrorAction SilentlyContinue
        if (-not $match) {
            Write-Error "Package verification failed: expected $($check.Description) in $($check.Path)"
        }
    }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Remove-WorkspaceArtifacts -RepoRoot $repoRoot
$buildPython = Find-BuildPython

if (-not $buildPython) {
    Write-Error @"
No supported local Python interpreter was found.

Install Python 3.12 or Python 3.13 and rerun this script. The build uses pip to
download Linux-compatible CPython 3.12 wheels for AWS Lambda, so the local
interpreter is only used to run pip and create the build environment.
"@
}

$pythonVersion = & $buildPython --version 2>&1
Write-Host "Using Python interpreter: $buildPython"
Write-Host "Interpreter version: $pythonVersion"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
if ([string]::IsNullOrWhiteSpace($OutputZip)) {
    $OutputZip = "deployment-$timestamp.zip"
}

$buildRootPath = Join-Path $repoRoot $BuildRoot
$venvPath = Join-Path $buildRootPath "venv"
$packageDir = Join-Path $buildRootPath "package"
$zipPath = Join-Path $repoRoot $OutputZip

if (Test-Path $buildRootPath) {
    Remove-Item -LiteralPath $buildRootPath -Recurse -Force
}
if (Test-Path $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Path $buildRootPath | Out-Null

& $buildPython -m venv $venvPath
$venvPython = Join-Path $venvPath "Scripts\python.exe"

& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install `
    --requirement (Join-Path $repoRoot "requirements.txt") `
    --target $packageDir `
    --platform manylinux2014_x86_64 `
    --implementation cp `
    --python-version 3.12 `
    --only-binary=:all: `
    --no-compile `
    --upgrade

Copy-Item -Path (Join-Path $repoRoot "app") -Destination $packageDir -Recurse -Force

Remove-AllowedArtifacts -PackageDir $packageDir
Assert-RepositoryMarkers -PackageDir $packageDir
Assert-PackageClean -PackageDir $packageDir

$nativeLibraries = Get-NativeLibraries -PackageDir $packageDir
$nativeLibraries | ForEach-Object { Write-Host "Native library: $_" }

if ($nativeLibraries -match "\.pyd$") {
    Write-Error "Windows .pyd files are present in the package. Aborting."
}

if (-not ($nativeLibraries -match "\.so$")) {
    Write-Warning "No Linux .so files were found in the package."
}

Write-Host ""
Write-Host "Verification note:"
Write-Host "This script prepares Linux-targeted wheels for AWS Lambda."
Write-Host "Import verification of Linux .so modules cannot be executed from native Windows PowerShell."
Write-Host "Run the final import verification in a Linux-compatible Python 3.12 environment before deployment."

Compress-Archive -Path (Join-Path $packageDir "*") -DestinationPath $zipPath -CompressionLevel Optimal

$zipInfo = Get-Item $zipPath
$hash = Get-FileHash $zipPath -Algorithm SHA256

Write-Host ""
Write-Host "ZIP filename: $($zipInfo.Name)"
Write-Host "ZIP path: $($zipInfo.FullName)"
Write-Host "ZIP size: $($zipInfo.Length)"
Write-Host "ZIP SHA256: $($hash.Hash)"
