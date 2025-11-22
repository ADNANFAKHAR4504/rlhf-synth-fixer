## Ideal response — lib/ directory (Terraform)

Reference copy of the Terraform sources under `lib/` for the webhook-processing stack. Variables are supplied at deploy time (no hardcoded region/environment). Resource names use the random suffix only; no timestamp component is present.

---

### api_gateway.tf

```terraform
resource "aws_api_gateway_rest_api" "webhook_api" {
  name        = "${var.project}-${var.environment}-api-${local.suffix}"
  description = "Webhook processing API"

  endpoint_configuration { types = ["REGIONAL"] }

  tags = local.common_tags
}

resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  parent_id   = aws_api_gateway_rest_api.webhook_api.root_resource_id
  path_part   = "webhook"
}

resource "aws_api_gateway_request_validator" "webhook_validator" {
  rest_api_id                 = aws_api_gateway_rest_api.webhook_api.id
  name                        = "webhook-request-validator"
  validate_request_body       = true
  validate_request_parameters = true
}

resource "aws_api_gateway_method" "webhook_post" {
  rest_api_id      = aws_api_gateway_rest_api.webhook_api.id
  resource_id      = aws_api_gateway_resource.webhook.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
  request_validator_id = aws_api_gateway_request_validator.webhook_validator.id
}

resource "aws_api_gateway_integration" "webhook_lambda" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  resource_id = aws_api_gateway_resource.webhook.id
  http_method = aws_api_gateway_method.webhook_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.webhook_receiver.invoke_arn
}

resource "aws_api_gateway_deployment" "webhook_deployment" {
  depends_on = [aws_api_gateway_integration.webhook_lambda]
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  stage_name  = var.environment

  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "webhook_stage" {
  deployment_id = aws_api_gateway_deployment.webhook_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.webhook_api.id
  stage_name    = var.environment
  xray_tracing_enabled = true

  tags = local.common_tags
}

resource "aws_api_gateway_api_key" "webhook_key" {
  name      = "${var.project}-${var.environment}-api-key-${local.suffix}"
  enabled   = true

  tags = local.common_tags
}

resource "aws_api_gateway_usage_plan" "webhook_plan" {
  name = "${var.project}-${var.environment}-usage-plan-${local.suffix}"

  api_stages {
    api_id = aws_api_gateway_rest_api.webhook_api.id
    stage  = aws_api_gateway_stage.webhook_stage.stage_name
  }

  quota_settings {
    limit  = 1000000
    period = "MONTH"
  }

  throttle_settings {
    rate_limit  = 1000
    burst_limit = 2000
  }

  tags = local.common_tags
}

resource "aws_api_gateway_usage_plan_key" "webhook_plan_key" {
  key_id        = aws_api_gateway_api_key.webhook_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.webhook_plan.id
}
```

### cloudwatch.tf

