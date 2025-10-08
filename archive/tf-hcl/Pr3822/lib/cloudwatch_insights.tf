# cloudwatch_insights.tf

# CloudWatch Insights Queries for log analysis
resource "aws_cloudwatch_query_definition" "error_logs" {
  name = "${local.name_prefix}-error-logs"

  log_group_names = [for lg in aws_cloudwatch_log_group.applications : lg.name]

  query_string = <<-QUERY
fields @timestamp, @message, @logStream
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
QUERY
}

resource "aws_cloudwatch_query_definition" "application_stats" {
  name = "${local.name_prefix}-application-stats"

  log_group_names = [for lg in aws_cloudwatch_log_group.applications : lg.name]

  query_string = <<-QUERY
fields @timestamp, @logStream
| stats count() by @logStream
| sort count desc
QUERY
}

resource "aws_cloudwatch_query_definition" "hourly_log_volume" {
  name = "${local.name_prefix}-hourly-log-volume"

  log_group_names = [for lg in aws_cloudwatch_log_group.applications : lg.name]

  query_string = <<-QUERY
fields @timestamp
| stats count() by bin(1h)
| sort @timestamp desc
QUERY
}

resource "aws_cloudwatch_query_definition" "application_errors_by_type" {
  name = "${local.name_prefix}-errors-by-application"

  log_group_names = [for lg in aws_cloudwatch_log_group.applications : lg.name]

  query_string = <<-QUERY
fields @timestamp, @message, @logStream
| filter @message like /ERROR/ or @message like /WARN/
| parse @message /(?<level>ERROR|WARN)/
| stats count() by level, @logStream
| sort count desc
QUERY
}

resource "aws_cloudwatch_query_definition" "recent_logs_all_apps" {
  name = "${local.name_prefix}-recent-logs-all-apps"

  log_group_names = [for lg in aws_cloudwatch_log_group.applications : lg.name]

  query_string = <<-QUERY
fields @timestamp, @message, @logStream
| sort @timestamp desc
| limit 50
QUERY
}
