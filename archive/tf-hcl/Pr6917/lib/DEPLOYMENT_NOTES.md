# Deployment Notes

## Current Deployment Issues

### Issue 1: Environment Suffix Not Being Passed
The deployment is using the default `environment_suffix="dev"` instead of the PR-specific suffix (e.g., `"pr6917"`).

**Expected**: Resources should be created with names like `aws-config-role-pr6917`
**Actual**: Resources are being created with names like `aws-config-role-dev`

**Solution**: The deployment system should pass the environment suffix as:
```bash
terraform apply -var="environment_suffix=pr6917"
```

Or set it as an environment variable:
```bash
export TF_VAR_environment_suffix=pr6917
terraform apply
```

### Issue 2: Resources Already Exist with "dev" Suffix
Resources from a previous deployment with `environment_suffix="dev"` already exist:
- IAM Role: `aws-config-role-dev`
- S3 Buckets: `aws-config-bucket-dev`, `terraform-state-dev`
- DynamoDB Table: `terraform-state-lock-dev`
- AWS Organization: Account is already in an organization

**Solutions**:

**Option A: Use Different Suffix** (Recommended)
Deploy with a unique suffix like `pr6917` to avoid conflicts:
```bash
terraform apply -var="environment_suffix=pr6917"
```

**Option B: Import Existing Resources**
Import the existing resources into Terraform state:
```bash
# Import organization
terraform import aws_organizations_organization.main <org-id>

# Import IAM role
terraform import aws_iam_role.config aws-config-role-dev

# Import S3 buckets
terraform import aws_s3_bucket.config aws-config-bucket-dev
terraform import aws_s3_bucket.terraform_state terraform-state-dev

# Import DynamoDB table
terraform import aws_dynamodb_table.terraform_state_lock terraform-state-lock-dev
```

**Option C: Destroy Existing Resources**
```bash
terraform destroy -var="environment_suffix=dev"
```

### Issue 3: S3 Bucket Region Mismatch
The `terraform-state-dev` bucket exists in `eu-west-1` but the code tries to create it in `us-east-1`.

**Solution**: If using the "dev" suffix, either:
1. Use a different suffix (recommended)
2. Delete the existing bucket in eu-west-1
3. Update the code to create it in eu-west-1 (not recommended as it should be in primary region)

## Successful Partial Deployment

Despite the errors, some resources were successfully created:
- ✅ Primary KMS Key: `mrk-8218ac5c89104e1381e48bcfebcfc043`
- ✅ Secondary KMS Key (replica): `mrk-8218ac5c89104e1381e48bcfebcfc043`
- ✅ CloudWatch Log Groups: `/aws/iam/activity-dev`, `/aws/organizations/activity-dev`, `/aws/config/activity-dev`
- ✅ Security Audit Role: `security-audit-role-dev`

## Code Fixes Applied

1. **KMS Key Policy**: Added proper CloudWatch Logs permissions with encryption context
2. **CloudWatch Dependencies**: Added `depends_on` to ensure KMS key is created first
3. **Lifecycle Rules**: Added lifecycle blocks to prevent accidental destruction
4. **Variable Defaults**: Added default value for `environment_suffix` to prevent "no value" errors

## Recommended Deployment Command

```bash
cd lib
terraform init
terraform plan -var="environment_suffix=pr6917" -out=tfplan
terraform apply tfplan
```

## Environment Variable Method

```bash
export TF_VAR_environment_suffix=pr6917
cd lib
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

