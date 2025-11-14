# Task execution role (for pulling images and writing logs)
resource "aws_iam_role" "ecs_execution" {
  for_each = var.services

  name = "${var.environment}-${each.key}-ecs-execution-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = local.service_tags[each.key]
}

# Attach managed policy for execution role
resource "aws_iam_role_policy_attachment" "ecs_execution" {
  for_each = aws_iam_role.ecs_execution

  role       = each.value.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for SSM parameter access
resource "aws_iam_policy" "ecs_ssm" {
  name        = "${var.environment}-ecs-ssm-policy-${local.env_suffix}"
  description = "Allow ECS tasks to read SSM parameters"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ]
      Resource = [
        "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.environment}/ecs/*"
      ]
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_ssm" {
  for_each = aws_iam_role.ecs_execution

  role       = each.value.name
  policy_arn = aws_iam_policy.ecs_ssm.arn
}

# Task role (for application permissions)
resource "aws_iam_role" "ecs_task" {
  for_each = var.services

  name = "${var.environment}-${each.key}-ecs-task-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = local.service_tags[each.key]
}

# Service-specific policies
resource "aws_iam_policy" "service_specific" {
  for_each = var.services

  name        = "${var.environment}-${each.key}-policy-${local.env_suffix}"
  description = "Service-specific permissions for ${each.key}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "arn:aws:s3:::${var.environment}-app-data/${each.key}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:PutItem"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${var.environment}-*"
      }
    ]
  })

  tags = local.service_tags[each.key]
}

resource "aws_iam_role_policy_attachment" "service_specific" {
  for_each = aws_iam_role.ecs_task

  role       = each.value.name
  policy_arn = aws_iam_policy.service_specific[each.key].arn
}