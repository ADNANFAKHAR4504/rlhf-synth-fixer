This document tracks all errors encountered during the Terraform deployment of a serverless event-driven architecture for financial market data processing. The infrastructure includes Lambda functions, EventBridge event bus, DynamoDB tables, SQS dead letter queues, SNS notifications, CloudWatch monitoring, and X-Ray tracing.

---

## Error 1: Lambda Reserved Concurrent Executions Limit Exceeded

### Title
Lambda Function Concurrency Configuration Exceeds Account Limits

### Description
During `terraform apply`, all three Lambda functions (ingestion, processing, notification) failed to deploy with the following error:

```
Error: setting Lambda Function (lambda-ingestion-dev) concurrency: operation error Lambda: 
PutFunctionConcurrency, https response error StatusCode: 400, RequestID: 37c3ad35-3f63-4c64-ba52-0ffa86fdfccd, 
InvalidParameterValueException: Specified ReservedConcurrentExecutions for function decreases 
account's UnreservedConcurrentExecution below its minimum value of [10].
```

The error occurred on line 487 for `lambda-ingestion-dev`, line 525 for `lambda-processing-dev`, and line 563 for `lambda-notification-dev`.

### Root Cause

The infrastructure attempted to reserve 10 concurrent executions for each of three Lambda functions (30 total reserved executions). However, the AWS account had a regional concurrent execution limit of only 10 total executions, not the standard 1,000.[10][11][12]

AWS requires maintaining a minimum of 10 unreserved concurrent executions in the account pool for functions without reserved capacity. The configuration violated this constraint by attempting to reserve capacity that exceeded available account limits.[10]

This is a common issue in:
- New AWS accounts with default soft limits
- Sandbox/development accounts with reduced quotas
- Accounts that have not requested Service Quota increases

### Impact Assessment

**Operational Impact**: High
- Complete deployment failure for all Lambda functions
- Event processing pipeline non-functional
- No capacity to handle market data events

**Cost Impact**: None
- No resources created due to deployment failure
- No ongoing costs incurred

**Security Impact**: None
- Reserved concurrency is a capacity management feature, not a security control

**Compliance Impact**: Low
- Event processing capability unavailable affects audit trail generation
- 90-day EventBridge archive cannot capture events until deployment succeeds

### Fix Applied

Removed the `reserved_concurrent_executions` parameter from all three Lambda function definitions, allowing them to use the unreserved concurrency pool.

**Before (Incorrect Configuration):**

```hcl
resource "aws_lambda_function" "ingestion" {
  function_name = "lambda-ingestion-${var.environment}"
  role          = aws_iam_role.lambda_ingestion.arn
  handler       = "lambda_function.ingestion_handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  reserved_concurrent_executions = var.lambda_reserved_concurrent_executions  # PROBLEMATIC LINE

  environment {
    variables = {
      ENVIRONMENT = var.environment
      REGION      = data.aws_region.current.name
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq_ingestion.arn
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_ingestion_basic,
    aws_iam_role_policy.lambda_ingestion_custom
  ]

  tags = {
    FunctionType = "ingestion"
  }
}
```

**After (Fixed Configuration):**

```hcl
resource "aws_lambda_function" "ingestion" {
  function_name = "lambda-ingestion-${var.environment}"
  role          = aws_iam_role.lambda_ingestion.arn
  handler       = "lambda_function.ingestion_handler"
  runtime       = "python3.11"
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds

  filename         = data.archive_file.lambda_code.output_path
  source_code_hash = data.archive_file.lambda_code.output_base64sha256

  # REMOVED: reserved_concurrent_executions parameter

  environment {
    variables = {
      ENVIRONMENT = var.environment
      REGION      = data.aws_region.current.name
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.dlq_ingestion.arn
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_ingestion_basic,
    aws_iam_role_policy.lambda_ingestion_custom
  ]

  tags = {
    FunctionType = "ingestion"
  }
}
```

The same fix was applied to `aws_lambda_function.processing` and `aws_lambda_function.notification`.

### Prevention Strategy

**For Development and Testing Environments:**

1. **Avoid Reserved Concurrency in Testing**: Do not configure `reserved_concurrent_executions` in development, staging, or CI/CD test environments where account limits may be constrained.[13][14]

2. **Check Account Limits Before Deployment**: Query current Lambda concurrency limits using AWS CLI:
   ```bash
   aws lambda get-account-settings --region us-east-1
   ```
   This returns the `AccountLimit.ConcurrentExecutions` value.

3. **Use Conditional Configuration**: Implement environment-specific concurrency configuration:
   ```hcl
   variable "enable_reserved_concurrency" {
     description = "Enable reserved concurrency for Lambda functions"
     type        = bool
     default     = false
   }

   resource "aws_lambda_function" "ingestion" {
     # ... other configuration ...
     
     reserved_concurrent_executions = var.enable_reserved_concurrency ? var.lambda_reserved_concurrent_executions : null
   }
   ```