```terraform
resource "aws_cloudwatch_log_group" "webhook_receiver_logs" {
  name              = "/aws/lambda/${aws_lambda_function.webhook_receiver.function_name}"
  retention_in_days = 7
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "payload_validator_logs" {
  name              = "/aws/lambda/${aws_lambda_function.payload_validator.function_name}"
  retention_in_days = 7
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "transaction_processor_logs" {
  name              = "/aws/lambda/${aws_lambda_function.transaction_processor.function_name}"
  retention_in_days = 7
  tags = local.common_tags
}

# Metric-math alarm for Lambda error percentage > 1%
resource "aws_cloudwatch_metric_alarm" "lambda_error_rate" {
  alarm_name          = "${var.project}-${var.environment}-lambda-error-rate-${local.suffix}"
  alarm_description   = "Alarm when Lambda error rate across functions exceeds 1%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  alarm_actions       = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
  ok_actions          = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []

  metric_query {
    id          = "m1"
    label       = "Errors"
    return_data = false
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.webhook_receiver.function_name
      }
      period = 60
    }
  }

  metric_query {
    id          = "m2"
    label       = "Invocations"
    return_data = false
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions = {
        FunctionName = aws_lambda_function.webhook_receiver.function_name
      }
      period = 60
    }
  }

  metric_query {
    id          = "e1"
    expression  = "IF(m2 > 0, 100 * m1 / m2, 0)"
    label       = "ErrorPercent"
    return_data = true
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_error_rate_validator" {
  alarm_name          = "${var.project}-${var.environment}-payload-validator-error-rate-${local.suffix}"
  alarm_description   = "Alarm when payload validator error rate exceeds 1%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  alarm_actions       = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
  ok_actions          = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
  tags                = local.common_tags

  metric_query {
    id          = "m1"
    label       = "Errors"
    return_data = false
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions = { FunctionName = aws_lambda_function.payload_validator.function_name }
      period = 60
    }
  }

  metric_query {
    id          = "m2"
    label       = "Invocations"
    return_data = false
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions = { FunctionName = aws_lambda_function.payload_validator.function_name }
      period = 60
    }
  }

  metric_query {
    id          = "e1"
    expression  = "IF(m2 > 0, 100 * m1 / m2, 0)"
    label       = "ErrorPercent"
    return_data = true
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_error_rate_processor" {
  alarm_name          = "${var.project}-${var.environment}-transaction-processor-error-rate-${local.suffix}"
  alarm_description   = "Alarm when transaction processor error rate exceeds 1%"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  alarm_actions       = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
  ok_actions          = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
  tags                = local.common_tags

  metric_query {
    id          = "m1"
    label       = "Errors"
    return_data = false
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions = { FunctionName = aws_lambda_function.transaction_processor.function_name }
      period = 60
    }
  }

  metric_query {
    id          = "m2"
    label       = "Invocations"
    return_data = false
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      stat        = "Sum"
      dimensions = { FunctionName = aws_lambda_function.transaction_processor.function_name }
      period = 60
    }
  }

  metric_query {
    id          = "e1"
    expression  = "IF(m2 > 0, 100 * m1 / m2, 0)"
    label       = "ErrorPercent"
    return_data = true
  }
}

# DLQ messages alarm
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.project}-${var.environment}-dlq-messages-${local.suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 10
  alarm_description   = "Alert when DLQ messages exceed 10"

  dimensions = {
    QueueName = aws_sqs_queue.webhook_dlq.name
  }

  tags = local.common_tags
  alarm_actions = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
}
```

### data_sources.tf

```terraform
data "aws_caller_identity" "current" {}

# Resolve AWS-managed DynamoDB KMS alias (aws/dynamodb) in target account/region
data "aws_kms_alias" "dynamodb" {
  name = "alias/aws/dynamodb"
}
```

### dynamodb.tf

```terraform
resource "aws_dynamodb_table" "transactions" {
  name         = "${var.project}-${var.environment}-transactions-${local.suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transaction_id"
  range_key    = "timestamp"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  global_secondary_index {
    name            = "customer-index"
    hash_key        = "customer_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags

  lifecycle {
    prevent_destroy = false
  }
}
```

### iam.tf

```terraform
resource "aws_iam_role" "lambda_role" {
  name = "${var.project}-${var.environment}-lambda-role-${local.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_policy" "lambda_common_policy" {
  name        = "${var.project}-${var.environment}-lambda-common-${local.suffix}"
  description = "Least-privilege policy for webhook lambdas"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow",
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ],
        Resource = [
          aws_sqs_queue.webhook_processing_queue.arn,
          aws_sqs_queue.validated_queue.arn,
          aws_sqs_queue.webhook_dlq.arn
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Resource = [
          "${aws_s3_bucket.webhook_payloads.arn}/*",
          "${aws_s3_bucket.failed_messages.arn}/*",
          aws_s3_bucket.webhook_payloads.arn,
          aws_s3_bucket.failed_messages.arn
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ],
        Resource = [
          aws_dynamodb_table.transactions.arn,
          "${aws_dynamodb_table.transactions.arn}/index/*"
        ]
      },
      {
        Effect = "Allow",
        Action = ["ssm:GetParameter*"],
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter${var.ssm_prefix}/*"
      },
      {
        Effect = "Allow",
        Action = ["kms:Decrypt"],
        Resource = "arn:aws:kms:*:*:key/*"
      },
      {
        Effect = "Allow",
        Action = ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_common_policy.arn
}
```

### lambda.tf

