# eventbridge.tf

# Custom EventBridge Event Bus
resource "aws_cloudwatch_event_bus" "main" {
  name = "loan-processing-${var.environment_suffix}"

  tags = {
    Name = "eventbridge-bus-${var.environment_suffix}"
  }
}

# IAM Role for EventBridge to invoke ECS
resource "aws_iam_role" "eventbridge_ecs" {
  name_prefix = "eventbridge-ecs-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "eventbridge-ecs-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "eventbridge_ecs" {
  name_prefix = "eventbridge-ecs-${var.environment_suffix}-"
  role        = aws_iam_role.eventbridge_ecs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:RunTask"
        ]
        Resource = aws_ecs_task_definition.app.arn
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_task_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      }
    ]
  })
}

# Scheduled Rule for Nightly Batch Processing (runs at 2 AM UTC)
resource "aws_cloudwatch_event_rule" "nightly_batch" {
  name                = "nightly-batch-${var.environment_suffix}"
  description         = "Trigger nightly batch processing at 2 AM UTC"
  schedule_expression = "cron(0 2 * * ? *)"
  event_bus_name      = aws_cloudwatch_event_bus.main.name

  tags = {
    Name = "nightly-batch-rule-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "nightly_batch" {
  rule           = aws_cloudwatch_event_rule.nightly_batch.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  arn            = aws_ecs_cluster.main.arn
  role_arn       = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.app.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = aws_subnet.private[*].id
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = false
    }
  }

  input = jsonencode({
    containerOverrides = [
      {
        name = "loan-processing-app"
        environment = [
          {
            name  = "BATCH_MODE"
            value = "true"
          },
          {
            name  = "BATCH_TYPE"
            value = "nightly"
          }
        ]
      }
    ]
  })
}

# Scheduled Rule for Weekly Report Generation (runs Sunday at 1 AM UTC)
resource "aws_cloudwatch_event_rule" "weekly_report" {
  name                = "weekly-report-${var.environment_suffix}"
  description         = "Generate weekly reports on Sunday at 1 AM UTC"
  schedule_expression = "cron(0 1 ? * SUN *)"
  event_bus_name      = aws_cloudwatch_event_bus.main.name

  tags = {
    Name = "weekly-report-rule-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_event_target" "weekly_report" {
  rule           = aws_cloudwatch_event_rule.weekly_report.name
  event_bus_name = aws_cloudwatch_event_bus.main.name
  arn            = aws_ecs_cluster.main.arn
  role_arn       = aws_iam_role.eventbridge_ecs.arn

  ecs_target {
    task_count          = 1
    task_definition_arn = aws_ecs_task_definition.app.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = aws_subnet.private[*].id
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = false
    }
  }

  input = jsonencode({
    containerOverrides = [
      {
        name = "loan-processing-app"
        environment = [
          {
            name  = "BATCH_MODE"
            value = "true"
          },
          {
            name  = "BATCH_TYPE"
            value = "weekly-report"
          }
        ]
      }
    ]
  })
}

# CloudWatch Log Group for EventBridge
resource "aws_cloudwatch_log_group" "eventbridge" {
  name              = "/aws/events/loan-processing-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.main.arn

  tags = {
    Name = "eventbridge-logs-${var.environment_suffix}"
  }
}
