# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${local.env_suffix}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-api-gateway-logs"
    Environment = local.env_suffix
  }
}

resource "aws_cloudwatch_log_group" "stepfunctions" {
  name              = "/aws/vendedlogs/states/${var.project_name}-${local.env_suffix}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-stepfunctions-logs"
    Environment = local.env_suffix
  }
}

resource "aws_cloudwatch_log_group" "lambda_process_payment" {
  name              = "/aws/lambda/${aws_lambda_function.process_payment.function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-process-payment-logs"
    Environment = local.env_suffix
  }
}

resource "aws_cloudwatch_log_group" "lambda_generate_receipt" {
  name              = "/aws/lambda/${aws_lambda_function.generate_receipt.function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-generate-receipt-logs"
    Environment = local.env_suffix
  }
}

resource "aws_cloudwatch_log_group" "lambda_send_email" {
  name              = "/aws/lambda/${aws_lambda_function.send_email.function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-send-email-logs"
    Environment = local.env_suffix
  }
}

resource "aws_cloudwatch_log_group" "lambda_webhook_handler" {
  name              = "/aws/lambda/${aws_lambda_function.webhook_handler.function_name}"
  retention_in_days = 14

  tags = {
    Name        = "${var.project_name}-webhook-handler-logs"
    Environment = local.env_suffix
  }
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors-${local.env_suffix}"
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
    Environment = local.env_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "stepfunctions_failed" {
  alarm_name          = "${var.project_name}-stepfunctions-failed-${local.env_suffix}"
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
    Environment = local.env_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx" {
  alarm_name          = "${var.project_name}-api-5xx-errors-${local.env_suffix}"
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
    Environment = local.env_suffix
  }
}
