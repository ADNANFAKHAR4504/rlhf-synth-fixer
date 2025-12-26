# iam.tf - IAM roles and policies

# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "ecs-task-execution-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name           = "ecs-task-execution-role-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role
resource "aws_iam_role" "ecs_task" {
  name = "ecs-task-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name           = "ecs-task-role-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "ecs-task-policy-${var.environment_suffix}"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.ecs_blue.arn}:*",
          "${aws_cloudwatch_log_group.ecs_green.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
}

# DMS IAM Role
resource "aws_iam_role" "dms_vpc" {
  count = var.enable_dms ? 1 : 0

  name = "dms-vpc-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name           = "dms-vpc-role-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

resource "aws_iam_role_policy_attachment" "dms_vpc" {
  count = var.enable_dms ? 1 : 0

  role       = aws_iam_role.dms_vpc[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
}

# DMS CloudWatch Role
resource "aws_iam_role" "dms_cloudwatch" {
  count = var.enable_dms ? 1 : 0

  name = "dms-cloudwatch-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "dms.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name           = "dms-cloudwatch-role-${var.environment_suffix}"
    Environment    = var.environment_suffix
    CostCenter     = "FinOps"
    MigrationPhase = "initial"
  }
}

resource "aws_iam_role_policy_attachment" "dms_cloudwatch" {
  count = var.enable_dms ? 1 : 0

  role       = aws_iam_role.dms_cloudwatch[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole"
}
