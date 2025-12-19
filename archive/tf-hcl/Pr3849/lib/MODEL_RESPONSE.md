# Subscription Management System - Terraform Infrastructure

I'll help you create a complete Terraform infrastructure for your subscription management system. Here's the organized solution with separate files for different resource types.

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "subscription-mgmt"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "sender_email" {
  description = "Verified SES sender email address"
  type        = string
  default     = "noreply@example.com"
}

variable "payment_gateway_api_key" {
  description = "Payment gateway API key"
  type        = string
  sensitive   = true
  default     = "placeholder-api-key"
}
```

## File: dynamodb.tf

```hcl
resource "aws_dynamodb_table" "subscriptions" {
  name           = "${var.project_name}-subscriptions-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "subscription_id"
  range_key      = "customer_id"

  attribute {
    name = "subscription_id"
    type = "S"
  }

  attribute {
    name = "customer_id"
    type = "S"
  }

  attribute {
    name = "renewal_date"
    type = "S"
  }

  global_secondary_index {
    name            = "renewal-date-index"
    hash_key        = "renewal_date"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-subscriptions"
    Environment = var.environment
  }
}
```

## File: s3.tf

```hcl
resource "aws_s3_bucket" "receipts" {
  bucket = "${var.project_name}-receipts-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.project_name}-receipts"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "receipts" {
  bucket = aws_s3_bucket.receipts.id

  rule {
    id     = "archive-old-receipts"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555
    }
  }
}

data "aws_caller_identity" "current" {}
```

## File: secrets_manager.tf

```hcl
resource "aws_secretsmanager_secret" "payment_gateway" {
  name                    = "${var.project_name}-payment-gateway-${var.environment}"
  description             = "Payment gateway API credentials"
  recovery_window_in_days = 7

  tags = {
    Name        = "${var.project_name}-payment-gateway"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "payment_gateway" {
  secret_id = aws_secretsmanager_secret.payment_gateway.id
  secret_string = jsonencode({
    api_key    = var.payment_gateway_api_key
    api_secret = "placeholder-api-secret"
    endpoint   = "https://api.paymentgateway.com"
  })
}
```

## File: ses.tf

```hcl
resource "aws_ses_email_identity" "sender" {
  email = var.sender_email
}

resource "aws_ses_configuration_set" "receipts" {
  name = "${var.project_name}-receipts-${var.environment}"
}

resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "cloudwatch-destination"
  configuration_set_name = aws_ses_configuration_set.receipts.name
  enabled                = true
  matching_types         = ["send", "reject", "bounce", "complaint", "delivery"]

  cloudwatch_destination {
    default_value  = "default"
    dimension_name = "ses:configuration-set"
    value_source   = "messageTag"
  }
}
```

## File: iam.tf

```hcl
# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-lambda-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-lambda-execution"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy-${var.environment}"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.subscriptions.arn,
          "${aws_dynamodb_table.subscriptions.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.receipts.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.payment_gateway.arn
      }
    ]
  })
}

# Step Functions execution role
resource "aws_iam_role" "stepfunctions_execution" {
  name = "${var.project_name}-stepfunctions-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-stepfunctions-execution"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy" "stepfunctions_policy" {
  name = "${var.project_name}-stepfunctions-policy-${var.environment}"
  role = aws_iam_role.stepfunctions_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.process_payment.arn,
          aws_lambda_function.generate_receipt.arn,
          aws_lambda_function.send_email.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogDelivery",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# API Gateway CloudWatch role
resource "aws_iam_role" "apigateway_cloudwatch" {
  name = "${var.project_name}-apigateway-cloudwatch-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-apigateway-cloudwatch"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "apigateway_cloudwatch" {
  role       = aws_iam_role.apigateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}
```

## File: lambda.tf

```hcl
# Lambda function for processing payments
resource "aws_lambda_function" "process_payment" {
  filename         = data.archive_file.process_payment.output_path
  function_name    = "${var.project_name}-process-payment-${var.environment}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.process_payment.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      DYNAMODB_TABLE        = aws_dynamodb_table.subscriptions.name
      SECRETS_MANAGER_ARN   = aws_secretsmanager_secret.payment_gateway.arn
      ENVIRONMENT           = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-process-payment"
    Environment = var.environment
  }
}

data "archive_file" "process_payment" {
  type        = "zip"
  output_path = "${path.module}/lambda_packages/process_payment.zip"
  source {
    content  = file("${path.module}/lambda/process_payment.js")
    filename = "index.js"
  }
}

# Lambda function for generating receipts
resource "aws_lambda_function" "generate_receipt" {
  filename         = data.archive_file.generate_receipt.output_path
  function_name    = "${var.project_name}-generate-receipt-${var.environment}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.generate_receipt.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      S3_BUCKET   = aws_s3_bucket.receipts.id
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-generate-receipt"
    Environment = var.environment
  }
}

