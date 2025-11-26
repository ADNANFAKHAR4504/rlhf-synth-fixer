# logs.tf - CloudWatch Logs Insights saved queries

# Query 1: Error analysis
resource "aws_cloudwatch_query_definition" "error_analysis" {
  name = "Error-Analysis-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.lambda.name
  ]

  query_string = <<-EOQ
    fields @timestamp, @message, @logStream
    | filter @message like /ERROR/
    | parse @message /ERROR: (?<error_message>.*)/
    | stats count() as error_count by error_message
    | sort error_count desc
    | limit 20
  EOQ
}

# Query 2: Latency trends
resource "aws_cloudwatch_query_definition" "latency_trends" {
  name = "Latency-Trends-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.lambda.name
  ]

  query_string = <<-EOQ
    fields @timestamp, @duration
    | filter @type = "REPORT"
    | stats avg(@duration), max(@duration), min(@duration), pct(@duration, 95) as p95, pct(@duration, 99) as p99 by bin(5m)
  EOQ
}

# Query 3: Top transaction types
resource "aws_cloudwatch_query_definition" "transaction_types" {
  name = "Transaction-Types-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.lambda.name
  ]

  query_string = <<-EOQ
    fields @timestamp, @message
    | filter @message like /TransactionType/
    | parse @message /TransactionType: (?<transaction_type>.*)/
    | stats count() as transaction_count by transaction_type
    | sort transaction_count desc
    | limit 10
  EOQ
}

# Query 4: Transaction success rate
resource "aws_cloudwatch_query_definition" "success_rate" {
  name = "Success-Rate-${var.environment_suffix}"

  log_group_names = [
    aws_cloudwatch_log_group.lambda.name
  ]

  query_string = <<-EOQ
    fields @timestamp, @message
    | filter @message like /ProcessingResult/
    | parse @message /ProcessingResult: (?<result>.*)/
    | stats count() as total by result
  EOQ
}
