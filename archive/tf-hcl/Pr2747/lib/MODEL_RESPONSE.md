## main.tf

```hcl
# Required variable for provider.tf consumption
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

# KMS Key for CloudWatch Log Group encryption
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch log encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "secureApp-cloudwatch-kms-key"
    Environment = var.environment
    Project     = "secureApp"
  }
}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/secureApp-cloudwatch-logs"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}

# S3 Bucket with AES-256 encryption and blocked public access
resource "aws_s3_bucket" "secure_bucket" {
  bucket = "secureapp-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "secureApp-secure-bucket"
    Environment = var.environment
    Project     = "secureApp"
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# IAM Role for Lambda with least privilege and cross-account access
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }

  # Cross-account access
  dynamic "statement" {
    for_each = var.trusted_account_ids
    content {
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = ["arn:aws:iam::${statement.value}:root"]
      }

      actions = ["sts:AssumeRole"]

      condition {
        test     = "StringEquals"
        variable = "sts:ExternalId"
        values   = [var.external_id]
      }
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "secureApp-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name        = "secureApp-lambda-role"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# Least privilege policy for Lambda
data "aws_iam_policy_document" "lambda_policy" {
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["arn:aws:logs:${var.aws_region}:*:*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject"
    ]

    resources = ["${aws_s3_bucket.secure_bucket.arn}/*"]
  }

  statement {
    effect = "Allow"

    actions = [
      "s3:ListBucket"
    ]

    resources = [aws_s3_bucket.secure_bucket.arn]
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name   = "secureApp-lambda-policy"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}

# CloudWatch Log Group with KMS encryption
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/secureApp-function"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = {
    Name        = "secureApp-lambda-logs"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# Lambda Function
resource "aws_lambda_function" "secure_function" {
  filename         = "lambda/function.zip"
  function_name    = "secureApp-function"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "nodejs14.x"
  timeout         = var.lambda_timeout

  environment {
    variables = var.lambda_environment_variables
  }

  depends_on = [
    aws_iam_role_policy.lambda_policy,
    aws_cloudwatch_log_group.lambda_logs,
  ]

  tags = {
    Name        = "secureApp-function"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# Lambda deployment package
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "lambda/index.js"
  output_path = "lambda/function.zip"
}

# CloudWatch Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_error_alarm" {
  alarm_name          = "secureApp-lambda-error-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = var.alarm_actions

  dimensions = {
    FunctionName = aws_lambda_function.secure_function.function_name
  }

  tags = {
    Name        = "secureApp-lambda-error-alarm"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# WAF WebACL
resource "aws_wafv2_web_acl" "main" {
  name  = "secureApp-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "secureApp-rate-limit"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "secureAppRateLimit"
      sampled_requests_enabled    = true
    }

    action {
      block {}
    }
  }

  rule {
    name     = "secureApp-ip-reputation"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                 = "secureAppIPReputation"
      sampled_requests_enabled    = true
    }

    action {
      block {}
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                 = "secureAppWAF"
    sampled_requests_enabled    = true
  }

  tags = {
    Name        = "secureApp-waf"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = aws_s3_bucket.secure_bucket.bucket_regional_domain_name
    origin_id   = "secureApp-S3-${aws_s3_bucket.secure_bucket.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.main.arn

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "secureApp-S3-${aws_s3_bucket.secure_bucket.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US", "CA", "GB", "DE"]
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name        = "secureApp-distribution"
    Environment = var.environment
    Project     = "secureApp"
  }
}

resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "secureApp origin access identity"
}

# S3 bucket policy for CloudFront
data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.secure_bucket.arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [aws_cloudfront_origin_access_identity.main.iam_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "secure_bucket" {
  bucket = aws_s3_bucket.secure_bucket.id
  policy = data.aws_iam_policy_document.s3_policy.json
}
```

## variables.tf

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "trusted_account_ids" {
  description = "List of AWS account IDs for cross-account access"
  type        = list(string)
  default     = []
}

variable "external_id" {
  description = "External ID for cross-account role assumption"
  type        = string
  default     = "secureApp-external-id"
  sensitive   = true
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30

  validation {
    condition     = var.lambda_timeout <= 30
    error_message = "Lambda timeout must not exceed 30 seconds."
  }
}

variable "lambda_environment_variables" {
  description = "Environment variables for Lambda function"
  type        = map(string)
  default     = {}
  sensitive   = true
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}
```

## outputs.tf

```hcl
output "s3_bucket_name" {
  description = "Name of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.id
  sensitive   = false
}

output "s3_bucket_arn" {
  description = "ARN of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.arn
  sensitive   = false
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.secure_function.function_name
  sensitive   = false
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.secure_function.arn
  sensitive   = false
}

output "lambda_role_arn" {
  description = "ARN of the Lambda IAM role"
  value       = aws_iam_role.lambda_role.arn
  sensitive   = false
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
  sensitive   = false
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
  sensitive   = false
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF WebACL"
  value       = aws_wafv2_web_acl.main.arn
  sensitive   = false
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda_logs.name
  sensitive   = false
}

output "kms_key_id" {
  description = "ID of the KMS key for CloudWatch logs"
  value       = aws_kms_key.cloudwatch_logs.key_id
  sensitive   = false
}

output "alarm_name" {
  description = "Name of the CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.lambda_error_alarm.alarm_name
  sensitive   = false
}
```

## lambda/index.js

```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event, context) => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  console.log('Context: ', JSON.stringify(context, null, 2));

  try {
    // Example S3 operation
    const bucketName = process.env.BUCKET_NAME;

    if (bucketName) {
      const params = {
        Bucket: bucketName,
        Key: `logs/execution-${context.awsRequestId}.json`,
        Body: JSON.stringify({
          requestId: context.awsRequestId,
          timestamp: new Date().toISOString(),
          event: event,
        }),
        ContentType: 'application/json',
      };

      await s3.putObject(params).promise();
      console.log('Log saved to S3 successfully');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Function executed successfully',
        requestId: context.awsRequestId,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

## Makefile

```makefile
.PHONY: help format validate plan lint security-check all

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

format: ## Format Terraform code
	@echo "Formatting Terraform code..."
	terraform fmt -recursive

validate: ## Validate Terraform code
	@echo "Validating Terraform configuration..."
	terraform validate

plan: ## Create Terraform plan
	@echo "Creating Terraform plan..."
	terraform plan -out=tfplan

lint: ## Run TFLint
	@echo "Running TFLint..."
	tflint --init
	tflint

security-check: ## Run security checks
	@echo "Running security checks..."
	./scripts/security-check.sh

all: format validate lint security-check ## Run all checks
	@echo "All checks completed!"

clean: ## Clean temporary files
	@echo "Cleaning temporary files..."
	rm -f tfplan
	rm -f lambda/function.zip
```

## scripts/security-check.sh

```bash
#!/bin/bash

echo "Running security checks..."

# Check if tfsec is available
if command -v tfsec &> /dev/null; then
    echo "Running tfsec..."
    tfsec .
else
    echo "tfsec not found, skipping..."
fi

# Check if checkov is available
if command -v checkov &> /dev/null; then
    echo "Running checkov..."
    checkov -f main.tf
else
    echo "checkov not found, skipping..."
fi

# Check if terrascan is available
if command -v terrascan &> /dev/null; then
    echo "Running terrascan..."
    terrascan scan -t aws
else
    echo "terrascan not found, skipping..."
fi

echo "Security checks completed!"
```
