output "alb_arn" {
  value       = aws_lb.main.arn
  description = "ARN of the Application Load Balancer"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "DNS name of the Application Load Balancer"
}

output "target_group_arn" {
  value       = aws_lb_target_group.main.arn
  description = "ARN of the target group"
}

output "alb_arn_suffix" {
  value       = aws_lb.main.arn_suffix
  description = "ARN suffix of the Application Load Balancer"
}

output "target_group_arn_suffix" {
  value       = aws_lb_target_group.main.arn_suffix
  description = "ARN suffix of the target group"
}