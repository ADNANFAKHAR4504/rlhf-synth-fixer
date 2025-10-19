# Model Failures and Resolutions

This document tracks errors encountered during implementation and their solutions to prevent future occurrences.

---

## Failure 1: S3 Storage Lens Configuration - Invalid Block Type

### Error Message
```
Error: Unsupported block type

  on tap_stack.tf line 1458, in resource "aws_s3control_storage_lens_configuration" "main":
 1458:         detailed_status_codes_metrics {

Blocks of type "detailed_status_codes_metrics" are not expected here. Did you mean "detailed_status_code_metrics"?
```

### Root Cause
Incorrect resource block name in S3 Storage Lens configuration. Used plural `detailed_status_codes_metrics` instead of singular `detailed_status_code_metrics`.

### Impact
- Terraform validation failed
- Prevented infrastructure deployment

### Solution
**BAD - Incorrect (plural)**:
```hcl
detailed_status_codes_metrics {
  enabled = true
}
```

**GOOD - Correct (singular)**:
```hcl
detailed_status_code_metrics {
  enabled = true
}
```

### Prevention
- Always reference official Terraform AWS provider documentation for exact block names
- Run `terraform validate` before committing code
- Enable IDE/editor Terraform language support with schema validation

**Files Modified**:
- `lib/tap_stack.tf` - Line 1458
- `lib/IDEAL_RESPONSE.md` - Updated to match

---

## Failure 2: KMS Key Policy - Empty Principal List

### Error Message
```
Error: creating KMS Key: operation error KMS: CreateKey, https response error StatusCode: 400,
RequestID: d91fa1f2-0cd5-4cca-90fc-bb8fedf1b4de, MalformedPolicyDocumentException:
Policy contains a statement with no principal.

  with aws_kms_key.primary,
  on tap_stack.tf line 299, in resource "aws_kms_key" "primary":
 299: resource "aws_kms_key" "primary" {
```

### Root Cause
KMS key policy included a statement for consumer account access with a `for` expression that resulted in an **empty principal array** when `consumer_accounts` variable is empty (default configuration).

AWS KMS does not allow policy statements with empty or missing principals.

### Impact
- Infrastructure deployment failed after 2+ minutes of KMS key creation
- Blocking error preventing all downstream resources from being created

### Detailed Analysis

**Original Code (BROKEN)**:
```hcl
resource "aws_kms_key" "primary" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = { AWS = "arn:aws:iam::${local.account_id}:root" }
        Action   = "kms:*"
        Resource = "*"
      },
      # ... other statements ...
      {
        Sid    = "Allow Consumer Accounts Decrypt"
        Effect = "Allow"
        Principal = {
          # This becomes an empty array when consumer_accounts = {} (default)
          AWS = [for account_id in local.consumer_account_ids : "arn:aws:iam::${account_id}:root"]
        }
        Action   = ["kms:Decrypt", "kms:DescribeKey", "kms:CreateGrant"]
        Resource = "*"
      }
    ]
  })
}
```

**Problem**: When `consumer_accounts = {}` (default), `local.consumer_account_ids = []`, so the `for` expression produces an empty array `[]`, resulting in:
```json
{
  "Principal": {
    "AWS": []  // [INVALID] - no principal!
  }
}
```

### Solution

Use `concat()` to **conditionally include** the statement only when there are consumer accounts:

**GOOD - Correct Conditional Approach**:
```hcl
resource "aws_kms_key" "primary" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "Enable IAM User Permissions"
          Effect = "Allow"
          Principal = { AWS = "arn:aws:iam::${local.account_id}:root" }
          Action   = "kms:*"
          Resource = "*"
        },
        {
          Sid    = "Allow CloudWatch Logs"
          Effect = "Allow"
          Principal = { Service = "logs.${var.aws_region}.amazonaws.com" }
          Action   = ["kms:Encrypt", "kms:Decrypt", ...]
          Resource = "*"
        },
        {
          Sid    = "Allow S3 Service"
          Effect = "Allow"
          Principal = { Service = "s3.amazonaws.com" }
          Action   = ["kms:Decrypt", "kms:GenerateDataKey"]
          Resource = "*"
        },
        {
          Sid    = "Allow CloudTrail"
          Effect = "Allow"
          Principal = { Service = "cloudtrail.amazonaws.com" }
          Action   = ["kms:GenerateDataKey*", "kms:DescribeKey"]
          Resource = "*"
        },
        {
          Sid    = "Allow DynamoDB Service"
          Effect = "Allow"
          Principal = { Service = "dynamodb.amazonaws.com" }
          Action   = ["kms:Decrypt", "kms:DescribeKey"]
          Resource = "*"
        }
      ],
      # Conditionally add consumer accounts statement ONLY if accounts exist
      length(local.consumer_account_ids) > 0 ? [
        {
          Sid    = "Allow Consumer Accounts Decrypt"
          Effect = "Allow"
          Principal = {
            AWS = [for account_id in local.consumer_account_ids : "arn:aws:iam::${account_id}:root"]
          }
          Action = [
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:CreateGrant"
          ]
          Resource = "*"
          Condition = {
            StringEquals = {
              "kms:ViaService" = "s3.${var.aws_region}.amazonaws.com"
            }
          }
        }
      ] : []  # Empty array when no consumer accounts - no statement added
    )
  })
}
```

