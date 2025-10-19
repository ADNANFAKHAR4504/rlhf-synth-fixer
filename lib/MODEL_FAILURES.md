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

## Summary

**Total Failures**: 2
**Time to Resolution**: ~10 minutes
**Impact**: Prevented deployment, but caught before production

**Key Takeaways**:
- Run `terraform validate` before every commit
- Test with default variable values (empty maps, empty lists)
- Use conditional logic for optional policy statements
- Reference official documentation for exact syntax
- Document all failures for team learning

---

*This file should be updated whenever new failures are encountered to build institutional knowledge.*