```terraform
data "archive_file" "webhook_receiver_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambdas/webhook_receiver"
  output_path = "${path.module}/lambdas/webhook_receiver.zip"
}

data "archive_file" "payload_validator_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambdas/payload_validator"
  output_path = "${path.module}/lambdas/payload_validator.zip"
}

data "archive_file" "transaction_processor_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambdas/transaction_processor"
  output_path = "${path.module}/lambdas/transaction_processor.zip"
}

resource "aws_lambda_function" "webhook_receiver" {
  function_name = "${var.project}-${var.environment}-webhook-receiver-${local.suffix}"
  filename      = data.archive_file.webhook_receiver_zip.output_path
  source_code_hash = data.archive_file.webhook_receiver_zip.output_base64sha256
  handler       = "index.handler"
  runtime       = "python3.11"
  architectures = ["arm64"]
  role          = aws_iam_role.lambda_role.arn
  memory_size   = var.lambda_configs.webhook_receiver.memory_size
  timeout       = var.lambda_configs.webhook_receiver.timeout

  tracing_config { mode = "Active" }

  environment {
    variables = {
      PROCESSING_QUEUE_URL = aws_sqs_queue.webhook_processing_queue.id
      PAYLOAD_BUCKET        = aws_s3_bucket.webhook_payloads.id
      # Pass SSM parameter names; Lambdas will fetch values at runtime
      API_KEY_PARAM         = "${var.ssm_prefix}/api_key"
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "payload_validator" {
  function_name = "${var.project}-${var.environment}-payload-validator-${local.suffix}"
  filename      = data.archive_file.payload_validator_zip.output_path
  source_code_hash = data.archive_file.payload_validator_zip.output_base64sha256
  handler       = "index.handler"
  runtime       = "python3.11"
  architectures = ["arm64"]
  role          = aws_iam_role.lambda_role.arn
  memory_size   = var.lambda_configs.payload_validator.memory_size
  timeout       = var.lambda_configs.payload_validator.timeout

  tracing_config { mode = "Active" }

  environment {
    variables = {
      VALIDATED_QUEUE_URL = aws_sqs_queue.validated_queue.id
      DLQ_URL             = aws_sqs_queue.webhook_dlq.id
      VALIDATION_RULES_PARAM = "${var.ssm_prefix}/validation_rules"
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "transaction_processor" {
  function_name = "${var.project}-${var.environment}-transaction-processor-${local.suffix}"
  filename      = data.archive_file.transaction_processor_zip.output_path
  source_code_hash = data.archive_file.transaction_processor_zip.output_base64sha256
  handler       = "index.handler"
  runtime       = "python3.11"
  architectures = ["arm64"]
  role          = aws_iam_role.lambda_role.arn
  memory_size   = var.lambda_configs.transaction_processor.memory_size
  timeout       = var.lambda_configs.transaction_processor.timeout

  tracing_config { mode = "Active" }

  environment {
    variables = {
      TRANSACTIONS_TABLE = aws_dynamodb_table.transactions.name
      ARCHIVE_BUCKET     = aws_s3_bucket.failed_messages.id
      DB_CREDENTIALS_PARAM = "${var.ssm_prefix}/db_credentials"
    }
  }

  tags = local.common_tags
}

# Permissions and event source mappings
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_receiver.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.webhook_api.execution_arn}/*/*"
}

resource "aws_lambda_event_source_mapping" "validator_sqs" {
  event_source_arn = aws_sqs_queue.webhook_processing_queue.arn
  function_name    = aws_lambda_function.payload_validator.arn
  batch_size       = 10
}

resource "aws_lambda_event_source_mapping" "processor_sqs" {
  event_source_arn = aws_sqs_queue.validated_queue.arn
  function_name    = aws_lambda_function.transaction_processor.arn
  batch_size       = 10
}
```

### locals.tf

```terraform
locals {
  # stable unique suffix per deployment
  suffix     = random_string.suffix.result

  name_prefix = join("-", [var.project, var.environment, local.suffix])

  common_tags = merge({
    Environment       = var.environment
    Project           = var.project
    CostCenter        = var.cost_center
    CreatedBy         = "iac-automation"
    iac-rlhf-amazon   = "true"
  }, {})
}
```

### outputs.tf

