data "aws_iam_policy_document" "ecs_task_execution_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_iam_role" "ecs_task_execution" {
  name               = "ecs-task-execution-role-${var.environment}-${var.environment_suffix}-${random_id.suffix.hex}"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_assume_role.json

  tags = {
    Name        = "ecs-task-execution-role-${var.environment}-${var.environment_suffix}-${random_id.suffix.hex}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name               = "ecs-task-role-${var.environment}-${var.environment_suffix}-${random_id.suffix.hex}"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_assume_role.json

  tags = {
    Name        = "ecs-task-role-${var.environment}-${var.environment_suffix}-${random_id.suffix.hex}"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

data "aws_iam_policy_document" "ecs_task" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = var.allowed_s3_resources
  }
}

resource "aws_iam_role_policy" "ecs_task" {
  name   = "ecs-task-policy-${var.environment}-${var.environment_suffix}"
  role   = aws_iam_role.ecs_task.id
  policy = data.aws_iam_policy_document.ecs_task.json
}
