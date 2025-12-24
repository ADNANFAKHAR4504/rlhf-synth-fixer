output "vpc_cidr" {
  value = local.vpc_cidr
}

output "availability_zones" {
  value = local.availability_zones
}

output "common_tags" {
  value = local.common_tags
}

output "project_name" {
  value = local.project
}

output "environment" {
  value = lookup(local.env_type, local.env)
}

output "instance_type" {
  value = lookup(local.instance_type, local.env)
}

output "as_group_desired" {
  value = lookup(local.as_group_desired, local.env)
}

output "as_group_min" {
  value = lookup(local.as_group_min, local.env)
}

output "as_group_max" {
  value = lookup(local.as_group_max, local.env)
}

output "enable_alb" {
  description = "Whether to enable ALB (disabled for LocalStack)"
  value       = local.enable_alb
}

output "enable_asg" {
  description = "Whether to enable Auto Scaling Group (disabled for LocalStack)"
  value       = local.enable_asg
}