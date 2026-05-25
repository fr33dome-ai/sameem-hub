# =============================================================================
# Sameem Hub — push to GitHub script
# =============================================================================
# Run from inside the Sameem Hub - Production folder:
#   .\deploy-push.ps1
# (or paste these commands one by one into PowerShell)
# =============================================================================

$ErrorActionPreference = "Stop"

# 1. Make sure we're in the Production folder
$prod = "C:\Users\Yoloa\OneDrive\Dokument\Claude\Projects\Sameem Hub\Sameem Hub - Production"
Set-Location -Path $prod
Write-Host "Working in: $prod" -ForegroundColor Cyan

# 2. Clean stale .git folder if it exists (left over from earlier sandbox attempt)
if (Test-Path .git) {
    Write-Host "Removing stale .git folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
}

# 3. Initialize a fresh git repo
git init
git config user.email "fr33dome@gmail.com"
git config user.name  "Abdullah Aldossari"

# 4. Stage and commit everything (.gitignore filters node_modules/.env)
git add .
git commit -m "Sameem Hub v1.7 - initial Netlify-ready monorepo"

# 5. Rename to main and add the GitHub remote
git branch -M main
git remote add origin https://github.com/abdullahrajeh21-cloud/sameem-hub.git

# 6. Push (Git Credential Manager will pop up Chrome OAuth)
git push -u origin main

Write-Host ""
Write-Host "DONE. Code is now on GitHub at:" -ForegroundColor Green
Write-Host "https://github.com/abdullahrajeh21-cloud/sameem-hub" -ForegroundColor Green
Write-Host ""
Write-Host "Next: come back to Claude — I'll wire up Netlify." -ForegroundColor Cyan
