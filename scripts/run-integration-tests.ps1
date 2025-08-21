# Integration Test Runner for Windows
# This script runs the infrastructure integration tests with proper AWS configuration

param(
  [string]$Region = "us-west-2"
)

Write-Host "🚀 Starting Infrastructure Integration Tests" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

# Check if AWS credentials are configured
if (-not $env:AWS_ACCESS_KEY_ID -and -not $env:AWS_PROFILE) {
  Write-Host "❌ AWS credentials not found!" -ForegroundColor Red
  Write-Host "   Please set one of the following:" -ForegroundColor Yellow
  Write-Host "   - AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY" -ForegroundColor Yellow
  Write-Host "   - AWS_PROFILE" -ForegroundColor Yellow
  Write-Host "   - Run 'aws configure' to set up credentials" -ForegroundColor Yellow
  exit 1
}

# Set default region if not provided
if (-not $env:AWS_REGION) {
  $env:AWS_REGION = $Region
  Write-Host "📍 Using default region: $env:AWS_REGION" -ForegroundColor Cyan
}
else {
  Write-Host "📍 Using region: $env:AWS_REGION" -ForegroundColor Cyan
}

# Verify AWS credentials
Write-Host "🔐 Verifying AWS credentials..." -ForegroundColor Yellow
try {
  $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
  Write-Host "✅ AWS credentials verified for account: $($identity.Account)" -ForegroundColor Green
}
catch {
  Write-Host "❌ Failed to verify AWS credentials" -ForegroundColor Red
  exit 1
}

# Check if infrastructure is deployed
Write-Host "🏗️  Checking if infrastructure is deployed..." -ForegroundColor Yellow
Push-Location lib
try {
  $stateList = terraform state list 2>$null
  if (-not $stateList) {
    Write-Host "❌ Terraform state not found. Please deploy infrastructure first:" -ForegroundColor Red
    Write-Host "   cd lib && terraform apply" -ForegroundColor Yellow
    exit 1
  }
}
catch {
  Write-Host "❌ Terraform state not found. Please deploy infrastructure first:" -ForegroundColor Red
  Write-Host "   cd lib && terraform apply" -ForegroundColor Yellow
  exit 1
}

# Get resource names from Terraform outputs
Write-Host "📋 Getting resource names from Terraform outputs..." -ForegroundColor Yellow
try {
  $VPC_ID = terraform output -raw vpc_id 2>$null
  if (-not $VPC_ID) { $VPC_ID = "vpc-0abc123de456" }
}
catch {
  $VPC_ID = "vpc-0abc123de456"
}

try {
  $RDS_IDENTIFIER = terraform output -raw rds_identifier 2>$null
  if (-not $RDS_IDENTIFIER) { $RDS_IDENTIFIER = "secure-infra-prod-rds" }
}
catch {
  $RDS_IDENTIFIER = "secure-infra-prod-rds"
}

try {
  $CLOUDTRAIL_NAME = terraform output -raw cloudtrail_name 2>$null
  if (-not $CLOUDTRAIL_NAME) { $CLOUDTRAIL_NAME = "secure-infra-prod-cloudtrail" }
}
catch {
  $CLOUDTRAIL_NAME = "secure-infra-prod-cloudtrail"
}

Write-Host "   VPC ID: $VPC_ID" -ForegroundColor Cyan
Write-Host "   RDS Identifier: $RDS_IDENTIFIER" -ForegroundColor Cyan
Write-Host "   CloudTrail Name: $CLOUDTRAIL_NAME" -ForegroundColor Cyan

Pop-Location

# Export variables for tests
$env:TEST_VPC_ID = $VPC_ID
$env:TEST_RDS_IDENTIFIER = $RDS_IDENTIFIER
$env:TEST_CLOUDTRAIL_NAME = $CLOUDTRAIL_NAME

# Run the integration tests
Write-Host "🧪 Running integration tests..." -ForegroundColor Yellow
npm run test:integration

Write-Host "✅ Integration tests completed!" -ForegroundColor Green
