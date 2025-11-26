# EventBridge Configuration for ECS Task State Monitoring
# Optional enhancement for automated responses to task failures

# EventBridge Rule for ECS Task State Changes
resource "aws_cloudwatch_event_rule" "ecs_task_state_change" {
  name        = "ecs-task-state-change-${var.environment_suffix}"
  description = "Capture ECS task state changes for monitoring and alerting"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      clusterArn    = [aws_ecs_cluster.main.arn]
      lastStatus    = ["STOPPED"]
      stoppedReason = [{ "prefix" : "" }]
    }
  })

  tags = {
    Name       = "ecs-task-state-change-${var.environment_suffix}"
    Service    = "eventbridge"
    CostCenter = "infrastructure"
  }
}

# CloudWatch Log Group for EventBridge
resource "aws_cloudwatch_log_group" "eventbridge" {
  name              = "/aws/events/ecs-task-state-${var.environment_suffix}"
  retention_in_days = 7

  tags = {
    Name       = "eventbridge-logs-${var.environment_suffix}"
    Service    = "eventbridge"
    CostCenter = "infrastructure"
  }
}

# EventBridge Target: CloudWatch Logs
resource "aws_cloudwatch_event_target" "log_target" {
  rule      = aws_cloudwatch_event_rule.ecs_task_state_change.name
  target_id = "LogTarget"
  arn       = aws_cloudwatch_log_group.eventbridge.arn
}

# EventBridge Rule for ECS Service Deployment Failures
resource "aws_cloudwatch_event_rule" "ecs_deployment_failure" {
  name        = "ecs-deployment-failure-${var.environment_suffix}"
  description = "Capture ECS service deployment failures"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Deployment State Change"]
    detail = {
      clusterArn       = [aws_ecs_cluster.main.arn]
      eventType        = ["ERROR"]
      deploymentStatus = ["FAILED"]
    }
  })

  tags = {
    Name       = "ecs-deployment-failure-${var.environment_suffix}"
    Service    = "eventbridge"
    CostCenter = "infrastructure"
  }
}

# EventBridge Target for Deployment Failures
resource "aws_cloudwatch_event_target" "deployment_failure_log" {
  rule      = aws_cloudwatch_event_rule.ecs_deployment_failure.name
  target_id = "DeploymentFailureLog"
  arn       = aws_cloudwatch_log_group.eventbridge.arn
}

# CloudWatch Metric Alarm for Task Stop Events
resource "aws_cloudwatch_metric_alarm" "task_stop_rate" {
  alarm_name          = "ecs-task-stop-rate-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "TriggeredRules"
  namespace           = "AWS/Events"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when ECS tasks are stopping frequently"
  treat_missing_data  = "notBreaching"

  dimensions = {
    RuleName = aws_cloudwatch_event_rule.ecs_task_state_change.name
  }

  tags = {
    Name       = "task-stop-rate-alarm-${var.environment_suffix}"
    Service    = "eventbridge"
    CostCenter = "infrastructure"
  }
}