data "archive_file" "generate_receipt" {
  type        = "zip"
  output_path = "${path.module}/lambda_packages/generate_receipt.zip"
  source {
    content  = file("${path.module}/lambda/generate_receipt.js")
    filename = "index.js"
  }
}

# Lambda function for sending emails
resource "aws_lambda_function" "send_email" {
  filename         = data.archive_file.send_email.output_path
  function_name    = "${var.project_name}-send-email-${var.environment}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.send_email.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      SENDER_EMAIL          = var.sender_email
      SES_CONFIGURATION_SET = aws_ses_configuration_set.receipts.name
      S3_BUCKET             = aws_s3_bucket.receipts.id
      ENVIRONMENT           = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-send-email"
    Environment = var.environment
  }
}

data "archive_file" "send_email" {
  type        = "zip"
  output_path = "${path.module}/lambda_packages/send_email.zip"
  source {
    content  = file("${path.module}/lambda/send_email.js")
    filename = "index.js"
  }
}

# Lambda function for webhook handler
resource "aws_lambda_function" "webhook_handler" {
  filename         = data.archive_file.webhook_handler.output_path
  function_name    = "${var.project_name}-webhook-handler-${var.environment}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.webhook_handler.output_base64sha256
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      STATE_MACHINE_ARN = aws_sfn_state_machine.renewal_workflow.arn
      ENVIRONMENT       = var.environment
    }
  }

  tags = {
    Name        = "${var.project_name}-webhook-handler"
    Environment = var.environment
  }
}

data "archive_file" "webhook_handler" {
  type        = "zip"
  output_path = "${path.module}/lambda_packages/webhook_handler.zip"
  source {
    content  = file("${path.module}/lambda/webhook_handler.js")
    filename = "index.js"
  }
}

