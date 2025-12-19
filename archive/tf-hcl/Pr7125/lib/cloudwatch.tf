resource "aws_cloudwatch_dashboard" "reconciliation_dashboard" {
  dashboard_name = "reconciliation-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/States", "ExecutionTime", { stat = "Average", label = "Avg Execution Time" }],
            [".", ".", { stat = "Maximum", label = "Max Execution Time" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Step Functions Execution Time"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/States", "ExecutionsFailed", { stat = "Sum", label = "Failed Executions" }],
            [".", "ExecutionsSucceeded", { stat = "Sum", label = "Successful Executions" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Step Functions Execution Status"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", label = "File Parser Duration" }, { functionName = aws_lambda_function.file_parser.function_name }],
            ["...", { functionName = aws_lambda_function.transaction_validator.function_name, label = "Validator Duration" }],
            ["...", { functionName = aws_lambda_function.report_generator.function_name, label = "Report Gen Duration" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Lambda Function Duration"
          yAxis = {
            left = {
              label = "Milliseconds"
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Errors", { stat = "Sum", label = "File Parser Errors" }, { functionName = aws_lambda_function.file_parser.function_name }],
            ["...", { functionName = aws_lambda_function.transaction_validator.function_name, label = "Validator Errors" }],
            ["...", { functionName = aws_lambda_function.report_generator.function_name, label = "Report Gen Errors" }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Lambda Function Errors"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum" }, { TableName = aws_dynamodb_table.transaction_records.name }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }, { TableName = aws_dynamodb_table.transaction_records.name }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Capacity Units - Transaction Records"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum" }, { TableName = aws_dynamodb_table.reconciliation_results.name }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }, { TableName = aws_dynamodb_table.reconciliation_results.name }]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "DynamoDB Capacity Units - Reconciliation Results"
        }
      }
    ]
  })
}
