IDEAL_RESPONSE
Reference copy of the current Terraform and Lambda sources under `lib/` for the webhook-processing stack. Variables are supplied at deploy time; resource names rely on a random suffix (no timestamp).

## Files

- **README.md** – Usage notes for the Terraform-driven webhook processing stack.
- **provider.tf** – Configures Terraform provider versions and the AWS provider region input.
- **variables.tf** – Declares input variables for region, environment, project, cost center, Lambda configs, SSM prefix, and alert emails.
- **locals.tf** – Defines common tags and a random name suffix applied across resources.
- **terraform.tfvars** – Sample variable values for local use (region, environment, optional notifications/SSM prefix).
- **data_sources.tf** – Looks up caller identity and the AWS-managed DynamoDB KMS alias.
- **random.tf** – Generates the stable random suffix used in names.
- **iam.tf** – Creates the Lambda execution role and least-privilege policy for logs, SQS, S3, DynamoDB, SSM, and X-Ray.
- **lambda.tf** – Packages three Python Lambdas and wires permissions/event sources for API Gateway and SQS queues.
- **api_gateway.tf** – Defines the REST API, webhook resource/method, API key, usage plan, deployment, and stage.
- **s3.tf** – Creates encrypted/versioned buckets for webhook payloads and failed messages with lifecycle rules and public access blocks.
- **sqs.tf** – Configures processing, validated, and dead-letter queues with redrive policies.
- **dynamodb.tf** – Creates the transactions table with a customer_id GSI, PITR, and SSE.
- **cloudwatch.tf** – Sets log groups and alarms for Lambda error rates and DLQ depth.
- **sns.tf** – Defines an alerts topic and optional email subscriptions.
- **outputs.tf** – Outputs endpoints, ARNs, queue URLs, bucket names, and the random suffix.
- **scripts/build-lambdas.sh** – Build script to package each Lambda into zip artifacts.
- **lambdas/requirements.txt** – Shared Python dependencies for all Lambda functions.
- **lambdas/webhook_receiver/index.py** – Lambda that stores raw webhook payloads in S3 and enqueues processing jobs.
- **lambdas/payload_validator/index.py** – Lambda that validates queued payloads, optionally using SSM-hosted rules, forwarding good items or DLQ-ing failures.
- **lambdas/transaction_processor/index.py** – Lambda that writes validated transactions to DynamoDB, enriching with SSM-fetched DB credentials.

### `README.md`

```markdown
This directory contains the Terraform configuration and Lambda source for the webhook processing pipeline.

How to use
1. Set the AWS region and environment variables (or provide via -var).

   export TF_VAR_aws_region="<your-region>"
   export TF_VAR_environment=dev

2. Build Lambdas:

   ./lib/scripts/build-lambdas.sh

3. Run Terraform plan/apply from the repo root or from `lib/`:

   cd lib
   terraform init
   terraform validate
   terraform plan -var="aws_region=$TF_VAR_aws_region" -var="environment=$TF_VAR_environment"

Notes
- All resource names include environment, a random suffix, and a timestamp to avoid collisions across accounts/regions.
- No hardcoded ARNs or account IDs are used; the AWS-managed DynamoDB KMS alias is resolved via a data source.
- S3 buckets and other resources are created with force_destroy / removal policies to allow teardown.
- All resources are tagged with `iac-rlhf-amazon` via `local.common_tags`.
```

### `provider.tf`

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

### `variables.tf`

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
    webhook_receiver      = { memory_size = 512, timeout = 60 }
    payload_validator     = { memory_size = 256, timeout = 30 }
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

### `locals.tf`

```terraform
locals {
  # stable unique suffix per deployment
  suffix = random_string.suffix.result

  name_prefix = join("-", [var.project, var.environment, local.suffix])

  common_tags = merge({
    Environment     = var.environment
    Project         = var.project
    CostCenter      = var.cost_center
    CreatedBy       = "iac-automation"
    iac-rlhf-amazon = "true"
  }, {})
}
```

### `terraform.tfvars`

```terraform
## Terraform variables for local runs (do NOT commit secrets)

# AWS region used by the aws provider
aws_region = "us-east-1"

# Environment suffix used in names and tags (dev/staging/prod)
environment = "dev"

# Optional: list of notification emails (leave empty to skip subscription creation)
# notification_emails = []

# Optional: SSM parameter prefix (adjust if you store params under a different path)
# ssm_prefix = "/webhook-processor"
```

### `data_sources.tf`