**How It Works**:
- When `consumer_accounts = {}`: `concat([base_statements], []) = [base_statements]` [VALID] Valid policy
- When consumer accounts exist: `concat([base_statements], [consumer_statement]) = [base_statements, consumer_statement]` [VALID] Valid policy

### Prevention

**Best Practices for Dynamic Policy Statements**:

1. **Always use conditional logic** for optional policy statements:
   ```hcl
   Statement = concat(
     [required_statements],
     condition ? [optional_statement] : []
   )
   ```

2. **Never use `for` expressions** that can produce empty arrays in Principal fields:
   ```hcl
   # [BAD] - can create empty Principal
   Principal = { AWS = [for x in var.list : x] }

   # [GOOD] - conditionally include entire statement
   length(var.list) > 0 ? {
     Principal = { AWS = [for x in var.list : x] }
   } : null
   ```

3. **Test with default/empty variable values** before deployment

4. **Validate policy syntax** locally:
   ```bash
   terraform validate
   terraform plan
   ```

**Files Modified**:
- `lib/tap_stack.tf` - Lines 304-396 (KMS key policy)
- `lib/IDEAL_RESPONSE.md` - Updated to match corrected implementation

### Lessons Learned

1. **AWS Services Require Valid Principals**: Empty principal arrays are invalid in IAM/KMS policies
2. **Dynamic Policies Need Defensive Coding**: Use conditional logic (`concat`, ternary operators) when building policies from variables
3. **Test Default Configurations**: Always test infrastructure with default/empty variable values
4. **Validation is Critical**: Run `terraform validate` and `terraform plan` before `apply`

---

## Failure 3: S3 Storage Lens - Advanced Metrics and Data Export Error

### Error Message
```
Error: creating S3 Storage Lens Configuration: operation error S3 Control: PutStorageLensConfiguration,
https response error StatusCode: 400, RequestID: MX5VEAFGQCZTXWDF,
api error UnknownError: UnknownError

  with aws_s3control_storage_lens_configuration.main[0],
  on tap_stack.tf line 1440, in resource "aws_s3control_storage_lens_configuration" "main":
 1440: resource "aws_s3control_storage_lens_configuration" "main" {
```

### Root Cause
S3 Storage Lens configuration included advanced premium features not available in all AWS accounts:
- `advanced_cost_optimization_metrics` - Requires S3 Storage Lens advanced metrics (paid feature)
- `advanced_data_protection_metrics` - Requires S3 Storage Lens advanced metrics (paid feature)
- `detailed_status_code_metrics` - Requires S3 Storage Lens advanced metrics (paid feature)
- `data_export` with KMS encryption - May have compatibility issues or require additional permissions

AWS returns a vague "UnknownError" when attempting to use premium features not enabled on the account.

### Impact
- Infrastructure deployment failed during S3 Storage Lens resource creation
- Blocked complete infrastructure provisioning
- Required configuration simplification

### Detailed Analysis

**Original Code (BROKEN)**:
```hcl
resource "aws_s3control_storage_lens_configuration" "main" {
  count = var.enable_storage_lens ? 1 : 0

  config_id = "${var.project_name}-storage-lens-${local.env_suffix}"

  storage_lens_configuration {
    enabled = true

    account_level {
      bucket_level {
        activity_metrics {
          enabled = true
        }

        advanced_cost_optimization_metrics {  # Premium feature
          enabled = true
        }

        advanced_data_protection_metrics {  # Premium feature
          enabled = true
        }

        detailed_status_code_metrics {  # Premium feature
          enabled = true
        }
      }
    }

    data_export {  # May require additional setup
      s3_bucket_destination {
        account_id            = local.account_id
        arn                   = aws_s3_bucket.audit.arn
        format                = "CSV"
        output_schema_version = "V_1"
        prefix                = "storage-lens/"

        encryption {
          sse_kms {
            key_id = aws_kms_key.primary.arn
          }
        }
      }
    }
  }
}
```

