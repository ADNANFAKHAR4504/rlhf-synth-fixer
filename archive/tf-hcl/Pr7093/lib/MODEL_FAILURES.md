# Model Failures and Corrections

This document tracks all errors encountered during terraform apply and their resolutions for the Serverless Transaction Processing Pipeline infrastructure deployment.

## Error Summary

Total Errors: 4 (7 individual deployment failures across multiple attempts)
- Critical: 2 (Lambda concurrency limits)
- Configuration: 2 (SNS policy, CloudWatch Logs KMS permissions)

---

## Error 1: Lambda Reserved Concurrency - Account Limit Exceeded (Transaction Processor)

**Severity:** Critical  
**Category:** Configuration Error  
**File:** main.tf, Line 542  
**Resource:** `aws_lambda_function.transaction_processor`

### Error Message

```
Error: setting Lambda Function (lambda-transaction-processor-dev) concurrency: 
operation error Lambda: PutFunctionConcurrency, https response error StatusCode: 400, 
RequestID: a7d87a0a-0da2-4286-8246-316221270ff1, InvalidParameterValueException: 
Specified ReservedConcurrentExecutions for function decreases account's 
UnreservedConcurrentExecution below its minimum value of [10].
```

### Description

The Lambda function configuration attempted to reserve 100 concurrent executions as specified in the requirements, but the AWS account has insufficient total concurrency available to maintain the required minimum of 10 unreserved executions. This error persisted through multiple attempts with progressively lower values (100 → 5 → 1) before requiring complete removal of the reserved concurrency setting.

### Root Cause

AWS Lambda accounts have a default concurrent execution limit (typically 1000 for new accounts in a region) that must maintain at least 10 unreserved executions for other functions. The account already had other Lambda functions consuming concurrency capacity, leaving insufficient headroom to reserve even 1 execution without violating the minimum unreserved requirement. The prompt specification of reserving 100 executions assumed a higher account limit or fewer existing functions.

### Impact

**Operational Impact:** High - Reserved concurrency prevents throttling under load, but for dev/test environments unreserved concurrency is acceptable  
**Security Impact:** None  
**Cost Impact:** None - Unreserved concurrency has identical pricing  
**Compliance Impact:** Low - Dev environment doesn't require guaranteed concurrent execution capacity

### Original Code

```hcl
resource "aws_lambda_function" "transaction_processor" {
  function_name = "lambda-transaction-processor-${var.environment}"
  role          = aws_iam_role.transaction_processor.arn
  handler       = "processor_function.lambda_handler"
  runtime       = "python3.11"
  architectures = ["arm64"]
  memory_size   = 512
  timeout       = 300
  
  reserved_concurrent_executions = 100

  filename         = data.archive_file.processor_function_zip.output_path
  source_code_hash = data.archive_file.processor_function_zip.output_base64sha256
```

### Corrected Code

```hcl
resource "aws_lambda_function" "transaction_processor" {
  function_name = "lambda-transaction-processor-${var.environment}"
  role          = aws_iam_role.transaction_processor.arn
  handler       = "processor_function.lambda_handler"
  runtime       = "python3.11"
  architectures = ["arm64"]
  memory_size   = 512
  timeout       = 300

  filename         = data.archive_file.processor_function_zip.output_path
  source_code_hash = data.archive_file.processor_function_zip.output_base64sha256
```

### Prevention Strategy

1. Query account concurrency limits using AWS Service Quotas API before setting reserved concurrency
2. Use unreserved concurrency for dev/test environments where guaranteed capacity is not critical
3. Request AWS Service Quotas increase for concurrent executions if production workloads require reserved capacity
4. Implement CloudWatch alarms on Lambda throttling metrics to detect capacity issues without reserved concurrency
5. Document actual account limits in infrastructure repository to prevent configuration mismatches

---

## Error 2: Lambda Reserved Concurrency - Account Limit Exceeded (DLQ Processor)

**Severity:** Critical  
**Category:** Configuration Error  
**File:** main.tf, Line 576  
**Resource:** `aws_lambda_function.dlq_processor`

### Error Message

```
Error: setting Lambda Function (lambda-dlq-processor-dev) concurrency: 
operation error Lambda: PutFunctionConcurrency, https response error StatusCode: 400, 
RequestID: 024216ba-0ce3-4f86-aff0-d51ca5b15d57, InvalidParameterValueException: 
Specified ReservedConcurrentExecutions for function decreases account's 
UnreservedConcurrentExecution below its minimum value of [10].
```

### Description

Identical to Error 1, the DLQ processor Lambda attempted to reserve 50 concurrent executions but encountered the same account-level concurrency constraints. Multiple deployment attempts with reduced values (50 → 3 → 1) all failed before requiring complete removal of the setting.