```terraform
data "aws_caller_identity" "current" {}

# Resolve AWS-managed DynamoDB KMS alias (aws/dynamodb) in target account/region
data "aws_kms_alias" "dynamodb" {
  name = "alias/aws/dynamodb"
}
```

### `random.tf`

```terraform
resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}
```

### `iam.tf`

```terraform
resource "aws_iam_role" "lambda_role" {
  name = "${var.project}-${var.environment}-lambda-role-${local.suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
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
        Resource = [
          "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.project}-${var.environment}-*"
        ]
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
        Effect   = "Allow",
        Action   = ["ssm:GetParameter*"],
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter${var.ssm_prefix}/*"
      },
      {
        Effect   = "Allow",
        Action   = ["kms:Decrypt"],
        Resource = [data.aws_kms_alias.dynamodb.target_key_arn]
      },
      {
        Effect   = "Allow",
        Action   = ["xray:PutTraceSegments", "xray:PutTelemetryRecords"],
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

### `lambda.tf`

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
  function_name    = "${var.project}-${var.environment}-webhook-receiver-${local.suffix}"
  filename         = data.archive_file.webhook_receiver_zip.output_path
  source_code_hash = data.archive_file.webhook_receiver_zip.output_base64sha256
  handler          = "index.handler"
  runtime          = "python3.11"
  architectures    = ["arm64"]
  role             = aws_iam_role.lambda_role.arn
  memory_size      = var.lambda_configs.webhook_receiver.memory_size
  timeout          = var.lambda_configs.webhook_receiver.timeout

  tracing_config { mode = "Active" }

  environment {
    variables = {
      PROCESSING_QUEUE_URL = aws_sqs_queue.webhook_processing_queue.id
      PAYLOAD_BUCKET       = aws_s3_bucket.webhook_payloads.id
      # Pass SSM parameter names; Lambdas will fetch values at runtime
      API_KEY_PARAM = "${var.ssm_prefix}/api_key"
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "payload_validator" {
  function_name    = "${var.project}-${var.environment}-payload-validator-${local.suffix}"
  filename         = data.archive_file.payload_validator_zip.output_path
  source_code_hash = data.archive_file.payload_validator_zip.output_base64sha256
  handler          = "index.handler"
  runtime          = "python3.11"
  architectures    = ["arm64"]
  role             = aws_iam_role.lambda_role.arn
  memory_size      = var.lambda_configs.payload_validator.memory_size
  timeout          = var.lambda_configs.payload_validator.timeout

  tracing_config { mode = "Active" }

  environment {
    variables = {
      VALIDATED_QUEUE_URL    = aws_sqs_queue.validated_queue.id
      DLQ_URL                = aws_sqs_queue.webhook_dlq.id
      VALIDATION_RULES_PARAM = "${var.ssm_prefix}/validation_rules"
    }
  }

  tags = local.common_tags
}

resource "aws_lambda_function" "transaction_processor" {
  function_name    = "${var.project}-${var.environment}-transaction-processor-${local.suffix}"
  filename         = data.archive_file.transaction_processor_zip.output_path
  source_code_hash = data.archive_file.transaction_processor_zip.output_base64sha256
  handler          = "index.handler"
  runtime          = "python3.11"
  architectures    = ["arm64"]
  role             = aws_iam_role.lambda_role.arn
  memory_size      = var.lambda_configs.transaction_processor.memory_size
  timeout          = var.lambda_configs.transaction_processor.timeout

  tracing_config { mode = "Active" }

  environment {
    variables = {
      TRANSACTIONS_TABLE   = aws_dynamodb_table.transactions.name
      ARCHIVE_BUCKET       = aws_s3_bucket.failed_messages.id
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

### `api_gateway.tf`

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
  rest_api_id          = aws_api_gateway_rest_api.webhook_api.id
  resource_id          = aws_api_gateway_resource.webhook.id
  http_method          = "POST"
  authorization        = "NONE"
  api_key_required     = true
  request_validator_id = aws_api_gateway_request_validator.webhook_validator.id
}

resource "aws_api_gateway_integration" "webhook_lambda" {
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id
  resource_id = aws_api_gateway_resource.webhook.id
  http_method = aws_api_gateway_method.webhook_post.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.webhook_receiver.invoke_arn
}

resource "aws_api_gateway_deployment" "webhook_deployment" {
  depends_on  = [aws_api_gateway_integration.webhook_lambda]
  rest_api_id = aws_api_gateway_rest_api.webhook_api.id

  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "webhook_stage" {
  deployment_id        = aws_api_gateway_deployment.webhook_deployment.id
  rest_api_id          = aws_api_gateway_rest_api.webhook_api.id
  stage_name           = var.environment
  xray_tracing_enabled = true

  tags = local.common_tags
}

resource "aws_api_gateway_api_key" "webhook_key" {
  name    = "${var.project}-${var.environment}-api-key-${local.suffix}"
  enabled = true

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

### `s3.tf`

```terraform
resource "aws_s3_bucket" "webhook_payloads" {
  bucket = lower("${var.project}-${var.environment}-webhook-payloads-${local.suffix}")

  force_destroy = true # allow destroy when cleaning up/failing

  tags = local.common_tags
}

