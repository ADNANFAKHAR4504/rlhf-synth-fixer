# Data Sources
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_region" "secondary" {
  provider = aws.secondary
}

data "aws_availability_zones" "primary" {
  state = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "archive_file" "health_monitor" {
  type        = "zip"
  source_file = "${path.module}/lambda_health_monitor.py"
  output_path = "${path.module}/health_monitor.zip"
}

data "archive_file" "config_sync" {
  type        = "zip"
  source_file = "${path.module}/lambda_config_sync.py"
  output_path = "${path.module}/config_sync.zip"
}

# VPC - Primary Region (us-east-1)
resource "aws_vpc" "primary" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-primary-east-${var.environment}"
  }
}

resource "aws_subnet" "primary_private" {
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = {
    Name = "subnet-private-${count.index + 1}-east-${var.environment}"
  }
}

# VPC - Secondary Region (us-west-2)
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-secondary-west-${var.environment}"
  }
}

resource "aws_subnet" "secondary_private" {
  count             = 2
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = {
    Name = "subnet-private-${count.index + 1}-west-${var.environment}"
  }
}

# DynamoDB Global Table
resource "aws_dynamodb_table" "transactions" {
  name         = "transactions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"
  range_key    = "timestamp"

  deletion_protection_enabled = false

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  point_in_time_recovery {
    enabled = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  replica {
    region_name = "us-west-2"
  }

  tags = {
    Name = "dynamodb-transactions-global-${var.environment}"
  }
}

# KMS Keys - Primary Region
resource "aws_kms_key" "primary" {
  description             = "KMS key for DR encryption in us-east-1"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SSM to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "kms-dr-encryption-east-${var.environment}"
  }
}

resource "aws_kms_alias" "primary" {
  name          = "alias/dr-encryption-east-${var.environment}"
  target_key_id = aws_kms_key.primary.key_id
}

# KMS Keys - Secondary Region
resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for DR encryption in us-west-2"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow SNS to use the key"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow SSM to use the key"
        Effect = "Allow"
        Principal = {
          Service = "ssm.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "kms-dr-encryption-west-${var.environment}"
  }
}

resource "aws_kms_alias" "secondary" {
  provider      = aws.secondary
  name          = "alias/dr-encryption-west-${var.environment}"
  target_key_id = aws_kms_key.secondary.key_id
}

# S3 Buckets
resource "aws_s3_bucket" "primary" {
  bucket        = "s3-payment-docs-east-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "s3-payment-docs-east-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "primary" {
  bucket = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "secondary" {
  provider      = aws.secondary
  bucket        = "s3-payment-docs-west-${var.environment}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name = "s3-payment-docs-west-${var.environment}"
  }
}

resource "aws_s3_bucket_versioning" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Replication IAM Role
data "aws_iam_policy_document" "s3_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "s3_replication" {
  name               = "iam-s3-replication-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.s3_assume_role.json

  tags = {
    Name = "iam-s3-replication-${var.environment}"
  }
}

data "aws_iam_policy_document" "s3_replication" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetReplicationConfiguration",
      "s3:ListBucket"
    ]
    resources = [aws_s3_bucket.primary.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:GetObjectVersionForReplication",
      "s3:GetObjectVersionAcl",
      "s3:GetObjectVersionTagging"
    ]
    resources = ["${aws_s3_bucket.primary.arn}/*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:ReplicateObject",
      "s3:ReplicateDelete",
      "s3:ReplicateTags"
    ]
    resources = ["${aws_s3_bucket.secondary.arn}/*"]
  }
}

resource "aws_iam_role_policy" "s3_replication" {
  name   = "s3-replication-policy"
  role   = aws_iam_role.s3_replication.id
  policy = data.aws_iam_policy_document.s3_replication.json
}

# S3 Cross-Region Replication
resource "aws_s3_bucket_replication_configuration" "replication" {
  depends_on = [aws_s3_bucket_versioning.primary, aws_s3_bucket_versioning.secondary]

  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "replicate-all-objects"
    status = "Enabled"

    filter {}

    delete_marker_replication {
      status = "Enabled"
    }

    destination {
      bucket        = aws_s3_bucket.secondary.arn
      storage_class = "STANDARD"
    }
  }
}

# Lambda Execution IAM Role
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_execution" {
  name               = "iam-lambda-execution-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Name = "iam-lambda-execution-${var.environment}"
  }
}

