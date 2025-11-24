resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/aws/codebuild/v1-${var.environment_suffix}"
  retention_in_days = 30

  kms_key_id = aws_kms_key.artifacts.arn

  tags = {
    Name = "codebuild-logs-v1-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "ecs_tasks" {
  name              = "/ecs/v1-${var.environment_suffix}"
  retention_in_days = 30

  kms_key_id = aws_kms_key.artifacts.arn

  tags = {
    Name = "ecs-logs-v1-${var.environment_suffix}"
  }
}
