output "alb_sg_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "ecs_sg_id" {
  description = "ECS security group ID"
  value       = aws_security_group.ecs.id
}

output "database_sg_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}
