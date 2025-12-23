# ECS Service-Linked Role with custom permission boundary
resource "aws_iam_role" "ecs_service_role" {
  name                 = "ecs-service-role-${var.environment_suffix}"
  description          = "ECS service-linked role with custom permission boundary"
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name    = "ecs-service-role-${var.environment_suffix}"
      Service = "ECS"
    }
  )
}

resource "aws_iam_role_policy_attachment" "ecs_service_role" {
  role       = aws_iam_role.ecs_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# RDS Service-Linked Role with custom permission boundary
resource "aws_iam_role" "rds_service_role" {
  name                 = "rds-service-role-${var.environment_suffix}"
  description          = "RDS service-linked role with custom permission boundary"
  permissions_boundary = aws_iam_policy.permission_boundary.arn

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name    = "rds-service-role-${var.environment_suffix}"
      Service = "RDS"
    }
  )
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  role       = aws_iam_role.rds_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}
