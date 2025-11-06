output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.fintech_cluster.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.fintech_cluster.arn
}

output "alb_dns_name" {
  description = "DNS name of the internal ALB"
  value       = aws_lb.internal.dns_name
}

output "alb_arn" {
  description = "ARN of the internal ALB"
  value       = aws_lb.internal.arn
}

output "payment_service_target_group_arn" {
  description = "ARN of the payment service target group"
  value       = aws_lb_target_group.payment_service.arn
}

output "auth_service_target_group_arn" {
  description = "ARN of the auth service target group"
  value       = aws_lb_target_group.auth_service.arn
}

output "analytics_service_target_group_arn" {
  description = "ARN of the analytics service target group"
  value       = aws_lb_target_group.analytics_service.arn
}

output "payment_service_name" {
  description = "Name of the payment ECS service"
  value       = aws_ecs_service.payment_service.name
}

output "auth_service_name" {
  description = "Name of the auth ECS service"
  value       = aws_ecs_service.auth_service.name
}

output "analytics_service_name" {
  description = "Name of the analytics ECS service"
  value       = aws_ecs_service.analytics_service.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = jsonencode(aws_subnet.private[*].id)
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs_services.id
}

output "cloudwatch_log_groups" {
  description = "CloudWatch log group names for each service"
  value = jsonencode({
    payment_service   = aws_cloudwatch_log_group.payment_service.name
    auth_service      = aws_cloudwatch_log_group.auth_service.name
    analytics_service = aws_cloudwatch_log_group.analytics_service.name
  })
}
