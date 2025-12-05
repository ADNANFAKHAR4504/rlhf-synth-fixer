# events.tf - CloudWatch Event Rules for ECS Task State Changes

resource "aws_cloudwatch_event_rule" "ecs_task_stopped" {
  name        = "ecs-task-stopped-${var.environment_suffix}"
  description = "Capture ECS task stopped events"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      lastStatus = ["STOPPED"]
      clusterArn = [aws_ecs_cluster.main.arn]
      stoppedReason = [
        { "prefix" = "Essential container" },
        { "prefix" = "Task failed" }
      ]
    }
  })

  tags = {
    Name = "ecs-task-stopped-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_rule" "ecs_task_failed_to_start" {
  name        = "ecs-task-failed-start-${var.environment_suffix}"
  description = "Capture ECS task failed to start events"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      lastStatus    = ["STOPPED"]
      clusterArn    = [aws_ecs_cluster.main.arn]
      desiredStatus = ["RUNNING"]
      stoppedReason = [
        { "prefix" = "CannotPullContainer" },
        { "prefix" = "ResourceInitializationError" }
      ]
    }
  })

  tags = {
    Name = "ecs-task-failed-start-${var.environment_suffix}"
  }
}

# SNS targets for event rules
resource "aws_cloudwatch_event_target" "task_stopped_sns" {
  rule      = aws_cloudwatch_event_rule.ecs_task_stopped.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.critical_alerts.arn

  input_transformer {
    input_paths = {
      cluster = "$.detail.clusterArn"
      taskArn = "$.detail.taskArn"
      reason  = "$.detail.stoppedReason"
      service = "$.detail.group"
    }
    input_template = "\"ECS Task Stopped - Cluster: <cluster>, Task: <taskArn>, Service: <service>, Reason: <reason>\""
  }
}

resource "aws_cloudwatch_event_target" "task_failed_start_sns" {
  rule      = aws_cloudwatch_event_rule.ecs_task_failed_to_start.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.critical_alerts.arn

  input_transformer {
    input_paths = {
      cluster = "$.detail.clusterArn"
      taskArn = "$.detail.taskArn"
      reason  = "$.detail.stoppedReason"
      service = "$.detail.group"
    }
    input_template = "\"ECS Task Failed to Start - Cluster: <cluster>, Task: <taskArn>, Service: <service>, Reason: <reason>\""
  }
}

# SNS topic policy to allow EventBridge to publish
resource "aws_sns_topic_policy" "critical_alerts_events" {
  arn = aws_sns_topic.critical_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.critical_alerts.arn
      }
    ]
  })
}
