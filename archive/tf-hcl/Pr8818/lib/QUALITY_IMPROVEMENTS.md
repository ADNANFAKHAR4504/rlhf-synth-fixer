# Infrastructure Quality Improvements

## Current Score Analysis
**Current Score**: 7/10
**Target Score**: 8+/10
**Required Improvement**: +1 to +2 points

## Missing Category A Improvements (+2 points)

### 1. IAM Least-Privilege Permissions (+1 point)

**Current Issue**: Multiple wildcard (*) permissions in IAM policies

**Locations**:
- `lib/iam.tf:59` - Lambda DynamoDB access
- `lib/iam.tf:105, 114, 123` - S3 replication permissions
- `lib/iam.tf:131, 147` - KMS encryption permissions

**Fix Required**:
Replace wildcard permissions with specific resource ARNs:

```hcl
# Lambda DynamoDB Policy - BEFORE
Resource = "*"

# Lambda DynamoDB Policy - AFTER
Resource = [
  aws_dynamodb_table.transactions.arn,
  "${aws_dynamodb_table.transactions.arn}/*"
]
```

```hcl
# S3 Replication Policy - BEFORE
Resource = "*"

# S3 Replication Policy - AFTER
Resource = [
  aws_s3_bucket.documents.arn,
  "${aws_s3_bucket.documents.arn}/*",
  aws_s3_bucket.documents_secondary.arn,
  "${aws_s3_bucket.documents_secondary.arn}/*"
]
```

```hcl
# KMS Policy - BEFORE
Resource = "*"

# KMS Policy - AFTER
Resource = [
  aws_kms_key.s3.arn,
  aws_kms_key.s3_secondary.arn
]
```

### 2. Lambda Dead-Letter Queues (+0.5 point)

**Current State**: No DLQ configured for Lambda functions

**Fix Required**:
Add SQS dead-letter queue for Lambda error handling:

```hcl
# Create DLQ
resource "aws_sqs_queue" "lambda_dlq" {
  provider = aws.primary
  name     = "${local.resource_prefix}-lambda-dlq-${local.current_region}"
  
  kms_master_key_id = aws_kms_key.s3.id
  
  tags = merge(
    local.common_tags,
    {
      Name = "${local.resource_prefix}-lambda-dlq-${local.current_region}"
    }
  )
}

# Add to Lambda function
resource "aws_lambda_function" "processor" {
  # ... existing config ...
  
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }
}
```

### 3. Enhanced CloudWatch Alarms (+0.5 point)

**Current State**: 4 existing alarms (good start)

**Additional Alarms Needed**:
- Lambda throttle alarm
- DynamoDB throttle alarm
- API Gateway 5XX error alarm (currently only 4XX)

```hcl
# Lambda Throttles Alarm
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-lambda-throttles-${local.current_region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Lambda function is being throttled"
  
  dimensions = {
    FunctionName = aws_lambda_function.processor.function_name
  }
  
  tags = local.common_tags
}

# DynamoDB Throttles Alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-dynamodb-throttles-${local.current_region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "DynamoDB requests are being throttled"
  
  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }
  
  tags = local.common_tags
}
```

## Implementation Priority

1. **Fix IAM wildcards** (+1 point) - CRITICAL for security
2. **Add Lambda DLQ** (+0.5 point) - Important for error handling
3. **Add enhanced alarms** (+0.5 point) - Good for monitoring

## Expected Outcome

- **Before**: 7/10
- **After IAM fix**: 8/10  (meets threshold!)
- **After all fixes**: 8.5-9/10 (exceeds threshold significantly)

## Files to Modify

1. `lib/iam.tf` - Fix wildcard permissions
2. `lib/lambda.tf` - Add DLQ configuration
3. `lib/cloudwatch.tf` - Add enhanced alarms
4. New file: `lib/sqs.tf` - Create DLQ resource

