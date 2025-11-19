output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.instance.id
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.instance.id
}

output "launch_template_latest_version" {
  description = "Latest version of the launch template"
  value       = aws_launch_template.instance.latest_version
}

output "autoscaling_group_id" {
  description = "ID of the Auto Scaling Group"
  value       = aws_autoscaling_group.instance.id
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling Group"
  value       = aws_autoscaling_group.instance.name
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.instance.arn
}