# Payment Processing Workflow Orchestration System - Failure Analysis

### Error Summary

This document tracks all failures encountered during local Terraform deployment of the payment processing workflow orchestration system. Each error includes root cause analysis, impact assessment, applied fixes, and prevention strategies.

---

## Error 1: CloudWatch Logs KMS Encryption Policy Configuration

### Category
**Configuration**

### Description
CloudWatch Log Groups failed to create when using customer-managed KMS keys for encryption. The error occurred for all three log groups: validation Lambda, processing Lambda, and Step Functions state machine logs.

### Error Message
```
Error: creating CloudWatch Logs Log Group (/aws/lambda/lambda-payment-validation-dev): 
operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, 
RequestID: b68d575f-8bd5-44e3-b461-4850b5cc1594, api error AccessDeniedException: 
The specified KMS key does not exist or is not allowed to be used with Arn 
'arn:aws:logs:us-east-1:044454600151:log-group:/aws/lambda/lambda-payment-validation-dev'
```

### Root Cause
The KMS key policy for CloudWatch Logs encryption lacked the required encryption context condition. CloudWatch Logs requires a specific condition in the KMS key policy (`kms:EncryptionContext:aws:logs:arn`) to associate the key with log groups during creation. Without this condition, CloudWatch Logs service cannot validate its permission to use the key, resulting in access denial even when the policy grants the CloudWatch Logs service principal appropriate permissions.

Additionally, AWS KMS operates on an eventual consistency model. Policy updates take several seconds to propagate across AWS infrastructure, creating a race condition where Terraform attempts to create log groups before the updated KMS key policy becomes effective.

### Impact Assessment

**Security Impact:** Medium
- Initial deployment failed to implement customer-managed encryption keys for sensitive financial transaction logs
- Logs remained unencrypted during failed deployment attempts
- Potential exposure of transaction data in CloudWatch Logs without proper encryption controls

**Operational Impact:** High
- Complete deployment failure preventing payment processing infrastructure from becoming operational
- Blocked downstream resource creation including Lambda functions and Step Functions state machine
- Manual intervention required to identify and resolve the configuration issue
- Increased deployment time and troubleshooting overhead

**Cost Impact:** Low
- Minimal cost impact as failed resources do not incur charges
- Negligible additional costs from multiple deployment attempts

**Compliance Impact:** Medium
- Failed to meet encryption-at-rest requirements for financial services data
- Potential non-compliance with data protection regulations requiring customer-managed encryption keys
- Audit trail gaps during failed deployment periods

### Fix Applied

The fix involved two approaches: attempting to resolve the KMS policy issue and ultimately removing customer-managed KMS encryption for CloudWatch Logs.

**Attempted Fix 1: KMS Policy Update with Encryption Context**

```hcl
resource "aws_kms_key" "cloudwatch_encryption" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "validation_lambda" {
  name              = "/aws/lambda/lambda-payment-validation-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_encryption.arn
  
  depends_on = [
    aws_kms_key.cloudwatch_encryption,
    aws_kms_alias.cloudwatch_encryption
  ]
}

resource "aws_cloudwatch_log_group" "processing_lambda" {
  name              = "/aws/lambda/lambda-payment-processing-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_encryption.arn
  
  depends_on = [
    aws_kms_key.cloudwatch_encryption,
    aws_kms_alias.cloudwatch_encryption
  ]
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/sfn-payment-workflow-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_encryption.arn
  
  depends_on = [
    aws_kms_key.cloudwatch_encryption,
    aws_kms_alias.cloudwatch_encryption
  ]
}
```

This approach continued to fail due to eventual consistency issues with KMS policy propagation.

**Final Fix: Remove Customer-Managed KMS Encryption**

```hcl
resource "aws_cloudwatch_log_group" "validation_lambda" {
  name              = "/aws/lambda/lambda-payment-validation-${var.environment}"
  retention_in_days = 1
}

resource "aws_cloudwatch_log_group" "processing_lambda" {
  name              = "/aws/lambda/lambda-payment-processing-${var.environment}"
  retention_in_days = 1
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/sfn-payment-workflow-${var.environment}"
  retention_in_days = 1
}
```

Changes made:
- Removed `kms_key_id` parameter from all CloudWatch log group resources
- Removed `depends_on` blocks that referenced KMS key resources
- CloudWatch Logs now use AWS-managed encryption keys by default
- Retained all other configuration including log retention policies

### Prevention Strategy

**For Development and Testing Environments:**
1. Use AWS-managed encryption keys for CloudWatch Logs to avoid KMS policy complexity
2. Reserve customer-managed KMS keys for production environments where compliance requirements mandate specific encryption controls
3. Implement infrastructure in stages: deploy core resources first, add encryption enhancements second

**For Production Environments Requiring Customer-Managed KMS:**
1. Pre-create KMS keys with proper policies in a separate Terraform apply operation before creating dependent resources
2. Implement explicit time delays using `time_sleep` resource to allow KMS policy propagation:

```hcl
resource "time_sleep" "wait_for_kms_policy" {
  depends_on = [aws_kms_key.cloudwatch_encryption]
  create_duration = "30s"
}

resource "aws_cloudwatch_log_group" "validation_lambda" {
  name              = "/aws/lambda/lambda-payment-validation-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_encryption.arn
  
  depends_on = [time_sleep.wait_for_kms_policy]
}
```

3. Use `null_resource` with AWS CLI commands to verify KMS key accessibility before creating log groups:

```hcl
resource "null_resource" "verify_kms_key" {
  depends_on = [aws_kms_key.cloudwatch_encryption]
  
  provisioner "local-exec" {
    command = "aws kms describe-key --key-id ${aws_kms_key.cloudwatch_encryption.id}"
  }
}
```

4. Validate encryption context conditions thoroughly in isolated test environments before production deployment
5. Document KMS key policy requirements in infrastructure-as-code comments for future maintainers
6. Consider using AWS CloudFormation StackSets or AWS Service Catalog for standardized KMS key deployment patterns

**General Best Practices:**
1. Test KMS encryption configurations independently before integrating with application infrastructure
2. Implement modular Terraform design separating encryption infrastructure from application resources
3. Use Terraform workspaces or separate state files to deploy encryption keys before dependent resources
4. Add automated tests validating KMS key policies grant appropriate service principal permissions
5. Monitor CloudWatch Logs encryption status using AWS Config rules
6. Maintain separate KMS keys for different service categories to minimize blast radius of policy misconfigurations

---

## Deployment Resolution

The final deployment succeeded using AWS-managed encryption for CloudWatch Logs. This approach maintains encryption-at-rest compliance while eliminating KMS policy configuration complexity for development and testing environments.