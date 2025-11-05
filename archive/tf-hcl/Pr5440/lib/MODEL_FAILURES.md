# Model Failures Documentation

This document lists the errors found in the model-generated code that required fixes before successful deployment.

## Error 1: Missing S3 Lifecycle Filter

**File**: lib/main.tf  
**Line**: 206  
**Resource**: aws_s3_bucket_lifecycle_configuration.data_bucket_lifecycle

**Error Message**:
```
Warning: Invalid Attribute Combination
No attribute specified when one (and only one) of [rule.filter,rule.prefix] is required
```

**Problem**: The S3 lifecycle rule was missing a required filter attribute.

**Original Code**:
```
rule {
  id     = "transition-to-glacier"
  status = "Enabled"
  
  transition {
    days          = local.s3_lifecycle_days
    storage_class = "GLACIER"
  }
}
```

**Fixed Code**:
```
rule {
  id     = "transition-to-glacier"
  status = "Enabled"
  
  filter {}
  
  transition {
    days          = local.s3_lifecycle_days
    storage_class = "GLACIER"
  }
}
```

**Fix**: Added empty filter block to apply rule to all objects.

---

## Error 2: KMS Policy Conditional Type Mismatch

**File**: lib/main.tf  
**Line**: 113  
**Resource**: aws_kms_key.data_key

**Error Message**:
```
Error: Inconsistent conditional result types
The true and false result expressions must have consistent types. 
Type mismatch for tuple element 0: Type mismatch for object attribute "Action": 
The 'true' tuple has length 3, but the 'false' tuple has length 2.
```

**Problem**: The conditional in the KMS policy had different array lengths for Actions (3 actions in dev environment, 2 in prod environment), causing a type mismatch error.

**Original Code**:
```
local.environment == "dev" ? [
  {
    Action = [
      "kms:Describe*",
      "kms:List*",
      "kms:GetKeyPolicy"
    ]
  }
] : [
  {
    Action = [
      "kms:Decrypt",
      "kms:GenerateDataKey"
    ]
  }
]
```

**Fixed Code**:
```
policy = jsonencode({
  Version = "2012-10-17"
  Statement = [
    {
      Sid    = "EnableIAMUserPermissions"
      Effect = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      }
      Action   = "kms:*"
      Resource = "*"
    },
    {
      Sid    = "AllowServiceUsage"
      Effect = "Allow"
      Principal = {
        AWS = aws_iam_role.data_access_role.arn
      }
      Action = [
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ]
      Resource = "*"
    }
  ]
})
```

**Fix**: Simplified the policy to remove the problematic conditional and use a single unified policy for all environments.

---

## Summary

**Total Errors**: 2  
**Error Type**: Terraform syntax and validation errors  
**Resolution**: Both errors were fixed manually  
**Deployment Status**: Successful after fixes

## Deployment Result

```
Apply complete! Resources: 12 added, 0 changed, 0 destroyed.
```

**Resources Created**: 12 AWS resources including S3, DynamoDB, KMS, IAM, SNS, and CloudWatch.

---

## Cleanup

To destroy all resources:
```
terraform destroy -var="environmentSuffix=dev" -auto-approve
```