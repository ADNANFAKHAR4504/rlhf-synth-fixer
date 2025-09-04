I'll fix all the errors identified in the Terraform deployment. Here are the corrected sections that need to be updated in the `main.tf` file:

## Fixed File: `main.tf` (Updated sections only)

Replace the problematic sections in your `main.tf` file with these corrected versions:

### Fix 1: S3 Bucket Lifecycle Configuration (around line 177)

```hcl
# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "app_assets_lifecycle" {
  bucket = aws_s3_bucket.app_assets.id

  rule {
    id     = "cleanup_old_versions"
    status = "Enabled"

    # Add filter to specify which objects the rule applies to
    filter {
      prefix = "" # Apply to all objects in the bucket
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
```

### Fix 2: DynamoDB Global Secondary Index (around line 216)

```hcl
# DynamoDB table with on-demand billing
resource "aws_dynamodb_table" "app_data" {
  name           = "${local.name_prefix}-data"
  billing_mode   = "PAY_PER_REQUEST" # On-demand as required
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # Optional GSI for querying by status
  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  global_secondary_index {
    name               = "status-created_at-index"
    hash_key           = "status"
    range_key          = "created_at"
    projection_type    = "ALL" # Required argument - projects all attributes
  }

  # TTL attribute for automatic item expiration
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-data"
    Description = "DynamoDB table for ProjectX application data with on-demand billing"
  })
}
```

### Fix 3: Replace Lambda Event Invoke Config with Function Event Invoke Config (around lines 610-622)

```hcl
# Lambda Function Event Invoke Configuration for error handling
resource "aws_lambda_function_event_invoke_config" "api_handler_invoke_config" {
  function_name = aws_lambda_function.api_handler.function_name

  destination_config {
    on_failure {
      destination = aws_sns_topic.lambda_errors.arn
    }
  }

  maximum_retry_attempts = 2
}

resource "aws_lambda_function_event_invoke_config" "data_processor_invoke_config" {
  function_name = aws_lambda_function.data_processor.function_name

  destination_config {
    on_failure {
      destination = aws_sns_topic.lambda_errors.arn
    }
  }

  maximum_retry_attempts = 2
}
```

### Fix 4: Add SNS Topic Policy for Lambda to Publish Messages

Add this additional resource after the SNS topic subscription to ensure Lambda can publish to the SNS topic:

```hcl
# SNS Topic Policy to allow Lambda functions to publish messages
resource "aws_sns_topic_policy" "lambda_errors_policy" {
  arn = aws_sns_topic.lambda_errors.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaPublish"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.lambda_execution_role.arn,
            aws_iam_role.lambda_processor_role.arn
          ]
        }
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.lambda_errors.arn
      }
    ]
  })
}
```

### Fix 5: Add SNS Publish Permission to Lambda IAM Policies

Update the `lambda_basic_execution` policy to include SNS publish permissions:

```hcl
# IAM Policy for basic Lambda execution (CloudWatch Logs, X-Ray, and SNS)
resource "aws_iam_policy" "lambda_basic_execution" {
  name        = "${local.name_prefix}-lambda-basic-execution"
  description = "Basic execution policy for Lambda functions - CloudWatch Logs, X-Ray, and SNS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # CloudWatch Logs permissions - required for all Lambda functions
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${local.region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        # X-Ray tracing permissions - required for distributed tracing
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        # SNS publish permissions - required for error notifications
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.lambda_errors.arn
      }
    ]
  })

  tags = local.tags
}
```

## Summary of Fixes Applied:

1. **S3 Lifecycle Configuration**: Added required `filter` block with empty prefix to apply rules to all objects
2. **DynamoDB GSI**: Added required `projection_type = "ALL"` parameter to the Global Secondary Index
3. **Lambda Event Invoke Config**: Changed from `aws_lambda_event_invoke_config` to `aws_lambda_function_event_invoke_config` (correct resource type)
4. **SNS Permissions**: Added SNS topic policy and updated Lambda IAM policy to allow publishing to the error notification topic

These fixes address all the errors mentioned in your deployment log:

- Fixed S3 lifecycle configuration attribute combination warning
- Fixed missing `projection_type` argument in DynamoDB GSI
- Fixed invalid resource type for Lambda event invoke configuration
- Added proper SNS permissions for Lambda error handling

The corrected configuration should now deploy successfully without errors.
