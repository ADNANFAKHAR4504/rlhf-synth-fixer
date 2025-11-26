# iam.tf - IAM roles and policies

# ECS task execution role
resource "aws_iam_role" "ecs_task_execution" {
  name_prefix = "payment-ecs-exec-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "payment-app-${var.environment_suffix}"
          }
        }
      }
    ]
  })

  tags = {
    Name       = "payment-ecs-task-execution-role-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name_prefix = "ecs-secrets-${var.environment_suffix}-"
  role        = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = [
          aws_secretsmanager_secret.aurora_master_password.arn,
          aws_kms_key.database.arn
        ]
      }
    ]
  })
}

# ECS task role
resource "aws_iam_role" "ecs_task" {
  name_prefix = "payment-ecs-task-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
        Condition = {
          StringEquals = {
            "sts:ExternalId" = "payment-app-${var.environment_suffix}"
          }
        }
      }
    ]
  })

  tags = {
    Name       = "payment-ecs-task-role-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name_prefix = "ecs-s3-${var.environment_suffix}-"
  role        = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.static_assets.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.static_assets.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "ecs_task_cloudwatch" {
  name_prefix = "ecs-cloudwatch-${var.environment_suffix}-"
  role        = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.ecs.arn}:*"
      }
    ]
  })
}

# ECS autoscaling role
resource "aws_iam_role" "ecs_autoscaling" {
  name_prefix = "payment-ecs-autoscaling-${var.environment_suffix}-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "application-autoscaling.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name       = "payment-ecs-autoscaling-role-${var.environment_suffix}"
    CostCenter = "Engineering"
    Compliance = "PCI-DSS"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_autoscaling" {
  role       = aws_iam_role.ecs_autoscaling.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceAutoscaleRole"
}