# Lambda Health Monitor Policy
data "aws_iam_policy_document" "lambda_health_monitor" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:DescribeTable"
    ]
    resources = [aws_dynamodb_table.transactions.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [
      aws_sns_topic.primary.arn,
      aws_sns_topic.secondary.arn
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:*"]
  }
}

resource "aws_iam_policy" "lambda_health_monitor" {
  name   = "iam-lambda-health-monitor-policy-${var.environment}"
  policy = data.aws_iam_policy_document.lambda_health_monitor.json
}

resource "aws_iam_role_policy_attachment" "lambda_health_monitor" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_health_monitor.arn
}

# Cross-Region Assume Role for Config Sync
resource "aws_iam_role" "cross_region_assume" {
  name                 = "iam-cross-region-assume-${var.environment}"
  max_session_duration = 3600

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        AWS = aws_iam_role.lambda_execution.arn
      }
      Action = "sts:AssumeRole"
      Condition = {
        StringEquals = {
          "aws:SourceArn" = [
            "arn:aws:lambda:us-east-1:${data.aws_caller_identity.current.account_id}:function:lambda-config-sync-east-${var.environment}",
            "arn:aws:lambda:us-west-2:${data.aws_caller_identity.current.account_id}:function:lambda-config-sync-west-${var.environment}"
          ]
        }
      }
    }]
  })

  tags = {
    Name = "iam-cross-region-assume-${var.environment}"
  }
}

# Lambda Config Sync Policy
data "aws_iam_policy_document" "lambda_config_sync" {
  statement {
    effect = "Allow"
    actions = [
      "ssm:GetParameter"
    ]
    resources = [
      "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/payment-app/*",
      "arn:aws:ssm:us-west-2:${data.aws_caller_identity.current.account_id}:parameter/payment-app/*"
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "sts:AssumeRole"
    ]
    resources = [aws_iam_role.cross_region_assume.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:${data.aws_caller_identity.current.account_id}:*"]
  }
}

resource "aws_iam_policy" "lambda_config_sync" {
  name   = "iam-lambda-config-sync-policy-${var.environment}"
  policy = data.aws_iam_policy_document.lambda_config_sync.json
}

resource "aws_iam_role_policy_attachment" "lambda_config_sync" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_config_sync.arn
}

# Cross-Region Assume Role Policy
data "aws_iam_policy_document" "cross_region_ssm" {
  statement {
    effect = "Allow"
    actions = [
      "ssm:PutParameter"
    ]
    resources = [
      "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/payment-app/*",
      "arn:aws:ssm:us-west-2:${data.aws_caller_identity.current.account_id}:parameter/payment-app/*"
    ]
  }
}

resource "aws_iam_policy" "cross_region_ssm" {
  name   = "iam-cross-region-ssm-policy-${var.environment}"
  policy = data.aws_iam_policy_document.cross_region_ssm.json
}

resource "aws_iam_role_policy_attachment" "cross_region_ssm" {
  role       = aws_iam_role.cross_region_assume.name
  policy_arn = aws_iam_policy.cross_region_ssm.arn
}

# SNS Topics
resource "aws_sns_topic" "primary" {
  name              = "sns-alerts-east-${var.environment}"
  kms_master_key_id = aws_kms_key.primary.id

  tags = {
    Name = "sns-alerts-east-${var.environment}"
  }
}

resource "aws_sns_topic_subscription" "primary_email" {
  topic_arn = aws_sns_topic.primary.arn
  protocol  = "email"
  endpoint  = "test@example.com"
}

resource "aws_sns_topic" "secondary" {
  provider          = aws.secondary
  name              = "sns-alerts-west-${var.environment}"
  kms_master_key_id = aws_kms_key.secondary.id

  tags = {
    Name = "sns-alerts-west-${var.environment}"
  }
}

