output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling group"
  value       = aws_autoscaling_group.main.name
}

output "load_balancer_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.main.arn
}

output "load_balancer_security_group_id" {
  description = "ID of the load balancer security group"
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.ec2.id
}

output "high_cpu_alarm_name" {
  description = "Name of the high CPU alarm"
  value       = aws_cloudwatch_metric_alarm.high_cpu.alarm_name
}

output "low_cpu_alarm_name" {
  description = "Name of the low CPU alarm"
  value       = aws_cloudwatch_metric_alarm.low_cpu.alarm_name
}