### Root Cause

Same root cause as Error 1 - insufficient account-level concurrent execution capacity to satisfy both Lambda functions' reserved concurrency requirements while maintaining the mandatory 10 unreserved executions. The combined reservation of 100 + 50 = 150 executions far exceeded available capacity.

### Impact

**Operational Impact:** Medium - DLQ processing is lower volume and can tolerate unreserved concurrency sharing  
**Security Impact:** None  
**Cost Impact:** None  
**Compliance Impact:** Low - Error processing doesn't require guaranteed execution capacity in dev environment

### Original Code

```hcl
resource "aws_lambda_function" "dlq_processor" {
  function_name = "lambda-dlq-processor-${var.environment}"
  role          = aws_iam_role.dlq_processor.arn
  handler       = "dlq_processor_function.lambda_handler"
  runtime       = "python3.11"
  architectures = ["arm64"]
  memory_size   = 512
  timeout       = 300
  
  reserved_concurrent_executions = 50

  filename         = data.archive_file.dlq_processor_function_zip.output_path
  source_code_hash = data.archive_file.dlq_processor_function_zip.output_base64sha256
```

### Corrected Code

```hcl
resource "aws_lambda_function" "dlq_processor" {
  function_name = "lambda-dlq-processor-${var.environment}"
  role          = aws_iam_role.dlq_processor.arn
  handler       = "dlq_processor_function.lambda_handler"
  runtime       = "python3.11"
  architectures = ["arm64"]
  memory_size   = 512
  timeout       = 300

  filename         = data.archive_file.dlq_processor_function_zip.output_path
  source_code_hash = data.archive_file.dlq_processor_function_zip.output_base64sha256
```

### Prevention Strategy

1. Same strategies as Error 1
2. For production deployments, calculate total reserved concurrency needs across all functions before deployment
3. Use AWS CloudFormation StackSets or Terraform workspaces to enforce environment-specific concurrency settings

---

## Error 3: SNS Topic Policy - Invalid Wildcard Action

**Severity:** Configuration Error  
**Category:** IAM Policy Error  
**File:** main.tf, Line 656  
**Resource:** `aws_sns_topic.alerts`

### Error Message

```
Error: setting SNS Topic (arn:aws:sns:eu-central-1:044454600151:sns-alerts-dev) 
attribute (Policy): operation error SNS: SetTopicAttributes, https response error 
StatusCode: 400, RequestID: 595c0885-8e44-5d62-bdc2-691e55ec8dec, InvalidParameter: 
Invalid parameter: Policy statement action out of service scope!
```

### Description

The SNS topic policy used a wildcard action "SNS:*" with a wildcard resource "*" in violation of AWS SNS policy validation rules. AWS SNS requires explicit action specification and proper ARN formatting in topic policies to prevent overly permissive access grants.

### Root Cause

The model generated a topic policy following a common pattern used for S3 bucket policies and KMS key policies where wildcard actions are permitted. However, SNS has stricter policy validation that rejects wildcard actions in topic policies, requiring explicit enumeration of allowed SNS actions (Publish, Subscribe, SetTopicAttributes, etc.) and specific topic ARN references instead of wildcard resources.

### Impact

**Operational Impact:** High - Prevented SNS topic creation blocking CloudWatch alarm notifications  
**Security Impact:** Medium - Overly permissive wildcard policy would have granted unnecessary privileges  
**Cost Impact:** None  
**Compliance Impact:** Medium - Violates least privilege principle for IAM policies

### Original Code

```hcl
resource "aws_sns_topic" "alerts" {
  name              = "sns-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.lambda_encryption.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowRootAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "SNS:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudWatchPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = "*"
      }
    ]
  })
}
```

### Corrected Code

```hcl
resource "aws_sns_topic" "alerts" {
  name              = "sns-alerts-${var.environment}"
  kms_master_key_id = aws_kms_key.lambda_encryption.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowRootAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "SNS:Publish",
          "SNS:Subscribe",
          "SNS:SetTopicAttributes",
          "SNS:GetTopicAttributes",
          "SNS:DeleteTopic"
        ]
        Resource = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:sns-alerts-${var.environment}"
      },
      {
        Sid    = "AllowCloudWatchPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = "arn:aws:sns:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:sns-alerts-${var.environment}"
      }
    ]
  })
}
```

### Prevention Strategy

