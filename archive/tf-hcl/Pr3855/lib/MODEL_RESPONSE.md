## provider.tf

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "use1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "usw2"
  region = "us-west-2"
}
```

## lib/main.tf

```hcl
# Variables
variable "aws_region" {
  description = "Default AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "iac-aws-nova-model-breaking"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "platform-team"
}

variable "kms_key_deletion_days" {
  description = "KMS key deletion window in days"
  type        = number
  default     = 7
}

# Locals
locals {
  region_suffix = {
    "us-east-1" = "use1"
    "us-west-2" = "usw2"
  }

  regions = {
    use1 = "us-east-1"
    usw2 = "us-west-2"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
    ManagedBy   = "terraform"
  }
}

# Data source for Lambda package
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"
  source {
    content = <<EOF
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("Hello, World! Lambda invoked")
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'message': 'Hello, World!'
        })
    }
EOF
    filename = "lambda_function.py"
  }
}

# US-East-1 Resources
resource "aws_kms_key" "lambda_env_use1" {
  provider                = aws.use1
  description             = "KMS key for Lambda environment encryption in us-east-1"
  deletion_window_in_days = var.kms_key_deletion_days
  enable_key_rotation     = true

  tags = merge(local.tags, {
    Name   = "${var.project_name}-lambda-env-use1"
    Region = "us-east-1"
  })
}

resource "aws_kms_alias" "lambda_env_use1" {
  provider      = aws.use1
  name          = "alias/${var.project_name}-lambda-env-use1"
  target_key_id = aws_kms_key.lambda_env_use1.key_id
}

resource "aws_cloudwatch_log_group" "lambda_use1" {
  provider          = aws.use1
  name              = "/aws/lambda/${var.project_name}-lambda-use1"
  retention_in_days = 30

  tags = merge(local.tags, {
    Name   = "${var.project_name}-lambda-logs-use1"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_log_group" "api_gateway_use1" {
  provider          = aws.use1
  name              = "/aws/apigateway/${var.project_name}-api-use1"
  retention_in_days = 30

  tags = merge(local.tags, {
    Name   = "${var.project_name}-api-logs-use1"
    Region = "us-east-1"
  })
}

resource "aws_iam_role" "lambda_execution_use1" {
  provider = aws.use1
  name     = "${var.project_name}-lambda-execution-use1"

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

  tags = merge(local.tags, {
    Name   = "${var.project_name}-lambda-execution-use1"
    Region = "us-east-1"
  })
}

resource "aws_iam_role_policy" "lambda_execution_use1" {
  provider = aws.use1
  name     = "${var.project_name}-lambda-execution-policy-use1"
  role     = aws_iam_role.lambda_execution_use1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda_use1.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.lambda_env_use1.arn
      }
    ]
  })
}

resource "aws_lambda_function" "main_use1" {
  provider         = aws.use1
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-lambda-use1"
  role            = aws_iam_role.lambda_execution_use1.arn
  handler         = "lambda_function.lambda_handler"
  runtime         = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  publish         = true
  kms_key_arn     = aws_kms_key.lambda_env_use1.arn

  environment {
    variables = {
      ENVIRONMENT = var.environment
      REGION      = "us-east-1"
      PROJECT     = var.project_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_use1]

  tags = merge(local.tags, {
    Name   = "${var.project_name}-lambda-use1"
    Region = "us-east-1"
  })
}

resource "aws_lambda_alias" "main_use1" {
  provider         = aws.use1
  name             = "live"
  description      = "Live alias for zero-downtime deployments"
  function_name    = aws_lambda_function.main_use1.function_name
  function_version = aws_lambda_function.main_use1.version
}

resource "aws_apigatewayv2_api" "main_use1" {
  provider      = aws.use1
  name          = "${var.project_name}-api-use1"
  protocol_type = "HTTP"
  description   = "HTTP API for ${var.project_name} in us-east-1"

  tags = merge(local.tags, {
    Name   = "${var.project_name}-api-use1"
    Region = "us-east-1"
  })
}

resource "aws_apigatewayv2_integration" "lambda_use1" {
  provider           = aws.use1
  api_id             = aws_apigatewayv2_api.main_use1.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_alias.main_use1.invoke_arn
}

resource "aws_apigatewayv2_route" "main_use1" {
  provider           = aws.use1
  api_id             = aws_apigatewayv2_api.main_use1.id
  route_key          = "POST /hello"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_use1.id}"
  authorization_type = "AWS_IAM"
}