resource "aws_lambda_permission" "apigateway_webhook" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.subscription_api.execution_arn}/*/*"
}

# Grant Step Functions permission to invoke Lambda
resource "aws_iam_role_policy" "stepfunctions_invoke_lambda" {
  name = "${var.project_name}-stepfunctions-invoke-lambda-${var.environment}"
  role = aws_iam_role.stepfunctions_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.webhook_handler.arn
        ]
      }
    ]
  })
}
```

## File: stepfunctions.tf

```hcl
resource "aws_sfn_state_machine" "renewal_workflow" {
  name     = "${var.project_name}-renewal-workflow-${var.environment}"
  role_arn = aws_iam_role.stepfunctions_execution.arn
  type     = "EXPRESS"

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.stepfunctions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }

  definition = jsonencode({
    Comment = "Subscription renewal workflow with retry logic"
    StartAt = "ProcessPayment"
    States = {
      ProcessPayment = {
        Type     = "Task"
        Resource = aws_lambda_function.process_payment.arn
        Retry = [
          {
            ErrorEquals = [
              "PaymentError",
              "States.TaskFailed"
            ]
            IntervalSeconds = 2
            MaxAttempts     = 3
            BackoffRate     = 2.0
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "PaymentFailed"
          }
        ]
        Next = "GenerateReceipt"
      }
      GenerateReceipt = {
        Type     = "Task"
        Resource = aws_lambda_function.generate_receipt.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed"]
            IntervalSeconds = 1
            MaxAttempts     = 2
            BackoffRate     = 1.5
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "ReceiptFailed"
          }
        ]
        Next = "SendEmail"
      }
      SendEmail = {
        Type     = "Task"
        Resource = aws_lambda_function.send_email.arn
        Retry = [
          {
            ErrorEquals     = ["States.TaskFailed"]
            IntervalSeconds = 1
            MaxAttempts     = 2
            BackoffRate     = 1.5
          }
        ]
        Catch = [
          {
            ErrorEquals = ["States.ALL"]
            Next        = "EmailFailed"
          }
        ]
        Next = "Success"
      }
      Success = {
        Type = "Succeed"
      }
      PaymentFailed = {
        Type  = "Fail"
        Error = "PaymentProcessingFailed"
        Cause = "Unable to process payment after retries"
      }
      ReceiptFailed = {
        Type  = "Fail"
        Error = "ReceiptGenerationFailed"
        Cause = "Unable to generate receipt"
      }
      EmailFailed = {
        Type  = "Fail"
        Error = "EmailSendingFailed"
        Cause = "Unable to send email notification"
      }
    }
  })

  tags = {
    Name        = "${var.project_name}-renewal-workflow"
    Environment = var.environment
  }
}
```

## File: apigateway.tf

```hcl
resource "aws_api_gateway_rest_api" "subscription_api" {
  name        = "${var.project_name}-api-${var.environment}"
  description = "API for subscription payment webhooks"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${var.project_name}-api"
    Environment = var.environment
  }
}

resource "aws_api_gateway_resource" "webhook" {
  rest_api_id = aws_api_gateway_rest_api.subscription_api.id
  parent_id   = aws_api_gateway_rest_api.subscription_api.root_resource_id
  path_part   = "webhook"
}

resource "aws_api_gateway_method" "webhook_post" {
  rest_api_id   = aws_api_gateway_rest_api.subscription_api.id
  resource_id   = aws_api_gateway_resource.webhook.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "webhook_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.subscription_api.id
  resource_id             = aws_api_gateway_resource.webhook.id
  http_method             = aws_api_gateway_method.webhook_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.webhook_handler.invoke_arn
}

resource "aws_api_gateway_deployment" "subscription_api" {
  rest_api_id = aws_api_gateway_rest_api.subscription_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.webhook.id,
      aws_api_gateway_method.webhook_post.id,
      aws_api_gateway_integration.webhook_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.webhook_lambda
  ]
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.subscription_api.id
  rest_api_id   = aws_api_gateway_rest_api.subscription_api.id
  stage_name    = "prod"

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name        = "${var.project_name}-api-stage"
    Environment = var.environment
  }
}

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.subscription_api.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
    logging_level   = "INFO"
  }
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.apigateway_cloudwatch.arn
}
```

## File: cloudwatch.tf

```hcl
# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-api-gateway-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "stepfunctions" {
  name              = "/aws/vendedlogs/states/${var.project_name}-${var.environment}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-stepfunctions-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "lambda_process_payment" {
  name              = "/aws/lambda/${aws_lambda_function.process_payment.function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-process-payment-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "lambda_generate_receipt" {
  name              = "/aws/lambda/${aws_lambda_function.generate_receipt.function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-generate-receipt-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "lambda_send_email" {
  name              = "/aws/lambda/${aws_lambda_function.send_email.function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-send-email-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "lambda_webhook_handler" {
  name              = "/aws/lambda/${aws_lambda_function.webhook_handler.function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-webhook-handler-logs"
    Environment = var.environment
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda functions have more than 5 errors in 5 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.process_payment.function_name
  }

  tags = {
    Name        = "${var.project_name}-lambda-errors-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "stepfunctions_failed" {
  alarm_name          = "${var.project_name}-stepfunctions-failed-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ExecutionsFailed"
  namespace           = "AWS/States"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when Step Functions executions fail"
  treat_missing_data  = "notBreaching"

  dimensions = {
    StateMachineArn = aws_sfn_state_machine.renewal_workflow.arn
  }

  tags = {
    Name        = "${var.project_name}-stepfunctions-failed-alarm"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "${var.project_name}-api-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when API Gateway returns more than 10 5xx errors in 5 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.subscription_api.name
    Stage   = aws_api_gateway_stage.prod.stage_name
  }

  tags = {
    Name        = "${var.project_name}-api-5xx-alarm"
    Environment = var.environment
  }
}
```

## File: outputs.tf

```hcl
output "api_gateway_url" {
  description = "API Gateway webhook URL"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/webhook"
}

output "dynamodb_table_name" {
  description = "DynamoDB table name for subscriptions"
  value       = aws_dynamodb_table.subscriptions.name
}

output "s3_bucket_name" {
  description = "S3 bucket name for receipts"
  value       = aws_s3_bucket.receipts.id
}

output "stepfunctions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.renewal_workflow.arn
}

output "secrets_manager_arn" {
  description = "Secrets Manager ARN for payment gateway credentials"
  value       = aws_secretsmanager_secret.payment_gateway.arn
}

output "ses_configuration_set" {
  description = "SES configuration set name"
  value       = aws_ses_configuration_set.receipts.name
}
```

## File: lambda/process_payment.js

```javascript
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const dynamoDb = new DynamoDBClient();
const secretsManager = new SecretsManagerClient();

exports.handler = async (event) => {
    console.log('Processing payment event:', JSON.stringify(event));

    try {
        const { subscription_id, customer_id, amount } = event;

        if (!subscription_id || !customer_id || !amount) {
            throw new Error('Missing required fields: subscription_id, customer_id, or amount');
        }

        // Retrieve payment gateway credentials
        const secretResponse = await secretsManager.send(
            new GetSecretValueCommand({
                SecretId: process.env.SECRETS_MANAGER_ARN
            })
        );

        const credentials = JSON.parse(secretResponse.SecretString);

        // Validate subscription exists in DynamoDB
        const getParams = {
            TableName: process.env.DYNAMODB_TABLE,
            Key: {
                subscription_id: { S: subscription_id },
                customer_id: { S: customer_id }
            }
        };

        const subscription = await dynamoDb.send(new GetItemCommand(getParams));

        if (!subscription.Item) {
            throw new Error('Subscription not found');
        }

        // Simulate payment processing
        // In production, this would call the actual payment gateway API
        const paymentResult = await processPaymentWithGateway(
            credentials,
            {
                subscription_id,
                customer_id,
                amount
            }
        );

        // Update subscription status
        const updateParams = {
            TableName: process.env.DYNAMODB_TABLE,
            Key: {
                subscription_id: { S: subscription_id },
                customer_id: { S: customer_id }
            },
            UpdateExpression: 'SET payment_status = :status, last_payment = :timestamp, transaction_id = :txn_id',
            ExpressionAttributeValues: {
                ':status': { S: 'paid' },
                ':timestamp': { S: new Date().toISOString() },
                ':txn_id': { S: paymentResult.transaction_id }
            }
        };

        await dynamoDb.send(new UpdateItemCommand(updateParams));

        return {
            statusCode: 200,
            body: {
                subscription_id,
                customer_id,
                transaction_id: paymentResult.transaction_id,
                amount,
                status: 'success',
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        console.error('Payment processing error:', error);
        throw new Error('PaymentError: ' + error.message);
    }
};

async function processPaymentWithGateway(credentials, paymentData) {
    // Simulate payment gateway API call
    // In production, integrate with actual payment gateway
    console.log('Processing payment with gateway:', paymentData);

    // Simulate success response
    return {
        transaction_id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        status: 'approved',
        amount: paymentData.amount,
        timestamp: new Date().toISOString()
    };
}
```

## File: lambda/generate_receipt.js

```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client();

exports.handler = async (event) => {
    console.log('Generating receipt:', JSON.stringify(event));

    try {
        const { subscription_id, customer_id, transaction_id, amount, timestamp } = event.body || event;

        if (!subscription_id || !customer_id || !transaction_id) {
            throw new Error('Missing required fields');
        }

        // Generate PDF receipt (simplified version)
        const receiptContent = generateReceiptPDF({
            subscription_id,
            customer_id,
            transaction_id,
            amount,
            timestamp: timestamp || new Date().toISOString()
        });

        // Store receipt in S3
        const receiptKey = `receipts/${customer_id}/${subscription_id}/${transaction_id}.pdf`;

        const putParams = {
            Bucket: process.env.S3_BUCKET,
            Key: receiptKey,
            Body: receiptContent,
            ContentType: 'application/pdf',
            ServerSideEncryption: 'AES256',
            Metadata: {
                subscription_id: subscription_id,
                customer_id: customer_id,
                transaction_id: transaction_id
            }
        };

        await s3.send(new PutObjectCommand(putParams));

        return {
            statusCode: 200,
            body: {
                subscription_id,
                customer_id,
                transaction_id,
                receipt_key: receiptKey,
                receipt_url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${receiptKey}`,
                status: 'receipt_generated'
            }
        };

    } catch (error) {
        console.error('Receipt generation error:', error);
        throw error;
    }
};

function generateReceiptPDF(data) {
    // Simplified PDF generation
    // In production, use a PDF library like PDFKit
    const receiptText = `
PAYMENT RECEIPT
=====================================
Subscription ID: ${data.subscription_id}
Customer ID: ${data.customer_id}
Transaction ID: ${data.transaction_id}
Amount: $${data.amount}
Date: ${data.timestamp}
Status: PAID
=====================================
Thank you for your payment!
    `;

    return Buffer.from(receiptText, 'utf-8');
}
```

## File: lambda/send_email.js

```javascript
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient();

exports.handler = async (event) => {
    console.log('Sending email:', JSON.stringify(event));

    try {
        const { subscription_id, customer_id, transaction_id, receipt_key, receipt_url } = event.body || event;

        if (!customer_id || !transaction_id) {
            throw new Error('Missing required fields');
        }

        // In production, retrieve customer email from DynamoDB
        const customerEmail = `customer-${customer_id}@example.com`;

        const emailParams = {
            Source: process.env.SENDER_EMAIL,
            Destination: {
                ToAddresses: [customerEmail]
            },
            Message: {
                Subject: {
                    Data: 'Payment Receipt - Subscription Renewal',
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: generateEmailHTML({
                            subscription_id,
                            customer_id,
                            transaction_id,
                            receipt_url
                        }),
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: generateEmailText({
                            subscription_id,
                            customer_id,
                            transaction_id,
                            receipt_url
                        }),
                        Charset: 'UTF-8'
                    }
                }
            },
            ConfigurationSetName: process.env.SES_CONFIGURATION_SET
        };

        const result = await ses.send(new SendEmailCommand(emailParams));

        return {
            statusCode: 200,
            body: {
                subscription_id,
                customer_id,
                transaction_id,
                email_sent: true,
                message_id: result.MessageId,
                status: 'email_sent'
            }
        };

    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
};

function generateEmailHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Confirmation</h1>
        </div>
        <div class="content">
            <h2>Thank you for your payment!</h2>
            <p>Your subscription has been successfully renewed.</p>
            <p><strong>Transaction Details:</strong></p>
            <ul>
                <li>Subscription ID: ${data.subscription_id}</li>
                <li>Transaction ID: ${data.transaction_id}</li>
                <li>Customer ID: ${data.customer_id}</li>
            </ul>
            <p>You can download your receipt using the link below:</p>
            <p><a href="${data.receipt_url}" class="button">Download Receipt</a></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
}

function generateEmailText(data) {
    return `
Payment Confirmation

Thank you for your payment! Your subscription has been successfully renewed.

Transaction Details:
- Subscription ID: ${data.subscription_id}
- Transaction ID: ${data.transaction_id}
- Customer ID: ${data.customer_id}

You can download your receipt here: ${data.receipt_url}

This is an automated message. Please do not reply to this email.
    `;
}
```

## File: lambda/webhook_handler.js

```javascript
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');

const stepFunctions = new SFNClient();

exports.handler = async (event) => {
    console.log('Webhook received:', JSON.stringify(event));

    try {
        // Parse webhook payload
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

        const { subscription_id, customer_id, amount, event_type } = body;

        if (!subscription_id || !customer_id || !amount) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    error: 'Missing required fields: subscription_id, customer_id, or amount'
                })
            };
        }

        // Start Step Functions execution
        const executionParams = {
            stateMachineArn: process.env.STATE_MACHINE_ARN,
            input: JSON.stringify({
                subscription_id,
                customer_id,
                amount,
                event_type: event_type || 'subscription.renewal',
                timestamp: new Date().toISOString()
            }),
            name: `renewal-${subscription_id}-${Date.now()}`
        };

        const result = await stepFunctions.send(new StartExecutionCommand(executionParams));

        return {
            statusCode: 202,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Webhook received and processing started',
                execution_arn: result.executionArn,
                subscription_id,
                customer_id
            })
        };

    } catch (error) {
        console.error('Webhook handler error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
```

This infrastructure provides a complete subscription management system with payment processing, receipt generation, and email notifications, all orchestrated through AWS Step Functions with built-in retry logic and comprehensive monitoring through CloudWatch.