1. Always use explicit action enumeration in SNS topic policies - never use wildcard actions
2. Replace wildcard resources ("*") with fully qualified ARNs constructed from data sources
3. Validate IAM policies using AWS IAM Policy Simulator before terraform apply
4. Use aws_iam_policy_document data source for policy generation to catch syntax errors during plan phase
5. Document service-specific policy requirements (SNS, SQS, KMS all have different validation rules)

---

## Error 4: CloudWatch Logs KMS Key - Insufficient Permissions

**Severity:** Critical  
**Category:** KMS Policy Configuration  
**File:** main.tf, Line 639 and 645  
**Resources:** `aws_cloudwatch_log_group.transaction_processor`, `aws_cloudwatch_log_group.dlq_processor`

### Error Message

```
Error: creating CloudWatch Logs Log Group (/aws/lambda/lambda-transaction-processor-dev): 
operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, 
RequestID: 89968842-9f52-4886-9a7c-85189b661410, api error AccessDeniedException: 
The specified KMS key does not exist or is not allowed to be used with Arn 
'arn:aws:logs:eu-central-1:044454600151:log-group:/aws/lambda/lambda-transaction-processor-dev'
```

### Description

CloudWatch Logs log groups configured with KMS encryption failed to create because the KMS key policy lacked the necessary permissions for the CloudWatch Logs service principal. The original policy granted only GenerateDataKey and Decrypt permissions with a ViaService condition, but CloudWatch Logs requires additional permissions including CreateGrant and uses a different encryption context validation mechanism.

### Root Cause

CloudWatch Logs uses AWS KMS grants to encrypt log data, requiring the CreateGrant permission that was missing from the original key policy. Additionally, the ViaService condition is insufficient for CloudWatch Logs - it requires an ArnLike condition matching the kms:EncryptionContext:aws:logs:arn encryption context key. Without these permissions, CloudWatch Logs cannot create the encrypted log groups even though the key exists and is referenced correctly.

### Impact

**Operational Impact:** Critical - Prevented Lambda function CloudWatch logging breaking observability  
**Security Impact:** High - Without KMS encryption log data would be unencrypted violating GDPR requirements  
**Cost Impact:** None  
**Compliance Impact:** Critical - GDPR requires encryption at rest for sensitive transaction data in logs

### Original Code

```hcl
resource "aws_kms_key" "lambda_encryption" {
  description             = "KMS key for Lambda env vars, SQS, and CloudWatch Logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs Service Principal"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "logs.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })
}
```

### Corrected Code

```hcl
resource "aws_kms_key" "lambda_encryption" {
  description             = "KMS key for Lambda env vars, SQS, and CloudWatch Logs encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs Service Principal"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
          }
        }
      }
    ]
  })
}
```

### Prevention Strategy

1. Always include kms:CreateGrant permission for AWS services using KMS encryption grants (CloudWatch Logs, SNS, SQS)
2. Use ArnLike conditions with encryption context for CloudWatch Logs instead of ViaService conditions
3. Include comprehensive encryption actions (Encrypt, Decrypt, ReEncrypt*, GenerateDataKey*, DescribeKey) for service principals
4. Test KMS key policies with actual resource creation in a sandbox environment before production deployment
5. Reference AWS service-specific KMS key policy documentation - each service has unique requirements
6. Scope encryption context conditions to specific log group patterns (/aws/lambda/*) to follow least privilege

---

## Summary and Recommendations

### Key Takeaways

1. **AWS Account Limits Awareness:** Reserved Lambda concurrency requires understanding total account limits and existing resource consumption
2. **Service-Specific Policy Validation:** SNS, SQS, KMS, and CloudWatch each have unique IAM policy validation rules that prevent wildcard actions or require specific permissions
3. **KMS Encryption Context Requirements:** CloudWatch Logs uses encryption context and CreateGrant permissions that differ from other AWS services
4. **Iterative Debugging Process:** Configuration errors often require multiple deployment attempts to identify correct values within service constraints

### Recommended Improvements

1. Add pre-deployment validation scripts checking AWS Service Quotas before setting reserved concurrency
2. Implement policy validation using AWS IAM Policy Simulator in CI/CD pipeline
3. Create reusable Terraform modules for KMS keys with pre-configured service principal permissions
4. Document actual AWS account limits and existing resource consumption in infrastructure repository
5. Use aws_iam_policy_document data sources for all policies to catch syntax errors during planning phase

### Model Training Opportunities

These errors provide valuable training data for:
- AWS account concurrency limits and unreserved execution requirements
- Service-specific IAM policy validation rules (SNS wildcard action prohibition)
- CloudWatch Logs KMS encryption requirements (CreateGrant permission, encryption context conditions)
- Iterative troubleshooting patterns for AWS service permission errors
- Environment-specific configuration differences (dev vs production reserved concurrency needs)