resource "aws_apigatewayv2_stage" "main_use1" {
  provider    = aws.use1
  api_id      = aws_apigatewayv2_api.main_use1.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_use1.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(local.tags, {
    Name   = "${var.project_name}-api-stage-use1"
    Region = "us-east-1"
  })
}

resource "aws_lambda_permission" "api_gateway_use1" {
  provider      = aws.use1
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_alias.main_use1.function_name
  qualifier     = aws_lambda_alias.main_use1.name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main_use1.execution_arn}/*/*"
}

resource "aws_sns_topic" "alerts_use1" {
  provider = aws.use1
  name     = "${var.project_name}-alerts-use1"

  tags = merge(local.tags, {
    Name   = "${var.project_name}-alerts-use1"
    Region = "us-east-1"
  })
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors_use1" {
  provider            = aws.use1
  alarm_name          = "${var.project_name}-lambda-errors-use1"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = [aws_sns_topic.alerts_use1.arn]

  dimensions = {
    FunctionName = aws_lambda_function.main_use1.function_name
  }

  tags = merge(local.tags, {
    Name   = "${var.project_name}-lambda-errors-alarm-use1"
    Region = "us-east-1"
  })
}

# US-West-2 Resources
resource "aws_kms_key" "lambda_env_usw2" {
  provider                = aws.usw2
  description             = "KMS key for Lambda environment encryption in us-west-2"
  deletion_window_in_days = var.kms_key_deletion_days
  enable_key_rotation     = true

  tags = merge(local.tags, {
    Name   = "${var.project_name}-lambda-env-usw2"
    Region = "us-west-2"
  })
}

resource "aws_kms_alias" "lambda_env_usw2" {
  provider      = aws.usw2
  name          = "alias/${var.project_name}-lambda-env-usw2"
  target_key_id = aws_kms_key.lambda_env_usw2.key_id
}

resource "aws_cloudwatch_log_group" "lambda_usw2" {
  provider          = aws.usw2
  name              = "/aws/lambda/${var.project_name}-lambda-usw2"
  retention_in_days = 30

  tags = merge(local.tags, {
    Name   = "${var.project_name}-lambda-logs-usw2"
    Region = "us-west-2"
  })
}

resource "aws_cloudwatch_log_group" "api_gateway_usw2" {
  provider          = aws.usw2
  name              = "/aws/apigateway/${var.project_name}-api-usw2"
  retention_in_days = 30

  tags = merge(local.tags, {
    Name   = "${var.project_name}-api-logs-usw2"
    Region = "us-west-2"
  })
}

resource "aws_iam_role" "lambda_execution_usw2" {
  provider = aws.usw2
  name     = "${var.project_name}-lambda-execution-usw2"

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

  tags = merge(local.tags, {
    Name   = "${var.project_name}-lambda-execution-usw2"
    Region = "us-west-2"
  })
}

resource "aws_iam_role_policy" "lambda_execution_usw2" {
  provider = aws.usw2
  name     = "${var.project_name}-lambda-execution-policy-usw2"
  role     = aws_iam_role.lambda_execution_usw2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.lambda_usw2.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.lambda_env_usw2.arn
      }
    ]
  })
}

resource "aws_lambda_function" "main_usw2" {
  provider         = aws.usw2
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-lambda-usw2"
  role            = aws_iam_role.lambda_execution_usw2.arn
  handler         = "lambda_function.lambda_handler"
  runtime         = "python3.12"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  publish         = true
  kms_key_arn     = aws_kms_key.lambda_env_usw2.arn

  environment {
    variables = {
      ENVIRONMENT = var.environment
      REGION      = "us-west-2"
      PROJECT     = var.project_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_usw2]

  tags = merge(local.tags, {
    Name   = "${var.project_name}-lambda-usw2"
    Region = "us-west-2"
  })
}

resource "aws_lambda_alias" "main_usw2" {
  provider         = aws.usw2
  name             = "live"
  description      = "Live alias for zero-downtime deployments"
  function_name    = aws_lambda_function.main_usw2.function_name
  function_version = aws_lambda_function.main_usw2.version
}

resource "aws_apigatewayv2_api" "main_usw2" {
  provider      = aws.usw2
  name          = "${var.project_name}-api-usw2"
  protocol_type = "HTTP"
  description   = "HTTP API for ${var.project_name} in us-west-2"

  tags = merge(local.tags, {
    Name   = "${var.project_name}-api-usw2"
    Region = "us-west-2"
  })
}

resource "aws_apigatewayv2_integration" "lambda_usw2" {
  provider           = aws.usw2
  api_id             = aws_apigatewayv2_api.main_usw2.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_alias.main_usw2.invoke_arn
}

resource "aws_apigatewayv2_route" "main_usw2" {
  provider           = aws.usw2
  api_id             = aws_apigatewayv2_api.main_usw2.id
  route_key          = "POST /hello"
  target             = "integrations/${aws_apigatewayv2_integration.lambda_usw2.id}"
  authorization_type = "AWS_IAM"
}

resource "aws_apigatewayv2_stage" "main_usw2" {
  provider    = aws.usw2
  api_id      = aws_apigatewayv2_api.main_usw2.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_usw2.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(local.tags, {
    Name   = "${var.project_name}-api-stage-usw2"
    Region = "us-west-2"
  })
}

resource "aws_lambda_permission" "api_gateway_usw2" {
  provider      = aws.usw2
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_alias.main_usw2.function_name
  qualifier     = aws_lambda_alias.main_usw2.name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main_usw2.execution_arn}/*/*"
}

