output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Hosted zone ID of the application load balancer"
  value       = aws_lb.main.zone_id
}

output "ecr_repository_url" {
  description = "URL of the application ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "alb_target_group_arn" {
  description = "ARN of the Application Load Balancer target group"
  value       = aws_lb_target_group.app.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group used by ECS tasks"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_execution.arn
}

output "task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

output "vpc_id" {
  description = "Identifier of the application VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs used by ECS tasks and RDS"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB"
  value       = aws_subnet.public[*].id
}

output "rds_endpoint" {
  description = "Writer endpoint of the application database"
  value       = aws_db_instance.app.address
}

output "rds_identifier" {
  description = "Identifier of the application database instance"
  value       = aws_db_instance.app.identifier
}

output "rds_master_secret_arn" {
  description = "Secrets Manager ARN storing the database credentials"
  value       = try(aws_db_instance.app.master_user_secret[0].secret_arn, "")
}

output "route53_record_fqdn" {
  description = "FQDN of the Route 53 record pointing to the ALB"
  value       = try(aws_route53_record.app[0].fqdn, "")
}

output "aws_region" {
  description = "AWS region where the stack is deployed"
  value       = var.aws_region
}