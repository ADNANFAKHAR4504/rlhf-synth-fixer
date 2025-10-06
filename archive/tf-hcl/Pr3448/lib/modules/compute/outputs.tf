output "alb_dns" {
  value = aws_lb.main.dns_name
}

output "alb_arn_suffix" {
  value = aws_lb.main.arn_suffix
}

output "target_group_arn" {
  value = aws_lb_target_group.main.arn
}

output "asg_name" {
  value = aws_autoscaling_group.main.name
}

output "app_security_group_id" {
  value = aws_security_group.app.id
}


