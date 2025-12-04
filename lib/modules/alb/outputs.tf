output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "alb_security_group_id" {
  description = "Security group ID of the ALB"
  value       = aws_security_group.alb.id
}

output "alb_arn_suffix" {
  description = "ARN suffix of the ALB for CloudWatch"
  value       = aws_lb.main.arn_suffix
}

output "target_group_arn_suffix" {
  description = "ARN suffix of the target group for CloudWatch"
  value       = aws_lb_target_group.main.arn_suffix
}

output "https_listener_arn" {
  description = "ARN of the HTTPS listener (null if no certificate provided)"
  value       = length(aws_lb_listener.https) > 0 ? aws_lb_listener.https[0].arn : null
}

output "ssl_enabled" {
  description = "Whether SSL/HTTPS is enabled"
  value       = var.ssl_certificate_arn != null
}

output "alb_url" {
  description = "Primary URL for the ALB (HTTPS if available, HTTP otherwise)"
  value       = var.ssl_certificate_arn != null ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
}