```terraform
output "api_endpoint" {
  description = "Public API Gateway endpoint for the webhook POST"
  value       = format("https://%s.execute-api.%s.amazonaws.com/%s/webhook", aws_api_gateway_rest_api.webhook_api.id, var.aws_region, aws_api_gateway_stage.webhook_stage.stage_name)
}

output "api_key_id" {
  value = aws_api_gateway_api_key.webhook_key.id
}

output "webhook_receiver_arn" {
  value = aws_lambda_function.webhook_receiver.arn
}

output "payload_validator_arn" {
  value = aws_lambda_function.payload_validator.arn
}

output "transaction_processor_arn" {
  value = aws_lambda_function.transaction_processor.arn
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.transactions.name
}

output "webhook_payloads_bucket" {
  value = aws_s3_bucket.webhook_payloads.id
}

output "failed_messages_bucket" {
  value = aws_s3_bucket.failed_messages.id
}

output "processing_queue_url" {
  value = aws_sqs_queue.webhook_processing_queue.id
}

output "validated_queue_url" {
  value = aws_sqs_queue.validated_queue.id
}

output "dlq_url" {
  value = aws_sqs_queue.webhook_dlq.id
}

output "random_suffix" {
  value = random_string.suffix.result
}
```

### provider.tf

```terraform
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  # region must be supplied by caller via variable or TF_VAR_aws_region
  region = var.aws_region
}

provider "random" {}
```

### random.tf

```terraform
resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}
```

### s3.tf

```terraform
resource "aws_s3_bucket" "webhook_payloads" {
  bucket = lower("${var.project}-${var.environment}-webhook-payloads-${local.suffix}")
  acl    = "private"

  force_destroy = true # allow destroy when cleaning up/failing

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id

  rule {
    id     = "archive-old-payloads"
    status = "Enabled"
    filter { prefix = "" }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# failed messages bucket
resource "aws_s3_bucket" "failed_messages" {
  bucket = lower("${var.project}-${var.environment}-failed-messages-${local.suffix}")
  acl    = "private"

  force_destroy = true

  versioning {
    enabled = true
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id

  rule {
    id     = "cleanup-failed-messages"
    status = "Enabled"
    filter { prefix = "" }

    transition {
      # AWS requires STANDARD_IA transitions to be >= 30 days
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 90
    }
  }
}
```

### sns.tf

```terraform
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-${var.environment}-alerts-${local.suffix}"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "emails" {
  for_each = { for addr in var.notification_emails : addr => addr }

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}
```

### sqs.tf

```terraform
resource "aws_sqs_queue" "webhook_dlq" {
  name                      = "${var.project}-${var.environment}-webhook-dlq-${local.suffix}"
  message_retention_seconds = 1209600

  tags = local.common_tags
}

resource "aws_sqs_queue" "webhook_processing_queue" {
  name                       = "${var.project}-${var.environment}-webhook-processing-${local.suffix}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.webhook_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.common_tags
}

resource "aws_sqs_queue" "validated_queue" {
  name                       = "${var.project}-${var.environment}-validated-${local.suffix}"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 1209600
  receive_wait_time_seconds  = 20

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.webhook_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.common_tags
}
```

### variables.tf

```terraform
variable "aws_region" {
  description = "AWS region to deploy into. Provide via -var or TF_VAR_aws_region environment variable. No hardcoded defaults to ensure cross-account/region executability."
  type        = string
}

variable "environment" {
  description = "Deployment environment suffix (e.g., dev, staging, prod)"
  type        = string
}

variable "project" {
  description = "Project name used in resource naming"
  type        = string
  default     = "webhook-processor"
}

variable "cost_center" {
  description = "Cost center tag"
  type        = string
  default     = "fintech-ops"
}

variable "lambda_configs" {
  description = "Lambda function memory/timeout configuration"
  type = map(object({
    memory_size = number
    timeout     = number
  }))
  default = {
    webhook_receiver = { memory_size = 512, timeout = 60 }
    payload_validator = { memory_size = 256, timeout = 30 }
    transaction_processor = { memory_size = 1024, timeout = 120 }
  }
}

variable "ssm_prefix" {
  description = "SSM Parameter Store prefix/path for sensitive values"
  type        = string
  default     = "/webhook-processor"
}

variable "notification_emails" {
  description = "List of email addresses to subscribe to alert SNS topic"
  type        = list(string)
  default     = []
}
```
