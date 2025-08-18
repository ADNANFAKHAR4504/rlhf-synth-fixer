Param(
    [string]$BackendConfigPath = "..\lib\backend.hcl",
    [switch]$MigrateState
)

$ErrorActionPreference = "Stop"

Write-Host "🔄 Initializing Terraform backend..."

# Determine Terraform directory (assume lib/ for this repo)
$TerraformDir = "..\lib"
if (-not (Test-Path $TerraformDir)) {
    throw "Terraform directory not found: $TerraformDir"
}

Push-Location $TerraformDir

$argsList = @("init", "-input=false", "-reconfigure")

if ($MigrateState) {
    $argsList += "-migrate-state"
}

if (Test-Path $BackendConfigPath) {
    Write-Host "Using backend config file: $BackendConfigPath"
    $argsList += ("-backend-config=" + $BackendConfigPath)
} else {
    # Fall back to environment variables if provided
    $bucket = $env:TERRAFORM_STATE_BUCKET
    $region = $env:TERRAFORM_STATE_BUCKET_REGION
    $key    = $env:TERRAFORM_STATE_KEY
    $dtable = $env:TERRAFORM_STATE_LOCK_TABLE

    if (-not $bucket) { throw "TERRAFORM_STATE_BUCKET not set and no backend.hcl provided." }
    if (-not $region) { $region = "us-east-1" }
    if (-not $key)    { $key = "iac-test-automations/lib/terraform.tfstate" }

    $argsList += @(
        ("-backend-config=bucket=" + $bucket),
        ("-backend-config=key=" + $key),
        ("-backend-config=region=" + $region),
        ("-backend-config=encrypt=true")
    )
    if ($dtable) { $argsList += ("-backend-config=dynamodb_table=" + $dtable) }
}

Write-Host ("terraform " + ($argsList -join ' '))
terraform @argsList | Write-Host

Pop-Location

Write-Host "✅ Terraform backend initialized"

