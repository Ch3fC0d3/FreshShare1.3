# PowerShell deployment script with output logging
$logFile = "deploy-log.txt"

# Clear previous log
if (Test-Path $logFile) {
    Remove-Item $logFile
}

# Helper function to log commands and their output
function Execute-LogCommand {
    param (
        [string]$command,
        [string]$description
    )
    
    Write-Output "EXECUTING: $description" | Out-File -FilePath $logFile -Append
    Write-Output "COMMAND: $command" | Out-File -FilePath $logFile -Append
    
    try {
        $output = Invoke-Expression -Command $command 2>&1
        $exitCode = $LASTEXITCODE
        
        Write-Output "OUTPUT:" | Out-File -FilePath $logFile -Append
        $output | Out-File -FilePath $logFile -Append
        Write-Output "EXIT CODE: $exitCode" | Out-File -FilePath $logFile -Append
    }
    catch {
        Write-Output "ERROR: $_" | Out-File -FilePath $logFile -Append
    }
    
    Write-Output "----------------------------------------" | Out-File -FilePath $logFile -Append
}

# Log start of deployment
Write-Output "=== FRESHSHARE DEPLOYMENT STARTED $(Get-Date) ===" | Out-File -FilePath $logFile -Append

# Check current state
Execute-LogCommand -command "git config --get remote.origin.url" -description "Checking remote URL"
Execute-LogCommand -command "git branch --show-current" -description "Checking current branch"
Execute-LogCommand -command "git status" -description "Checking Git status"

# Add all files
Execute-LogCommand -command "git add -A" -description "Adding all files"
Execute-LogCommand -command "git status" -description "Checking Git status after add"

# Commit changes
$commitMsg = "Clean repository for production deployment with CSS fixes"
Execute-LogCommand -command "git commit -m `"$commitMsg`"" -description "Committing changes"

# Ensure we're on restore_branch
Execute-LogCommand -command "git checkout restore_branch" -description "Switching to restore_branch"

# Push to GitHub
Execute-LogCommand -command "git push origin restore_branch" -description "Pushing to GitHub"

# Log end of deployment
Write-Output "=== FRESHSHARE DEPLOYMENT COMPLETED $(Get-Date) ===" | Out-File -FilePath $logFile -Append