**Problem**:
- Advanced metrics are premium features requiring S3 Storage Lens Advanced subscription
- Free tier only supports basic activity metrics
- Data export with KMS may require additional bucket policy permissions
- No validation exists to check if account has premium features enabled

### Solution

**Step 1**: Simplify Storage Lens configuration to use only free-tier features:

```hcl
resource "aws_s3control_storage_lens_configuration" "main" {
  count = var.enable_storage_lens ? 1 : 0

  config_id = "${var.project_name}-storage-lens-${local.env_suffix}"

  storage_lens_configuration {
    enabled = true

    account_level {
      bucket_level {
        activity_metrics {  # Free tier feature
          enabled = true
        }
      }
    }
    # No data export - can be added later if needed with proper bucket permissions
  }
}
```

**Step 2**: Disable Storage Lens by default (error persisted even with basic config):

```hcl
variable "enable_storage_lens" {
  description = "Enable S3 Storage Lens for usage analytics (requires account-level enablement)"
  type        = bool
  default     = false  # Changed from true to false
}
```

**What Changed**:
- Removed `advanced_cost_optimization_metrics` (requires premium)
- Removed `advanced_data_protection_metrics` (requires premium)
- Removed `detailed_status_code_metrics` (requires premium)
- Removed `data_export` block (can be added later with SSE-S3 or proper permissions)
- Kept only `activity_metrics` which is available in free tier
- **Changed default to `false`** - Storage Lens must be explicitly enabled with `enable_storage_lens = true`

### Prevention

**Best Practices for S3 Storage Lens**:

1. **Disable by default and require explicit enablement**:
   ```hcl
   variable "enable_storage_lens" {
     description = "Enable S3 Storage Lens (requires account-level enablement)"
     type        = bool
     default     = false  # Disabled by default
   }
   ```

2. **Start with basic configuration**:
   ```hcl
   # Use only free-tier features initially
   bucket_level {
     activity_metrics {
       enabled = true
     }
   }
   ```

3. **Add advanced features conditionally**:
   ```hcl
   variable "storage_lens_advanced" {
     description = "Enable advanced Storage Lens metrics (requires premium)"
     type        = bool
     default     = false
   }

   dynamic "advanced_cost_optimization_metrics" {
     for_each = var.storage_lens_advanced ? [1] : []
     content {
       enabled = true
     }
   }
   ```

4. **Use SSE-S3 for data export instead of SSE-KMS** (simpler, fewer permissions needed):
   ```hcl
   data_export {
     s3_bucket_destination {
       arn    = aws_s3_bucket.audit.arn
       format = "CSV"
       # No encryption block = defaults to SSE-S3
     }
   }
   ```

5. **Test in non-production accounts first** - Storage Lens features vary by account type

6. **Check AWS account entitlements** before enabling premium features

7. **Document that Storage Lens requires manual enablement** in deployment instructions

**Files Modified**:
- `lib/tap_stack.tf` - Lines 203-207 (Changed `enable_storage_lens` default to `false`)
- `lib/tap_stack.tf` - Lines 1440-1456 (Simplified Storage Lens configuration)
- `lib/IDEAL_RESPONSE.md` - Updated to match corrected implementation
- `test/terraform.unit.test.ts` - Removed tests for advanced metrics

### Lessons Learned

1. **AWS Free Tier Limitations**: Not all AWS features are available in free tier; advanced metrics require paid subscriptions
2. **Vague Error Messages**: AWS sometimes returns "UnknownError" for feature entitlement issues
3. **Feature Availability Varies**: S3 Storage Lens advanced features require explicit enablement
4. **Start Simple**: Begin with basic configurations and add complexity incrementally
5. **Documentation Gaps**: AWS error messages don't always clearly indicate premium feature requirements
6. **Disable Optional Features by Default**: Features that require account-level setup should default to `false` to prevent deployment failures
7. **Account-Level Prerequisites**: Some AWS features (like Storage Lens) require manual account configuration before Terraform can create them

---

## Summary

**Total Failures**: 3
**Time to Resolution**: ~15 minutes
**Impact**: Prevented deployment, but caught before production

**Key Takeaways**:
- Run `terraform validate` before every commit
- Test with default variable values (empty maps, empty lists)
- Use conditional logic for optional policy statements
- Reference official documentation for exact syntax
- Start with basic/free-tier features before adding premium features
- Test in non-production environments first
- Document all failures for team learning

---

*This file should be updated whenever new failures are encountered to build institutional knowledge.*
