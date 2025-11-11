# Overview

This document tracks all deployment failures encountered during the RDS Disaster Recovery infrastructure deployment in Terraform. Each error includes root cause analysis, impact assessment, applied fixes, and prevention strategies.

**Total Errors Tracked:** 4  
**Severity Breakdown:** Critical (2), Configuration (1), Deprecation (1)

***

## Error #1: Missing Default Provider Configuration

### Category
Critical - Infrastructure Initialization

### Description
When running `terraform plan`, the deployment failed with error: `Provider "registry.terraform.io/hashicorp/aws" requires explicit configuration`. Additionally, `invalid AWS Region: (empty)` was reported, indicating the default provider was not configured.

### Root Cause
The Terraform configuration defined only aliased AWS providers (`aws.primary` for us-east-1 and `aws.dr` for us-west-2) without a default provider block. Terraform requires at least one default provider (without alias) to be explicitly configured, even when using multiple aliased providers for multi-region deployments.

### Impact

**Severity:** Critical  
**Operational Impact:** Terraform cannot initialize provider registry or execute any plans  
**Cost Impact:** No resources created; deployment blocked  
**Compliance Impact:** Infrastructure-as-Code validation fails before reaching compliance checks

### Failure Timeline
- **Trigger:** `terraform plan` command
- **Detection Point:** Provider initialization phase
- **Propagation:** Blocks all subsequent operations

### Fix Applied

Add a default AWS provider block before aliased providers:

```hcl
# Default provider (required even with aliased providers)
provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
    }
  }
}

# Primary region provider
provider "aws" {
  region = "us-east-1"
  alias  = "primary"
  
  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
      Purpose     = "DR-Primary"
    }
  }
}

# DR region provider
provider "aws" {
  region = "us-west-2"
  alias  = "dr"
  
  default_tags {
    tags = {
      Environment = var.environmentSuffix
      Owner       = "DevOps"
      CostCenter  = "Engineering"
      ManagedBy   = "Terraform"
      Purpose     = "DR-Secondary"
    }
  }
}
```

### Prevention Strategy

1. **Pre-deployment Validation:** Always define a default provider block when using multi-region deployments
2. **Code Review Checklist:** Verify provider configuration completeness before pushing to repository
3. **CI/CD Gate:** Add pre-plan validation script to check for default provider presence
4. **Documentation:** Maintain provider configuration template for team reference

### Testing Verification
- Run `terraform init` successfully without errors
- Run `terraform plan` shows provider initialization complete
- No region-related errors in output

***

## Error #2: Invalid S3 Lifecycle Configuration - Missing Filter/Prefix

### Category
Configuration - Resource Schema Compliance

### Description
During `terraform plan`, warnings appeared: `No attribute specified when one (and only one) of [rule[0].filter, rule[0].prefix] is required`. This warning was raised for both primary and DR region S3 bucket lifecycle configurations.

### Root Cause
The S3 bucket lifecycle rules were missing the required filter specification. AWS provider enforces that each lifecycle rule must explicitly define which objects the rule applies to by using either a `filter` block or `prefix` attribute. Without this specification, the scope of lifecycle actions is ambiguous.

### Impact

**Severity:** High (Configuration)  
**Current Status:** Warning (will become hard error in future AWS provider versions)  
**Operational Impact:** Future terraform apply operations will fail; current deployments remain functional  
**Version Impact:** AWS provider v6.x+ enforces this; v7.0.0+ will reject this configuration  
**Cost Impact:** Potential lifecycle actions not applied correctly, leading to unexpected storage costs

### Failure Timeline
- **Current:** Warning during terraform plan
- **Projected:** Error in AWS provider v7.0.0
- **Action Required Before:** Next major provider upgrade

### Fix Applied

Add `filter` blocks to both lifecycle configurations:

```hcl
# S3 bucket lifecycle configuration (Primary Region)
resource "aws_s3_bucket_lifecycle_configuration" "primary_backup_metadata" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_backup_metadata.id
  
  rule {
    id     = "transition-to-glacier"
    status = "Enabled"
    
    filter {
      prefix = ""  # Apply to all objects in bucket
    }
    
    transition {
      days          = 7
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 30
    }
  }
}

# S3 bucket lifecycle configuration (DR Region)
resource "aws_s3_bucket_lifecycle_configuration" "dr_backup_metadata" {
  provider = aws.dr
  bucket   = aws_s3_bucket.dr_backup_metadata.id
  
  rule {
    id     = "transition-to-glacier"
    status = "Enabled"
    
    filter {
      prefix = ""  # Apply to all objects in bucket
    }
    
    transition {
      days          = 7
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 30
    }
  }
}
```

### Prevention Strategy

