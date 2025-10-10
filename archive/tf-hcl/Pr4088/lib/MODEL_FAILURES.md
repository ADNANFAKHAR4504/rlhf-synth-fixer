# Model Failures Documentation

This document tracks the errors encountered during Terraform deployment and their resolutions.

## Summary of Issues

During the initial deployment, several errors were encountered related to naming conventions, resource configurations, and AWS service limitations. All issues have been resolved through configuration updates.

---

## Issue 1: Undeclared Input Variable

**Error:**
```
Error: Reference to undeclared input variable
  on provider.tf line 19, in provider "aws":
  19:   region = var.aws_region

An input variable with the name "aws_region" has not been declared.
```

**Root Cause:**
The provider.tf file referenced `var.aws_region` but no corresponding variable declaration existed.

**Resolution:**
Added variable declaration in tap_stack.tf:
```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
```

**Status:** [RESOLVED]

---

## Issue 2: Deprecated Attribute Warning

**Warning:**
```
Warning: Deprecated attribute
  on tap_stack.tf line 73, in locals:
  73:   region     = data.aws_region.current.name

The attribute "name" is deprecated.
```

**Root Cause:**
AWS provider v5.x deprecated `data.aws_region.current.name` in favor of `data.aws_region.current.id`.

**Resolution:**
Updated locals block:
```hcl
locals {
  region = data.aws_region.current.id  # Changed from .name to .id
}
```

**Status:** [RESOLVED]

---

## Issue 3: Invalid ECR Repository Name

**Error:**
```
Error: creating ECR Repository (TAP-prod-webapp): InvalidParameterException
Invalid parameter at 'repositoryName' failed to satisfy constraint:
'must satisfy regular expression '(?:[a-z0-9]+(?:[._-][a-z0-9]+)*/)*[a-z0-9]+(?:[._-][a-z0-9]+)*''
```

**Root Cause:**
ECR repository names must be lowercase. The name `TAP-prod-webapp` contained uppercase letters.

**Resolution:**
- Created lowercase naming prefix: `name_prefix_lower = lower("${var.company_name}-${var.environment}")`
- Updated ECR resource: `name = "${local.name_prefix_lower}-${var.app_name}"`
- Result: `tap-prod-webapp` (all lowercase)

**Status:** [RESOLVED]

---

## Issue 4: CodeCommit Repository Creation Restricted

**Error:**
```
Error: creating CodeCommit Repository (TAP-prod-webapp-repo): OperationNotAllowedException
CreateRepository request is not allowed because there is no existing repository
in this AWS account or AWS Organization
```

**Root Cause:**
CodeCommit may not be available in all AWS accounts, regions, or organizations. This is often an account-level restriction or service availability issue.

**Resolution:**
- Commented out the CodeCommit repository resource
- Updated pipeline source stage to use S3 instead
- Removed CodeCommit IAM permissions from CodePipeline role
- Added documentation for users who want to re-enable CodeCommit or use GitHub/GitLab

**Alternative Source Options:**
- S3 (currently configured)
- GitHub via GitHub Actions integration
- GitLab via webhooks
- Bitbucket

**Status:** [RESOLVED] (workaround implemented)

---

## Issue 5: Invalid S3 Bucket Name

**Error:**
```
Error: creating S3 Bucket (TAP-prod-pipeline-artifacts-137285103215): InvalidBucketName
The specified bucket is not valid.
```

**Root Cause:**
S3 bucket names must be lowercase. The name `TAP-prod-pipeline-artifacts-...` contained uppercase letters.

**Resolution:**
Updated S3 bucket resource:
```hcl
bucket = "${local.name_prefix_lower}-pipeline-artifacts-${local.account_id}"
```
Result: `tap-prod-pipeline-artifacts-137285103215`

**Status:** [RESOLVED]

---

## Issue 6: CloudWatch Logs KMS Access Denied

**Error:**
```
Error: creating CloudWatch Logs Log Group (/ecs/TAP-prod-webapp): AccessDeniedException
The specified KMS key does not exist or is not allowed to be used
```

**Root Cause:**
The KMS key did not have a policy allowing CloudWatch Logs service to use it for encryption.

**Resolution:**
Added KMS key policy statement:
```hcl
{
  Sid    = "Allow CloudWatch Logs"
  Effect = "Allow"
  Principal = {
    Service = "logs.${local.region}.amazonaws.com"
  }
  Action = [
    "kms:Encrypt",
    "kms:Decrypt",
    "kms:ReEncrypt*",
    "kms:GenerateDataKey*",
    "kms:CreateGrant",
    "kms:DescribeKey"
  ]
  Resource = "*"
  Condition = {
    ArnLike = {
      "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${local.region}:${local.account_id}:log-group:*"
    }
  }
}
```

**Status:** [RESOLVED]

---

## Issue 7: Invalid CodeDeploy Configuration

**Error:**
```
Error: creating CodeDeploy Deployment Group: DeploymentConfigDoesNotExistException
No deployment configuration found for name: CodeDeployDefault.ECSAllAtOnceBlueGreen
```

**Root Cause:**
Two configuration issues:
1. Invalid deployment configuration name (non-existent)
2. Incorrect blue/green deployment settings for ECS Fargate

**Resolution:**
1. Changed deployment config: `CodeDeployDefault.ECSAllAtOnce`
2. Removed `green_fleet_provisioning_option` block (not applicable for ECS Fargate)

Valid ECS deployment configurations:
- `CodeDeployDefault.ECSAllAtOnce`
- `CodeDeployDefault.ECSLinear10PercentEvery1Minutes`
- `CodeDeployDefault.ECSLinear10PercentEvery3Minutes`
- `CodeDeployDefault.ECSCanary10Percent5Minutes`
- `CodeDeployDefault.ECSCanary10Percent15Minutes`

**Status:** [RESOLVED]

---

## Lessons Learned

1. **Naming Conventions:** Always use lowercase for AWS resource names (ECR, S3)
2. **KMS Policies:** Service principals need explicit permissions in KMS key policies
3. **Service Availability:** Not all AWS services are available in all accounts/regions
4. **API Deprecations:** Stay updated with provider version changes
5. **ECS vs EC2 Deployments:** CodeDeploy configurations differ between compute types

---

## Testing Recommendations

1. Run `terraform validate` after each configuration change
2. Use `terraform plan` to preview changes before applying
3. Test in a non-production environment first
4. Implement automated testing for Terraform configurations
5. Document account-specific requirements (like CodeCommit availability)

---

## Current Status

[PASS] All critical errors resolved
[PASS] Configuration passes `terraform validate`
[PASS] Ready for deployment with S3 source
[NOTE] CodeCommit commented out (optional - can be re-enabled if available)