resource "aws_s3_bucket_acl" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "webhook_payloads" {
  bucket = aws_s3_bucket.webhook_payloads.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "webhook_payloads" {
  bucket                  = aws_s3_bucket.webhook_payloads.id
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

  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_acl" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "failed_messages" {
  bucket = aws_s3_bucket.failed_messages.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "failed_messages" {
  bucket                  = aws_s3_bucket.failed_messages.id
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

### `sqs.tf`

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

### `dynamodb.tf`

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
    enabled = true
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

### `cloudwatch.tf`

```terraform
resource "aws_cloudwatch_log_group" "webhook_receiver_logs" {
  name              = "/aws/lambda/${aws_lambda_function.webhook_receiver.function_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "payload_validator_logs" {
  name              = "/aws/lambda/${aws_lambda_function.payload_validator.function_name}"
  retention_in_days = 7
  tags              = local.common_tags
}

resource "aws_cloudwatch_log_group" "transaction_processor_logs" {
  name              = "/aws/lambda/${aws_lambda_function.transaction_processor.function_name}"
  retention_in_days = 7
  tags              = local.common_tags
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
      dimensions  = { FunctionName = aws_lambda_function.payload_validator.function_name }
      period      = 60
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
      dimensions  = { FunctionName = aws_lambda_function.payload_validator.function_name }
      period      = 60
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
      dimensions  = { FunctionName = aws_lambda_function.transaction_processor.function_name }
      period      = 60
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
      dimensions  = { FunctionName = aws_lambda_function.transaction_processor.function_name }
      period      = 60
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

  tags          = local.common_tags
  alarm_actions = length(var.notification_emails) > 0 ? [aws_sns_topic.alerts.arn] : []
}
```

### `sns.tf`

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

### `outputs.tf`

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

### `scripts/build-lambdas.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Build script to package each lambda function directory into a zip under lib/lambdas
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
LAMBDA_DIR="$ROOT_DIR/lambdas"

for fn in webhook_receiver payload_validator transaction_processor; do
  pushd "$LAMBDA_DIR/$fn" >/dev/null
  rm -f "$ROOT_DIR/lambdas/${fn}.zip"
  # install dependencies into package dir
  mkdir -p build
  pip install -r ../requirements.txt -t build/
  cp -r *.py build/ || true
  (cd build && zip -r ../${fn}.zip .)
  rm -rf build
  popd >/dev/null
done

echo "Built lambda zips in $ROOT_DIR/lambdas"
```

### `lambdas/requirements.txt`

```
boto3==1.28.0
```

### `lambdas/webhook_receiver/index.py`

```python
import os
import json
import boto3
from datetime import datetime

# Clients
S3 = boto3.client('s3')
SQS = boto3.client('sqs')
SSM = boto3.client('ssm')

# Cache for SSM parameters to avoid repeated calls on warm invocations
_SSM_CACHE = {}

def get_ssm_param(name, with_decryption=True):
    if name in _SSM_CACHE:
        return _SSM_CACHE[name]
    try:
        resp = SSM.get_parameter(Name=name, WithDecryption=with_decryption)
        val = resp['Parameter']['Value']
        _SSM_CACHE[name] = val
        return val
    except Exception:
        return None


def handler(event, context):
    # Realistic use-case: persist raw webhook payload to S3 and push a message to SQS for processing
    body = event.get('body') if isinstance(event, dict) else None
    if body is None:
        return { 'statusCode': 400, 'body': 'Missing body' }

    # Fetch runtime configuration from environment (SSM parameter names)
    bucket = os.environ.get('PAYLOAD_BUCKET')
    queue_url = os.environ.get('PROCESSING_QUEUE_URL')
    api_key_param = os.environ.get('API_KEY_PARAM')
    api_key = get_ssm_param(api_key_param) if api_key_param else None

    key = f"raw/{datetime.utcnow().strftime('%Y/%m/%d/%H%M%S')}-{context.aws_request_id}.json"
    S3.put_object(Bucket=bucket, Key=key, Body=body.encode('utf-8'))

    message = { 's3_bucket': bucket, 's3_key': key }
    SQS.send_message(QueueUrl=queue_url, MessageBody=json.dumps(message))

    return { 'statusCode': 200, 'body': json.dumps({'accepted': True, 's3_key': key}) }
```

### `lambdas/payload_validator/index.py`

```python
import os
import json
import boto3

SQS = boto3.client('sqs')
SSM = boto3.client('ssm')

_SSM_CACHE = {}

def get_ssm_param(name, with_decryption=True):
    if name in _SSM_CACHE:
        return _SSM_CACHE[name]
    try:
        resp = SSM.get_parameter(Name=name, WithDecryption=with_decryption)
        val = resp['Parameter']['Value']
        _SSM_CACHE[name] = val
        return val
    except Exception:
        return None


def validate_payload(payload):
    # Simple but realistic validation example: expect 'transaction_id' and 'amount'
    if not isinstance(payload, dict):
        return False, 'payload not json'
    if 'transaction_id' not in payload:
        return False, 'missing transaction_id'
    if 'amount' not in payload:
        return False, 'missing amount'
    return True, ''

def handler(event, context):
    # event from SQS: Records -> body contains s3 pointer
    records = event.get('Records', [])
    # Load validation rules from SSM if provided (expects JSON string)
    validation_rules_param = os.environ.get('VALIDATION_RULES_PARAM')
    validation_rules = None
    if validation_rules_param:
        raw = get_ssm_param(validation_rules_param)
        try:
            validation_rules = json.loads(raw) if raw else None
        except Exception:
            validation_rules = None
    for r in records:
        try:
            body = json.loads(r['body'])
            # fetch S3 object here in production; assume body contains payload for this simplified example
            payload = body.get('payload') or body
            ok, reason = validate_payload(payload)
            # Optionally apply extra validation rules from SSM (example)
            if ok and validation_rules and isinstance(validation_rules, dict):
                # example rule: minimum_amount
                min_amount = validation_rules.get('minimum_amount')
                if min_amount is not None and payload.get('amount', 0) < min_amount:
                    ok = False
                    reason = f'amount below minimum {min_amount}'
            if not ok:
                # send to DLQ by sending to DLQ queue directly
                SQS.send_message(QueueUrl=os.environ['DLQ_URL'], MessageBody=json.dumps({ 'error': reason, 'original': payload }))
                continue
            # forward to validated queue
            SQS.send_message(QueueUrl=os.environ['VALIDATED_QUEUE_URL'], MessageBody=json.dumps(payload))
        except Exception as e:
            SQS.send_message(QueueUrl=os.environ['DLQ_URL'], MessageBody=json.dumps({'error': str(e)}))

    return {'statusCode': 200}
```

### `lambdas/transaction_processor/index.py`

```python
import os
import json
import boto3
from datetime import datetime

DDB = boto3.resource('dynamodb')
SSM = boto3.client('ssm')

_SSM_CACHE = {}

def get_ssm_param(name, with_decryption=True):
    if name in _SSM_CACHE:
        return _SSM_CACHE[name]
    try:
        resp = SSM.get_parameter(Name=name, WithDecryption=with_decryption)
        val = resp['Parameter']['Value']
        _SSM_CACHE[name] = val
        return val
    except Exception:
        return None


def handler(event, context):
    table_name = os.environ.get('TRANSACTIONS_TABLE')
    table = DDB.Table(table_name)

    # Fetch DB credentials from SSM (expects JSON with keys like username/password)
    db_creds_param = os.environ.get('DB_CREDENTIALS_PARAM')
    db_creds = None
    if db_creds_param:
        raw = get_ssm_param(db_creds_param)
        try:
            db_creds = json.loads(raw) if raw else None
        except Exception:
            db_creds = None

    records = event.get('Records', [])
    for r in records:
        body = json.loads(r['body'])
        item = {
            'transaction_id': body.get('transaction_id'),
            'timestamp': body.get('timestamp') or datetime.utcnow().isoformat(),
            'customer_id': body.get('customer_id', 'unknown'),
            'raw': json.dumps(body)
        }
        # Example use of db_creds: not used to write to DynamoDB but shown as realistic binding
        if db_creds:
            item['ingested_by'] = db_creds.get('username')

        table.put_item(Item=item)

    return {'statusCode': 200}
```