resource "aws_sns_topic" "alerts_usw2" {
  provider = aws.usw2
  name     = "${var.project_name}-alerts-usw2"

  tags = merge(local.tags, {
    Name   = "${var.project_name}-alerts-usw2"
    Region = "us-west-2"
  })
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors_usw2" {
  provider            = aws.usw2
  alarm_name          = "${var.project_name}-lambda-errors-usw2"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = [aws_sns_topic.alerts_usw2.arn]

  dimensions = {
    FunctionName = aws_lambda_function.main_usw2.function_name
  }

  tags = merge(local.tags, {
    Name   = "${var.project_name}-lambda-errors-alarm-usw2"
    Region = "us-west-2"
  })
}

# Outputs
output "api_endpoint_url_use1" {
  description = "API Gateway endpoint URL for us-east-1"
  value       = "${aws_apigatewayv2_api.main_use1.api_endpoint}/${var.environment}/hello"
}

output "api_endpoint_url_usw2" {
  description = "API Gateway endpoint URL for us-west-2"
  value       = "${aws_apigatewayv2_api.main_usw2.api_endpoint}/${var.environment}/hello"
}

output "lambda_alias_arn_use1" {
  description = "Lambda alias ARN for us-east-1"
  value       = aws_lambda_alias.main_use1.arn
}

output "lambda_alias_arn_usw2" {
  description = "Lambda alias ARN for us-west-2"
  value       = aws_lambda_alias.main_usw2.arn
}

output "cloudwatch_log_group_name_use1" {
  description = "CloudWatch Log Group name for Lambda in us-east-1"
  value       = aws_cloudwatch_log_group.lambda_use1.name
}

output "cloudwatch_log_group_name_usw2" {
  description = "CloudWatch Log Group name for Lambda in us-west-2"
  value       = aws_cloudwatch_log_group.lambda_usw2.name
}

output "sns_topic_arn_use1" {
  description = "SNS Topic ARN for alerts in us-east-1"
  value       = aws_sns_topic.alerts_use1.arn
}

output "sns_topic_arn_usw2" {
  description = "SNS Topic ARN for alerts in us-west-2"
  value       = aws_sns_topic.alerts_usw2.arn
}
```