1. **Schema Validation:** Use `terraform validate -json` to catch schema issues before plan
2. **Provider Documentation Review:** Check AWS provider changelog for schema changes when upgrading versions
3. **IDE Integration:** Enable Terraform LSP for real-time schema validation in VS Code
4. **Linting:** Implement tflint with aws-provider plugin to catch schema compliance issues
5. **CI/CD Validation:** Add terraform validate step before terraform plan in pipeline

### Testing Verification
- Run `terraform plan` with no lifecycle-related warnings
- Verify S3 objects created after day 7 transition to GLACIER storage class
- Confirm objects expire after 30 days as configured

***

## Error #3: Deprecated data.aws_region Attribute

### Category
Deprecation - API Compatibility

### Description
During `terraform plan`, deprecation warning appeared: `The attribute "name" is deprecated. Refer to the provider documentation for details`. This occurred in two Lambda function environment variable blocks referencing `data.aws_region.dr.name` and `data.aws_region.primary.name`.

### Root Cause
AWS provider deprecated the `name` attribute of the `data.aws_region` data source in favor of the `region` attribute. This change was made to standardize attribute naming across AWS provider data sources. The `name` attribute will be removed in AWS provider v7.0.0.

### Impact

**Severity:** Medium (Deprecation)  
**Current Status:** Deprecation warning (not blocking)  
**Operational Impact:** Code remains functional; warns of future incompatibility  
**Version Impact:** Will become error in AWS provider v7.0.0  
**Maintenance Impact:** Team must update code before major version upgrade

### Failure Timeline
- **Current:** Deprecation warning during terraform plan (AWS provider v5.x+)
- **Projected:** Error in AWS provider v7.0.0
- **Action Required Before:** Next major provider upgrade cycle

### Fix Applied

Replace all instances of `data.aws_region.<alias>.name` with `data.aws_region.<alias>.region`:

```hcl
# Lambda function for snapshot copying (Primary Region)
resource "aws_lambda_function" "primary_snapshot_copier" {
  provider = aws.primary
  
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "snapshot-copier-${var.environmentSuffix}-${random_string.suffix.result}"
  role            = aws_iam_role.primary_lambda.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 60
  
  environment {
    variables = {
      DESTINATION_REGION  = data.aws_region.dr.region      # Changed from .name to .region
      DESTINATION_KMS_KEY = aws_kms_key.dr_rds.arn
      SNS_TOPIC_ARN       = aws_sns_topic.primary_alerts.arn
      S3_BUCKET_NAME      = aws_s3_bucket.primary_backup_metadata.id
      RDS_INSTANCE_ID     = aws_db_instance.primary.id
    }
  }
  
  tags = {
    Name = "snapshot-copier-${var.environmentSuffix}-${random_string.suffix.result}"
  }
}

# Lambda function for snapshot validation (DR Region)
resource "aws_lambda_function" "dr_snapshot_validator" {
  provider = aws.dr
  
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "snapshot-validator-${var.environmentSuffix}-${random_string.suffix.result}"
  role            = aws_iam_role.dr_lambda.arn
  handler         = "lambda_function.validate_snapshot_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  timeout         = 60
  
  environment {
    variables = {
      SNS_TOPIC_ARN  = aws_sns_topic.dr_alerts.arn
      S3_BUCKET_NAME = aws_s3_bucket.dr_backup_metadata.id
      SOURCE_REGION  = data.aws_region.primary.region     # Changed from .name to .region
    }
  }
  
  tags = {
    Name = "snapshot-validator-${var.environmentSuffix}-${random_string.suffix.result}"
  }
}
```

### Prevention Strategy

1. **Provider Version Monitoring:** Subscribe to AWS provider release notes for deprecation announcements
2. **Regular Updates:** Schedule quarterly provider updates to catch deprecations early
3. **Deprecation Scanning:** Use terraform-deprecation-checker (custom script) in CI/CD pipeline
4. **Code Review:** Check AWS provider documentation for deprecated attributes during code review
5. **Pre-upgrade Testing:** Test with new provider versions in sandbox environment before promoting to production

### Testing Verification
- Run `terraform plan` with no deprecation warnings
- Verify Lambda environment variables receive correct region values
- Confirm Lambda functions can access cross-region resources using correct region identifiers

***

## Error #4: Invalid Security Group Name Prefix

### Category
Critical - Resource Naming Constraint Violation

### Description
During `terraform apply`, the deployment failed with error: `invalid value for name (cannot begin with sg-)` for both primary and DR region security groups. This occurred when Terraform attempted to create `aws_security_group.primary_rds` and `aws_security_group.dr_rds` resources.

### Root Cause
AWS security group names cannot start with the `sg-` prefix because AWS reserves this prefix for automatically generated security group identifiers (e.g., sg-0123456789abcdef0). When users attempt to manually create security groups with names beginning with `sg-`, the CreateSecurityGroup API call fails with InvalidParameterValue error.

