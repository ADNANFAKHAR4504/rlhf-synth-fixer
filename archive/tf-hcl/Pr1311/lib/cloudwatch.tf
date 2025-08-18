# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset(["user", "order", "notification"])

  name              = "/aws/lambda/${var.project_name}-${var.environment_suffix}-${each.key}-service"
  retention_in_days = 14
  # kms_key_id        = aws_kms_key.pipeline_key.arn # Removed to avoid circular dependency

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-${each.key}-logs"
    Environment = var.environment
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment_suffix}"
  retention_in_days = 14
  # kms_key_id        = aws_kms_key.pipeline_key.arn # Removed to avoid circular dependency

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-api-logs"
    Environment = var.environment
  }
}

# CloudWatch Log Groups for CodeBuild projects
resource "aws_cloudwatch_log_group" "codebuild_build" {
  name              = "/aws/codebuild/${var.project_name}-${var.environment_suffix}-build-test"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-codebuild-build-logs"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_log_group" "codebuild_deploy" {
  name              = "/aws/codebuild/${var.project_name}-${var.environment_suffix}-deploy"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-${var.environment_suffix}-codebuild-deploy-logs"
    Environment = var.environment
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment_suffix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", "${var.project_name}-${var.environment_suffix}-user-service"],
            [".", ".", ".", "${var.project_name}-${var.environment_suffix}-order-service"],
            [".", ".", ".", "${var.project_name}-${var.environment_suffix}-notification-service"]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Function Duration"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-${var.environment_suffix}-user-service"],
            [".", ".", ".", "${var.project_name}-${var.environment_suffix}-order-service"],
            [".", ".", ".", "${var.project_name}-${var.environment_suffix}-notification-service"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Invocations"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", var.project_name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "API Gateway Requests"
        }
      }
    ]
  })
}