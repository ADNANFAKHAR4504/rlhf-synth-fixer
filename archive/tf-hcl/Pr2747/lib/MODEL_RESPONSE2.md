Looking at the error messages, I can identify two main issues:

1. **CloudWatch Logs KMS Key Issue**: The error message shows "The specified KMS key does not exist or is not allowed to be used with Arn". This suggests that either:
   - The KMS key doesn't have the proper permissions for CloudWatch Logs service to use it
   - There's a timing issue where the log group is being created before the KMS key is fully ready
   - The KMS key policy doesn't allow CloudWatch Logs service to use it

2. **WAF Scope Issue**: The error shows "The scope is not valid., field: SCOPE_VALUE, parameter: CLOUDFRONT". This is likely because:
   - WAF with CLOUDFRONT scope must be created in us-east-1 region, not us-west-2
   - CloudFront is a global service and WAF WebACLs for CloudFront must be in us-east-1

Let me provide fixes for both issues:

For the KMS key issue:

- Need to add proper KMS key policy that allows CloudWatch Logs service to use the key
- Need to ensure proper dependencies

For the WAF issue:

- Need to create the WAF WebACL in us-east-1 region specifically
- This might require a separate provider for us-east-1 or changing the approach

### Answer

---

Looking at the error messages, I can identify two critical issues that need to be fixed:

## Issues Identified

1. **KMS Key Permission Issue**: CloudWatch Logs service doesn't have permission to use the KMS key
2. **WAF Regional Issue**: WAF WebACL with `CLOUDFRONT` scope must be created in `us-east-1`, not `us-west-2`

## Solution

Here are the fixes needed in your `main.tf`:

### Fix 1: KMS Key Policy for CloudWatch Logs

Replace the KMS key resource with proper permissions:

```hcl
# KMS Key for CloudWatch Log Group encryption with proper policy
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch log encryption"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/secureApp-function"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "secureApp-cloudwatch-kms-key"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# Add data source for current AWS account
data "aws_caller_identity" "current" {}
```

### Fix 2: WAF with Separate Provider for us-east-1

Add a separate provider for us-east-1 and update WAF resources:

```hcl
# Add this near the top of main.tf, after the aws_region variable
# Provider for us-east-1 (required for CloudFront WAF)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Update WAF WebACL to use us-east-1 provider
resource "aws_wafv2_web_acl" "main" {
  provider = aws.us_east_1
  name     = "secureApp-waf"
  scope    = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "secureApp-rate-limit"
    priority = 1

    action {
      block {}
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
  }

  rule {
    name     = "secureApp-ip-reputation"
    priority = 2

    action {
      block {}
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
```

### Fix 3: Update CloudWatch Log Group Dependencies

Update the log group resource to ensure proper dependency:

```hcl
# CloudWatch Log Group with KMS encryption
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/secureApp-function"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  depends_on = [
    aws_kms_key.cloudwatch_logs
  ]

  tags = {
    Name        = "secureApp-lambda-logs"
    Environment = var.environment
    Project     = "secureApp"
  }
}
```

### Fix 4: Update Lambda Function Dependencies

```hcl
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
    aws_kms_key.cloudwatch_logs
  ]

  tags = {
    Name        = "secureApp-function"
    Environment = var.environment
    Project     = "secureApp"
  }
}
```

## Complete Fixed main.tf Section

Here's the complete corrected section that should replace the problematic parts:

```hcl
# Required variable for provider.tf consumption
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

# Provider for us-east-1 (required for CloudFront WAF)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Data sources
data "aws_caller_identity" "current" {}

# KMS Key for CloudWatch Log Group encryption with proper policy
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch log encryption"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/secureApp-function"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "secureApp-cloudwatch-kms-key"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# Continue with rest of the configuration...

# CloudWatch Log Group with KMS encryption
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/secureApp-function"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  depends_on = [
    aws_kms_key.cloudwatch_logs
  ]

  tags = {
    Name        = "secureApp-lambda-logs"
    Environment = var.environment
    Project     = "secureApp"
  }
}

# WAF WebACL (must be in us-east-1 for CloudFront)
resource "aws_wafv2_web_acl" "main" {
  provider = aws.us_east_1
  name     = "secureApp-waf"
  scope    = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "secureApp-rate-limit"
    priority = 1

    action {
      block {}
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
  }

  rule {
    name     = "secureApp-ip-reputation"
    priority = 2

    action {
      block {}
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
```
