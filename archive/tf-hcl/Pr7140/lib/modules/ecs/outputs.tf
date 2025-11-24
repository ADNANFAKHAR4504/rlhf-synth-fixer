output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "lb_dns_name" {
  description = "Load balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "lb_zone_id" {
  description = "Load balancer zone ID"
  value       = aws_lb.main.zone_id
}

output "lb_arn" {
  description = "Load balancer ARN"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "Target group ARN"
  value       = aws_lb_target_group.app.arn
}
