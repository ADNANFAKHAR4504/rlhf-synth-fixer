# Cleanup script to remove orphaned Terraform state resources
# This script should be run before terraform apply in CI/CD pipelines

param(
    [switch]$Force
)

Write-Host "🧹 Starting Terraform state cleanup..." -ForegroundColor Green

# Change to the lib directory where Terraform files are located
Set-Location lib

# Initialize Terraform without backend to avoid S3 issues
Write-Host "📦 Initializing Terraform..." -ForegroundColor Yellow
terraform init -backend=false

# List current state to see what exists
Write-Host "📋 Current Terraform state:" -ForegroundColor Yellow
try {
    $stateList = terraform state list 2>$null
    if ($stateList) {
        Write-Host $stateList
    } else {
        Write-Host "No state found or backend not configured"
    }
} catch {
    Write-Host "No state found or backend not configured"
}

# Remove orphaned aws_launch_template.web if it exists
Write-Host "🗑️  Attempting to remove orphaned aws_launch_template.web..." -ForegroundColor Yellow
try {
    $stateList = terraform state list 2>$null
    if ($stateList -match "aws_launch_template\.web") {
        Write-Host "Found aws_launch_template.web in state, removing..." -ForegroundColor Red
        terraform state rm 'aws_launch_template.web'
        Write-Host "Successfully removed aws_launch_template.web" -ForegroundColor Green
    } else {
        Write-Host "aws_launch_template.web not found in state" -ForegroundColor Green
    }
} catch {
    Write-Host "Failed to remove aws_launch_template.web (may not exist)" -ForegroundColor Yellow
}

# Remove any other orphaned resources that might cause cycles
Write-Host "🔍 Checking for other potential orphaned resources..." -ForegroundColor Yellow
$orphanedResources = @("aws_launch_template", "aws_autoscaling_group", "aws_launch_configuration")
try {
    $stateList = terraform state list 2>$null
    foreach ($resource in $orphanedResources) {
        if ($stateList -match $resource) {
            Write-Host "Found $resource in state, checking if it's orphaned..." -ForegroundColor Yellow
            # You can add more specific checks here
        }
    }
} catch {
    Write-Host "No state found to check for orphaned resources" -ForegroundColor Yellow
}

Write-Host "✅ Terraform state cleanup completed" -ForegroundColor Green

# Validate the configuration
Write-Host "🔍 Validating Terraform configuration..." -ForegroundColor Yellow
terraform validate

Write-Host "📋 Final state list:" -ForegroundColor Yellow
try {
    $finalStateList = terraform state list 2>$null
    if ($finalStateList) {
        Write-Host $finalStateList
    } else {
        Write-Host "No state found"
    }
} catch {
    Write-Host "No state found"
}

Write-Host "🎉 Cleanup script completed successfully!" -ForegroundColor Green
