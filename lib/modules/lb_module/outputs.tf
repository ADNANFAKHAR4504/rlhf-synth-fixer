output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = var.enable_alb ? aws_lb.main[0].arn : ""
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = var.enable_alb ? aws_lb.main[0].dns_name : ""
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = var.enable_alb ? aws_lb_target_group.main[0].arn : ""
}