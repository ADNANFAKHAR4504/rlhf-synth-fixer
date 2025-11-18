# ECR repositories
data "aws_ecr_repository" "services" {
  for_each = local.ecr_repos
  name     = each.value
}

# Latest image for each service
data "aws_ecr_image" "latest" {
  for_each        = data.aws_ecr_repository.services
  repository_name = each.value.name
  most_recent     = true
}

# SSM parameters for sensitive values
data "aws_ssm_parameter" "app_secrets" {
  for_each = toset([
    "database_url",
    "api_key",
    "jwt_secret"
  ])
  name = "/${var.environment}/ecs/${each.key}"
}

# Current AWS account and caller identity
data "aws_caller_identity" "current" {}

# VPC data
data "aws_vpc" "main" {
  id = var.vpc_id
}

# ALB data
data "aws_lb" "main" {
  arn = var.alb_arn
}

# ALB listener
data "aws_lb_listener" "main" {
  load_balancer_arn = data.aws_lb.main.arn
  port              = 443
}