resource "aws_sns_topic_subscription" "secondary_email" {
  provider  = aws.secondary
  topic_arn = aws_sns_topic.secondary.arn
  protocol  = "email"
  endpoint  = "test@example.com"
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "health_monitor_primary" {
  name              = "/aws/lambda/lambda-health-monitor-east-${var.environment}"
  retention_in_days = 1

  tags = {
    Name = "log-health-monitor-east-${var.environment}"
  }
}

resource "aws_cloudwatch_log_group" "health_monitor_secondary" {
  provider          = aws.secondary
  name              = "/aws/lambda/lambda-health-monitor-west-${var.environment}"
  retention_in_days = 1

  tags = {
    Name = "log-health-monitor-west-${var.environment}"
  }
}

resource "aws_cloudwatch_log_group" "config_sync_primary" {
  name              = "/aws/lambda/lambda-config-sync-east-${var.environment}"
  retention_in_days = 1

  tags = {
    Name = "log-config-sync-east-${var.environment}"
  }
}

resource "aws_cloudwatch_log_group" "config_sync_secondary" {
  provider          = aws.secondary
  name              = "/aws/lambda/lambda-config-sync-west-${var.environment}"
  retention_in_days = 1

  tags = {
    Name = "log-config-sync-west-${var.environment}"
  }
}

# Lambda Functions - Health Monitor
resource "aws_lambda_function" "health_monitor_primary" {
  depends_on = [
    aws_iam_role.lambda_execution,
    aws_iam_role_policy_attachment.lambda_health_monitor,
    aws_cloudwatch_log_group.health_monitor_primary
  ]

  filename         = data.archive_file.health_monitor.output_path
  function_name    = "lambda-health-monitor-east-${var.environment}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_health_monitor.handler"
  source_code_hash = data.archive_file.health_monitor.output_base64sha256
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 300

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name
      SNS_TOPIC_ARN       = aws_sns_topic.primary.arn
    }
  }

  tags = {
    Name = "lambda-health-monitor-east-${var.environment}"
  }
}

resource "aws_lambda_function" "health_monitor_secondary" {
  provider = aws.secondary
  depends_on = [
    aws_iam_role.lambda_execution,
    aws_iam_role_policy_attachment.lambda_health_monitor,
    aws_cloudwatch_log_group.health_monitor_secondary
  ]

  filename         = data.archive_file.health_monitor.output_path
  function_name    = "lambda-health-monitor-west-${var.environment}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_health_monitor.handler"
  source_code_hash = data.archive_file.health_monitor.output_base64sha256
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 300

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.transactions.name
      SNS_TOPIC_ARN       = aws_sns_topic.secondary.arn
    }
  }

  tags = {
    Name = "lambda-health-monitor-west-${var.environment}"
  }
}

# Lambda Functions - Config Sync
resource "aws_lambda_function" "config_sync_primary" {
  depends_on = [
    aws_iam_role.lambda_execution,
    aws_iam_role_policy_attachment.lambda_config_sync,
    aws_cloudwatch_log_group.config_sync_primary
  ]

  filename         = data.archive_file.config_sync.output_path
  function_name    = "lambda-config-sync-east-${var.environment}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_config_sync.handler"
  source_code_hash = data.archive_file.config_sync.output_base64sha256
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 300

  environment {
    variables = {
      SSM_PARAMETER_PATH = "/payment-app/${var.environment}"
      TARGET_REGION      = "us-west-2"
      ASSUME_ROLE_ARN    = aws_iam_role.cross_region_assume.arn
    }
  }

  tags = {
    Name = "lambda-config-sync-east-${var.environment}"
  }
}

resource "aws_lambda_function" "config_sync_secondary" {
  provider = aws.secondary
  depends_on = [
    aws_iam_role.lambda_execution,
    aws_iam_role_policy_attachment.lambda_config_sync,
    aws_cloudwatch_log_group.config_sync_secondary
  ]

  filename         = data.archive_file.config_sync.output_path
  function_name    = "lambda-config-sync-west-${var.environment}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_config_sync.handler"
  source_code_hash = data.archive_file.config_sync.output_base64sha256
  runtime          = "python3.11"
  memory_size      = 256
  timeout          = 300

  environment {
    variables = {
      SSM_PARAMETER_PATH = "/payment-app/${var.environment}"
      TARGET_REGION      = "us-east-1"
      ASSUME_ROLE_ARN    = aws_iam_role.cross_region_assume.arn
    }
  }

  tags = {
    Name = "lambda-config-sync-west-${var.environment}"
  }
}

# API Gateway - Primary
resource "aws_apigatewayv2_api" "primary" {
  name          = "api-health-east-${var.environment}"
  protocol_type = "HTTP"

  tags = {
    Name = "api-health-east-${var.environment}"
  }
}

resource "aws_apigatewayv2_integration" "primary" {
  api_id           = aws_apigatewayv2_api.primary.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.health_monitor_primary.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "primary" {
  api_id    = aws_apigatewayv2_api.primary.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.primary.id}"
}

resource "aws_apigatewayv2_stage" "primary" {
  api_id      = aws_apigatewayv2_api.primary.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Name = "api-stage-east-${var.environment}"
  }
}

