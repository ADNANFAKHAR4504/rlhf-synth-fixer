# Terraform Workspaces Strategy

## Manual Testing vs Pipeline Deployment

### Current Issue
अगर manually test करने के बाद pipeline से deploy करते हैं, तो duplicate resources create हो सकते हैं।

### Solution Options

#### Option 1: Separate Workspaces
```bash
# Manual testing में
terraform workspace new manual-dev
terraform workspace select manual-dev
terraform apply

# Pipeline में  
terraform workspace new pipeline-dev
terraform workspace select pipeline-dev
terraform apply
```

#### Option 2: Different Environment Names
```bash
# Manual testing के लिए
export TF_VAR_environment="dev-manual"

# Pipeline के लिए
export TF_VAR_environment="dev"
```

#### Option 3: Cleanup Before Pipeline
```bash
# Manual testing के बाद cleanup
terraform destroy
rm terraform.tfstate*

# फिर pipeline चलाएं
```

## Recommended Approach

### For Manual Testing
1. Use local state
2. Use temporary environment name (`dev-test`, `dev-manual`)
3. Always cleanup before pipeline deployment

### For Pipeline
1. Use remote S3 backend
2. Use standard environment names (`dev`, `test`, `prod`)
3. Separate state files per environment

## Implementation Steps

### Step 1: Create Separate Backend Configs
```hcl
# backend-local.tf (for manual testing)
# Empty - uses local state

# backend-remote.tf (for pipeline)
terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "${var.environment}/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### Step 2: Use Environment Variables
```bash
# Manual testing
export TF_VAR_environment="dev-manual"
export TF_VAR_owner="your-name"
export TF_VAR_purpose="testing"

# Pipeline
export TF_VAR_environment="dev"
export TF_VAR_owner="platform-team"
export TF_VAR_purpose="web-application"
```

### Step 3: Pipeline Commands
```bash
# Pipeline deployment script
terraform init -backend-config="backend-remote.tf"
terraform workspace select ${ENVIRONMENT} || terraform workspace new ${ENVIRONMENT}
terraform plan
terraform apply -auto-approve
```

## Best Practices

1. **Never mix manual and pipeline deployments** in same environment
2. **Use different naming conventions** for manual vs pipeline
3. **Always cleanup manual testing resources** before pipeline
4. **Use remote state** for all production deployments
5. **Document your strategy** clearly for team members

## Quick Commands

### Manual Testing Cleanup
```bash
# Remove manual testing resources
terraform destroy -auto-approve
rm -f terraform.tfstate*
rm -f .terraform.lock.hcl
```

### Pipeline Preparation
```bash
# Ensure clean state for pipeline
terraform init -backend-config="backend-remote.tf"
terraform plan -var="environment=dev"
```