### Impact

**Severity:** Critical  
**Operational Impact:** Security group creation fails; deployment blocked  
**Security Impact:** Network security controls cannot be established; application unreachable  
**Rollback Impact:** Partial infrastructure created (VPCs, subnets, IGW) without security groups  
**Cost Impact:** Orphaned resources consuming costs without providing service functionality

### Failure Timeline
- **Trigger:** `terraform apply` command
- **Detection Point:** Security group resource creation phase
- **Error Message:** InvalidParameterValue in AWS API response
- **Propagation:** Blocks dependent resources (RDS, Lambda, etc.)

### Fix Applied

Replace `name` attribute with `name_prefix` and remove `sg-` prefix:

```hcl
# Security group for RDS in primary region
resource "aws_security_group" "primary_rds" {
  provider    = aws.primary
  name_prefix = "rds-${var.environmentSuffix}-"  # Changed from name to name_prefix
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    description = "PostgreSQL from application subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [for subnet in aws_subnet.primary_app : subnet.cidr_block]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "rds-${var.environmentSuffix}-${random_string.suffix.result}"
  }
}

# Security group for RDS in DR region
resource "aws_security_group" "dr_rds" {
  provider    = aws.dr
  name_prefix = "dr-rds-${var.environmentSuffix}-"  # Changed from name to name_prefix
  description = "Security group for RDS database in DR region"
  vpc_id      = aws_vpc.dr.id
  
  ingress {
    description = "PostgreSQL from application subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [for subnet in aws_subnet.dr_app : subnet.cidr_block]
  }
  
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "dr-rds-${var.environmentSuffix}-${random_string.suffix.result}"
  }
}
```

### Key Changes Explained

| Aspect | Before | After | Reason |
|--------|--------|-------|--------|
| Attribute | `name` | `name_prefix` | AWS reserves `sg-` prefix for IDs |
| Name Format | `sg-rds-prod-abc123` | `rds-prod-xxxxx` | User cannot begin with sg- |
| Generation | Static exact name | AWS auto-generates suffix | Ensures compliance with constraints |
| Lifecycle | User-managed | Terraform + AWS managed | Safer for infrastructure updates |

### How name_prefix Works

When using `name_prefix` instead of `name`, Terraform follows this process:

1. Takes the provided prefix value: `rds-prod-`
2. Requests security group creation with the prefix
3. AWS appends a random suffix to ensure uniqueness
4. Final name created: `rds-prod-20231105t130315z-xxxxx`
5. Terraform tracks the full name in state file for future updates

This approach prevents naming conflicts and respects AWS reserved prefixes.

### Prevention Strategy

1. **Naming Convention Template:** Establish team standards excluding reserved prefixes (sg-, i-, ami-, snap-, vol-, etc.)
2. **Pre-deployment Validation:** Add linting rule to terraform to detect sg- prefix in security group names
3. **Code Review Process:** Check security group naming during code review against AWS reserved prefixes list
4. **Documentation:** Maintain list of AWS reserved prefixes in team wiki for reference
5. **CI/CD Validation:** Implement automated check in pipeline to reject naming patterns with reserved prefixes
6. **IDE Templates:** Configure Terraform IDE snippets to use name_prefix by default for security groups

### Testing Verification
- Run `terraform plan` with no naming constraint errors
- Execute `terraform apply` successfully creating security groups with auto-generated compliant names
- Verify security group created with name like `rds-prod-20231105t130315z-xxxxx`
- Confirm security group ID format remains `sg-0123456789abcdef0` (AWS generated)
- Test ingress rule allows PostgreSQL (5432) from application subnets
- Test egress rule allows all outbound traffic

***

## Summary by Severity

### Critical Errors (2)
1. Missing Default Provider Configuration - Blocks all operations
2. Invalid Security Group Name Prefix - Deployment fails during apply

### Configuration Issues (1)
1. Invalid S3 Lifecycle Configuration - Future compatibility issue

### Deprecation Warnings (1)
1. Deprecated data.aws_region Attribute - Pre-upgrade maintenance item

***

## Deployment Checkpoint Validation

Use this checklist after implementing all fixes:

- [ ] Default provider configured without alias
- [ ] All aliased providers configured correctly
- [ ] S3 lifecycle rules include filter or prefix blocks
- [ ] All data.aws_region references use .region (not .name)
- [ ] Security group names use name_prefix without sg- prefix
- [ ] terraform validate passes with no errors
- [ ] terraform plan shows 0 warnings
- [ ] terraform apply completes successfully
- [ ] All resources created with expected configurations
- [ ] Outputs match expected values

***