resource "aws_lambda_permission" "api_gateway_primary" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_monitor_primary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.primary.execution_arn}/*/*"
}

# API Gateway - Secondary
resource "aws_apigatewayv2_api" "secondary" {
  provider      = aws.secondary
  name          = "api-health-west-${var.environment}"
  protocol_type = "HTTP"

  tags = {
    Name = "api-health-west-${var.environment}"
  }
}

resource "aws_apigatewayv2_integration" "secondary" {
  provider         = aws.secondary
  api_id           = aws_apigatewayv2_api.secondary.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.health_monitor_secondary.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "secondary" {
  provider  = aws.secondary
  api_id    = aws_apigatewayv2_api.secondary.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.secondary.id}"
}

resource "aws_apigatewayv2_stage" "secondary" {
  provider    = aws.secondary
  api_id      = aws_apigatewayv2_api.secondary.id
  name        = "$default"
  auto_deploy = true

  tags = {
    Name = "api-stage-west-${var.environment}"
  }
}

resource "aws_lambda_permission" "api_gateway_secondary" {
  provider      = aws.secondary
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_monitor_secondary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.secondary.execution_arn}/*/*"
}

# Route 53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = "drpayment.example.internal"

  tags = {
    Name = "route53-zone-payment-${var.environment}"
  }
}

# Route 53 Health Checks
resource "aws_route53_health_check" "primary" {
  fqdn              = split("/", replace(aws_apigatewayv2_stage.primary.invoke_url, "https://", ""))[0]
  port              = 443
  type              = "HTTPS"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "health-check-primary-${var.environment}"
  }
}

resource "aws_route53_health_check" "secondary" {
  fqdn              = split("/", replace(aws_apigatewayv2_stage.secondary.invoke_url, "https://", ""))[0]
  port              = 443
  type              = "HTTPS"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "health-check-secondary-${var.environment}"
  }
}

# Route 53 Weighted Records
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.payment.example.com"
  type    = "CNAME"
  ttl     = 60

  weighted_routing_policy {
    weight = 100
  }

  set_identifier  = "primary"
  records         = [replace(aws_apigatewayv2_stage.primary.invoke_url, "https://", "")]
  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.payment.example.com"
  type    = "CNAME"
  ttl     = 60

  weighted_routing_policy {
    weight = 0
  }

  set_identifier  = "secondary"
  records         = [replace(aws_apigatewayv2_stage.secondary.invoke_url, "https://", "")]
  health_check_id = aws_route53_health_check.secondary.id
}

# CloudWatch Alarms - Primary
resource "aws_cloudwatch_metric_alarm" "dynamodb_user_errors_primary" {
  alarm_name          = "alarm-dynamodb-user-errors-east-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "DynamoDB user errors in primary region"
  alarm_actions       = [aws_sns_topic.primary.arn]

  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }

  tags = {
    Name = "alarm-dynamodb-user-errors-east-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_system_errors_primary" {
  alarm_name          = "alarm-dynamodb-system-errors-east-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "DynamoDB system errors in primary region"
  alarm_actions       = [aws_sns_topic.primary.arn]

  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }

  tags = {
    Name = "alarm-dynamodb-system-errors-east-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors_primary" {
  alarm_name          = "alarm-lambda-errors-east-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Lambda errors in primary region"
  alarm_actions       = [aws_sns_topic.primary.arn]

  dimensions = {
    FunctionName = aws_lambda_function.health_monitor_primary.function_name
  }

  tags = {
    Name = "alarm-lambda-errors-east-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles_primary" {
  alarm_name          = "alarm-lambda-throttles-east-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Lambda throttles in primary region"
  alarm_actions       = [aws_sns_topic.primary.arn]

  dimensions = {
    FunctionName = aws_lambda_function.health_monitor_primary.function_name
  }

  tags = {
    Name = "alarm-lambda-throttles-east-${var.environment}"
  }
}

# CloudWatch Alarms - Secondary
resource "aws_cloudwatch_metric_alarm" "dynamodb_user_errors_secondary" {
  provider            = aws.secondary
  alarm_name          = "alarm-dynamodb-user-errors-west-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "DynamoDB user errors in secondary region"
  alarm_actions       = [aws_sns_topic.secondary.arn]

  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }

  tags = {
    Name = "alarm-dynamodb-user-errors-west-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_system_errors_secondary" {
  provider            = aws.secondary
  alarm_name          = "alarm-dynamodb-system-errors-west-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "DynamoDB system errors in secondary region"
  alarm_actions       = [aws_sns_topic.secondary.arn]

  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }

  tags = {
    Name = "alarm-dynamodb-system-errors-west-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors_secondary" {
  provider            = aws.secondary
  alarm_name          = "alarm-lambda-errors-west-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Lambda errors in secondary region"
  alarm_actions       = [aws_sns_topic.secondary.arn]

  dimensions = {
    FunctionName = aws_lambda_function.health_monitor_secondary.function_name
  }

  tags = {
    Name = "alarm-lambda-errors-west-${var.environment}"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_throttles_secondary" {
  provider            = aws.secondary
  alarm_name          = "alarm-lambda-throttles-west-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Lambda throttles in secondary region"
  alarm_actions       = [aws_sns_topic.secondary.arn]

  dimensions = {
    FunctionName = aws_lambda_function.health_monitor_secondary.function_name
  }

  tags = {
    Name = "alarm-lambda-throttles-west-${var.environment}"
  }
}

# SSM Parameters - Primary
resource "aws_ssm_parameter" "db_connection_primary" {
  name   = "/payment-app/${var.environment}/db-connection"
  type   = "SecureString"
  value  = "postgresql://user:pass@db.example.com:5432/payments"
  key_id = aws_kms_key.primary.id

  tags = {
    Name = "ssm-db-connection-east-${var.environment}"
  }
}

resource "aws_ssm_parameter" "api_key_primary" {
  name   = "/payment-app/${var.environment}/api-key"
  type   = "SecureString"
  value  = "test-api-key-12345"
  key_id = aws_kms_key.primary.id

  tags = {
    Name = "ssm-api-key-east-${var.environment}"
  }
}

# SSM Parameters - Secondary
resource "aws_ssm_parameter" "db_connection_secondary" {
  provider = aws.secondary
  name     = "/payment-app/${var.environment}/db-connection"
  type     = "SecureString"
  value    = "postgresql://user:pass@db.example.com:5432/payments"
  key_id   = aws_kms_key.secondary.id

  tags = {
    Name = "ssm-db-connection-west-${var.environment}"
  }
}

resource "aws_ssm_parameter" "api_key_secondary" {
  provider = aws.secondary
  name     = "/payment-app/${var.environment}/api-key"
  type     = "SecureString"
  value    = "test-api-key-12345"
  key_id   = aws_kms_key.secondary.id

  tags = {
    Name = "ssm-api-key-west-${var.environment}"
  }
}

# Outputs
output "vpc_id_primary" {
  description = "Primary VPC ID"
  value       = aws_vpc.primary.id
}

output "vpc_id_secondary" {
  description = "Secondary VPC ID"
  value       = aws_vpc.secondary.id
}

output "vpc_cidr_primary" {
  description = "Primary VPC CIDR block"
  value       = aws_vpc.primary.cidr_block
}

output "vpc_cidr_secondary" {
  description = "Secondary VPC CIDR block"
  value       = aws_vpc.secondary.cidr_block
}

output "private_subnet_ids_primary" {
  description = "Primary region private subnet IDs"
  value       = aws_subnet.primary_private[*].id
}

output "private_subnet_ids_secondary" {
  description = "Secondary region private subnet IDs"
  value       = aws_subnet.secondary_private[*].id
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = aws_dynamodb_table.transactions.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB global table ARN"
  value       = aws_dynamodb_table.transactions.arn
}

output "dynamodb_stream_arn" {
  description = "DynamoDB stream ARN"
  value       = aws_dynamodb_table.transactions.stream_arn
}

output "s3_bucket_name_primary" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary.id
}

output "s3_bucket_arn_primary" {
  description = "Primary S3 bucket ARN"
  value       = aws_s3_bucket.primary.arn
}

output "s3_bucket_name_secondary" {
  description = "Secondary S3 bucket name"
  value       = aws_s3_bucket.secondary.id
}

output "s3_bucket_arn_secondary" {
  description = "Secondary S3 bucket ARN"
  value       = aws_s3_bucket.secondary.arn
}

output "s3_replication_role_arn" {
  description = "S3 replication IAM role ARN"
  value       = aws_iam_role.s3_replication.arn
}

output "lambda_health_monitor_name_primary" {
  description = "Primary health monitor Lambda function name"
  value       = aws_lambda_function.health_monitor_primary.function_name
}

output "lambda_health_monitor_arn_primary" {
  description = "Primary health monitor Lambda function ARN"
  value       = aws_lambda_function.health_monitor_primary.arn
}

output "lambda_health_monitor_name_secondary" {
  description = "Secondary health monitor Lambda function name"
  value       = aws_lambda_function.health_monitor_secondary.function_name
}

output "lambda_health_monitor_arn_secondary" {
  description = "Secondary health monitor Lambda function ARN"
  value       = aws_lambda_function.health_monitor_secondary.arn
}

output "lambda_config_sync_name_primary" {
  description = "Primary config sync Lambda function name"
  value       = aws_lambda_function.config_sync_primary.function_name
}

output "lambda_config_sync_arn_primary" {
  description = "Primary config sync Lambda function ARN"
  value       = aws_lambda_function.config_sync_primary.arn
}

output "lambda_config_sync_name_secondary" {
  description = "Secondary config sync Lambda function name"
  value       = aws_lambda_function.config_sync_secondary.function_name
}

output "lambda_config_sync_arn_secondary" {
  description = "Secondary config sync Lambda function ARN"
  value       = aws_lambda_function.config_sync_secondary.arn
}

output "lambda_execution_role_arn" {
  description = "Lambda execution IAM role ARN"
  value       = aws_iam_role.lambda_execution.arn
}

output "api_gateway_endpoint_primary" {
  description = "Primary API Gateway endpoint URL"
  value       = aws_apigatewayv2_stage.primary.invoke_url
}

output "api_gateway_id_primary" {
  description = "Primary API Gateway ID"
  value       = aws_apigatewayv2_api.primary.id
}

output "api_gateway_endpoint_secondary" {
  description = "Secondary API Gateway endpoint URL"
  value       = aws_apigatewayv2_stage.secondary.invoke_url
}

output "api_gateway_id_secondary" {
  description = "Secondary API Gateway ID"
  value       = aws_apigatewayv2_api.secondary.id
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name" {
  description = "Route 53 hosted zone name"
  value       = aws_route53_zone.main.name
}

output "route53_health_check_id_primary" {
  description = "Primary region health check ID"
  value       = aws_route53_health_check.primary.id
}

output "route53_health_check_id_secondary" {
  description = "Secondary region health check ID"
  value       = aws_route53_health_check.secondary.id
}

output "route53_record_fqdn" {
  description = "Route 53 weighted record FQDN"
  value       = aws_route53_record.primary.fqdn
}

output "cloudwatch_alarm_names" {
  description = "List of CloudWatch alarm names"
  value = [
    aws_cloudwatch_metric_alarm.dynamodb_user_errors_primary.alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_system_errors_primary.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_errors_primary.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_throttles_primary.alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_user_errors_secondary.alarm_name,
    aws_cloudwatch_metric_alarm.dynamodb_system_errors_secondary.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_errors_secondary.alarm_name,
    aws_cloudwatch_metric_alarm.lambda_throttles_secondary.alarm_name
  ]
}

output "sns_topic_arn_primary" {
  description = "Primary SNS topic ARN"
  value       = aws_sns_topic.primary.arn
}

output "sns_topic_arn_secondary" {
  description = "Secondary SNS topic ARN"
  value       = aws_sns_topic.secondary.arn
}

output "kms_key_id_primary" {
  description = "Primary KMS key ID"
  value       = aws_kms_key.primary.id
}

output "kms_key_arn_primary" {
  description = "Primary KMS key ARN"
  value       = aws_kms_key.primary.arn
}

output "kms_key_id_secondary" {
  description = "Secondary KMS key ID"
  value       = aws_kms_key.secondary.id
}

output "kms_key_arn_secondary" {
  description = "Secondary KMS key ARN"
  value       = aws_kms_key.secondary.arn
}

output "ssm_parameter_names" {
  description = "List of SSM parameter names"
  value = [
    aws_ssm_parameter.db_connection_primary.name,
    aws_ssm_parameter.api_key_primary.name,
    aws_ssm_parameter.db_connection_secondary.name,
    aws_ssm_parameter.api_key_secondary.name
  ]
}

output "cross_region_assume_role_arn" {
  description = "Cross-region assume role ARN"
  value       = aws_iam_role.cross_region_assume.arn
}

output "ssm_parameter_value_primary" {
  description = "Primary SSM parameter value (sensitive)"
  value       = aws_ssm_parameter.db_connection_primary.value
  sensitive   = true
}

output "ssm_parameter_value_secondary" {
  description = "Secondary SSM parameter value (sensitive)"
  value       = aws_ssm_parameter.db_connection_secondary.value
  sensitive   = true
}